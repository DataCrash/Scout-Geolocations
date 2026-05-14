using Scout.Cache.Api.Domain.Enums;

namespace Scout.Cache.Api.Domain.Entities;

public class Geocache
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    /// <summary>Latitude em graus decimais (WGS84).</summary>
    public double Latitude { get; set; }

    /// <summary>Longitude em graus decimais (WGS84).</summary>
    public double Longitude { get; set; }

    /// <summary>Raio de geofence em metros para validação por proximidade.</summary>
    public int RadiusMeters { get; set; } = 30;

    public CacheType Type { get; set; } = CacheType.QRCode;

    public CacheStatus Status { get; set; } = CacheStatus.Active;

    /// <summary>Código QR associado ao cache (nulo para tipos não-QR).</summary>
    public string? QrCode { get; set; }

    /// <summary>Evento ao qual este cache pertence.</summary>
    public Guid EventId { get; set; }

    /// <summary>Pontuação base atribuída ao encontrar este cache.</summary>
    public int BasePoints { get; set; } = 10;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
