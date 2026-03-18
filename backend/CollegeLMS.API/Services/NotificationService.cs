using CollegeLMS.API.Data;
using CollegeLMS.API.Models;

namespace CollegeLMS.API.Services;

/// <summary>
/// ★ Innovation Feature — Automated Deadline Reminder System
/// Creates and manages in-app Notification records in PostgreSQL.
/// </summary>
public class NotificationService(AppDbContext db)
{
    // TODO (Person 3): Implement full CRUD for notifications

    /// <summary>Creates a new in-app notification for a user.</summary>
    public Task CreateAsync(int userId, string message)
    {
        // TODO (Person 3): Instantiate Notification, add to DbContext, save
        return Task.CompletedTask;
    }

    /// <summary>Fetches all notifications for a user, ordered by newest first.</summary>
    public Task<List<Notification>> GetByUserAsync(int userId) =>
        Task.FromResult(new List<Notification>());

    /// <summary>Marks a single notification as read.</summary>
    public Task MarkAsReadAsync(int notificationId) =>
        Task.CompletedTask;

    /// <summary>Marks all notifications for a user as read.</summary>
    public Task MarkAllAsReadAsync(int userId) =>
        Task.CompletedTask;
}
