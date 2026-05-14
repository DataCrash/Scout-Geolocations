namespace Scout.Location.Api.Domain.Events;

public sealed record LocationUpdated(Guid UserId, Guid EventId, double Latitude, double Longitude, DateTime RecordedAt);
public sealed record EnteredGeofence(Guid UserId, Guid GeocacheId, Guid EventId, double Latitude, double Longitude, DateTime OccurredAt);
public sealed record ExitedGeofence(Guid UserId, Guid GeocacheId, Guid EventId, DateTime OccurredAt);
