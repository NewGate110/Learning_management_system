using System.ComponentModel.DataAnnotations;

namespace CollegeLMS.API.Contracts;

public sealed record AssessmentResponse(
    int Id,
    int ModuleId,
    string ModuleTitle,
    string Title,
    string Description,
    DateTime ScheduledAt,
    int Duration,
    string Location);

public sealed record UpsertAssessmentRequest
{
    [Range(1, int.MaxValue)]
    public int ModuleId { get; init; }

    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; init; } = string.Empty;

    [StringLength(4000)]
    public string Description { get; init; } = string.Empty;

    public DateTime ScheduledAt { get; init; }

    [Range(1, 1440)]
    public int Duration { get; init; }

    [StringLength(200)]
    public string Location { get; init; } = string.Empty;
}
