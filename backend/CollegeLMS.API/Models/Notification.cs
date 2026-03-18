namespace CollegeLMS.API.Models;

/// <summary>
/// ★ Innovation Feature — Automated Deadline Reminder System
/// Stores in-app notification alerts per user with read/unread status.
/// </summary>
public class Notification
{
    public int      Id        { get; set; }
    public int      UserId    { get; set; }
    public string   Message   { get; set; } = string.Empty;
    public bool     IsRead    { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
}
