using MediatR;
using Scout.Identity.Api.Domain.Enums;

namespace Scout.Identity.Api.Domain.Events;

public record PatrulhaCreatedEvent(
    Guid PatrulhaId,
    Guid MonitorId,
    string PatrulhaName) : INotification;

public record MemberJoinedEvent(
    Guid PatrulhaId,
    Guid UserId,
    UserRole Role) : INotification;

public record SubmonitorAssignedEvent(
    Guid PatrulhaId,
    Guid SubmonitorId) : INotification;
