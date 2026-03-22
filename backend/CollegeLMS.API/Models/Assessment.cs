namespace CollegeLMS.API.Models;

public class Assessment
{
    public int Id { get; set; }
    public int ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public int Duration { get; set; }
    public string Location { get; set; } = string.Empty;

    public Module? Module { get; set; }
    public ICollection<AssessmentGrade> Grades { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
}
