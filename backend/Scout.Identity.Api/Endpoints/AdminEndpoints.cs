using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Scout.Identity.Api.Contracts;
using Scout.Identity.Api.Domain.Enums;
using Scout.Identity.Api.Infrastructure;

namespace Scout.Identity.Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
        // Todos os endpoints deste grupo exigem papel ChefesEscoteiro
        var group = app.MapGroup("/admin").WithTags("Admin")
            .RequireAuthorization("ChefesEscoteiro");

        // GET /admin/users
        group.MapGet("/users", async (
            ClaimsPrincipal principal,
            IdentityDbContext db,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var actorId = principal.FindFirstValue("sub") ?? "unknown";
            var users = await db.Users
                .Select(u => new UserResponse(u.Id, u.Name, u.Email, u.Role.ToString()))
                .ToListAsync(ct);

            logger.LogInformation(
                "AUDIT admin.users.list actorId={ActorId} count={Count}",
                actorId,
                users.Count);

            return Results.Ok(users);
        });

        // PUT /admin/users/{id}/role — promove ou rebaixa papel de qualquer usuário
        group.MapPut("/users/{id:guid}/role", async (
            Guid id,
            UpdateUserRoleRequest req,
            ClaimsPrincipal principal,
            IdentityDbContext db,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var actorId = principal.FindFirstValue("sub") ?? "unknown";

            if (!Enum.TryParse<UserRole>(req.Role, ignoreCase: true, out var role))
            {
                logger.LogWarning(
                    "AUDIT admin.users.role.invalid actorId={ActorId} targetUserId={TargetUserId} requestedRole={RequestedRole}",
                    actorId,
                    id,
                    req.Role);

                return Results.BadRequest(new
                {
                    Message = $"Papel inválido. Opções: {string.Join(", ", Enum.GetNames<UserRole>())}",
                });
            }

            var user = await db.Users.FindAsync([id], ct);
            if (user is null)
            {
                logger.LogWarning(
                    "AUDIT admin.users.role.notfound actorId={ActorId} targetUserId={TargetUserId}",
                    actorId,
                    id);

                return Results.NotFound();
            }

            var previousRole = user.Role;

            user.Role = role;
            await db.SaveChangesAsync(ct);

            logger.LogInformation(
                "AUDIT admin.users.role.updated actorId={ActorId} targetUserId={TargetUserId} previousRole={PreviousRole} newRole={NewRole}",
                actorId,
                user.Id,
                previousRole,
                user.Role);

            return Results.Ok(new UserResponse(user.Id, user.Name, user.Email, user.Role.ToString()));
        });

        // GET /admin/patrulhas
        group.MapGet("/patrulhas", async (
            ClaimsPrincipal principal,
            IdentityDbContext db,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var actorId = principal.FindFirstValue("sub") ?? "unknown";
            var patrulhas = await db.Patrulhas
                .Select(p => new PatrulhaResponse(p.Id, p.Name, p.MonitorId, p.SubmonitorId, p.CreatedAt))
                .ToListAsync(ct);

            logger.LogInformation(
                "AUDIT admin.patrulhas.list actorId={ActorId} count={Count}",
                actorId,
                patrulhas.Count);

            return Results.Ok(patrulhas);
        });

        // DELETE /admin/users/{id}/location-data
        // Stub: exclusão efetiva será delegada ao Location Service via mensageria (RabbitMQ).
        // Este endpoint registra a intenção e a trilha de auditoria.
        group.MapDelete("/users/{id:guid}/location-data", (
            Guid id,
            ClaimsPrincipal principal,
            ILogger<Program> logger) =>
        {
            var actorId = principal.FindFirstValue("sub") ?? "unknown";

            logger.LogInformation(
                "AUDIT admin.location.delete.requested actorId={ActorId} targetUserId={TargetUserId}",
                actorId,
                id);

            return Results.Accepted(value: new
            {
                Message = "Solicitação de exclusão de dados de localização registrada",
                UserId = id,
                Note = "Execução assíncrona via Location Service",
            });
        });
    }
}
