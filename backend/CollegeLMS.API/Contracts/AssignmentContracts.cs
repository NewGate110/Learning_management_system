using System.ComponentModel.DataAnnotations;

namespace CollegeLMS.API.Contracts;

public sealed record AssignmentResponse(
    int Id,
    string Title,
    string Description,
    DateTime Deadline,
    int ModuleId,
    int SubmissionCount);

public sealed record UpsertAssignmentRequest
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; init; } = string.Empty;

    [StringLength(4000)]
    public string Description { get; init; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int ModuleId { get; init; }

    public DateTime Deadline { get; init; }
}

public sealed record SubmitAssignmentRequest
{
    [Required]
    [StringLength(2048, MinimumLength = 3)]
    public string FileUrl { get; init; } = string.Empty;

    public DateTime? SubmittedAt { get; init; }
}

public sealed record PendingSubmissionResponse(
    int Id,
    int AssignmentId,
    string AssignmentTitle,
    int ModuleId,
    string ModuleTitle,
    int CourseId,
    string CourseTitle,
    int StudentId,
    string StudentName,
    string FileUrl,
    DateTime SubmittedAt,
    DateTime Deadline);

public sealed record MyAssignmentSubmissionResponse(
    int AssignmentId,
    int StudentId,
    int? SubmissionId,
    string? FileUrl,
    DateTime? SubmittedAt,
    string Status,
    int? AssignmentGradeId,
    double? Score,
    string? Feedback,
    DateTime? GradedAt);
