using System.ComponentModel.DataAnnotations;

namespace CollegeLMS.API.Contracts;

public sealed record CourseResponse(
    int Id,
    string Title,
    string Description,
    int InstructorId,
    string InstructorName,
    int StudentCount,
    int AssignmentCount);

public sealed record CourseDetailResponse(
    int Id,
    string Title,
    string Description,
    int InstructorId,
    string InstructorName,
    IReadOnlyCollection<int> StudentIds,
    IReadOnlyCollection<AssignmentResponse> Assignments);

public sealed record UpsertCourseRequest
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; init; } = string.Empty;

    [StringLength(4000)]
    public string Description { get; init; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int InstructorId { get; init; }

    public IReadOnlyCollection<int> StudentIds { get; init; } = [];
}
