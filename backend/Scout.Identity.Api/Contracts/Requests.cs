namespace Scout.Identity.Api.Contracts;

public record GoogleLoginRequest(string IdToken);
public record GuestLoginRequest(string Name);
public record CreatePatrulhaRequest(string Name);
public record JoinPatrulhaRequest(string Token);
public record SetSubmonitorRequest(Guid UserId);
public record UpdateUserRoleRequest(string Role);
