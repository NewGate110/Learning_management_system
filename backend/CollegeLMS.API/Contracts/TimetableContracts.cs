using System.ComponentModel.DataAnnotations;

namespace CollegeLMS.API.Contracts;

public sealed record TimetableSlotResponse(
    int Id,
    int ModuleId,
    string ModuleTitle,
    int InstructorId,
    string InstructorName,
    string DayOfWeek,
    TimeSpan StartTime,
    TimeSpan EndTime,
    string Location,
    DateTime EffectiveFrom,
    DateTime EffectiveTo);

public sealed record UpsertTimetableSlotRequest
{
    [Range(1, int.MaxValue)]
    public int ModuleId { get; init; }

    [Range(1, int.MaxValue)]
    public int InstructorId { get; init; }

    [Required]
    [StringLength(12)]
    public string DayOfWeek { get; init; } = string.Empty;

    public TimeSpan StartTime { get; init; }
    public TimeSpan EndTime { get; init; }

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string Location { get; init; } = string.Empty;

    public DateTime EffectiveFrom { get; init; }
    public DateTime EffectiveTo { get; init; }
}

public sealed record CreateTimetableExceptionRequest
{
    [Range(1, int.MaxValue)]
    public int TimetableSlotId { get; init; }

    public DateTime Date { get; init; }

    [Required]
    [StringLength(24)]
    public string Status { get; init; } = string.Empty;

    public DateTime? RescheduleDate { get; init; }
    public TimeSpan? RescheduleStartTime { get; init; }
    public TimeSpan? RescheduleEndTime { get; init; }

    [Required]
    [StringLength(500, MinimumLength = 3)]
    public string Reason { get; init; } = string.Empty;
}

public sealed record TimetableExceptionResponse(
    int Id,
    int TimetableSlotId,
    DateTime Date,
    string Status,
    DateTime? RescheduleDate,
    TimeSpan? RescheduleStartTime,
    TimeSpan? RescheduleEndTime,
    string Reason);

public sealed record TimetableSessionEventResponse(
    int TimetableSlotId,
    int ModuleId,
    string ModuleTitle,
    DateTime Date,
    DateTime SessionStart,
    DateTime SessionEnd,
    string Location,
    bool IsCancelled,
    bool IsRescheduled,
    string? Reason);
