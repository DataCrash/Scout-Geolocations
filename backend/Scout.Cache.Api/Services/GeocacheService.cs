using Microsoft.EntityFrameworkCore;
using Scout.Cache.Api.Contracts;
using Scout.Cache.Api.Domain.Entities;
using Scout.Cache.Api.Domain.Enums;
using Scout.Cache.Api.Infrastructure;
using StackExchange.Redis;

namespace Scout.Cache.Api.Services;

public class GeocacheService
{
    private readonly CacheDbContext _db;
    private readonly IDatabase _redis;

    private const string RedisGeoKey = "geocaches:geo";

    public GeocacheService(CacheDbContext db, IConnectionMultiplexer redis)
    {
        _db = db;
        _redis = redis.GetDatabase();
    }

    public async Task<GeocacheResponse> CreateAsync(CreateGeocacheRequest req, CancellationToken ct = default)
    {
        if (!Enum.TryParse<CacheType>(req.Type, ignoreCase: true, out var type))
            throw new ArgumentException($"Tipo inválido: {req.Type}");

        var cache = new Geocache
        {
            Name        = req.Name,
            Description = req.Description,
            Latitude    = req.Latitude,
            Longitude   = req.Longitude,
            RadiusMeters = req.RadiusMeters,
            Type        = type,
            BasePoints  = req.BasePoints,
            EventId     = req.EventId,
            QrCode      = type == CacheType.QRCode ? Guid.NewGuid().ToString("N") : null,
        };

        _db.Geocaches.Add(cache);
        await _db.SaveChangesAsync(ct);

        await _redis.GeoAddAsync(RedisGeoKey,
            new GeoEntry(cache.Longitude, cache.Latitude, cache.Id.ToString()));

        return ToResponse(cache);
    }

    public async Task<GeocacheResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var cache = await _db.Geocaches.AsNoTracking().FirstOrDefaultAsync(g => g.Id == id, ct);
        return cache is null ? null : ToResponse(cache);
    }

    public async Task<IEnumerable<GeocacheResponse>> ListByEventAsync(Guid eventId, CancellationToken ct = default)
    {
        var caches = await _db.Geocaches
            .AsNoTracking()
            .Where(g => g.EventId == eventId)
            .OrderBy(g => g.Name)
            .ToListAsync(ct);

        return caches.Select(ToResponse);
    }

    public async Task<GeocacheResponse?> UpdateAsync(Guid id, UpdateGeocacheRequest req, CancellationToken ct = default)
    {
        var cache = await _db.Geocaches.FindAsync([id], ct);
        if (cache is null) return null;

        if (req.Name is not null) cache.Name = req.Name;
        if (req.Description is not null) cache.Description = req.Description;
        if (req.BasePoints.HasValue) cache.BasePoints = req.BasePoints.Value;
        if (req.RadiusMeters.HasValue) cache.RadiusMeters = req.RadiusMeters.Value;

        if (req.Status is not null && Enum.TryParse<CacheStatus>(req.Status, ignoreCase: true, out var status))
            cache.Status = status;

        bool geoChanged = false;
        if (req.Latitude.HasValue) { cache.Latitude = req.Latitude.Value; geoChanged = true; }
        if (req.Longitude.HasValue) { cache.Longitude = req.Longitude.Value; geoChanged = true; }

        cache.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        if (geoChanged)
            await _redis.GeoAddAsync(RedisGeoKey,
                new GeoEntry(cache.Longitude, cache.Latitude, cache.Id.ToString()));

        return ToResponse(cache);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var cache = await _db.Geocaches.FindAsync([id], ct);
        if (cache is null) return false;

        _db.Geocaches.Remove(cache);
        await _db.SaveChangesAsync(ct);
        await _redis.GeoRemoveAsync(RedisGeoKey, cache.Id.ToString());
        return true;
    }

    public async Task<IEnumerable<NearbyGeocacheResponse>> FindNearbyAsync(
        double latitude, double longitude, double radiusKm,
        Guid? eventId = null, CancellationToken ct = default)
    {
        var results = await _redis.GeoRadiusAsync(
            RedisGeoKey,
            longitude, latitude,
            radiusKm, GeoUnit.Kilometers,
            order: Order.Ascending,
            options: GeoRadiusOptions.WithCoordinates | GeoRadiusOptions.WithDistance);

        if (results is null || results.Length == 0)
            return [];

        var ids = results
            .Where(r => Guid.TryParse(r.Member.ToString(), out _))
            .Select(r => Guid.Parse(r.Member.ToString()!))
            .ToList();

        var idDistanceMap = results
            .Where(r => Guid.TryParse(r.Member.ToString(), out _))
            .ToDictionary(
                r => Guid.Parse(r.Member.ToString()!),
                r => r.Distance.GetValueOrDefault());

        var query = _db.Geocaches.AsNoTracking().Where(g => ids.Contains(g.Id) && g.Status == CacheStatus.Active);
        if (eventId.HasValue)
            query = query.Where(g => g.EventId == eventId.Value);

        var caches = await query.ToListAsync(ct);

        return caches
            .OrderBy(g => idDistanceMap.GetValueOrDefault(g.Id))
            .Select(g => new NearbyGeocacheResponse(
                g.Id, g.Name, g.Type.ToString(), g.Status.ToString(),
                g.Latitude, g.Longitude,
                Math.Round(idDistanceMap.GetValueOrDefault(g.Id), 3),
                g.BasePoints));
    }

    public async Task<GeocacheResponse?> GetByQrCodeAsync(string qrCode, CancellationToken ct = default)
    {
        var cache = await _db.Geocaches.AsNoTracking()
            .FirstOrDefaultAsync(g => g.QrCode == qrCode, ct);
        return cache is null ? null : ToResponse(cache);
    }

    private static GeocacheResponse ToResponse(Geocache g) => new(
        g.Id, g.Name, g.Description,
        g.Latitude, g.Longitude, g.RadiusMeters,
        g.Type.ToString(), g.Status.ToString(),
        g.QrCode, g.EventId, g.BasePoints, g.CreatedAt);
}
