namespace Scout.Cache.Api.Contracts;

// ── Requests ─────────────────────────────────────────────────────────────────

public record CreateGeocacheRequest(
    string Name,
    string Description,
    double Latitude,
    double Longitude,
    int RadiusMeters,
    string Type,
    int BasePoints,
    Guid EventId
);

public record UpdateGeocacheRequest(
    string? Name,
    string? Description,
    double? Latitude,
    double? Longitude,
    int? RadiusMeters,
    string? Type,
    string? Status,
    int? BasePoints
);

public record NearbySearchRequest(
    double Latitude,
    double Longitude,
    double RadiusKm,
    Guid? EventId
);

// ── Responses ────────────────────────────────────────────────────────────────

public record GeocacheResponse(
    Guid Id,
    string Name,
    string Description,
    double Latitude,
    double Longitude,
    int RadiusMeters,
    string Type,
    string Status,
    string? QrCode,
    Guid EventId,
    int BasePoints,
    DateTime CreatedAt
);

public record NearbyGeocacheResponse(
    Guid Id,
    string Name,
    string Type,
    string Status,
    double Latitude,
    double Longitude,
    double DistanceKm,
    int BasePoints
);
