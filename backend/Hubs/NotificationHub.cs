using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SkillSathiAPI.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        // Hub is primarily used for server-to-client notifications pushing.
        // We will inject IHubContext<NotificationHub> in our controllers to push events.
    }
}
