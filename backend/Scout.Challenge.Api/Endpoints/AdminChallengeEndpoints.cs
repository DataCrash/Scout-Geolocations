using System.Security.Claims;
using Scout.Challenge.Api.Contracts;
using Scout.Challenge.Api.Services;

namespace Scout.Challenge.Api.Endpoints;

public static class AdminChallengeEndpoints
{
    public static IEndpointRouteBuilder MapAdminChallengeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/challenges")
            .WithTags("Admin - Challenges")
            .RequireAuthorization("AdminOnly");

        // POST /api/admin/challenges
        group.MapPost("/", async (
            CreateChallengeRequest req,
            ClaimsPrincipal principal,
            ChallengeService svc,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var actorId = principal.FindFirstValue("sub") ?? "unknown";
            var created = await svc.CreateAsync(req, ct);

            logger.LogInformation(
                "AUDIT admin.challenge.created actorId={ActorId} challengeId={ChallengeId} eventId={EventId}",
                actorId,
                created.Id,
                created.EventId);

            return Results.Created($"/api/challenges/{created.Id}", created);
        })
        .WithName("AdminCreateChallenge")
        .Produces<ChallengeResponse>(StatusCodes.Status201Created);

        // PUT /api/admin/challenges/{id}
        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateChallengeRequest req,
            ClaimsPrincipal principal,
            ChallengeService svc,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var actorId = principal.FindFirstValue("sub") ?? "unknown";
            var updated = await svc.UpdateAsync(id, req, ct);

            if (updated is null)
            {
                logger.LogWarning(
                    "AUDIT admin.challenge.update.notfound actorId={ActorId} challengeId={ChallengeId}",
                    actorId,
                    id);
                return Results.NotFound();
            }

            logger.LogInformation(
                "AUDIT admin.challenge.updated actorId={ActorId} challengeId={ChallengeId} eventId={EventId}",
                actorId,
                updated.Id,
                updated.EventId);

            return Results.Ok(updated);
        })
        .WithName("AdminUpdateChallenge")
        .Produces<ChallengeResponse>()
        .Produces(StatusCodes.Status404NotFound);

        // DELETE /api/admin/challenges/{id}
        group.MapDelete("/{id:guid}", async (
            Guid id,
            ClaimsPrincipal principal,
            ChallengeService svc,
            ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var actorId = principal.FindFirstValue("sub") ?? "unknown";
            var deleted = await svc.DeleteAsync(id, ct);

            if (!deleted)
            {
                logger.LogWarning(
                    "AUDIT admin.challenge.delete.notfound actorId={ActorId} challengeId={ChallengeId}",
                    actorId,
                    id);
                return Results.NotFound();
            }

            logger.LogInformation(
                "AUDIT admin.challenge.deleted actorId={ActorId} challengeId={ChallengeId}",
                actorId,
                id);

            return Results.NoContent();
        })
        .WithName("AdminDeleteChallenge")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound);

        return app;
    }
}
