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

    public async Task<bool> CreateAsync(
        int userId,
        string message,
        int? assignmentId = null,
        CancellationToken cancellationToken = default)
    {
        return await CreateAsync(
            userId,
            NotificationTypes.General,
            message,
            assignmentId,
            null,
            null,
            null,
            cancellationToken);
    }

    public async Task<bool> CreateAsync(
        int userId,
        string type,
        string message,
        int? assignmentId = null,
        int? assessmentId = null,
        int? moduleId = null,
        int? timetableExceptionId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedType = string.IsNullOrWhiteSpace(type) ? NotificationTypes.General : type.Trim();
        if (!NotificationTypes.IsValid(normalizedType))
        {
            normalizedType = NotificationTypes.General;
        }

        var normalizedMessage = message.Trim();
        var duplicateExists = await db.Notifications.AnyAsync(
            notification =>
                notification.UserId == userId &&
                !notification.IsRead &&
                notification.Type == normalizedType &&
                notification.AssignmentId == assignmentId &&
                notification.AssessmentId == assessmentId &&
                notification.ModuleId == moduleId &&
                notification.TimetableExceptionId == timetableExceptionId &&
                notification.Message == normalizedMessage,
            cancellationToken);

        if (duplicateExists)
        {
            return false;
        }

        db.Notifications.Add(new Notification
        {
            UserId = userId,
            Type = normalizedType,
            Message = normalizedMessage,
            AssignmentId = assignmentId,
            AssessmentId = assessmentId,
            ModuleId = moduleId,
            TimetableExceptionId = timetableExceptionId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<int> CreateBulkAsync(
        IEnumerable<int> userIds,
        string type,
        string message,
        int? assignmentId = null,
        int? assessmentId = null,
        int? moduleId = null,
        int? timetableExceptionId = null,
        CancellationToken cancellationToken = default)
    {
        var distinctUserIds = userIds.Distinct().ToList();
        var created = 0;

        foreach (var userId in distinctUserIds)
        {
            var createdForUser = await CreateAsync(
                userId,
                type,
                message,
                assignmentId,
                assessmentId,
                moduleId,
                timetableExceptionId,
                cancellationToken);

            if (createdForUser)
            {
                created++;
            }
        }

        return created;
    }

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
