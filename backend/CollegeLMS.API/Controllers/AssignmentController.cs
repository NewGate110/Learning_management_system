using CollegeLMS.API.Contracts;
using CollegeLMS.API.Data;
using CollegeLMS.API.Extensions;
using CollegeLMS.API.Models;
using CollegeLMS.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssignmentController(
    AppDbContext db,
    AttendanceService attendanceService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssignmentResponse>>> GetByModule(
        [FromQuery] int moduleId,
        CancellationToken cancellationToken)
    {
        if (moduleId <= 0)
        {
            return BadRequest(new { message = "moduleId must be greater than zero." });
        }

        var assignments = await db.Assignments
            .AsNoTracking()
            .Where(assignment => assignment.ModuleId == moduleId)
            .OrderBy(assignment => assignment.Deadline)
            .Select(assignment => new AssignmentResponse(
                assignment.Id,
                assignment.Title,
                assignment.Description,
                assignment.Deadline,
                assignment.ModuleId,
                assignment.Submissions.Count))
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
                item.ModuleId,
                item.Submissions.Count))
            .FirstOrDefaultAsync(cancellationToken);

        return assignment is null ? NotFound() : Ok(assignment);
    }

    [HttpGet("pending-submissions")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<IEnumerable<PendingSubmissionResponse>>> GetPendingSubmissions(
        [FromQuery] int? courseId,
        CancellationToken cancellationToken)
    {
        var actorId = User.GetUserId();
        if (actorId is null)
        {
            return Unauthorized();
        }

        var query = db.Submissions
            .AsNoTracking()
            .Where(submission => submission.AssignmentGrade == null);

        if (!User.IsInRole(UserRoles.Admin))
        {
            query = query.Where(submission =>
                submission.Assignment!.Module!.Course!.InstructorId == actorId.Value);
        }

        if (courseId.HasValue && courseId.Value > 0)
        {
            query = query.Where(submission => submission.Assignment!.Module!.CourseId == courseId.Value);
        }

        var submissions = await query
            .OrderBy(submission => submission.SubmittedAt)
            .Select(submission => new PendingSubmissionResponse(
                submission.Id,
                submission.AssignmentId,
                submission.Assignment!.Title,
                submission.Assignment.ModuleId,
                submission.Assignment.Module!.Title,
                submission.Assignment.Module.CourseId,
                submission.Assignment.Module.Course!.Title,
                submission.StudentId,
                submission.Student!.Name,
                submission.FileUrl,
                submission.SubmittedAt,
                submission.Assignment.Deadline))
            .ToListAsync(cancellationToken);

        return Ok(submissions);
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

        var module = await db.Modules
            .AsNoTracking()
            .Include(item => item.Course)
            .FirstOrDefaultAsync(item => item.Id == request.ModuleId, cancellationToken);

        if (module is null || module.Course is null)
        {
            return BadRequest(new { message = "ModuleId does not reference an existing module." });
        }

        var actorId = User.GetUserId();
        var isAdmin = User.IsInRole(UserRoles.Admin);
        if (!isAdmin && module.Course.InstructorId != actorId)
        {
            return Forbid();
        }

        var assignment = new Assignment
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Deadline = request.Deadline.ToUniversalTime(),
            ModuleId = module.Id
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
            .Include(item => item.Module)
                .ThenInclude(module => module!.Course)
            .Include(item => item.Submissions)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (assignment is null)
        {
            return NotFound();
        }

        var actorId = User.GetUserId();
        var isAdmin = User.IsInRole(UserRoles.Admin);
        if (!isAdmin && assignment.Module?.Course?.InstructorId != actorId)
        {
            return Forbid();
        }

        if (request.ModuleId != assignment.ModuleId)
        {
            var targetModule = await db.Modules
                .AsNoTracking()
                .Include(module => module.Course)
                .FirstOrDefaultAsync(module => module.Id == request.ModuleId, cancellationToken);

            if (targetModule is null || targetModule.Course is null)
            {
                return BadRequest(new { message = "ModuleId does not reference an existing module." });
            }

            if (!isAdmin && targetModule.Course.InstructorId != actorId)
            {
                return Forbid();
            }

            assignment.ModuleId = targetModule.Id;
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
            .Include(item => item.Module)
                .ThenInclude(module => module!.Course)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (assignment is null)
        {
            return NotFound();
        }

        var actorId = User.GetUserId();
        var isAdmin = User.IsInRole(UserRoles.Admin);
        if (!isAdmin && assignment.Module?.Course?.InstructorId != actorId)
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
            .Include(item => item.Module)
                .ThenInclude(module => module!.Course)
                    .ThenInclude(course => course!.Students)
            .Include(item => item.Submissions)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (assignment is null || assignment.Module?.Course is null)
        {
            return NotFound();
        }

        var isEnrolled = assignment.Module.Course.Students.Any(student => student.Id == userId.Value);
        if (!isEnrolled)
        {
            return Forbid();
        }

        var attendance = await attendanceService.GetAttendanceSummaryAsync(
            assignment.ModuleId,
            userId.Value,
            cancellationToken);

        if (attendance.Percentage < 80)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = "Assignment submission is locked because attendance is below 80% for this module.",
                attendancePercentage = attendance.Percentage
            });
        }

        var submittedAt = request.SubmittedAt?.ToUniversalTime() ?? DateTime.UtcNow;
        var submission = assignment.Submissions.FirstOrDefault(item => item.StudentId == userId.Value);

        if (submission is null)
        {
            submission = new Submission
            {
                AssignmentId = assignment.Id,
                StudentId = userId.Value,
                FileUrl = request.FileUrl.Trim(),
                SubmittedAt = submittedAt
            };

            db.Submissions.Add(submission);
        }
        else
        {
            submission.FileUrl = request.FileUrl.Trim();
            submission.SubmittedAt = submittedAt;
        }

        await db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            assignmentId = assignment.Id,
            moduleId = assignment.ModuleId,
            studentId = userId.Value,
            submissionId = submission.Id,
            fileUrl = submission.FileUrl,
            submittedAt = submission.SubmittedAt,
            status = submission.SubmittedAt <= assignment.Deadline ? "OnTime" : "Late",
            attendancePercentage = attendance.Percentage
        });
    }

    [HttpGet("{id:int}/my-submission")]
    [Authorize(Roles = UserRoles.Student)]
    public async Task<ActionResult<MyAssignmentSubmissionResponse>> GetMySubmission(
        int id,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var assignment = await db.Assignments
            .Include(item => item.Module)
                .ThenInclude(module => module!.Course)
                    .ThenInclude(course => course!.Students)
            .Include(item => item.Submissions.Where(submission => submission.StudentId == userId.Value))
                .ThenInclude(submission => submission.AssignmentGrade)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (assignment is null || assignment.Module?.Course is null)
        {
            return NotFound();
        }

        var isEnrolled = assignment.Module.Course.Students.Any(student => student.Id == userId.Value);
        if (!isEnrolled)
        {
            return Forbid();
        }

        var submission = assignment.Submissions.FirstOrDefault(submitted => submitted.StudentId == userId.Value);
        if (submission is null)
        {
            return Ok(new MyAssignmentSubmissionResponse(
                assignment.Id,
                userId.Value,
                null,
                null,
                null,
                "NotSubmitted",
                null,
                null,
                null,
                null));
        }

        return Ok(new MyAssignmentSubmissionResponse(
            assignment.Id,
            userId.Value,
            submission.Id,
            submission.FileUrl,
            submission.SubmittedAt,
            submission.AssignmentGrade is null ? "Submitted" : "Graded",
            submission.AssignmentGrade?.Id,
            submission.AssignmentGrade?.Score,
            submission.AssignmentGrade?.Feedback,
            submission.AssignmentGrade?.GradedAt));
    }

    private static AssignmentResponse ToResponse(Assignment assignment) =>
        new(
            assignment.Id,
            assignment.Title,
            assignment.Description,
            assignment.Deadline,
            assignment.ModuleId,
            assignment.Submissions.Count);
}
