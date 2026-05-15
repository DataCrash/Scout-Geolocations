using MediatR;
using Microsoft.EntityFrameworkCore;
using Scout.Identity.Api.Domain.Entities;
using Scout.Identity.Api.Domain.Enums;
using Scout.Identity.Api.Domain.Events;
using Scout.Identity.Api.Infrastructure;

namespace Scout.Identity.Api.Services;

public class PatrulhaService(IdentityDbContext db, IPublisher publisher, ILogger<PatrulhaService> logger)
{
    private static readonly TimeSpan DefaultInviteValidity = TimeSpan.FromHours(8);

    public async Task<Patrulha> CreateAsync(string name, Guid monitorId, CancellationToken ct = default)
    {
        var patrulha = new Patrulha
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            MonitorId = monitorId,
            CreatedAt = DateTime.UtcNow,
        };

        db.Patrulhas.Add(patrulha);
        db.PatrulhaMembers.Add(new PatrulhaMember
        {
            PatrulhaId = patrulha.Id,
            UserId = monitorId,
            JoinedAt = DateTime.UtcNow,
        });

        var monitor = await db.Users.FindAsync([monitorId], ct)
            ?? throw new KeyNotFoundException("Usuário não encontrado");

        monitor.Role = UserRole.Monitor;

        await db.SaveChangesAsync(ct);
        await publisher.Publish(new PatrulhaCreatedEvent(patrulha.Id, monitorId, patrulha.Name), ct);

        logger.LogInformation(
            "AUDIT patrulha.created patrulhaId={PatrulhaId} monitorId={MonitorId} name={PatrulhaName}",
            patrulha.Id,
            monitorId,
            patrulha.Name);

        return patrulha;
    }

    public async Task<PatrulhaInvite> GenerateInviteAsync(
        Guid patrulhaId, Guid requesterId, CancellationToken ct = default)
    {
        var patrulha = await db.Patrulhas.FindAsync([patrulhaId], ct)
            ?? throw new KeyNotFoundException("Patrulha não encontrada");

        if (patrulha.MonitorId != requesterId && patrulha.SubmonitorId != requesterId)
            throw new UnauthorizedAccessException("Apenas Monitor ou Submonitor podem gerar convites");

        // Revoga convites ativos anteriores desta Patrulha
        var existing = await db.PatrulhaInvites
            .Where(i => i.PatrulhaId == patrulhaId && !i.IsRevoked)
            .ToListAsync(ct);

        foreach (var inv in existing)
            inv.IsRevoked = true;

        var invite = new PatrulhaInvite
        {
            Id = Guid.NewGuid(),
            PatrulhaId = patrulhaId,
            Token = Guid.NewGuid().ToString("N"),
            CreatedById = requesterId,
            ExpiresAt = DateTime.UtcNow.Add(DefaultInviteValidity),
            IsRevoked = false,
        };

        db.PatrulhaInvites.Add(invite);
        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "AUDIT patrulha.invite.generated patrulhaId={PatrulhaId} requesterId={RequesterId} inviteId={InviteId} expiresAt={ExpiresAt}",
            patrulhaId,
            requesterId,
            invite.Id,
            invite.ExpiresAt);

        return invite;
    }

    public async Task<PatrulhaMember?> JoinAsync(string token, Guid userId, CancellationToken ct = default)
    {
        var invite = await db.PatrulhaInvites
            .FirstOrDefaultAsync(i => i.Token == token, ct);

        if (invite is null || !invite.IsValid)
        {
            logger.LogWarning(
                "AUDIT patrulha.join.invalid_token userId={UserId}",
                userId);

            return null;
        }

        var alreadyMember = await db.PatrulhaMembers
            .AnyAsync(m => m.PatrulhaId == invite.PatrulhaId && m.UserId == userId, ct);

        if (alreadyMember)
        {
            logger.LogInformation(
                "AUDIT patrulha.join.already_member patrulhaId={PatrulhaId} userId={UserId}",
                invite.PatrulhaId,
                userId);

            return await db.PatrulhaMembers
                .FirstAsync(m => m.PatrulhaId == invite.PatrulhaId && m.UserId == userId, ct);
        }

        var member = new PatrulhaMember
        {
            PatrulhaId = invite.PatrulhaId,
            UserId = userId,
            JoinedAt = DateTime.UtcNow,
        };

        db.PatrulhaMembers.Add(member);
        await db.SaveChangesAsync(ct);

        var user = await db.Users.FindAsync([userId], ct);
        await publisher.Publish(new MemberJoinedEvent(invite.PatrulhaId, userId, user!.Role), ct);

        logger.LogInformation(
            "AUDIT patrulha.member.joined patrulhaId={PatrulhaId} userId={UserId} role={Role}",
            invite.PatrulhaId,
            userId,
            user.Role);

        return member;
    }

    public async Task SetSubmonitorAsync(
        Guid patrulhaId, Guid newSubmonitorId, Guid requesterId, CancellationToken ct = default)
    {
        var patrulha = await db.Patrulhas.FindAsync([patrulhaId], ct)
            ?? throw new KeyNotFoundException("Patrulha não encontrada");

        if (patrulha.MonitorId != requesterId)
            throw new UnauthorizedAccessException("Apenas o Monitor pode nomear Submonitor");

        var isMember = await db.PatrulhaMembers
            .AnyAsync(m => m.PatrulhaId == patrulhaId && m.UserId == newSubmonitorId, ct);

        if (!isMember)
            throw new InvalidOperationException("Usuário não é membro desta Patrulha");

        // Rebaixa o Submonitor anterior
        if (patrulha.SubmonitorId.HasValue)
        {
            var prevSub = await db.Users.FindAsync([patrulha.SubmonitorId.Value], ct);
            if (prevSub is { Role: UserRole.Submonitor })
                prevSub.Role = UserRole.Integrante;
        }

        patrulha.SubmonitorId = newSubmonitorId;

        var newSub = await db.Users.FindAsync([newSubmonitorId], ct)
            ?? throw new KeyNotFoundException("Usuário não encontrado");

        newSub.Role = UserRole.Submonitor;

        await db.SaveChangesAsync(ct);
        await publisher.Publish(new SubmonitorAssignedEvent(patrulhaId, newSubmonitorId), ct);

        logger.LogInformation(
            "AUDIT patrulha.submonitor.assigned patrulhaId={PatrulhaId} requesterId={RequesterId} submonitorId={SubmonitorId}",
            patrulhaId,
            requesterId,
            newSubmonitorId);
    }
}
