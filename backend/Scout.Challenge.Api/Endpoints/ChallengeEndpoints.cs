using System.Security.Claims;
using Scout.Challenge.Api.Contracts;
using Scout.Challenge.Api.Services;

namespace Scout.Challenge.Api.Endpoints;

public static class ChallengeEndpoints
{
    public static IEndpointRouteBuilder MapChallengeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/challenges")
            .WithTags("Challenges")
            .RequireAuthorization();

        // GET /api/challenges?eventId=...
        group.MapGet("/", async (Guid eventId, ChallengeService svc, CancellationToken ct) =>
        {
            var list = await svc.GetByEventAsync(eventId, ct);
            return Results.Ok(list);
        })
        .WithName("GetChallengesByEvent")
        .Produces<List<ChallengeResponse>>();

        // GET /api/challenges/{id}
        group.MapGet("/{id:guid}", async (Guid id, ChallengeService svc, CancellationToken ct) =>
        {
            var challenge = await svc.GetByIdAsync(id, ct);
            return challenge is null ? Results.NotFound() : Results.Ok(challenge);
        })
        .WithName("GetChallengeById")
        .Produces<ChallengeResponse>()
        .Produces(StatusCodes.Status404NotFound);

        // POST /api/challenges/{id}/validate
        group.MapPost("/{id:guid}/validate",
            async (
                Guid id,
                ValidateChallengeRequest req,
                ClaimsPrincipal principal,
                ChallengeService svc,
                ILogger<Program> logger,
                CancellationToken ct) =>
            {
                var actorId = principal.FindFirstValue("sub") ?? "unknown";

                try
                {
                    var result = await svc.ValidateAsync(id, req, ct);

                    logger.LogInformation(
                        "AUDIT checkin.request.processed actorId={ActorId} challengeId={ChallengeId} attemptId={AttemptId} status={Status}",
                        actorId,
                        id,
                        result.Id,
                        result.Status);

                    return Results.Ok(result);
                }
                catch (KeyNotFoundException ex)
                {
                    logger.LogWarning(
                        "AUDIT checkin.request.notfound actorId={ActorId} challengeId={ChallengeId} message={Message}",
                        actorId,
                        id,
                        ex.Message);

                    return Results.NotFound(ex.Message);
                }
                catch (InvalidOperationException ex)
                {
                    logger.LogWarning(
                        "AUDIT checkin.request.conflict actorId={ActorId} challengeId={ChallengeId} message={Message}",
                        actorId,
                        id,
                        ex.Message);

                    return Results.Conflict(ex.Message);
                }
            })
        .WithName("ValidateChallenge")
        .Produces<AttemptResponse>()
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status409Conflict);

        // GET /api/challenges/score?patrulhaId=...&eventId=...
        group.MapGet("/score",
            async (Guid patrulhaId, Guid eventId, ChallengeService svc, CancellationToken ct) =>
            {
                var score = await svc.GetScoreAsync(patrulhaId, eventId, ct);
                return Results.Ok(score);
            })
        .WithName("GetPatrulhaScore")
        .Produces<PatrulhaScoreResponse>();

        return app;
    }
}
