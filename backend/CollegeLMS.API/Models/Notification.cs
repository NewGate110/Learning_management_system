namespace CollegeLMS.API.Models;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? AssignmentId { get; set; }
    public int? AssessmentId { get; set; }
    public int? ModuleId { get; set; }
    public int? TimetableExceptionId { get; set; }
    public string Type { get; set; } = NotificationTypes.General;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }

    public User? User { get; set; }
    public Assignment? Assignment { get; set; }
    public Assessment? Assessment { get; set; }
    public Module? Module { get; set; }
    public TimetableException? TimetableException { get; set; }
}

public static class NotificationTypes
{
    public const string General = "General";
    public const string ClassCancelled = "ClassCancelled";
    public const string ClassRescheduled = "ClassRescheduled";
    public const string AssignmentDeadline = "AssignmentDeadline";
    public const string AssessmentDate = "AssessmentDate";
    public const string AssignmentGraded = "AssignmentGraded";
    public const string FinalGradeReleased = "FinalGradeReleased";

    public static bool IsValid(string type) =>
        type is General or
            ClassCancelled or
            ClassRescheduled or
            AssignmentDeadline or
            AssessmentDate or
            AssignmentGraded or
            FinalGradeReleased;
}
