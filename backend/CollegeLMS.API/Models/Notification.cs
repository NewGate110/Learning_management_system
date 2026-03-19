namespace CollegeLMS.API.Models;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? AssignmentId { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }

    public User? User { get; set; }
    public Assignment? Assignment { get; set; }
}
