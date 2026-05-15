using Microsoft.EntityFrameworkCore;
using Scout.Challenge.Api.Domain.Entities;
using Scout.Challenge.Api.Domain.Enums;

namespace Scout.Challenge.Api.Infrastructure;

public static class DevDataSeeder
{
    public static readonly Guid SeedEventId =
        Guid.Parse("00000000-0000-0000-0000-000000000001");

    public static readonly Guid SeedChallengeId =
        Guid.Parse("00000000-0000-0000-0000-000000000010");

    public const string SeedQrCode = "QR-DEMO-001";

    public static async Task EnsureChallengeSeedAsync(
        ChallengeDbContext db,
        CancellationToken ct = default)
    {
        var challenge = await db.Challenges
            .FirstOrDefaultAsync(c => c.Id == SeedChallengeId, ct);

        if (challenge is null)
        {
            db.Challenges.Add(new Scout.Challenge.Api.Domain.Entities.Challenge
            {
                Id = SeedChallengeId,
                EventId = SeedEventId,
                Title = "Desafio E2E Seed - QR + Geo",
                Description = "Desafio seed para validacao E2E integrada.",
                Type = ChallengeType.QRCodeAndGeolocation,
                Status = ChallengeStatus.Active,
                QrCode = SeedQrCode,
                Latitude = -23.55052,
                Longitude = -46.63331,
                RadiusMeters = 80,
                BasePoints = 25,
                BonusPoints = 0,
                BonusTimeSeconds = 0,
                CreatedAt = DateTime.UtcNow,
            });

            await db.SaveChangesAsync(ct);
            return;
        }

        // Keep seed deterministic even if previous manual edits changed it.
        challenge.EventId = SeedEventId;
        challenge.Title = "Desafio E2E Seed - QR + Geo";
        challenge.Description = "Desafio seed para validacao E2E integrada.";
        challenge.Type = ChallengeType.QRCodeAndGeolocation;
        challenge.Status = ChallengeStatus.Active;
        challenge.QrCode = SeedQrCode;
        challenge.Latitude = -23.55052;
        challenge.Longitude = -46.63331;
        challenge.RadiusMeters = 80;
        challenge.BasePoints = 25;
        challenge.BonusPoints = 0;
        challenge.BonusTimeSeconds = 0;
        challenge.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}
