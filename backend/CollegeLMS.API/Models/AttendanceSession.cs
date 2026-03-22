namespace CollegeLMS.API.Models;

public class AttendanceSession
{
    public int Id { get; set; }
    public int ModuleId { get; set; }
    public DateTime Date { get; set; }
    public int CreatedByInstructorId { get; set; }

    public Module? Module { get; set; }
    public User? CreatedByInstructor { get; set; }
    public ICollection<AttendanceRecord> Records { get; set; } = [];
}
