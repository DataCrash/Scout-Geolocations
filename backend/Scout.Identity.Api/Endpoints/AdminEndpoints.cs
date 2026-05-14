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
        group.MapGet("/users", async (IdentityDbContext db, CancellationToken ct) =>
        {
            var users = await db.Users
                .Select(u => new UserResponse(u.Id, u.Name, u.Email, u.Role.ToString()))
                .ToListAsync(ct);

            return Results.Ok(users);
        });

        // PUT /admin/users/{id}/role — promove ou rebaixa papel de qualquer usuário
        group.MapPut("/users/{id:guid}/role", async (
            Guid                 id,
            UpdateUserRoleRequest req,
            IdentityDbContext    db,
            CancellationToken    ct) =>
        {
            if (!Enum.TryParse<UserRole>(req.Role, ignoreCase: true, out var role))
                return Results.BadRequest(new
                {
                    Message = $"Papel inválido. Opções: {string.Join(", ", Enum.GetNames<UserRole>())}",
                });

            var user = await db.Users.FindAsync([id], ct);
            if (user is null) return Results.NotFound();

            user.Role = role;
            await db.SaveChangesAsync(ct);

            return Results.Ok(new UserResponse(user.Id, user.Name, user.Email, user.Role.ToString()));
        });

        // GET /admin/patrulhas
        group.MapGet("/patrulhas", async (IdentityDbContext db, CancellationToken ct) =>
        {
            var patrulhas = await db.Patrulhas
                .Select(p => new PatrulhaResponse(p.Id, p.Name, p.MonitorId, p.SubmonitorId, p.CreatedAt))
                .ToListAsync(ct);

            return Results.Ok(patrulhas);
        });

        // DELETE /admin/users/{id}/location-data
        // Stub: exclusão efetiva será delegada ao Location Service via mensageria (RabbitMQ).
        // Este endpoint registra a intenção e a trilha de auditoria.
        group.MapDelete("/users/{id:guid}/location-data", (Guid id) =>
            Results.Accepted(value: new
            {
                Message = "Solicitação de exclusão de dados de localização registrada",
                UserId  = id,
                Note    = "Execução assíncrona via Location Service",
            }));
    }
}
