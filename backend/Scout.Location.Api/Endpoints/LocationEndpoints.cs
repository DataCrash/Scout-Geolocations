using System.Security.Claims;
using Scout.Location.Api.Contracts;
using Scout.Location.Api.Services;

namespace Scout.Location.Api.Endpoints;

public static class LocationEndpoints
{
    public static void MapLocationEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/locations").WithTags("Locations");

        // POST /api/locations — atualiza posição do usuário autenticado
        group.MapPost("/", async (
            UpdateLocationRequest req,
            ClaimsPrincipal user,
            LocationService svc) =>
        {
            var userIdStr = user.FindFirstValue("sub") ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Results.Unauthorized();

            // Validação básica
            if (req.Latitude is < -90 or > 90)
                return Results.BadRequest("Latitude inválida.");
            if (req.Longitude is < -180 or > 180)
                return Results.BadRequest("Longitude inválida.");

            await svc.UpdateLocationAsync(
                userId,
                req.EventId,
                req.Latitude,
                req.Longitude,
                req.Accuracy,
                req.Altitude,
                req.RecordedAt == default ? DateTime.UtcNow : req.RecordedAt.ToUniversalTime());

            return Results.NoContent();
        }).RequireAuthorization();

        // GET /api/locations/me — posição atual do usuário autenticado
        group.MapGet("/me", async (
            ClaimsPrincipal user,
            LocationService svc) =>
        {
            var userIdStr = user.FindFirstValue("sub") ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Results.Unauthorized();

            var location = await svc.GetCurrentLocationAsync(userId);
            return location is not null
                ? Results.Ok(location)
                : Results.NotFound();
        }).RequireAuthorization();

        // GET /api/locations/user/{userId} — posição atual de usuário específico (admin)
        group.MapGet("/user/{userId:guid}", async (
            Guid userId,
            LocationService svc) =>
        {
            var location = await svc.GetCurrentLocationAsync(userId);
            return location is not null
                ? Results.Ok(location)
                : Results.NotFound();
        }).RequireAuthorization("AdminOnly");

        // GET /api/locations/nearby — usuários próximos
        group.MapGet("/nearby", async (
            double lat,
            double lon,
            double radius,
            Guid? eventId,
            LocationService svc) =>
        {
            if (radius is <= 0 or > 50000)
                return Results.BadRequest("Raio deve estar entre 1 e 50000 metros.");

            var nearby = await svc.GetUsersNearbyAsync(lat, lon, radius, eventId);
            return Results.Ok(nearby);
        }).RequireAuthorization();

        // GET /api/locations/history — histórico de posições (admin)
        group.MapGet("/history", async (
            Guid userId,
            DateTime? from,
            DateTime? to,
            int limit,
            LocationService svc) =>
        {
            if (limit is <= 0 or > 1000) limit = 200;
            var history = await svc.GetHistoryAsync(userId, from, to, limit);
            return Results.Ok(history);
        }).RequireAuthorization("AdminOnly");

        // GET /health
        app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "location-api" }));
    }
}
