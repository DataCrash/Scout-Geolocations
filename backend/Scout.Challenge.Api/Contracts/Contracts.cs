using Scout.Challenge.Api.Domain.Enums;

namespace Scout.Challenge.Api.Contracts;

// ── Requests ──────────────────────────────────────────────────────────────────

public record CreateChallengeRequest(
    Guid EventId,
    string Title,
    string Description,
    ChallengeType Type,
    string? QrCode,
    double? Latitude,
    double? Longitude,
    int RadiusMeters,
    int BasePoints,
    int BonusPoints,
    int BonusTimeSeconds,
    Guid? GeocacheId);

public record UpdateChallengeRequest(
    string? Title,
    string? Description,
    ChallengeStatus? Status,
    int? BasePoints,
    int? BonusPoints,
    int? BonusTimeSeconds,
    int? RadiusMeters);

public record ValidateChallengeRequest(
    Guid PatrulhaId,
    Guid UserId,
    string? ScannedQrCode,
    double? Latitude,
    double? Longitude,
    string? PhotoBase64);

// ── Responses ─────────────────────────────────────────────────────────────────

public record ChallengeResponse(
    Guid Id,
    Guid EventId,
    string Title,
    string Description,
    ChallengeType Type,
    ChallengeStatus Status,
    string? QrCode,
    double? Latitude,
    double? Longitude,
    int RadiusMeters,
    int BasePoints,
    int BonusPoints,
    int BonusTimeSeconds,
    Guid? GeocacheId,
    DateTime CreatedAt);

public record AttemptResponse(
    Guid Id,
    Guid ChallengeId,
    Guid PatrulhaId,
    Guid UserId,
    AttemptStatus Status,
    int PointsAwarded,
    string? FailReason,
    double? DistanceMeters,
    DateTime AttemptedAt,
    DateTime? ValidatedAt);

public record PatrulhaScoreResponse(
    Guid PatrulhaId,
    Guid EventId,
    int TotalPoints,
    int ValidatedChallenges,
    int TotalAttempts);
