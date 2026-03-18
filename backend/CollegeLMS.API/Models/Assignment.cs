namespace CollegeLMS.API.Models;

public class Assignment
{
    public int      Id          { get; set; }
    public string   Title       { get; set; } = string.Empty;
    public string   Description { get; set; } = string.Empty;
    public DateTime Deadline    { get; set; } // Used by ★ Deadline Reminder Service
    public int      CourseId    { get; set; }

    // Navigation
    public Course? Course { get; set; }
}
