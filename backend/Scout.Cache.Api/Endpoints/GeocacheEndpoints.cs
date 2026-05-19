using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Scout.Cache.Api.Contracts;
using Scout.Cache.Api.Services;

namespace Scout.Cache.Api.Endpoints;

public static class GeocacheEndpoints
{
    public static void MapGeocacheEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/geocaches")
            .WithTags("Geocaches")
            .RequireAuthorization();

        // ── CRUD ──────────────────────────────────────────────────────────────

        group.MapPost("/", CreateCache)
            .WithName("CreateGeocache");

        group.MapGet("/{id:guid}", GetById)
            .WithName("GetGeocacheById");

        group.MapGet("/event/{eventId:guid}", ListByEvent)
            .WithName("ListGeocachesByEvent");

        group.MapPut("/{id:guid}", UpdateCache)
            .WithName("UpdateGeocache");

        group.MapDelete("/{id:guid}", DeleteCache)
            .WithName("DeleteGeocache")
            .RequireAuthorization("AdminOnly");

        // ── Busca por proximidade ─────────────────────────────────────────────

        group.MapGet("/nearby", FindNearby)
            .WithName("FindNearbyGeocaches")
            .AllowAnonymous();

        // ── Lookup por QR ─────────────────────────────────────────────────────

        group.MapGet("/qr/{code}", GetByQrCode)
            .WithName("GetGeocacheByQrCode")
            .AllowAnonymous();
    }

    private static async Task<IResult> CreateCache(
        CreateGeocacheRequest req,
        ClaimsPrincipal principal,
        ILogger<Program> logger,
        GeocacheService svc,
        CancellationToken ct)
    {
        var actorId = principal.FindFirstValue("sub") ?? "unknown";

        try
        {
            var result = await svc.CreateAsync(req, ct);

            logger.LogInformation(
                "AUDIT admin.geocache.created actorId={ActorId} geocacheId={GeocacheId} eventId={EventId}",
                actorId,
                result.Id,
                result.EventId);

            return Results.Created($"/api/geocaches/{result.Id}", result);
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(
                "AUDIT admin.geocache.create.invalid actorId={ActorId} eventId={EventId} message={Message}",
                actorId,
                req.EventId,
                ex.Message);

            return Results.BadRequest(new { error = ex.Message });
        }
    }

    private static async Task<IResult> GetById(Guid id, GeocacheService svc, CancellationToken ct)
    {
        var result = await svc.GetByIdAsync(id, ct);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }

    private static async Task<IResult> ListByEvent(Guid eventId, GeocacheService svc, CancellationToken ct)
    {
        var result = await svc.ListByEventAsync(eventId, ct);
        return Results.Ok(result);
    }

    private static async Task<IResult> UpdateCache(
        Guid id,
        UpdateGeocacheRequest req,
        ClaimsPrincipal principal,
        ILogger<Program> logger,
        GeocacheService svc,
        CancellationToken ct)
    {
        var actorId = principal.FindFirstValue("sub") ?? "unknown";
        var result = await svc.UpdateAsync(id, req, ct);

        if (result is null)
        {
            logger.LogWarning(
                "AUDIT admin.geocache.update.notfound actorId={ActorId} geocacheId={GeocacheId}",
                actorId,
                id);

            return Results.NotFound();
        }

        logger.LogInformation(
            "AUDIT admin.geocache.updated actorId={ActorId} geocacheId={GeocacheId} eventId={EventId}",
            actorId,
            result.Id,
            result.EventId);

        return Results.Ok(result);
    }

    private static async Task<IResult> DeleteCache(
        Guid id,
        ClaimsPrincipal principal,
        ILogger<Program> logger,
        GeocacheService svc,
        CancellationToken ct)
    {
        var actorId = principal.FindFirstValue("sub") ?? "unknown";
        var deleted = await svc.DeleteAsync(id, ct);

        if (!deleted)
        {
            logger.LogWarning(
                "AUDIT admin.geocache.delete.notfound actorId={ActorId} geocacheId={GeocacheId}",
                actorId,
                id);

            return Results.NotFound();
        }

        logger.LogInformation(
            "AUDIT admin.geocache.deleted actorId={ActorId} geocacheId={GeocacheId}",
            actorId,
            id);

        return Results.NoContent();
    }

    private static async Task<IResult> FindNearby(
        [FromQuery] double lat,
        [FromQuery] double lon,
        [FromQuery] double radius,
        [FromQuery] Guid? eventId,
        GeocacheService svc,
        CancellationToken ct)
    {
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180)
            return Results.BadRequest(new { error = "Coordenadas inválidas." });

        if (radius <= 0 || radius > 50)
            return Results.BadRequest(new { error = "Raio deve ser entre 0 e 50 km." });

        var result = await svc.FindNearbyAsync(lat, lon, radius, eventId, ct);
        return Results.Ok(result);
    }

    private static async Task<IResult> GetByQrCode(string code, GeocacheService svc, CancellationToken ct)
    {
        var result = await svc.GetByQrCodeAsync(code, ct);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }
}
