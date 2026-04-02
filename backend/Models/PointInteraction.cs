namespace AquaMap.API.Models;

public enum InteractionType
{
    VotoDeVerificacao = 1,
    RelatoTemAgua = 2,
    RelatoSecou = 3
}

public class PointInteraction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WaterPointId { get; set; }
    public Guid UserId { get; set; }
    public InteractionType Type { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public WaterPoint WaterPoint { get; set; } = null!;
    public User User { get; set; } = null!;
}
