namespace CollegeLMS.API.Contracts;

public sealed record CalendarEventResponse(
    string Type,
    string Title,
    DateTime Start,
    DateTime? End,
    string? Location,
    string? Description,
    int? CourseId,
    int? ModuleId,
    int? AssignmentId,
    int? AssessmentId,
    int? TimetableSlotId,
    int? TimetableExceptionId);
