namespace CollegeLMS.API.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = UserRoles.Student;
    public string PasswordHash { get; set; } = string.Empty;

    public ICollection<Grade> Grades { get; set; } = [];
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
