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
        GeocacheService svc,
        CancellationToken ct)
    {
        try
        {
            var result = await svc.CreateAsync(req, ct);
            return Results.Created($"/api/geocaches/{result.Id}", result);
        }
        catch (ArgumentException ex)
        {
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
        GeocacheService svc,
        CancellationToken ct)
    {
        var result = await svc.UpdateAsync(id, req, ct);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }

    private static async Task<IResult> DeleteCache(Guid id, GeocacheService svc, CancellationToken ct)
    {
        var deleted = await svc.DeleteAsync(id, ct);
        return deleted ? Results.NoContent() : Results.NotFound();
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
