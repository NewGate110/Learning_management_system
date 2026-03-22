namespace CollegeLMS.API.Models;

public class AttendanceRecord
{
    public int Id { get; set; }
    public int AttendanceSessionId { get; set; }
    public int StudentId { get; set; }
    public bool IsPresent { get; set; }

    public AttendanceSession? AttendanceSession { get; set; }
    public User? Student { get; set; }
}
