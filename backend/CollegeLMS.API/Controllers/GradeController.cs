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
public class GradeController(
    AppDbContext db,
    ModuleProgressService moduleProgressService,
    NotificationService notificationService,
    EmailService emailService) : ControllerBase
{
    [HttpPost("assignment")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<AssignmentGradeResponse>> GradeAssignment(
        [FromBody] GradeAssignmentSubmissionRequest request,
        CancellationToken cancellationToken)
    {
        var submission = await db.Submissions
            .Include(item => item.Assignment)
                .ThenInclude(assignment => assignment!.Module)
                    .ThenInclude(module => module!.Course)
            .Include(item => item.Student)
            .Include(item => item.AssignmentGrade)
            .FirstOrDefaultAsync(item => item.Id == request.SubmissionId, cancellationToken);

        if (submission is null || submission.Assignment?.Module?.Course is null || submission.Student is null)
        {
            return NotFound();
        }

        var permission = EnsureCanGrade(submission.Assignment.Module.Course.InstructorId);
        if (permission is not null)
        {
            return permission;
        }

        var existingProgress = await db.ModuleProgresses
            .AsNoTracking()
            .FirstOrDefaultAsync(
                progress =>
                    progress.ModuleId == submission.Assignment.ModuleId &&
                    progress.StudentId == submission.StudentId,
                cancellationToken);

        if (existingProgress?.IsReleased == true)
        {
            return Conflict(new { message = "Final module grade is already released. Grades can no longer be edited." });
        }

        AssignmentGrade assignmentGrade;
        if (submission.AssignmentGrade is null)
        {
            assignmentGrade = new AssignmentGrade
            {
                SubmissionId = submission.Id,
                InstructorId = User.GetUserId()!.Value,
                Score = request.Score,
                Feedback = request.Feedback.Trim(),
                GradedAt = DateTime.UtcNow
            };
            db.AssignmentGrades.Add(assignmentGrade);
        }
        else
        {
            assignmentGrade = submission.AssignmentGrade;
            assignmentGrade.Score = request.Score;
            assignmentGrade.Feedback = request.Feedback.Trim();
            assignmentGrade.GradedAt = DateTime.UtcNow;
            assignmentGrade.InstructorId = User.GetUserId()!.Value;
        }

        await db.SaveChangesAsync(cancellationToken);

        await notificationService.CreateAsync(
            submission.StudentId,
            NotificationTypes.AssignmentGraded,
            $"Your submission for '{submission.Assignment.Title}' has been graded.",
            assignmentId: submission.AssignmentId,
            moduleId: submission.Assignment.ModuleId,
            cancellationToken: cancellationToken);

        await moduleProgressService.RecalculateAsync(
            submission.Assignment.ModuleId,
            submission.StudentId,
            cancellationToken);

        return Ok(ToAssignmentGradeResponse(
            assignmentGrade,
            submission.AssignmentId,
            submission.Assignment.ModuleId,
            submission.StudentId));
    }

    [HttpPut("assignment/{id:int}")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<AssignmentGradeResponse>> UpdateAssignmentGrade(
        int id,
        [FromBody] UpdateAssignmentGradeRequest request,
        CancellationToken cancellationToken)
    {
        var grade = await db.AssignmentGrades
            .Include(item => item.Submission)
                .ThenInclude(submission => submission!.Assignment)
                    .ThenInclude(assignment => assignment!.Module)
                        .ThenInclude(module => module!.Course)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (grade is null || grade.Submission?.Assignment?.Module?.Course is null)
        {
            return NotFound();
        }

        var permission = EnsureCanGrade(grade.Submission.Assignment.Module.Course.InstructorId);
        if (permission is not null)
        {
            return permission;
        }

        var existingProgress = await db.ModuleProgresses
            .AsNoTracking()
            .FirstOrDefaultAsync(
                progress =>
                    progress.ModuleId == grade.Submission.Assignment.ModuleId &&
                    progress.StudentId == grade.Submission.StudentId,
                cancellationToken);

        if (existingProgress?.IsReleased == true)
        {
            return Conflict(new { message = "Final module grade is already released. Grades can no longer be edited." });
        }

        grade.Score = request.Score;
        grade.Feedback = request.Feedback.Trim();
        grade.GradedAt = DateTime.UtcNow;
        grade.InstructorId = User.GetUserId()!.Value;

        await db.SaveChangesAsync(cancellationToken);

        await moduleProgressService.RecalculateAsync(
            grade.Submission.Assignment.ModuleId,
            grade.Submission.StudentId,
            cancellationToken);

        return Ok(ToAssignmentGradeResponse(
            grade,
            grade.Submission.AssignmentId,
            grade.Submission.Assignment.ModuleId,
            grade.Submission.StudentId));
    }

    [HttpPost("assessment")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<AssessmentGradeResponse>> GradeAssessment(
        [FromBody] GradeAssessmentRequest request,
        CancellationToken cancellationToken)
    {
        var assessment = await db.Assessments
            .Include(item => item.Module)
                .ThenInclude(module => module!.Course)
                    .ThenInclude(course => course!.Students)
            .FirstOrDefaultAsync(item => item.Id == request.AssessmentId, cancellationToken);

        if (assessment is null || assessment.Module?.Course is null)
        {
            return NotFound();
        }

        var permission = EnsureCanGrade(assessment.Module.Course.InstructorId);
        if (permission is not null)
        {
            return permission;
        }

        if (!assessment.Module.Course.Students.Any(student => student.Id == request.StudentId))
        {
            return BadRequest(new { message = "Student is not enrolled in this module's course." });
        }

        var existingProgress = await db.ModuleProgresses
            .AsNoTracking()
            .FirstOrDefaultAsync(
                progress =>
                    progress.ModuleId == assessment.ModuleId &&
                    progress.StudentId == request.StudentId,
                cancellationToken);

        if (existingProgress?.IsReleased == true)
        {
            return Conflict(new { message = "Final module grade is already released. Grades can no longer be edited." });
        }

        var grade = await db.AssessmentGrades
            .FirstOrDefaultAsync(
                item => item.AssessmentId == request.AssessmentId && item.StudentId == request.StudentId,
                cancellationToken);

        if (grade is null)
        {
            grade = new AssessmentGrade
            {
                AssessmentId = request.AssessmentId,
                StudentId = request.StudentId,
                InstructorId = User.GetUserId()!.Value,
                Score = request.Score,
                GradedAt = DateTime.UtcNow
            };

            db.AssessmentGrades.Add(grade);
        }
        else
        {
            grade.Score = request.Score;
            grade.GradedAt = DateTime.UtcNow;
            grade.InstructorId = User.GetUserId()!.Value;
        }

        await db.SaveChangesAsync(cancellationToken);

        await moduleProgressService.RecalculateAsync(
            assessment.ModuleId,
            request.StudentId,
            cancellationToken);

        return Ok(ToAssessmentGradeResponse(grade, assessment.ModuleId));
    }

    [HttpPut("assessment/{id:int}")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<AssessmentGradeResponse>> UpdateAssessmentGrade(
        int id,
        [FromBody] UpdateAssessmentGradeRequest request,
        CancellationToken cancellationToken)
    {
        var grade = await db.AssessmentGrades
            .Include(item => item.Assessment)
                .ThenInclude(assessment => assessment!.Module)
                    .ThenInclude(module => module!.Course)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (grade is null || grade.Assessment?.Module?.Course is null)
        {
            return NotFound();
        }

        var permission = EnsureCanGrade(grade.Assessment.Module.Course.InstructorId);
        if (permission is not null)
        {
            return permission;
        }

        var existingProgress = await db.ModuleProgresses
            .AsNoTracking()
            .FirstOrDefaultAsync(
                progress =>
                    progress.ModuleId == grade.Assessment.ModuleId &&
                    progress.StudentId == grade.StudentId,
                cancellationToken);

        if (existingProgress?.IsReleased == true)
        {
            return Conflict(new { message = "Final module grade is already released. Grades can no longer be edited." });
        }

        grade.Score = request.Score;
        grade.GradedAt = DateTime.UtcNow;
        grade.InstructorId = User.GetUserId()!.Value;

        await db.SaveChangesAsync(cancellationToken);

        await moduleProgressService.RecalculateAsync(
            grade.Assessment.ModuleId,
            grade.StudentId,
            cancellationToken);

        return Ok(ToAssessmentGradeResponse(grade, grade.Assessment.ModuleId));
    }

    [HttpGet("assignments")]
    public async Task<ActionResult<IEnumerable<AssignmentGradeResponse>>> GetAssignmentGrades(
        [FromQuery] int? studentId,
        CancellationToken cancellationToken)
    {
        var targetStudentId = await ResolveStudentIdAsync(studentId);
        if (targetStudentId is null)
        {
            return BadRequest(new { message = "studentId is required for instructor and admin grade queries." });
        }

        var actorId = User.GetUserId();
        var query = db.AssignmentGrades
            .AsNoTracking()
            .Where(grade => grade.Submission!.StudentId == targetStudentId.Value);

        if (User.IsInRole(UserRoles.Instructor) && !User.IsInRole(UserRoles.Admin))
        {
            query = query.Where(grade =>
                grade.Submission!.Assignment!.Module!.Course!.InstructorId == actorId);
        }

        var grades = await query
            .OrderByDescending(grade => grade.GradedAt)
            .Select(grade => new AssignmentGradeResponse(
                grade.Id,
                grade.SubmissionId,
                grade.Submission!.AssignmentId,
                grade.Submission.Assignment!.ModuleId,
                grade.Submission.StudentId,
                grade.InstructorId,
                grade.Score,
                grade.Feedback,
                grade.GradedAt))
            .ToListAsync(cancellationToken);

        return Ok(grades);
    }

    [HttpGet("assessments")]
    public async Task<ActionResult<IEnumerable<AssessmentGradeResponse>>> GetAssessmentGrades(
        [FromQuery] int? studentId,
        CancellationToken cancellationToken)
    {
        var targetStudentId = await ResolveStudentIdAsync(studentId);
        if (targetStudentId is null)
        {
            return BadRequest(new { message = "studentId is required for instructor and admin grade queries." });
        }

        var actorId = User.GetUserId();
        var query = db.AssessmentGrades
            .AsNoTracking()
            .Where(grade => grade.StudentId == targetStudentId.Value);

        if (User.IsInRole(UserRoles.Instructor) && !User.IsInRole(UserRoles.Admin))
        {
            query = query.Where(grade => grade.Assessment!.Module!.Course!.InstructorId == actorId);
        }

        var grades = await query
            .OrderByDescending(grade => grade.GradedAt)
            .Select(grade => new AssessmentGradeResponse(
                grade.Id,
                grade.AssessmentId,
                grade.Assessment!.ModuleId,
                grade.StudentId,
                grade.InstructorId,
                grade.Score,
                grade.GradedAt))
            .ToListAsync(cancellationToken);

        return Ok(grades);
    }

    [HttpGet("modules/{moduleId:int}/final")]
    [HttpGet("module/{moduleId:int}/final")]
    public async Task<ActionResult<ModuleFinalGradeResponse>> GetFinalModuleGrade(
        int moduleId,
        [FromQuery] int? studentId,
        CancellationToken cancellationToken)
    {
        var module = await db.Modules
            .AsNoTracking()
            .Include(item => item.Course)
                .ThenInclude(course => course!.Students)
            .FirstOrDefaultAsync(item => item.Id == moduleId, cancellationToken);

        if (module is null || module.Course is null)
        {
            return NotFound();
        }

        var actorId = User.GetUserId();
        if (actorId is null)
        {
            return Unauthorized();
        }

        if (!User.IsInRole(UserRoles.Student) && !studentId.HasValue)
        {
            return BadRequest(new { message = "studentId is required for instructor and admin final-grade queries." });
        }

        var targetStudentId = studentId ?? actorId.Value;

        if (User.IsInRole(UserRoles.Student) && targetStudentId != actorId.Value)
        {
            return Forbid();
        }

        if (User.IsInRole(UserRoles.Instructor) &&
            !User.IsInRole(UserRoles.Admin) &&
            module.Course.InstructorId != actorId.Value)
        {
            return Forbid();
        }

        if (!module.Course.Students.Any(student => student.Id == targetStudentId))
        {
            return BadRequest(new { message = "Student is not enrolled in the module's course." });
        }

        var progress = await moduleProgressService.RecalculateAsync(moduleId, targetStudentId, cancellationToken);

        var canViewFinalGrade = !User.IsInRole(UserRoles.Student) || progress.IsReleased;

        return Ok(new ModuleFinalGradeResponse(
            moduleId,
            targetStudentId,
            progress.Status,
            canViewFinalGrade ? progress.FinalGrade : null,
            progress.IsReleased));
    }

    [HttpPost("modules/{moduleId:int}/release")]
    [HttpPost("module/{moduleId:int}/release")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<ModuleGradeReleaseResponse>> ReleaseModuleGrades(
        int moduleId,
        CancellationToken cancellationToken)
    {
        var module = await db.Modules
            .Include(item => item.Course)
                .ThenInclude(course => course!.Students)
            .FirstOrDefaultAsync(item => item.Id == moduleId, cancellationToken);

        if (module is null || module.Course is null)
        {
            return NotFound();
        }

        var permission = EnsureCanGrade(module.Course.InstructorId);
        if (permission is not null)
        {
            return permission;
        }

        var releasedCount = 0;
        var alreadyReleasedCount = 0;
        var newlyReleased = new List<(User Student, ModuleProgress Progress)>();

        foreach (var student in module.Course.Students.OrderBy(student => student.Id))
        {
            var progress = await moduleProgressService.RecalculateAsync(moduleId, student.Id, cancellationToken);
            if (progress.FinalGrade is null)
            {
                return Conflict(new
                {
                    message = $"All assignments and assessments must be graded before releasing final grades for '{module.Title}'."
                });
            }

            if (progress.IsReleased)
            {
                alreadyReleasedCount++;
                continue;
            }

            progress.IsReleased = true;
            releasedCount++;
            newlyReleased.Add((student, progress));
        }

        if (releasedCount > 0)
        {
            await db.SaveChangesAsync(cancellationToken);

            foreach (var (student, progress) in newlyReleased)
            {
                var message = $"Final grade for module '{module.Title}' has been released: {progress.FinalGrade:F2}.";

                await notificationService.CreateAsync(
                    student.Id,
                    NotificationTypes.FinalGradeReleased,
                    message,
                    moduleId: moduleId,
                    cancellationToken: cancellationToken);

                await emailService.SendFinalGradeReleasedAsync(
                    student.Email,
                    student.Name,
                    module.Title,
                    progress.FinalGrade!.Value,
                    cancellationToken);
            }
        }

        return Ok(new ModuleGradeReleaseResponse(moduleId, releasedCount, alreadyReleasedCount));
    }

    private async Task<int?> ResolveStudentIdAsync(int? requestedStudentId)
    {
        var actorId = User.GetUserId();
        if (actorId is null)
        {
            return null;
        }

        if (requestedStudentId.HasValue)
        {
            if (User.IsInRole(UserRoles.Admin))
            {
                return requestedStudentId.Value;
            }

            if (User.IsInRole(UserRoles.Student))
            {
                return requestedStudentId.Value == actorId.Value ? requestedStudentId.Value : null;
            }

            if (!User.IsInRole(UserRoles.Instructor))
            {
                return null;
            }

            var teachesStudent = await db.Courses
                .AsNoTracking()
                .AnyAsync(course =>
                    course.InstructorId == actorId.Value &&
                    course.Students.Any(student => student.Id == requestedStudentId.Value));

            return teachesStudent ? requestedStudentId.Value : null;
        }

        if (User.IsInRole(UserRoles.Student))
        {
            return actorId.Value;
        }

        return null;
    }

    private ActionResult? EnsureCanGrade(int instructorId)
    {
        if (User.IsInRole(UserRoles.Admin))
        {
            return null;
        }

        var actorId = User.GetUserId();
        if (actorId is null || !User.IsInRole(UserRoles.Instructor) || actorId.Value != instructorId)
        {
            return Forbid();
        }

        return null;
    }

    private static AssignmentGradeResponse ToAssignmentGradeResponse(
        AssignmentGrade grade,
        int assignmentId,
        int moduleId,
        int studentId) =>
        new(
            grade.Id,
            grade.SubmissionId,
            assignmentId,
            moduleId,
            studentId,
            grade.InstructorId,
            grade.Score,
            grade.Feedback,
            grade.GradedAt);

    private static AssessmentGradeResponse ToAssessmentGradeResponse(AssessmentGrade grade, int moduleId) =>
        new(
            grade.Id,
            grade.AssessmentId,
            moduleId,
            grade.StudentId,
            grade.InstructorId,
            grade.Score,
            grade.GradedAt);
}
