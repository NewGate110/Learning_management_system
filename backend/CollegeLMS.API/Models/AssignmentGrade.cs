namespace CollegeLMS.API.Models;

public class AssignmentGrade
{
    public int Id { get; set; }
    public int SubmissionId { get; set; }
    public int InstructorId { get; set; }
    public double Score { get; set; }
    public DateTime GradedAt { get; set; }
    public string Feedback { get; set; } = string.Empty;

    public Submission? Submission { get; set; }
    public User? Instructor { get; set; }
}
