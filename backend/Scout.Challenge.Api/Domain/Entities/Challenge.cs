using Scout.Challenge.Api.Domain.Enums;

namespace Scout.Challenge.Api.Domain.Entities;

public class Challenge
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid EventId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public ChallengeType Type { get; set; } = ChallengeType.QRCode;

    public ChallengeStatus Status { get; set; } = ChallengeStatus.Draft;

    /// <summary>Código QR esperado para validação (nulo quando tipo não inclui QR).</summary>
    public string? QrCode { get; set; }

    /// <summary>Latitude do ponto de interesse (nulo quando tipo não inclui geolocalização).</summary>
    public double? Latitude { get; set; }

    /// <summary>Longitude do ponto de interesse (nulo quando tipo não inclui geolocalização).</summary>
    public double? Longitude { get; set; }

    /// <summary>Raio de geofence em metros para validação por proximidade.</summary>
    public int RadiusMeters { get; set; } = 30;

    /// <summary>Pontuação base atribuída ao concluir este desafio.</summary>
    public int BasePoints { get; set; } = 10;

    /// <summary>Bônus de pontos por conclusão rápida (aplicado se concluído em menos de BonusTimeSeconds segundos).</summary>
    public int BonusPoints { get; set; } = 5;

    /// <summary>Limite de tempo em segundos para receber BonusPoints (0 = sem bônus por tempo).</summary>
    public int BonusTimeSeconds { get; set; } = 0;

    /// <summary>Geocache ao qual este desafio pertence (referência por ID).</summary>
    public Guid? GeocacheId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<ChallengeAttempt> Attempts { get; set; } = [];
}
