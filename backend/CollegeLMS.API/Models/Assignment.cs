namespace CollegeLMS.API.Models;

public class Assignment
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public int CourseId { get; set; }

    public Course? Course { get; set; }
    public ICollection<Grade> Grades { get; set; } = [];
}
