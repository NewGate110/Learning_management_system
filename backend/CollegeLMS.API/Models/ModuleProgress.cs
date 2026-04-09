namespace CollegeLMS.API.Models;

public class ModuleProgress
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int ModuleId { get; set; }
    public string Status { get; set; } = ModuleProgressStatuses.InProgress;
    public double? FinalGrade { get; set; }
    public bool IsReleased { get; set; }

    public User? Student { get; set; }
    public Module? Module { get; set; }
}

public static class ModuleProgressStatuses
{
    public const string InProgress = "InProgress";
    public const string Passed = "Passed";
    public const string Failed = "Failed";

    public static bool IsValid(string status) =>
        status is InProgress or Passed or Failed;
}
