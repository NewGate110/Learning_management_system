using CollegeLMS.API.Data;
using CollegeLMS.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Services;

public class NotificationService(AppDbContext db)
{
    public Task<bool> UserExistsAsync(int userId, CancellationToken cancellationToken = default) =>
        db.Users.AsNoTracking().AnyAsync(user => user.Id == userId, cancellationToken);

    public Task<Notification?> GetByIdAsync(int notificationId, CancellationToken cancellationToken = default) =>
        db.Notifications
            .AsNoTracking()
            .FirstOrDefaultAsync(notification => notification.Id == notificationId, cancellationToken);

    public async Task<bool> CreateAsync(
        int userId,
        string message,
        int? assignmentId = null,
        CancellationToken cancellationToken = default)
    {
        var duplicateExists = assignmentId.HasValue
            ? await db.Notifications.AnyAsync(
                notification =>
                    notification.UserId == userId &&
                    notification.AssignmentId == assignmentId,
                cancellationToken)
            : await db.Notifications.AnyAsync(
                notification =>
                    notification.UserId == userId &&
                    notification.Message == message &&
                    !notification.IsRead,
                cancellationToken);

        if (duplicateExists)
        {
            return false;
        }

        db.Notifications.Add(new Notification
        {
            UserId = userId,
            AssignmentId = assignmentId,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public Task<List<Notification>> GetByUserAsync(int userId, CancellationToken cancellationToken = default) =>
        db.Notifications
            .AsNoTracking()
            .Where(notification => notification.UserId == userId)
            .OrderByDescending(notification => notification.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default) =>
        db.Notifications
            .AsNoTracking()
            .CountAsync(
                notification => notification.UserId == userId && !notification.IsRead,
                cancellationToken);

    public async Task<bool> MarkAsReadAsync(
        int notificationId,
        CancellationToken cancellationToken = default)
    {
        var notification = await db.Notifications
            .FirstOrDefaultAsync(item => item.Id == notificationId, cancellationToken);

        if (notification is null)
        {
            return false;
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }

        return true;
    }

    public async Task<int> MarkAllAsReadAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var notifications = await db.Notifications
            .Where(notification => notification.UserId == userId && !notification.IsRead)
            .ToListAsync(cancellationToken);

        if (notifications.Count == 0)
        {
            return 0;
        }

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        return notifications.Count;
    }
}
