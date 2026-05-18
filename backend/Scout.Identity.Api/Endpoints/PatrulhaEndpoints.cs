using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Scout.Identity.Api.Contracts;
using Scout.Identity.Api.Infrastructure;
using Scout.Identity.Api.Services;

namespace Scout.Identity.Api.Endpoints;

public static class PatrulhaEndpoints
{
    public static void MapPatrulhaEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/patrulha").WithTags("Patrulha").RequireAuthorization();

        // POST /patrulha — cria Patrulha; o solicitante vira Monitor
        group.MapPost("/", async (
            CreatePatrulhaRequest req,
            ClaimsPrincipal principal,
            PatrulhaService service,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest("Nome da Patrulha é obrigatório");

            if (!Guid.TryParse(principal.FindFirstValue("sub"), out var userId))
                return Results.Unauthorized();

            var patrulha = await service.CreateAsync(req.Name, userId, ct);
            return Results.Created(
                $"/patrulha/{patrulha.Id}",
                new PatrulhaResponse(patrulha.Id, patrulha.Name, patrulha.MonitorId, patrulha.SubmonitorId, patrulha.CreatedAt));
        });

        // GET /patrulha/{id}
        group.MapGet("/{id:guid}", async (
            Guid id,
            IdentityDbContext db,
            CancellationToken ct) =>
        {
            var p = await db.Patrulhas.FindAsync([id], ct);
            return p is null
                ? Results.NotFound()
                : Results.Ok(new PatrulhaResponse(p.Id, p.Name, p.MonitorId, p.SubmonitorId, p.CreatedAt));
        });

        // GET /patrulha/{id}/social-profile
        group.MapGet("/{id:guid}/social-profile", async (
            Guid id,
            IdentityDbContext db,
            CancellationToken ct) =>
        {
            var patrulha = await db.Patrulhas
                .AsNoTracking()
                .Include(p => p.Monitor)
                .Include(p => p.Submonitor)
                .Include(p => p.Members)
                    .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(p => p.Id == id, ct);

            if (patrulha is null)
                return Results.NotFound();

            var recentMembers = patrulha.Members
                .OrderByDescending(member => member.JoinedAt)
                .Take(5)
                .Select(member => new PatrulhaMemberResponse(
                    member.UserId,
                    member.User.Name,
                    member.User.Role.ToString(),
                    member.JoinedAt))
                .ToList();

            return Results.Ok(new PatrulhaSocialProfileResponse(
                patrulha.Id,
                patrulha.Name,
                patrulha.MonitorId,
                patrulha.Monitor.Name,
                patrulha.SubmonitorId,
                patrulha.Submonitor?.Name,
                patrulha.CreatedAt,
                patrulha.Members.Count,
                recentMembers));
        });

        // GET /patrulha/{id}/members
        group.MapGet("/{id:guid}/members", async (
            Guid id,
            IdentityDbContext db,
            CancellationToken ct) =>
        {
            var members = await db.PatrulhaMembers
                .Where(m => m.PatrulhaId == id)
                .Include(m => m.User)
                .Select(m => new PatrulhaMemberResponse(m.UserId, m.User.Name, m.User.Role.ToString(), m.JoinedAt))
                .ToListAsync(ct);

            return Results.Ok(members);
        });

        // GET /patrulha/{id}/invite — gera novo QR de convite (Monitor ou Submonitor)
        group.MapGet("/{id:guid}/invite", async (
            Guid id,
            ClaimsPrincipal principal,
            PatrulhaService service,
            QrCodeService qrService,
            IConfiguration config,
            CancellationToken ct) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue("sub"), out var userId))
                return Results.Unauthorized();

            try
            {
                var invite = await service.GenerateInviteAsync(id, userId, ct);
                var baseUrl = config["App:BaseUrl"] ?? "http://localhost:5001";
                var joinUrl = $"{baseUrl}/patrulha/join?token={invite.Token}";
                var qr = qrService.GeneratePngBase64(joinUrl);

                return Results.Ok(new InviteResponse(invite.Id, invite.Token, joinUrl, qr, invite.ExpiresAt));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Problem(detail: ex.Message, statusCode: StatusCodes.Status403Forbidden);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { ex.Message });
            }
        });

        // POST /patrulha/join — integrante entra na Patrulha via token do QR
        group.MapPost("/join", async (
            JoinPatrulhaRequest req,
            ClaimsPrincipal principal,
            PatrulhaService service,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Token))
                return Results.BadRequest("Token é obrigatório");

            if (!Guid.TryParse(principal.FindFirstValue("sub"), out var userId))
                return Results.Unauthorized();

            var member = await service.JoinAsync(req.Token, userId, ct);

            return member is null
                ? Results.Problem(detail: "Token inválido ou expirado", statusCode: StatusCodes.Status400BadRequest)
                : Results.Ok(new { member.PatrulhaId, member.UserId, member.JoinedAt });
        });

        // PUT /patrulha/{id}/submonitor — Monitor nomeia Submonitor
        group.MapPut("/{id:guid}/submonitor", async (
            Guid id,
            SetSubmonitorRequest req,
            ClaimsPrincipal principal,
            PatrulhaService service,
            CancellationToken ct) =>
        {
            if (!Guid.TryParse(principal.FindFirstValue("sub"), out var requesterId))
                return Results.Unauthorized();

            try
            {
                await service.SetSubmonitorAsync(id, req.UserId, requesterId, ct);
                return Results.NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Problem(detail: ex.Message, statusCode: StatusCodes.Status403Forbidden);
            }
            catch (Exception ex) when (ex is KeyNotFoundException or InvalidOperationException)
            {
                return Results.BadRequest(new { ex.Message });
            }
        });
    }
}
