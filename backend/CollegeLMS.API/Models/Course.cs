namespace CollegeLMS.API.Models;

public class Course
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int InstructorId { get; set; }

    public User? Instructor { get; set; }
    public ICollection<Assignment> Assignments { get; set; } = [];
    public ICollection<User> Students { get; set; } = [];
}
