using Scout.Cache.Api.Domain.Enums;

namespace Scout.Cache.Api.Domain.Entities;

public class Roteiro
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid EventId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public RoteiroStatus Status { get; set; } = RoteiroStatus.Active;

    public int Sequence { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
