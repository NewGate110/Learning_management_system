namespace CollegeLMS.API.Models;

public class TimetableSlot
{
    public int Id { get; set; }
    public int ModuleId { get; set; }
    public int InstructorId { get; set; }
    public string DayOfWeek { get; set; } = string.Empty;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Location { get; set; } = string.Empty;
    public DateTime EffectiveFrom { get; set; }
    public DateTime EffectiveTo { get; set; }

    public Module? Module { get; set; }
    public User? Instructor { get; set; }
    public ICollection<TimetableException> Exceptions { get; set; } = [];
}
