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
