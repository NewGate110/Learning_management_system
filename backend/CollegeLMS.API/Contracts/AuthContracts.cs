using System.ComponentModel.DataAnnotations;
using CollegeLMS.API.Models;

namespace CollegeLMS.API.Contracts;

public sealed record RegisterRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; init; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string Password { get; init; } = string.Empty;

    [StringLength(32)]
    public string Role { get; init; } = UserRoles.Student;
}

public sealed record LoginRequest
{
    [Required]
    [EmailAddress]
    [StringLength(255)]
    public string Email { get; init; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string Password { get; init; } = string.Empty;
}

public sealed record AuthResponse(
    string Token,
    int UserId,
    string Role);
