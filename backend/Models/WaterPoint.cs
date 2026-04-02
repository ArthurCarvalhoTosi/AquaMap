namespace AquaMap.API.Models;

public enum WaterPointStatus
{
    Disponivel = 1,
    SemAgua = 2,
    Manutencao = 3
}

public class WaterPoint
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public bool IsVerified { get; set; } = false;
    public WaterPointStatus CurrentStatus { get; set; } = WaterPointStatus.Disponivel;
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastStatusUpdate { get; set; } = DateTime.UtcNow;

    public User CreatedBy { get; set; } = null!;
    public ICollection<PointInteraction> Interactions { get; set; } = [];
}
