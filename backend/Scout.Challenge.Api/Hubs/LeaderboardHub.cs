using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Scout.Challenge.Api.Hubs;

[Authorize]
public class LeaderboardHub : Hub
{
    public Task JoinEventGroup(Guid eventId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, EventGroup(eventId));
    }

    public Task LeaveEventGroup(Guid eventId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, EventGroup(eventId));
    }

    public static string EventGroup(Guid eventId) => $"event-{eventId}";
}
