namespace CollegeLMS.API.Models;

public class AssessmentGrade
{
    public int Id { get; set; }
    public int AssessmentId { get; set; }
    public int StudentId { get; set; }
    public int InstructorId { get; set; }
    public double Score { get; set; }
    public DateTime GradedAt { get; set; }

    public Assessment? Assessment { get; set; }
    public User? Student { get; set; }
    public User? Instructor { get; set; }
}
