namespace Scout.Identity.Api.Contracts;

public record AuthResponse(string Token, Guid UserId, string Name, string Role);

public record OAuthAuthorizeResponse(string AuthorizationUrl, string State);

public record UserResponse(Guid Id, string Name, string? Email, string Role);

public record PatrulhaResponse(
    Guid Id,
    string Name,
    Guid MonitorId,
    Guid? SubmonitorId,
    DateTime CreatedAt);

public record InviteResponse(
    Guid InviteId,
    string Token,
    string JoinUrl,
    string QrCodeBase64,
    DateTime ExpiresAt);

public record PatrulhaMemberResponse(
    Guid UserId,
    string Name,
    string Role,
    DateTime JoinedAt);

public record PatrulhaSocialProfileResponse(
    Guid Id,
    string Name,
    Guid MonitorId,
    string MonitorName,
    Guid? SubmonitorId,
    string? SubmonitorName,
    DateTime CreatedAt,
    int MembersCount,
    IReadOnlyList<PatrulhaMemberResponse> RecentMembers);
