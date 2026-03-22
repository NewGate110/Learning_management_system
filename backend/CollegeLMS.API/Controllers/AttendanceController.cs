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
public class AttendanceController(
    AppDbContext db,
    AttendanceService attendanceService) : ControllerBase
{
    [HttpGet("modules/{moduleId:int}/sessions")]
    public async Task<ActionResult<IEnumerable<AttendanceSessionResponse>>> GetSessionsByModule(
        int moduleId,
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

        if (!CanAccessModule(module.Course))
        {
            return Forbid();
        }

        var sessions = await db.AttendanceSessions
            .AsNoTracking()
            .Where(session => session.ModuleId == moduleId)
            .OrderByDescending(session => session.Date)
            .Select(session => new AttendanceSessionResponse(
                session.Id,
                session.ModuleId,
                session.Date,
                session.CreatedByInstructorId,
                session.Records
                    .OrderBy(record => record.StudentId)
                    .Select(record => new AttendanceRecordResponse(
                        record.Id,
                        record.StudentId,
                        record.Student!.Name,
                        record.IsPresent))
                    .ToList()))
            .ToListAsync(cancellationToken);

        return Ok(sessions);
    }

    [HttpGet("modules/{moduleId:int}/percentage")]
    public async Task<ActionResult<AttendancePercentageResponse>> GetAttendancePercentage(
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

        if (!CanAccessModule(module.Course))
        {
            return Forbid();
        }

        var actorId = User.GetUserId();
        if (actorId is null)
        {
            return Unauthorized();
        }

        var targetStudentId = studentId ?? actorId.Value;
        if (User.IsInRole(UserRoles.Student) && targetStudentId != actorId.Value)
        {
            return Forbid();
        }

        var studentEnrolled = module.Course.Students.Any(student => student.Id == targetStudentId);
        if (!studentEnrolled)
        {
            return BadRequest(new { message = "Student is not enrolled in this module's course." });
        }

        var summary = await attendanceService.GetAttendanceSummaryAsync(
            moduleId,
            targetStudentId,
            cancellationToken);

        return Ok(new AttendancePercentageResponse(
            moduleId,
            targetStudentId,
            summary.PresentSessions,
            summary.TotalSessions,
            summary.Percentage,
            summary.Percentage >= 80));
    }

    [HttpPost("sessions")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<AttendanceSessionResponse>> CreateSession(
        [FromBody] CreateAttendanceSessionRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Date == default)
        {
            return BadRequest(new { message = "Date is required." });
        }

        var module = await db.Modules
            .Include(item => item.Course)
                .ThenInclude(course => course!.Students)
            .FirstOrDefaultAsync(item => item.Id == request.ModuleId, cancellationToken);

        if (module is null || module.Course is null)
        {
            return BadRequest(new { message = "ModuleId does not reference an existing module." });
        }

        var permission = EnsureCanManageModule(module.Course);
        if (permission is not null)
        {
            return permission;
        }

        var validationError = ValidateRecordStudents(request.Records, module.Course.Students);
        if (validationError is not null)
        {
            return validationError;
        }

        var actorId = User.GetUserId();
        if (actorId is null)
        {
            return Unauthorized();
        }

        var session = new AttendanceSession
        {
            ModuleId = request.ModuleId,
            Date = request.Date.ToUniversalTime(),
            CreatedByInstructorId = actorId.Value
        };

        foreach (var record in request.Records.DistinctBy(record => record.StudentId))
        {
            session.Records.Add(new AttendanceRecord
            {
                StudentId = record.StudentId,
                IsPresent = record.IsPresent
            });
        }

        db.AttendanceSessions.Add(session);
        await db.SaveChangesAsync(cancellationToken);

        var response = await db.AttendanceSessions
            .AsNoTracking()
            .Where(item => item.Id == session.Id)
            .Select(item => new AttendanceSessionResponse(
                item.Id,
                item.ModuleId,
                item.Date,
                item.CreatedByInstructorId,
                item.Records
                    .OrderBy(record => record.StudentId)
                    .Select(record => new AttendanceRecordResponse(
                        record.Id,
                        record.StudentId,
                        record.Student!.Name,
                        record.IsPresent))
                    .ToList()))
            .FirstAsync(cancellationToken);

        return CreatedAtAction(nameof(GetSessionsByModule), new { moduleId = request.ModuleId }, response);
    }

    [HttpPut("sessions/{id:int}")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<AttendanceSessionResponse>> UpdateSession(
        int id,
        [FromBody] UpdateAttendanceSessionRequest request,
        CancellationToken cancellationToken)
    {
        var session = await db.AttendanceSessions
            .Include(item => item.Module)
                .ThenInclude(module => module!.Course)
                    .ThenInclude(course => course!.Students)
            .Include(item => item.Records)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (session is null || session.Module?.Course is null)
        {
            return NotFound();
        }

        var permission = EnsureCanManageModule(session.Module.Course);
        if (permission is not null)
        {
            return permission;
        }

        if (request.Date.HasValue && request.Date.Value != default)
        {
            session.Date = request.Date.Value.ToUniversalTime();
        }

        if (request.Records is not null)
        {
            var validationError = ValidateRecordStudents(request.Records, session.Module.Course.Students);
            if (validationError is not null)
            {
                return validationError;
            }

            db.AttendanceRecords.RemoveRange(session.Records);
            session.Records.Clear();

            foreach (var record in request.Records.DistinctBy(record => record.StudentId))
            {
                session.Records.Add(new AttendanceRecord
                {
                    StudentId = record.StudentId,
                    IsPresent = record.IsPresent
                });
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        var response = await db.AttendanceSessions
            .AsNoTracking()
            .Where(item => item.Id == session.Id)
            .Select(item => new AttendanceSessionResponse(
                item.Id,
                item.ModuleId,
                item.Date,
                item.CreatedByInstructorId,
                item.Records
                    .OrderBy(record => record.StudentId)
                    .Select(record => new AttendanceRecordResponse(
                        record.Id,
                        record.StudentId,
                        record.Student!.Name,
                        record.IsPresent))
                    .ToList()))
            .FirstAsync(cancellationToken);

        return Ok(response);
    }

    [HttpPut("records/{id:int}")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<AttendanceRecordResponse>> UpdateRecord(
        int id,
        [FromBody] UpdateAttendanceRecordRequest request,
        CancellationToken cancellationToken)
    {
        var record = await db.AttendanceRecords
            .Include(item => item.AttendanceSession)
                .ThenInclude(session => session!.Module)
                    .ThenInclude(module => module!.Course)
            .Include(item => item.Student)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (record is null || record.AttendanceSession?.Module?.Course is null || record.Student is null)
        {
            return NotFound();
        }

        var permission = EnsureCanManageModule(record.AttendanceSession.Module.Course);
        if (permission is not null)
        {
            return permission;
        }

        record.IsPresent = request.IsPresent;
        await db.SaveChangesAsync(cancellationToken);

        return Ok(new AttendanceRecordResponse(
            record.Id,
            record.StudentId,
            record.Student.Name,
            record.IsPresent));
    }

    private bool CanAccessModule(Course course)
    {
        if (User.IsInRole(UserRoles.Admin))
        {
            return true;
        }

        var actorId = User.GetUserId();
        if (actorId is null)
        {
            return false;
        }

        if (User.IsInRole(UserRoles.Instructor))
        {
            return course.InstructorId == actorId.Value;
        }

        if (User.IsInRole(UserRoles.Student))
        {
            return course.Students.Any(student => student.Id == actorId.Value);
        }

        return false;
    }

    private ActionResult? EnsureCanManageModule(Course course)
    {
        if (User.IsInRole(UserRoles.Admin))
        {
            return null;
        }

        var actorId = User.GetUserId();
        if (actorId is null || !User.IsInRole(UserRoles.Instructor) || actorId.Value != course.InstructorId)
        {
            return Forbid();
        }

        return null;
    }

    private ActionResult? ValidateRecordStudents(
        IReadOnlyCollection<AttendanceRecordInput> records,
        IEnumerable<User> enrolledStudents)
    {
        if (records.Count == 0)
        {
            return BadRequest(new { message = "At least one attendance record is required." });
        }

        var enrolledStudentIds = enrolledStudents
            .Where(student => student.Role == UserRoles.Student)
            .Select(student => student.Id)
            .ToHashSet();

        var invalidStudentId = records
            .Select(record => record.StudentId)
            .Distinct()
            .FirstOrDefault(studentId => !enrolledStudentIds.Contains(studentId));

        if (invalidStudentId != 0)
        {
            return BadRequest(new
            {
                message = $"StudentId {invalidStudentId} is not enrolled in the module's course."
            });
        }

        return null;
    }
}
