using System.ComponentModel.DataAnnotations;
using AquaMap.API.Models;

namespace AquaMap.API.DTOs;

public class CreateWaterPointRequest
{
    [Required]
    public double Latitude { get; set; }

    [Required]
    public double Longitude { get; set; }

    [Required, MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(300)]
    public string Address { get; set; } = string.Empty;

    public IFormFile? Photo { get; set; }
}

public class WaterPointResponse
{
    public Guid Id { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public bool IsVerified { get; set; }
    public WaterPointStatus CurrentStatus { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime LastStatusUpdate { get; set; }
    public int VerificationVotes { get; set; }
    public int RecentPositiveReports { get; set; }
    public int RecentNegativeReports { get; set; }
}

public class InteractionRequest
{
    [Required]
    public InteractionType Type { get; set; }
}
