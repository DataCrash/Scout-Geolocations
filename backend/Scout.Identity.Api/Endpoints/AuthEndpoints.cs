using System.Security.Claims;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Scout.Identity.Api.Contracts;
using Scout.Identity.Api.Domain.Entities;
using Scout.Identity.Api.Domain.Enums;
using Scout.Identity.Api.Infrastructure;
using Scout.Identity.Api.Services;

namespace Scout.Identity.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/auth").WithTags("Auth");

        // POST /auth/google — troca ID token do Google por JWT da plataforma
        group.MapPost("/google", async (
            GoogleLoginRequest req,
            GoogleAuthService googleAuth,
            JwtService jwt,
            IdentityDbContext db,
            IConfiguration config,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.IdToken))
                return Results.BadRequest("idToken é obrigatório");

            var payload = await googleAuth.ValidateAsync(req.IdToken);
            if (payload is null)
            {
                logger.LogWarning("AUDIT auth.google.login.invalid_token");
                return Results.Unauthorized();
            }

            if (!payload.Email.EndsWith("@escoteiros.org.br", StringComparison.OrdinalIgnoreCase))
            {
                logger.LogWarning(
                    "AUDIT auth.google.login.blocked_domain email={Email}",
                    payload.Email);

                return Results.Problem(
                    detail: "Apenas contas @escoteiros.org.br são permitidas",
                    statusCode: StatusCodes.Status403Forbidden);
            }

            var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleSub == payload.Subject, ct);
            var created = false;

            if (user is null)
            {
                var initialAdmin = config["App:InitialAdminEmail"];
                var role = string.Equals(payload.Email, initialAdmin, StringComparison.OrdinalIgnoreCase)
                    ? UserRole.ChefesEscoteiro
                    : UserRole.Integrante;

                user = new User
                {
                    Id = Guid.NewGuid(),
                    GoogleSub = payload.Subject,
                    Email = payload.Email,
                    Name = payload.Name ?? payload.Email,
                    Role = role,
                    CreatedAt = DateTime.UtcNow,
                };

                db.Users.Add(user);
                await db.SaveChangesAsync(ct);
                created = true;
            }

            logger.LogInformation(
                "AUDIT auth.google.login.success userId={UserId} role={Role} created={Created}",
                user.Id,
                user.Role,
                created);

            return Results.Ok(new AuthResponse(jwt.Generate(user), user.Id, user.Name, user.Role.ToString()));
        });

        // POST /auth/guest — cria sessão de convidado (sem Google)
        group.MapPost("/guest", async (
            GuestLoginRequest req,
            JwtService jwt,
            IdentityDbContext db,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest("Nome é obrigatório");

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = req.Name.Trim(),
                Role = UserRole.Convidado,
                CreatedAt = DateTime.UtcNow,
            };

            db.Users.Add(user);
            await db.SaveChangesAsync(ct);

            logger.LogInformation(
                "AUDIT auth.guest.login.success userId={UserId} role={Role}",
                user.Id,
                user.Role);

            return Results.Ok(new AuthResponse(jwt.Generate(user), user.Id, user.Name, user.Role.ToString()));
        });

        // GET /auth/me — retorna dados do usuário autenticado
        group.MapGet("/me", async (
            ClaimsPrincipal principal,
            IdentityDbContext db,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue("sub"), out var userId))
                return Results.Unauthorized();

            var user = await db.Users.FindAsync([userId], ct);
            if (user is null) return Results.NotFound();

            logger.LogInformation(
                "AUDIT auth.me.success userId={UserId} role={Role}",
                user.Id,
                user.Role);

            return Results.Ok(new UserResponse(user.Id, user.Name, user.Email, user.Role.ToString()));
        }).RequireAuthorization();

        // POST /auth/google/authorize — inicia fluxo OAuth2 do Google
        group.MapPost("/google/authorize", (
            GoogleOAuthService oauthService,
            IConfiguration config,
            ILogger<Program> logger) =>
        {
            var state = Guid.NewGuid().ToString();
            var authUrl = oauthService.GetAuthorizationUrl(state);

            logger.LogInformation("AUDIT auth.google.authorize.issued state={State}", state);

            return Results.Ok(new OAuthAuthorizeResponse(authUrl, state));
        });

        // GET /auth/google/callback — recebe code do Google e troca por JWT
        group.MapGet("/google/callback", async (
            string code,
            string? state,
            GoogleOAuthService oauthService,
            JwtService jwt,
            IdentityDbContext db,
            IConfiguration config,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var frontendUrl = config["App:FrontendUrl"] ?? "http://localhost:5173";

            IResult RedirectWithError(string errorCode, string? errorDescription = null)
            {
                var errorUrl = QueryHelpers.AddQueryString(
                    $"{frontendUrl}/auth/callback",
                    new Dictionary<string, string?>
                    {
                        ["error"] = errorCode,
                        ["errorDescription"] = errorDescription,
                    });

                return Results.Redirect(errorUrl);
            }

            if (string.IsNullOrWhiteSpace(code))
                return RedirectWithError("oauth_missing_code", "Nao foi possivel concluir o login com Google.");

            var payload = await oauthService.ExchangeCodeForTokenAsync(code, ct);
            if (payload is null)
            {
                logger.LogWarning("AUDIT auth.google.callback.invalid_code state={State}", state);
                return RedirectWithError("oauth_invalid_code", "Nao foi possivel validar o login com Google.");
            }

            if (!payload.Email.EndsWith("@escoteiros.org.br", StringComparison.OrdinalIgnoreCase))
            {
                logger.LogWarning(
                    "AUDIT auth.google.callback.blocked_domain email={Email} state={State}",
                    payload.Email,
                    state);

                return RedirectWithError(
                    "oauth_domain_not_allowed",
                    "Use uma conta @escoteiros.org.br para acessar o sistema.");
            }

            var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleSub == payload.Subject, ct);
            var created = false;

            if (user is null)
            {
                var initialAdmin = config["App:InitialAdminEmail"];
                var role = string.Equals(payload.Email, initialAdmin, StringComparison.OrdinalIgnoreCase)
                    ? UserRole.ChefesEscoteiro
                    : UserRole.Integrante;

                user = new User
                {
                    Id = Guid.NewGuid(),
                    GoogleSub = payload.Subject,
                    Email = payload.Email,
                    Name = payload.Name ?? payload.Email,
                    Role = role,
                    CreatedAt = DateTime.UtcNow,
                };

                db.Users.Add(user);
                await db.SaveChangesAsync(ct);
                created = true;
            }

            var jwtToken = jwt.Generate(user);
            var redirectUrl = QueryHelpers.AddQueryString(
                $"{frontendUrl}/auth/callback",
                new Dictionary<string, string?>
                {
                    ["token"] = jwtToken,
                    ["userId"] = user.Id.ToString(),
                    ["name"] = user.Name,
                    ["role"] = user.Role.ToString(),
                });

            logger.LogInformation(
                "AUDIT auth.google.callback.success userId={UserId} role={Role} created={Created} state={State}",
                user.Id,
                user.Role,
                created,
                state);

            return Results.Redirect(redirectUrl);
        });
    }
}
