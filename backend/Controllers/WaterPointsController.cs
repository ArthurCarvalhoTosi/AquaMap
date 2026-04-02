using System.Security.Claims;
using AquaMap.API.Data;
using AquaMap.API.DTOs;
using AquaMap.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AquaMap.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WaterPointsController(AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
    private const int VerificationThreshold = 5;
    private const int StatusReportThreshold = 3;

    [HttpGet]
    public async Task<ActionResult<List<WaterPointResponse>>> GetAll(
        [FromQuery] double? lat, [FromQuery] double? lng, [FromQuery] double? radiusKm)
    {
        var query = db.WaterPoints
            .Include(w => w.CreatedBy)
            .Include(w => w.Interactions)
            .AsQueryable();

        var points = await query.ToListAsync();
        var now = DateTime.UtcNow;

        if (lat.HasValue && lng.HasValue && radiusKm.HasValue)
        {
            points = points.Where(p => GetDistanceKm(lat.Value, lng.Value, p.Latitude, p.Longitude) <= radiusKm.Value)
                .ToList();
        }

        return Ok(points.Select(p => MapToResponse(p, now)).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WaterPointResponse>> GetById(Guid id)
    {
        var point = await db.WaterPoints
            .Include(w => w.CreatedBy)
            .Include(w => w.Interactions)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (point is null) return NotFound();

        return Ok(MapToResponse(point, DateTime.UtcNow));
    }

    [Authorize]
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<WaterPointResponse>> Create([FromForm] CreateWaterPointRequest request)
    {
        var userId = GetUserId();
        string? photoUrl = null;

        if (request.Photo is { Length: > 0 })
        {
            photoUrl = await SavePhoto(request.Photo);
        }

        var point = new WaterPoint
        {
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Description = request.Description.Trim(),
            Address = request.Address.Trim(),
            PhotoUrl = photoUrl,
            CreatedByUserId = userId
        };

        db.WaterPoints.Add(point);
        await db.SaveChangesAsync();

        await db.Entry(point).Reference(p => p.CreatedBy).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = point.Id }, MapToResponse(point, DateTime.UtcNow));
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        var point = await db.WaterPoints.FindAsync(id);

        if (point is null) return NotFound();
        if (point.CreatedByUserId != userId) return Forbid();

        db.WaterPoints.Remove(point);
        await db.SaveChangesAsync();

        return NoContent();
    }

    [Authorize]
    [HttpPost("{id:guid}/interact")]
    public async Task<ActionResult<WaterPointResponse>> Interact(Guid id, [FromBody] InteractionRequest request)
    {
        var userId = GetUserId();

        var point = await db.WaterPoints
            .Include(w => w.CreatedBy)
            .Include(w => w.Interactions)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (point is null) return NotFound();

        var existingVote = await db.PointInteractions
            .AnyAsync(i => i.WaterPointId == id && i.UserId == userId && i.Type == request.Type
                && i.CreatedAt > DateTime.UtcNow.AddHours(-1));

        if (existingVote)
            return BadRequest(new { message = "Você já enviou essa interação recentemente." });

        var interaction = new PointInteraction
        {
            WaterPointId = id,
            UserId = userId,
            Type = request.Type
        };

        db.PointInteractions.Add(interaction);

        ApplyBusinessRules(point);

        await db.SaveChangesAsync();

        return Ok(MapToResponse(point, DateTime.UtcNow));
    }

    [Authorize]
    [HttpPost("{id:guid}/photo")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<WaterPointResponse>> UploadPhoto(Guid id, IFormFile photo)
    {
        var point = await db.WaterPoints
            .Include(w => w.CreatedBy)
            .Include(w => w.Interactions)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (point is null) return NotFound();

        point.PhotoUrl = await SavePhoto(photo);
        await db.SaveChangesAsync();

        return Ok(MapToResponse(point, DateTime.UtcNow));
    }

    private void ApplyBusinessRules(WaterPoint point)
    {
        var now = DateTime.UtcNow;
        var interactions = point.Interactions;

        if (!point.IsVerified)
        {
            var uniqueVerifiers = interactions
                .Where(i => i.Type == InteractionType.VotoDeVerificacao)
                .Select(i => i.UserId)
                .Distinct()
                .Count();

            if (uniqueVerifiers >= VerificationThreshold)
                point.IsVerified = true;
        }

        var recentDriedReports = interactions
            .Where(i => i.Type == InteractionType.RelatoSecou && i.CreatedAt > now.AddHours(-1))
            .Select(i => i.UserId)
            .Distinct()
            .Count();

        if (recentDriedReports >= StatusReportThreshold)
        {
            point.CurrentStatus = WaterPointStatus.SemAgua;
            point.LastStatusUpdate = now;
        }

        var recentAvailableReports = interactions
            .Where(i => i.Type == InteractionType.RelatoTemAgua && i.CreatedAt > now.AddHours(-1))
            .Select(i => i.UserId)
            .Distinct()
            .Count();

        if (recentAvailableReports >= StatusReportThreshold)
        {
            point.CurrentStatus = WaterPointStatus.Disponivel;
            point.LastStatusUpdate = now;
        }
    }

    private async Task<string> SavePhoto(IFormFile photo)
    {
        var uploadsDir = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "images");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(photo.FileName)}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await photo.CopyToAsync(stream);

        return $"/images/{fileName}";
    }

    private static WaterPointResponse MapToResponse(WaterPoint point, DateTime now)
    {
        return new WaterPointResponse
        {
            Id = point.Id,
            Latitude = point.Latitude,
            Longitude = point.Longitude,
            Description = point.Description,
            Address = point.Address,
            PhotoUrl = point.PhotoUrl,
            IsVerified = point.IsVerified,
            CurrentStatus = point.CurrentStatus,
            CreatedByUserName = point.CreatedBy?.Name ?? "Anônimo",
            CreatedAt = point.CreatedAt,
            LastStatusUpdate = point.LastStatusUpdate,
            VerificationVotes = point.Interactions?
                .Where(i => i.Type == InteractionType.VotoDeVerificacao)
                .Select(i => i.UserId).Distinct().Count() ?? 0,
            RecentPositiveReports = point.Interactions?
                .Where(i => i.Type == InteractionType.RelatoTemAgua && i.CreatedAt > now.AddHours(-1))
                .Select(i => i.UserId).Distinct().Count() ?? 0,
            RecentNegativeReports = point.Interactions?
                .Where(i => i.Type == InteractionType.RelatoSecou && i.CreatedAt > now.AddHours(-1))
                .Select(i => i.UserId).Distinct().Count() ?? 0
        };
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException();
        return Guid.Parse(claim);
    }

    private static double GetDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371;
        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double ToRad(double deg) => deg * Math.PI / 180;
}
