namespace CollegeLMS.API.Models;

public class Course
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int InstructorId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public User? Instructor { get; set; }
    public ICollection<Module> Modules { get; set; } = [];
    public ICollection<User> Students { get; set; } = [];
}
