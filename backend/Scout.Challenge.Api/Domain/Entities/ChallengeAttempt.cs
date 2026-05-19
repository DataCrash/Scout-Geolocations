using Scout.Challenge.Api.Domain.Enums;

namespace Scout.Challenge.Api.Domain.Entities;

public class ChallengeAttempt
{
    public Guid Id { get; set; } = Guid.CreateVersion7();

    public Guid ChallengeId { get; set; }

    public Challenge Challenge { get; set; } = null!;

    /// <summary>Patrulha que realizou a tentativa (referência por ID).</summary>
    public Guid PatrulhaId { get; set; }

    /// <summary>Membro que registrou a tentativa (referência por ID).</summary>
    public Guid UserId { get; set; }

    public AttemptStatus Status { get; set; } = AttemptStatus.Pending;

    /// <summary>QR code escaneado pelo participante (nulo quando não é desafio QR).</summary>
    public string? ScannedQrCode { get; set; }

    /// <summary>Latitude reportada pelo participante no momento da tentativa.</summary>
    public double? Latitude { get; set; }

    /// <summary>Longitude reportada pelo participante no momento da tentativa.</summary>
    public double? Longitude { get; set; }

    /// <summary>Distância calculada em metros entre o participante e o ponto do desafio.</summary>
    public double? DistanceMeters { get; set; }

    /// <summary>Pontos efetivamente atribuídos nesta tentativa (incluindo bônus).</summary>
    public int PointsAwarded { get; set; }

    /// <summary>Mensagem de erro quando o status é Failed.</summary>
    public string? FailReason { get; set; }

    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ValidatedAt { get; set; }
}
