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
        group.MapPost("/", async (CreateChallengeRequest req, ChallengeService svc, CancellationToken ct) =>
        {
            var created = await svc.CreateAsync(req, ct);
            return Results.Created($"/api/challenges/{created.Id}", created);
        })
        .WithName("AdminCreateChallenge")
        .Produces<ChallengeResponse>(StatusCodes.Status201Created);

        // PUT /api/admin/challenges/{id}
        group.MapPut("/{id:guid}", async (Guid id, UpdateChallengeRequest req, ChallengeService svc, CancellationToken ct) =>
        {
            var updated = await svc.UpdateAsync(id, req, ct);
            return updated is null ? Results.NotFound() : Results.Ok(updated);
        })
        .WithName("AdminUpdateChallenge")
        .Produces<ChallengeResponse>()
        .Produces(StatusCodes.Status404NotFound);

        // DELETE /api/admin/challenges/{id}
        group.MapDelete("/{id:guid}", async (Guid id, ChallengeService svc, CancellationToken ct) =>
        {
            var deleted = await svc.DeleteAsync(id, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        })
        .WithName("AdminDeleteChallenge")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound);

        return app;
    }
}
