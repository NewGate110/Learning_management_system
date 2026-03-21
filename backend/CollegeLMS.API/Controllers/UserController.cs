using CollegeLMS.API.Contracts;
using CollegeLMS.API.Data;
using CollegeLMS.API.Extensions;
using CollegeLMS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var users = await db.Users
            .AsNoTracking()
            .OrderBy(user => user.Name)
            .Select(user => new UserResponse(
                user.Id,
                user.Name,
                user.Email,
                user.Role,
                user.EnrolledCourses.OrderBy(course => course.Id).Select(course => course.Id).ToList(),
                user.CoursesTeaching.OrderBy(course => course.Id).Select(course => course.Id).ToList()))
            .ToListAsync(cancellationToken);

        return Ok(users);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        if (!User.CanAccessUser(id))
        {
            return Forbid();
        }

        var user = await db.Users
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new UserResponse(
                item.Id,
                item.Name,
                item.Email,
                item.Role,
                item.EnrolledCourses.OrderBy(course => course.Id).Select(course => course.Id).ToList(),
                item.CoursesTeaching.OrderBy(course => course.Id).Select(course => course.Id).ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        return user is null ? NotFound() : Ok(user);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UserResponse>> Update(
        int id,
        [FromBody] UpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.CanAccessUser(id))
        {
            return Forbid();
        }

        var isAdmin = User.IsInRole(UserRoles.Admin);

        if (!isAdmin && (request.Role is not null || request.EnrolledCourseIds is not null))
        {
            return Forbid();
        }

        var user = await db.Users
            .Include(item => item.EnrolledCourses)
            .Include(item => item.CoursesTeaching)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (user is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            user.Name = request.Name.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var emailTaken = await db.Users.AnyAsync(
                item => item.Id != id && item.Email == email,
                cancellationToken);

            if (emailTaken)
            {
                return Conflict(new { message = "Another user already uses this email address." });
            }

            user.Email = email;
        }

        if (request.Role is not null)
        {
            if (!UserRoles.IsValid(request.Role))
            {
                return BadRequest(new { message = "Role must be Student, Instructor, or Admin." });
            }

            user.Role = request.Role;

            if (user.Role != UserRoles.Student)
            {
                user.EnrolledCourses.Clear();
            }
        }

        if (request.EnrolledCourseIds is not null)
        {
            var targetRole = request.Role ?? user.Role;
            if (targetRole != UserRoles.Student)
            {
                return BadRequest(new { message = "Only students can be enrolled in courses." });
            }

            var courseIds = request.EnrolledCourseIds.Distinct().ToList();
            var courses = await db.Courses
                .Where(course => courseIds.Contains(course.Id))
                .ToListAsync(cancellationToken);

            if (courses.Count != courseIds.Count)
            {
                return BadRequest(new { message = "One or more course IDs are invalid." });
            }

            user.EnrolledCourses.Clear();
            foreach (var course in courses)
            {
                user.EnrolledCourses.Add(course);
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        return Ok(new UserResponse(
            user.Id,
            user.Name,
            user.Email,
            user.Role,
            user.EnrolledCourses.OrderBy(course => course.Id).Select(course => course.Id).ToList(),
            user.CoursesTeaching.OrderBy(course => course.Id).Select(course => course.Id).ToList()));
    }
}
