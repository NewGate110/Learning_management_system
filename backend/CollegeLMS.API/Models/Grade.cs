namespace CollegeLMS.API.Models;

public class Grade
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int AssignmentId { get; set; }
    public double Score { get; set; }
    public DateTime SubmittedAt { get; set; }

    public User? User { get; set; }
    public Assignment? Assignment { get; set; }
}
