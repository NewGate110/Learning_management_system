namespace CollegeLMS.API.Contracts;

public sealed record NotificationResponse(
    int Id,
    int UserId,
    string Type,
    string Message,
    bool IsRead,
    DateTime CreatedAt,
    DateTime? ReadAt,
    int? AssignmentId,
    int? AssessmentId,
    int? ModuleId,
    int? TimetableExceptionId);

public sealed record UnreadCountResponse(int Count);
