namespace CollegeLMS.API.Models;

public class Submission
{
    public int Id { get; set; }
    public int AssignmentId { get; set; }
    public int StudentId { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }

    public Assignment? Assignment { get; set; }
    public User? Student { get; set; }
    public AssignmentGrade? AssignmentGrade { get; set; }
}
