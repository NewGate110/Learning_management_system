namespace CollegeLMS.API.Models;

public class Module
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = ModuleTypes.Compulsory;
    public int Order { get; set; }

    public Course? Course { get; set; }
    public ICollection<Assignment> Assignments { get; set; } = [];
    public ICollection<Assessment> Assessments { get; set; } = [];
    public ICollection<ModuleProgress> Progresses { get; set; } = [];
    public ICollection<AttendanceSession> AttendanceSessions { get; set; } = [];
    public ICollection<TimetableSlot> TimetableSlots { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
}

public static class ModuleTypes
{
    public const string Sequential = "Sequential";
    public const string Compulsory = "Compulsory";
    public const string Optional = "Optional";

    public static bool IsValid(string type) =>
        type is Sequential or Compulsory or Optional;
}
