using MediatR;
using Microsoft.EntityFrameworkCore;
using Scout.Challenge.Api.Contracts;
using Scout.Challenge.Api.Domain.Entities;
using Scout.Challenge.Api.Domain.Enums;
using Scout.Challenge.Api.Domain.Events;
using Scout.Challenge.Api.Infrastructure;

namespace Scout.Challenge.Api.Services;

public class ChallengeService(ChallengeDbContext db, IMediator mediator, ILogger<ChallengeService> logger)
{
    // ── Haversine ─────────────────────────────────────────────────────────────

    private static double HaversineDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371000; // raio da Terra em metros
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLon = (lon2 - lon1) * Math.PI / 180.0;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0)
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    // ── CRUD de Desafios ──────────────────────────────────────────────────────

    public async Task<List<ChallengeResponse>> GetByEventAsync(Guid eventId, CancellationToken ct)
    {
        return await db.Challenges
            .Where(c => c.EventId == eventId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => MapResponse(c))
            .ToListAsync(ct);
    }

    public async Task<ChallengeResponse?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var c = await db.Challenges.FindAsync([id], ct);
        return c is null ? null : MapResponse(c);
    }

    public async Task<ChallengeResponse> CreateAsync(CreateChallengeRequest req, CancellationToken ct)
    {
        var challenge = new Domain.Entities.Challenge
        {
            EventId = req.EventId,
            Title = req.Title,
            Description = req.Description,
            Type = req.Type,
            QrCode = req.QrCode,
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            RadiusMeters = req.RadiusMeters,
            BasePoints = req.BasePoints,
            BonusPoints = req.BonusPoints,
            BonusTimeSeconds = req.BonusTimeSeconds,
            GeocacheId = req.GeocacheId,
        };

        db.Challenges.Add(challenge);
        await db.SaveChangesAsync(ct);
        return MapResponse(challenge);
    }

    public async Task<ChallengeResponse?> UpdateAsync(Guid id, UpdateChallengeRequest req, CancellationToken ct)
    {
        var challenge = await db.Challenges.FindAsync([id], ct);
        if (challenge is null)
            return null;

        if (req.Title is not null)
            challenge.Title = req.Title;
        if (req.Description is not null)
            challenge.Description = req.Description;
        if (req.Status is not null)
            challenge.Status = req.Status.Value;
        if (req.BasePoints is not null)
            challenge.BasePoints = req.BasePoints.Value;
        if (req.BonusPoints is not null)
            challenge.BonusPoints = req.BonusPoints.Value;
        if (req.BonusTimeSeconds is not null)
            challenge.BonusTimeSeconds = req.BonusTimeSeconds.Value;
        if (req.RadiusMeters is not null)
            challenge.RadiusMeters = req.RadiusMeters.Value;
        challenge.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return MapResponse(challenge);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        var challenge = await db.Challenges.FindAsync([id], ct);
        if (challenge is null)
            return false;
        db.Challenges.Remove(challenge);
        await db.SaveChangesAsync(ct);
        return true;
    }

    // ── Validação de Tentativa ────────────────────────────────────────────────

    public async Task<AttemptResponse> ValidateAsync(
        Guid challengeId, ValidateChallengeRequest req, CancellationToken ct)
    {
        var challenge = await db.Challenges.FindAsync([challengeId], ct)
            ?? throw new KeyNotFoundException($"Desafio {challengeId} não encontrado");

        if (challenge.Status != ChallengeStatus.Active)
            throw new InvalidOperationException("Desafio não está ativo");

        // Verifica tentativa duplicada (patrulha já validou este desafio)
        var alreadyValidated = await db.ChallengeAttempts
            .AnyAsync(a => a.ChallengeId == challengeId
                        && a.PatrulhaId == req.PatrulhaId
                        && a.Status == AttemptStatus.Validated, ct);

        if (alreadyValidated)
        {
            logger.LogWarning(
                "AUDIT checkin.duplicate challengeId={ChallengeId} patrulhaId={PatrulhaId} userId={UserId}",
                challengeId,
                req.PatrulhaId,
                req.UserId);

            throw new InvalidOperationException("Patrulha já validou este desafio");
        }

        var attempt = new ChallengeAttempt
        {
            ChallengeId = challengeId,
            PatrulhaId = req.PatrulhaId,
            UserId = req.UserId,
            ScannedQrCode = req.ScannedQrCode,
            Latitude = req.Latitude,
            Longitude = req.Longitude,
        };

        var (valid, failReason, distance) = ValidateAttempt(challenge, req);

        if (valid)
        {
            int bonus = 0;
            if (challenge.BonusTimeSeconds > 0)
            {
                // Bônus por rapidez: simplificado — verifica se há tentativas anteriores da patrulha
                // num evento e calcula baseado no tempo desde o início do evento (futuro)
                bonus = challenge.BonusPoints;
            }

            attempt.Status = AttemptStatus.Validated;
            attempt.PointsAwarded = challenge.BasePoints + bonus;
            attempt.DistanceMeters = distance;
            attempt.ValidatedAt = DateTime.UtcNow;

            db.ChallengeAttempts.Add(attempt);
            await db.SaveChangesAsync(ct);

            await mediator.Publish(new ChallengeValidated(
                attempt.Id, challengeId, req.PatrulhaId, req.UserId,
                attempt.PointsAwarded, attempt.ValidatedAt.Value), ct);

            logger.LogInformation(
                "AUDIT checkin.validated attemptId={AttemptId} challengeId={ChallengeId} patrulhaId={PatrulhaId} userId={UserId} points={PointsAwarded} distanceMeters={DistanceMeters}",
                attempt.Id,
                challengeId,
                req.PatrulhaId,
                req.UserId,
                attempt.PointsAwarded,
                attempt.DistanceMeters);
        }
        else
        {
            attempt.Status = AttemptStatus.Failed;
            attempt.FailReason = failReason;
            attempt.DistanceMeters = distance;

            db.ChallengeAttempts.Add(attempt);
            await db.SaveChangesAsync(ct);

            await mediator.Publish(new ChallengeFailed(
                attempt.Id, challengeId, req.PatrulhaId, req.UserId,
                failReason!, attempt.AttemptedAt), ct);

            logger.LogWarning(
                "AUDIT checkin.failed attemptId={AttemptId} challengeId={ChallengeId} patrulhaId={PatrulhaId} userId={UserId} reason={FailReason} distanceMeters={DistanceMeters}",
                attempt.Id,
                challengeId,
                req.PatrulhaId,
                req.UserId,
                attempt.FailReason,
                attempt.DistanceMeters);
        }

        return MapAttemptResponse(attempt);
    }

    // ── Score por Patrulha ────────────────────────────────────────────────────

    public async Task<PatrulhaScoreResponse> GetScoreAsync(
        Guid patrulhaId, Guid eventId, CancellationToken ct)
    {
        var attempts = await db.ChallengeAttempts
            .Include(a => a.Challenge)
            .Where(a => a.PatrulhaId == patrulhaId && a.Challenge.EventId == eventId)
            .ToListAsync(ct);

        var total = attempts.Where(a => a.Status == AttemptStatus.Validated).Sum(a => a.PointsAwarded);
        var validated = attempts.Count(a => a.Status == AttemptStatus.Validated);

        return new PatrulhaScoreResponse(patrulhaId, eventId, total, validated, attempts.Count);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static (bool Valid, string? FailReason, double? Distance)
        ValidateAttempt(Domain.Entities.Challenge challenge, ValidateChallengeRequest req)
    {
        bool qrOk = true, geoOk = true;
        double? distance = null;
        string? fail = null;

        if (challenge.Type is ChallengeType.QRCode or ChallengeType.QRCodeAndGeolocation)
        {
            if (string.IsNullOrWhiteSpace(req.ScannedQrCode) ||
                !string.Equals(challenge.QrCode, req.ScannedQrCode, StringComparison.OrdinalIgnoreCase))
            {
                qrOk = false;
                fail = "QR Code inválido";
            }
        }

        if (challenge.Type is ChallengeType.Geolocation or ChallengeType.QRCodeAndGeolocation)
        {
            if (req.Latitude is null || req.Longitude is null ||
                challenge.Latitude is null || challenge.Longitude is null)
            {
                geoOk = false;
                fail = fail is null ? "Localização não informada" : fail + "; Localização não informada";
            }
            else
            {
                distance = HaversineDistance(
                    challenge.Latitude.Value, challenge.Longitude.Value,
                    req.Latitude.Value, req.Longitude.Value);

                if (distance > challenge.RadiusMeters)
                {
                    geoOk = false;
                    var msg = $"Fora do raio ({distance:F0}m > {challenge.RadiusMeters}m)";
                    fail = fail is null ? msg : fail + "; " + msg;
                }
            }
        }

        return (qrOk && geoOk, fail, distance);
    }

    private static ChallengeResponse MapResponse(Domain.Entities.Challenge c) => new(
        c.Id, c.EventId, c.Title, c.Description, c.Type, c.Status,
        c.QrCode, c.Latitude, c.Longitude, c.RadiusMeters,
        c.BasePoints, c.BonusPoints, c.BonusTimeSeconds,
        c.GeocacheId, c.CreatedAt);

    private static AttemptResponse MapAttemptResponse(ChallengeAttempt a) => new(
        a.Id, a.ChallengeId, a.PatrulhaId, a.UserId, a.Status,
        a.PointsAwarded, a.FailReason, a.DistanceMeters,
        a.AttemptedAt, a.ValidatedAt);
}
