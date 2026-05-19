using System.Security.Claims;
using Scout.Cache.Api.Contracts;
using Scout.Cache.Api.Services;

namespace Scout.Cache.Api.Endpoints;

public static class AdminRoteiroEndpoints
{
    public static IEndpointRouteBuilder MapAdminRoteiroEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/roteiros")
            .WithTags("Admin - Roteiros")
            .RequireAuthorization("AdminOnly");

        group.MapPost("/", async (
            CreateRoteiroRequest req,
            ClaimsPrincipal principal,
            RoteiroService svc,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var actorId = principal.FindFirstValue("sub") ?? "unknown";
            var created = await svc.CreateAsync(req, ct);

            logger.LogInformation(
                "AUDIT admin.roteiro.created actorId={ActorId} roteiroId={RoteiroId} eventId={EventId}",
                actorId,
                created.Id,
                created.EventId);

            return Results.Created($"/api/admin/roteiros/{created.Id}", created);
        })
        .WithName("AdminCreateRoteiro")
        .Produces<RoteiroResponse>(StatusCodes.Status201Created);

        group.MapGet("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal principal,
            RoteiroService svc,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var actorId = principal.FindFirstValue("sub") ?? "unknown";
            var roteiro = await svc.GetByIdAsync(id, ct);

            if (roteiro is null)
            {
                logger.LogWarning(
                    "AUDIT admin.roteiro.get.notfound actorId={ActorId} roteiroId={RoteiroId}",
                    actorId,
                    id);
                return Results.NotFound();
            }

            return Results.Ok(roteiro);
        })
        .WithName("AdminGetRoteiroById")
        .Produces<RoteiroResponse>()
        .Produces(StatusCodes.Status404NotFound);

        group.MapGet("/event/{eventId:guid}", async (
            Guid eventId,
            ClaimsPrincipal principal,
            RoteiroService svc,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var actorId = principal.FindFirstValue("sub") ?? "unknown";
            var roteiros = await svc.ListByEventAsync(eventId, ct);

            logger.LogInformation(
                "AUDIT admin.roteiro.list actorId={ActorId} eventId={EventId} count={Count}",
                actorId,
                eventId,
                roteiros.Count());

            return Results.Ok(roteiros);
        })
        .WithName("AdminListRoteirosByEvent")
        .Produces<IEnumerable<RoteiroResponse>>();

        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateRoteiroRequest req,
            ClaimsPrincipal principal,
            RoteiroService svc,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var actorId = principal.FindFirstValue("sub") ?? "unknown";
            var updated = await svc.UpdateAsync(id, req, ct);

            if (updated is null)
            {
                logger.LogWarning(
                    "AUDIT admin.roteiro.update.notfound actorId={ActorId} roteiroId={RoteiroId}",
                    actorId,
                    id);
                return Results.NotFound();
            }

            logger.LogInformation(
                "AUDIT admin.roteiro.updated actorId={ActorId} roteiroId={RoteiroId} eventId={EventId}",
                actorId,
                updated.Id,
                updated.EventId);

            return Results.Ok(updated);
        })
        .WithName("AdminUpdateRoteiro")
        .Produces<RoteiroResponse>()
        .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal principal,
            RoteiroService svc,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var actorId = principal.FindFirstValue("sub") ?? "unknown";
            var deleted = await svc.DeleteAsync(id, ct);

            if (!deleted)
            {
                logger.LogWarning(
                    "AUDIT admin.roteiro.delete.notfound actorId={ActorId} roteiroId={RoteiroId}",
                    actorId,
                    id);
                return Results.NotFound();
            }

            logger.LogInformation(
                "AUDIT admin.roteiro.deleted actorId={ActorId} roteiroId={RoteiroId}",
                actorId,
                id);

            return Results.NoContent();
        })
        .WithName("AdminDeleteRoteiro")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound);

        return app;
    }
}
