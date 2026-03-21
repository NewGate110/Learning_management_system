using CollegeLMS.API.Contracts;
using CollegeLMS.API.Data;
using CollegeLMS.API.Models;
using CollegeLMS.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    AppDbContext db,
    IPasswordHasher<User> passwordHasher,
    JwtTokenService jwtTokenService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(user => user.Email == email, cancellationToken))
        {
            return Conflict(new { message = "An account with this email already exists." });
        }

        var requestedRole = string.IsNullOrWhiteSpace(request.Role)
            ? UserRoles.Student
            : request.Role.Trim();

        if (!UserRoles.IsValid(requestedRole))
        {
            return BadRequest(new { message = "Role must be Student, Instructor, or Admin." });
        }

        if (requestedRole != UserRoles.Student && !User.IsInRole(UserRoles.Admin))
        {
            return Forbid();
        }

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            Role = requestedRole
        };

        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        var (token, _) = jwtTokenService.CreateToken(user);

        return Ok(new AuthResponse(token, user.Id, user.Role));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(
            item => item.Email == email,
            cancellationToken);

        if (user is null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var verification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verification == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var (token, _) = jwtTokenService.CreateToken(user);

        return Ok(new AuthResponse(token, user.Id, user.Role));
    }
}
