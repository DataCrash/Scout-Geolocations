using System.Security.Claims;
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
            GoogleAuthService  googleAuth,
            JwtService         jwt,
            IdentityDbContext  db,
            IConfiguration     config,
            CancellationToken  ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.IdToken))
                return Results.BadRequest("idToken é obrigatório");

            var payload = await googleAuth.ValidateAsync(req.IdToken);
            if (payload is null)
                return Results.Unauthorized();

            if (!payload.Email.EndsWith("@escoteiros.org.br", StringComparison.OrdinalIgnoreCase))
                return Results.Problem(
                    detail:     "Apenas contas @escoteiros.org.br são permitidas",
                    statusCode: StatusCodes.Status403Forbidden);

            var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleSub == payload.Subject, ct);

            if (user is null)
            {
                var initialAdmin = config["App:InitialAdminEmail"];
                var role = string.Equals(payload.Email, initialAdmin, StringComparison.OrdinalIgnoreCase)
                    ? UserRole.ChefesEscoteiro
                    : UserRole.Integrante;

                user = new User
                {
                    Id        = Guid.NewGuid(),
                    GoogleSub = payload.Subject,
                    Email     = payload.Email,
                    Name      = payload.Name ?? payload.Email,
                    Role      = role,
                    CreatedAt = DateTime.UtcNow,
                };

                db.Users.Add(user);
                await db.SaveChangesAsync(ct);
            }

            return Results.Ok(new AuthResponse(jwt.Generate(user), user.Id, user.Name, user.Role.ToString()));
        });

        // POST /auth/guest — cria sessão de convidado (sem Google)
        group.MapPost("/guest", async (
            GuestLoginRequest req,
            JwtService        jwt,
            IdentityDbContext db,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest("Nome é obrigatório");

            var user = new User
            {
                Id        = Guid.NewGuid(),
                Name      = req.Name.Trim(),
                Role      = UserRole.Convidado,
                CreatedAt = DateTime.UtcNow,
            };

            db.Users.Add(user);
            await db.SaveChangesAsync(ct);

            return Results.Ok(new AuthResponse(jwt.Generate(user), user.Id, user.Name, user.Role.ToString()));
        });

        // GET /auth/me — retorna dados do usuário autenticado
        group.MapGet("/me", async (
            ClaimsPrincipal   principal,
            IdentityDbContext db,
            CancellationToken ct) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue("sub"), out var userId))
                return Results.Unauthorized();

            var user = await db.Users.FindAsync([userId], ct);
            if (user is null) return Results.NotFound();

            return Results.Ok(new UserResponse(user.Id, user.Name, user.Email, user.Role.ToString()));
        }).RequireAuthorization();

        // POST /auth/google/authorize — inicia fluxo OAuth2 do Google
        group.MapPost("/google/authorize", (
            GoogleOAuthService oauthService,
            IConfiguration config) =>
        {
            var state = Guid.NewGuid().ToString();
            var authUrl = oauthService.GetAuthorizationUrl(state);

            return Results.Ok(new OAuthAuthorizeResponse(authUrl, state));
        });

        // GET /auth/google/callback — recebe code do Google e troca por JWT
        group.MapGet("/google/callback", async (
            string code,
            string? state,
            GoogleOAuthService oauthService,
            JwtService         jwt,
            IdentityDbContext  db,
            IConfiguration     config,
            CancellationToken  ct) =>
        {
            if (string.IsNullOrWhiteSpace(code))
                return Results.BadRequest("code é obrigatório");

            var payload = await oauthService.ExchangeCodeForTokenAsync(code, ct);
            if (payload is null)
                return Results.Unauthorized();

            if (!payload.Email.EndsWith("@escoteiros.org.br", StringComparison.OrdinalIgnoreCase))
                return Results.Problem(
                    detail:     "Apenas contas @escoteiros.org.br são permitidas",
                    statusCode: StatusCodes.Status403Forbidden);

            var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleSub == payload.Subject, ct);

            if (user is null)
            {
                var initialAdmin = config["App:InitialAdminEmail"];
                var role = string.Equals(payload.Email, initialAdmin, StringComparison.OrdinalIgnoreCase)
                    ? UserRole.ChefesEscoteiro
                    : UserRole.Integrante;

                user = new User
                {
                    Id        = Guid.NewGuid(),
                    GoogleSub = payload.Subject,
                    Email     = payload.Email,
                    Name      = payload.Name ?? payload.Email,
                    Role      = role,
                    CreatedAt = DateTime.UtcNow,
                };

                db.Users.Add(user);
                await db.SaveChangesAsync(ct);
            }

            var frontendUrl = config["App:FrontendUrl"] ?? "http://localhost:5173";
            var jwtToken = jwt.Generate(user);
            var redirectUrl = $"{frontendUrl}/auth/callback?token={jwtToken}&userId={user.Id}&name={user.Name}&role={user.Role}";

            return Results.Redirect(redirectUrl);
        });
    }
}
