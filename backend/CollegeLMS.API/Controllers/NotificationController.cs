using CollegeLMS.API.Contracts;
using CollegeLMS.API.Extensions;
using CollegeLMS.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollegeLMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController(NotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationResponse>>> GetByUser(
        [FromQuery] int userId,
        CancellationToken cancellationToken)
    {
        var accessResult = await EnsureAccessibleAsync(userId, cancellationToken);
        if (accessResult is not null)
        {
            return accessResult;
        }

        var notifications = await notificationService.GetByUserAsync(userId, cancellationToken);
        return Ok(notifications.Select(ToResponse));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<UnreadCountResponse>> GetUnreadCount(
        [FromQuery] int userId,
        CancellationToken cancellationToken)
    {
        var accessResult = await EnsureAccessibleAsync(userId, cancellationToken);
        if (accessResult is not null)
        {
            return accessResult;
        }

        var count = await notificationService.GetUnreadCountAsync(userId, cancellationToken);
        return Ok(new UnreadCountResponse(count));
    }

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id, CancellationToken cancellationToken)
    {
        var notification = await notificationService.GetByIdAsync(id, cancellationToken);
        if (notification is null)
        {
            return NotFound();
        }

        if (!User.CanAccessUser(notification.UserId))
        {
            return Forbid();
        }

        await notificationService.MarkAsReadAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead(
        [FromQuery] int userId,
        CancellationToken cancellationToken)
    {
        var accessResult = await EnsureAccessibleAsync(userId, cancellationToken);
        if (accessResult is not null)
        {
            return accessResult;
        }

        await notificationService.MarkAllAsReadAsync(userId, cancellationToken);
        return NoContent();
    }

    private async Task<ActionResult?> EnsureAccessibleAsync(int userId, CancellationToken cancellationToken)
    {
        if (!User.CanAccessUser(userId))
        {
            return Forbid();
        }

        if (!await notificationService.UserExistsAsync(userId, cancellationToken))
        {
            return NotFound();
        }

        return null;
    }

    private static NotificationResponse ToResponse(CollegeLMS.API.Models.Notification notification) =>
        new(
            notification.Id,
            notification.UserId,
            notification.Type,
            notification.Message,
            notification.IsRead,
            notification.CreatedAt,
            notification.ReadAt,
            notification.AssignmentId,
            notification.AssessmentId,
            notification.ModuleId,
            notification.TimetableExceptionId);
}
