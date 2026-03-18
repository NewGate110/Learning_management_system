namespace CollegeLMS.API.Models;

public class User
{
    public int    Id       { get; set; }
    public string Name     { get; set; } = string.Empty;
    public string Email    { get; set; } = string.Empty;
    public string Role     { get; set; } = "Student"; // Student | Instructor | Admin
    public string Password { get; set; } = string.Empty; // TODO (Person 3): store hashed

    // Navigation
    public ICollection<Grade>        Grades        { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = []; // ★ Innovation
}
