using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollegeLMS.API.Controllers;

/// <summary>
/// ★ Innovation Feature — Automated Deadline Reminder System
/// Serves in-app notifications to the Angular frontend.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController : ControllerBase
{
    // TODO (Person 3): Inject NotificationService

    /// <summary>GET /api/notification?userId={id} — Fetch all notifications for user</summary>
    [HttpGet]
    public IActionResult GetByUser([FromQuery] int userId) =>
        Ok(new { message = $"Notifications for user {userId} — not yet implemented" });

    /// <summary>GET /api/notification/unread-count?userId={id}</summary>
    [HttpGet("unread-count")]
    public IActionResult GetUnreadCount([FromQuery] int userId) =>
        Ok(new { message = $"Unread count for user {userId} — not yet implemented" });

    /// <summary>PATCH /api/notification/{id}/read — Mark single notification as read</summary>
    [HttpPatch("{id}/read")]
    public IActionResult MarkAsRead(int id) =>
        Ok(new { message = $"Mark notification {id} as read — not yet implemented" });

    /// <summary>PATCH /api/notification/read-all?userId={id} — Mark all as read</summary>
    [HttpPatch("read-all")]
    public IActionResult MarkAllAsRead([FromQuery] int userId) =>
        Ok(new { message = $"Mark all read for user {userId} — not yet implemented" });
}
