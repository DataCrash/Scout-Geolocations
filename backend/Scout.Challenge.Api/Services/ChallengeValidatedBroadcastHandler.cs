using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Scout.Challenge.Api.Domain.Enums;
using Scout.Challenge.Api.Domain.Events;
using Scout.Challenge.Api.Hubs;
using Scout.Challenge.Api.Infrastructure;

namespace Scout.Challenge.Api.Services;

public class ChallengeValidatedBroadcastHandler(
    ChallengeDbContext db,
    IHubContext<LeaderboardHub> hubContext) : INotificationHandler<ChallengeValidated>
{
    public async Task Handle(ChallengeValidated notification, CancellationToken cancellationToken)
    {
        var challengeEventId = await db.Challenges
            .Where(c => c.Id == notification.ChallengeId)
            .Select(c => c.EventId)
            .FirstOrDefaultAsync(cancellationToken);

        if (challengeEventId == Guid.Empty)
        {
            return;
        }

        var attempts = await db.ChallengeAttempts
            .Include(a => a.Challenge)
            .Where(a => a.PatrulhaId == notification.PatrulhaId && a.Challenge.EventId == challengeEventId)
            .ToListAsync(cancellationToken);

        var totalPoints = attempts
            .Where(a => a.Status == AttemptStatus.Validated)
            .Sum(a => a.PointsAwarded);

        var validatedChallenges = attempts.Count(a => a.Status == AttemptStatus.Validated);

        await hubContext.Clients.Group(LeaderboardHub.EventGroup(challengeEventId)).SendAsync(
            "leaderboard.updated",
            new
            {
                EventId = challengeEventId,
                PatrulhaId = notification.PatrulhaId,
                TotalPoints = totalPoints,
                ValidatedChallenges = validatedChallenges,
                UpdatedAt = DateTime.UtcNow,
            },
            cancellationToken);
    }
}
