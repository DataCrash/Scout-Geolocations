namespace Scout.Location.Api.Contracts;

// ── Requests ──────────────────────────────────────────────────────────────────

public sealed record UpdateLocationRequest(
    Guid EventId,
    double Latitude,
    double Longitude,
    float? Accuracy,
    float? Altitude,
    DateTime RecordedAt
);

public sealed record NearbyUsersRequest(
    double Latitude,
    double Longitude,
    double RadiusMeters,
    Guid? EventId
);

// ── Responses ─────────────────────────────────────────────────────────────────

public sealed record UserLocationResponse(
    Guid UserId,
    Guid EventId,
    double Latitude,
    double Longitude,
    float? Accuracy,
    float? Altitude,
    DateTime RecordedAt
);

public sealed record NearbyUserResponse(
    Guid UserId,
    double Latitude,
    double Longitude,
    double DistanceMeters
);

public sealed record LocationHistoryResponse(
    Guid Id,
    Guid UserId,
    Guid EventId,
    double Latitude,
    double Longitude,
    float? Accuracy,
    float? Altitude,
    DateTime RecordedAt
);
