namespace CollegeLMS.API.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = UserRoles.Student;
    public string PasswordHash { get; set; } = string.Empty;

    public ICollection<Submission> Submissions { get; set; } = [];
    public ICollection<AssignmentGrade> AssignmentGradesGiven { get; set; } = [];
    public ICollection<AssessmentGrade> AssessmentGradesGiven { get; set; } = [];
    public ICollection<AssessmentGrade> AssessmentGradesReceived { get; set; } = [];
    public ICollection<ModuleProgress> ModuleProgresses { get; set; } = [];
    public ICollection<AttendanceSession> AttendanceSessionsCreated { get; set; } = [];
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = [];
    public ICollection<TimetableSlot> TimetableSlotsTeaching { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<Course> EnrolledCourses { get; set; } = [];
    public ICollection<Course> CoursesTeaching { get; set; } = [];
}

public static class UserRoles
{
    public const string Student = "Student";
    public const string Instructor = "Instructor";
    public const string Admin = "Admin";

    public static bool IsValid(string role) =>
        role is Student or Instructor or Admin;
}
