using Microsoft.EntityFrameworkCore;
using Scout.Cache.Api.Domain.Entities;
using Scout.Cache.Api.Domain.Enums;
using StackExchange.Redis;

namespace Scout.Cache.Api.Infrastructure;

public static class DevDataSeeder
{
    public static readonly Guid SeedEventId =
        Guid.Parse("00000000-0000-0000-0000-000000000001");

    public static readonly Guid SeedRoteiroId01 =
        Guid.Parse("00000000-0000-0000-0000-000000000201");

    public static readonly Guid SeedCacheId01 =
        Guid.Parse("00000000-0000-0000-0000-000000000101");

    public static readonly Guid SeedCacheId02 =
        Guid.Parse("00000000-0000-0000-0000-000000000102");

    public static readonly Guid SeedCacheId03 =
        Guid.Parse("00000000-0000-0000-0000-000000000103");

    public static readonly Guid SeedCacheId04 =
        Guid.Parse("00000000-0000-0000-0000-000000000104");

    public static readonly Guid SeedCacheId05 =
        Guid.Parse("00000000-0000-0000-0000-000000000105");

    private static readonly SeedRoteiro[] SeedRoteiros =
    [
        new(
            SeedRoteiroId01,
            "Roteiro Centro Historico",
            "Roteiro oficial de aceite M1 para validacao de fluxo admin e seed de evento.",
            1),
    ];

    private static readonly SeedGeocache[] SeedGeocaches =
    [
        new(
            SeedCacheId01,
            "Roteiro Centro - Marco Zero",
            "Cache oficial de aceite M1: marco inicial do roteiro urbano.",
            -23.55052,
            -46.63331,
            "QR-M1-001",
            30,
            10),
        new(
            SeedCacheId02,
            "Roteiro Centro - Patio do Colegio",
            "Cache oficial de aceite M1 no eixo historico.",
            -23.55072,
            -46.63420,
            "QR-M1-002",
            35,
            12),
        new(
            SeedCacheId03,
            "Roteiro Centro - Mosteiro",
            "Cache oficial de aceite M1 para validacao de proximidade.",
            -23.54857,
            -46.63271,
            "QR-M1-003",
            40,
            15),
        new(
            SeedCacheId04,
            "Roteiro Centro - Vale",
            "Cache oficial de aceite M1 com geofence intermediario.",
            -23.54398,
            -46.63959,
            "QR-M1-004",
            35,
            12),
        new(
            SeedCacheId05,
            "Roteiro Centro - Praca da Se",
            "Cache oficial de aceite M1 para fechamento de rota.",
            -23.55031,
            -46.63406,
            "QR-M1-005",
            30,
            10),
    ];

    public static async Task EnsureOfficialEventSeedAsync(
        CacheDbContext db,
        IDatabase redis,
        CancellationToken ct = default)
    {
        foreach (var seed in SeedRoteiros)
        {
            var roteiro = await db.Roteiros.FirstOrDefaultAsync(r => r.Id == seed.Id, ct);

            if (roteiro is null)
            {
                db.Roteiros.Add(new Roteiro
                {
                    Id = seed.Id,
                    EventId = SeedEventId,
                    Name = seed.Name,
                    Description = seed.Description,
                    Sequence = seed.Sequence,
                    Status = RoteiroStatus.Active,
                    CreatedAt = DateTime.UtcNow,
                });

                continue;
            }

            roteiro.EventId = SeedEventId;
            roteiro.Name = seed.Name;
            roteiro.Description = seed.Description;
            roteiro.Sequence = seed.Sequence;
            roteiro.Status = RoteiroStatus.Active;
            roteiro.UpdatedAt = DateTime.UtcNow;
        }

        foreach (var seed in SeedGeocaches)
        {
            var cache = await db.Geocaches.FirstOrDefaultAsync(g => g.Id == seed.Id, ct);

            if (cache is null)
            {
                db.Geocaches.Add(new Geocache
                {
                    Id = seed.Id,
                    Name = seed.Name,
                    Description = seed.Description,
                    Latitude = seed.Latitude,
                    Longitude = seed.Longitude,
                    RadiusMeters = seed.RadiusMeters,
                    Type = CacheType.QRCode,
                    Status = CacheStatus.Active,
                    QrCode = seed.QrCode,
                    EventId = SeedEventId,
                    BasePoints = seed.BasePoints,
                    CreatedAt = DateTime.UtcNow,
                });

                continue;
            }

            cache.Name = seed.Name;
            cache.Description = seed.Description;
            cache.Latitude = seed.Latitude;
            cache.Longitude = seed.Longitude;
            cache.RadiusMeters = seed.RadiusMeters;
            cache.Type = CacheType.QRCode;
            cache.Status = CacheStatus.Active;
            cache.QrCode = seed.QrCode;
            cache.EventId = SeedEventId;
            cache.BasePoints = seed.BasePoints;
            cache.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);

        var geoEntries = SeedGeocaches
            .Select(seed => new GeoEntry(seed.Longitude, seed.Latitude, seed.Id.ToString()))
            .ToArray();

        if (geoEntries.Length > 0)
        {
            await redis.GeoAddAsync("geocaches:geo", geoEntries);
        }
    }

    private sealed record SeedGeocache(
        Guid Id,
        string Name,
        string Description,
        double Latitude,
        double Longitude,
        string QrCode,
        int RadiusMeters,
        int BasePoints);

    private sealed record SeedRoteiro(
        Guid Id,
        string Name,
        string Description,
        int Sequence);
}
