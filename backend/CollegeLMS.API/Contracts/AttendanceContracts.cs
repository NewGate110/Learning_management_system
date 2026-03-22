using System.ComponentModel.DataAnnotations;

namespace CollegeLMS.API.Contracts;

public sealed record AttendanceRecordInput
{
    [Range(1, int.MaxValue)]
    public int StudentId { get; init; }

    public bool IsPresent { get; init; }
}

public sealed record CreateAttendanceSessionRequest
{
    [Range(1, int.MaxValue)]
    public int ModuleId { get; init; }

    public DateTime Date { get; init; }

    [Required]
    public IReadOnlyCollection<AttendanceRecordInput> Records { get; init; } = [];
}

public sealed record UpdateAttendanceSessionRequest
{
    public DateTime? Date { get; init; }
    public IReadOnlyCollection<AttendanceRecordInput>? Records { get; init; }
}

public sealed record UpdateAttendanceRecordRequest
{
    public bool IsPresent { get; init; }
}

public sealed record AttendanceRecordResponse(
    int Id,
    int StudentId,
    string StudentName,
    bool IsPresent);

public sealed record AttendanceSessionResponse(
    int Id,
    int ModuleId,
    DateTime Date,
    int CreatedByInstructorId,
    IReadOnlyCollection<AttendanceRecordResponse> Records);

public sealed record AttendancePercentageResponse(
    int ModuleId,
    int StudentId,
    int PresentSessions,
    int TotalSessions,
    double Percentage,
    bool EligibleForSubmission);
