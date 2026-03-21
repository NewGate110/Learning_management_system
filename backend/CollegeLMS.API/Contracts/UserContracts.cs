using System.ComponentModel.DataAnnotations;

namespace CollegeLMS.API.Contracts;

public sealed record UserResponse(
    int Id,
    string Name,
    string Email,
    string Role,
    IReadOnlyCollection<int> EnrolledCourseIds,
    IReadOnlyCollection<int> TaughtCourseIds);

public sealed record UpdateUserRequest
{
    [StringLength(100, MinimumLength = 2)]
    public string? Name { get; init; }

    [EmailAddress]
    [StringLength(255)]
    public string? Email { get; init; }

    [StringLength(32)]
    public string? Role { get; init; }

    public IReadOnlyCollection<int>? EnrolledCourseIds { get; init; }
}
