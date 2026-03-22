using System.ComponentModel.DataAnnotations;

namespace CollegeLMS.API.Contracts;

public sealed record ModuleSummaryResponse(
    int Id,
    int CourseId,
    string Title,
    string Description,
    string Type,
    int Order,
    int AssignmentCount,
    int AssessmentCount);

public sealed record UpsertModuleRequest
{
    [Range(1, int.MaxValue)]
    public int CourseId { get; init; }

    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; init; } = string.Empty;

    [StringLength(4000)]
    public string Description { get; init; } = string.Empty;

    [Required]
    [StringLength(32)]
    public string Type { get; init; } = string.Empty;

    [Range(0, int.MaxValue)]
    public int Order { get; init; }
}
