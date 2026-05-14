using Microsoft.EntityFrameworkCore;
using Scout.Location.Api.Contracts;
using Scout.Location.Api.Domain.Entities;
using Scout.Location.Api.Infrastructure;
using StackExchange.Redis;

namespace Scout.Location.Api.Services;

public sealed class LocationService(LocationDbContext db, IConnectionMultiplexer redis)
{
    private readonly IDatabase _geo = redis.GetDatabase();
    private const string GeoKey = "locations:geo";
    // Chave auxiliar para guardar EventId por userId (hash)
    private const string EventHashKey = "locations:event";

    // ── Atualizar posição do usuário ──────────────────────────────────────────

    public async Task UpdateLocationAsync(
        Guid userId,
        Guid eventId,
        double latitude,
        double longitude,
        float? accuracy,
        float? altitude,
        DateTime recordedAt)
    {
        // Persiste histórico no banco
        db.UserLocations.Add(new UserLocation
        {
            UserId = userId,
            EventId = eventId,
            Latitude = latitude,
            Longitude = longitude,
            Accuracy = accuracy,
            Altitude = altitude,
            RecordedAt = recordedAt,
        });
        await db.SaveChangesAsync();

        // Atualiza posição em tempo real no Redis
        await _geo.GeoAddAsync(GeoKey, longitude, latitude, userId.ToString());

        // Persiste mapeamento userId → eventId
        await _geo.HashSetAsync(EventHashKey, userId.ToString(), eventId.ToString());
    }

    // ── Posição atual (Redis) ─────────────────────────────────────────────────

    public async Task<UserLocationResponse?> GetCurrentLocationAsync(Guid userId)
    {
        var position = await _geo.GeoPositionAsync(GeoKey, (StackExchange.Redis.RedisValue)userId.ToString());
        if (position is null)
            return null;

        var pos = position.Value;
        var eventIdStr = await _geo.HashGetAsync(EventHashKey, userId.ToString());

        // Busca o registro mais recente do banco para os metadados
        var last = await db.UserLocations
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.RecordedAt)
            .FirstOrDefaultAsync();

        if (last is null) return null;

        var eventId = Guid.TryParse((string?)eventIdStr, out var eid) ? eid : last.EventId;

        return new UserLocationResponse(
            userId,
            eventId,
            pos.Latitude,
            pos.Longitude,
            last.Accuracy,
            last.Altitude,
            last.RecordedAt);
    }

    // ── Usuários próximos (Redis GeoRadius) ──────────────────────────────────

    public async Task<IReadOnlyList<NearbyUserResponse>> GetUsersNearbyAsync(
        double latitude,
        double longitude,
        double radiusMeters,
        Guid? eventId)
    {
        var results = await _geo.GeoRadiusAsync(
            GeoKey,
            longitude,
            latitude,
            radiusMeters / 1000.0, // Redis usa km
            GeoUnit.Kilometers,
            order: Order.Ascending,
            options: GeoRadiusOptions.WithCoordinates | GeoRadiusOptions.WithDistance);

        if (results is null) return [];

        var nearby = new List<NearbyUserResponse>();

        foreach (var r in results)
        {
            if (!Guid.TryParse((string?)r.Member.ToString(), out var uid)) continue;

            if (eventId.HasValue)
            {
                var evStr = await _geo.HashGetAsync(EventHashKey, uid.ToString());
                string evStrText = evStr.ToString();
                if (!Guid.TryParse(evStrText, out var ev) || ev != eventId.Value) continue;
            }

            nearby.Add(new NearbyUserResponse(
                uid,
                r.Position!.Value.Latitude,
                r.Position!.Value.Longitude,
                r.Distance!.Value * 1000)); // converte km → m
        }

        return nearby;
    }

    // ── Histórico de posições (Banco) ─────────────────────────────────────────

    public async Task<IReadOnlyList<LocationHistoryResponse>> GetHistoryAsync(
        Guid userId,
        DateTime? from,
        DateTime? to,
        int limit = 200)
    {
        var query = db.UserLocations
            .Where(l => l.UserId == userId);

        if (from.HasValue) query = query.Where(l => l.RecordedAt >= from.Value);
        if (to.HasValue) query = query.Where(l => l.RecordedAt <= to.Value);

        var rows = await query
            .OrderByDescending(l => l.RecordedAt)
            .Take(limit)
            .ToListAsync();

        return rows.Select(l => new LocationHistoryResponse(
            l.Id, l.UserId, l.EventId,
            l.Latitude, l.Longitude,
            l.Accuracy, l.Altitude, l.RecordedAt)).ToList();
    }
}
