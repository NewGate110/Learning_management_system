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
public class AssignmentController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssignmentResponse>>> GetByCourse(
        [FromQuery] int courseId,
        CancellationToken cancellationToken)
    {
        if (courseId <= 0)
        {
            return BadRequest(new { message = "courseId must be greater than zero." });
        }

        var assignments = await db.Assignments
            .AsNoTracking()
            .Where(assignment => assignment.CourseId == courseId)
            .OrderBy(assignment => assignment.Deadline)
            .Select(assignment => new AssignmentResponse(
                assignment.Id,
                assignment.Title,
                assignment.Description,
                assignment.Deadline,
                assignment.CourseId,
                assignment.Grades.Count))
            .ToListAsync(cancellationToken);

        return Ok(assignments);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AssignmentResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var assignment = await db.Assignments
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new AssignmentResponse(
                item.Id,
                item.Title,
                item.Description,
                item.Deadline,
                item.CourseId,
                item.Grades.Count))
            .FirstOrDefaultAsync(cancellationToken);

        return assignment is null ? NotFound() : Ok(assignment);
    }

    [HttpPost]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<AssignmentResponse>> Create(
        [FromBody] UpsertAssignmentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Deadline == default)
        {
            return BadRequest(new { message = "Deadline is required." });
        }

        var course = await db.Courses
            .FirstOrDefaultAsync(item => item.Id == request.CourseId, cancellationToken);

        if (course is null)
        {
            return BadRequest(new { message = "CourseId does not reference an existing course." });
        }

        var actorId = User.GetUserId();
        var isAdmin = User.IsInRole(UserRoles.Admin);
        if (!isAdmin && course.InstructorId != actorId)
        {
            return Forbid();
        }

        var assignment = new Assignment
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Deadline = request.Deadline.ToUniversalTime(),
            CourseId = course.Id
        };

        db.Assignments.Add(assignment);
        await db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = assignment.Id }, ToResponse(assignment));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<AssignmentResponse>> Update(
        int id,
        [FromBody] UpsertAssignmentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Deadline == default)
        {
            return BadRequest(new { message = "Deadline is required." });
        }

        var assignment = await db.Assignments
            .Include(item => item.Course)
            .Include(item => item.Grades)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (assignment is null)
        {
            return NotFound();
        }

        var actorId = User.GetUserId();
        var isAdmin = User.IsInRole(UserRoles.Admin);
        if (!isAdmin && assignment.Course?.InstructorId != actorId)
        {
            return Forbid();
        }

        if (request.CourseId != assignment.CourseId)
        {
            var targetCourse = await db.Courses.FirstOrDefaultAsync(
                course => course.Id == request.CourseId,
                cancellationToken);

            if (targetCourse is null)
            {
                return BadRequest(new { message = "CourseId does not reference an existing course." });
            }

            if (!isAdmin && targetCourse.InstructorId != actorId)
            {
                return Forbid();
            }

            assignment.CourseId = targetCourse.Id;
            assignment.Course = targetCourse;
        }

        assignment.Title = request.Title.Trim();
        assignment.Description = request.Description.Trim();
        assignment.Deadline = request.Deadline.ToUniversalTime();

        await db.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(assignment));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var assignment = await db.Assignments
            .Include(item => item.Course)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (assignment is null)
        {
            return NotFound();
        }

        var actorId = User.GetUserId();
        var isAdmin = User.IsInRole(UserRoles.Admin);
        if (!isAdmin && assignment.Course?.InstructorId != actorId)
        {
            return Forbid();
        }

        db.Assignments.Remove(assignment);
        await db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPost("{id:int}/submit")]
    [Authorize(Roles = UserRoles.Student)]
    public async Task<IActionResult> Submit(
        int id,
        [FromBody] SubmitAssignmentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var assignment = await db.Assignments
            .Include(item => item.Course)
                .ThenInclude(course => course!.Students)
            .Include(item => item.Grades)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (assignment is null)
        {
            return NotFound();
        }

        if (assignment.Course is null || assignment.Course.Students.All(student => student.Id != userId.Value))
        {
            return Forbid();
        }

        var submittedAt = request.SubmittedAt?.ToUniversalTime() ?? DateTime.UtcNow;
        var grade = assignment.Grades.FirstOrDefault(item => item.UserId == userId.Value);

        if (grade is null)
        {
            grade = new Grade
            {
                UserId = userId.Value,
                AssignmentId = assignment.Id,
                Score = request.Score ?? 0,
                SubmittedAt = submittedAt
            };

            db.Grades.Add(grade);
        }
        else
        {
            if (request.Score.HasValue)
            {
                grade.Score = request.Score.Value;
            }

            grade.SubmittedAt = submittedAt;
        }

        await db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            assignmentId = assignment.Id,
            userId = userId.Value,
            score = grade.Score,
            submittedAt = grade.SubmittedAt,
            status = grade.SubmittedAt <= assignment.Deadline ? "OnTime" : "Late"
        });
    }

    private static AssignmentResponse ToResponse(Assignment assignment) =>
        new(
            assignment.Id,
            assignment.Title,
            assignment.Description,
            assignment.Deadline,
            assignment.CourseId,
            assignment.Grades.Count);
}
