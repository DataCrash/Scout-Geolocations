namespace Scout.Cache.Api.Domain.Events;

public record CacheCreated(Guid CacheId, string Name, Guid EventId);
public record CacheFound(Guid CacheId, Guid PatrulhaId, Guid UserId, DateTime FoundAt);
public record CacheStatusChanged(Guid CacheId, string NewStatus);
