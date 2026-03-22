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
public class CalendarController(
    AppDbContext db,
    TimetableService timetableService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CalendarEventResponse>>> GetCalendar(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        var actorId = User.GetUserId();
        if (actorId is null)
        {
            return Unauthorized();
        }

        var windowStart = (from ?? DateTime.UtcNow.Date).ToUniversalTime();
        var windowEnd = (to ?? windowStart.AddDays(30)).ToUniversalTime();

        var accessibleCourseIds = await GetAccessibleCourseIdsAsync(actorId.Value, cancellationToken);
        var accessibleModuleIds = await db.Modules
            .AsNoTracking()
            .Where(module => accessibleCourseIds.Contains(module.CourseId))
            .Select(module => module.Id)
            .ToListAsync(cancellationToken);

        var events = new List<CalendarEventResponse>();

        var assignments = await db.Assignments
            .AsNoTracking()
            .Where(assignment =>
                accessibleModuleIds.Contains(assignment.ModuleId) &&
                assignment.Deadline >= windowStart &&
                assignment.Deadline <= windowEnd)
            .Select(assignment => new
            {
                assignment.Id,
                assignment.ModuleId,
                assignment.Module!.CourseId,
                assignment.Title,
                assignment.Deadline
            })
            .ToListAsync(cancellationToken);

        events.AddRange(assignments.Select(item => new CalendarEventResponse(
            "AssignmentDeadline",
            $"Assignment deadline: {item.Title}",
            item.Deadline,
            null,
            null,
            null,
            item.CourseId,
            item.ModuleId,
            item.Id,
            null,
            null,
            null)));

        var assessments = await db.Assessments
            .AsNoTracking()
            .Where(assessment =>
                accessibleModuleIds.Contains(assessment.ModuleId) &&
                assessment.ScheduledAt >= windowStart &&
                assessment.ScheduledAt <= windowEnd)
            .Select(assessment => new
            {
                assessment.Id,
                assessment.ModuleId,
                assessment.Module!.CourseId,
                assessment.Title,
                assessment.Description,
                assessment.ScheduledAt,
                assessment.Duration,
                assessment.Location
            })
            .ToListAsync(cancellationToken);

        events.AddRange(assessments.Select(item => new CalendarEventResponse(
            "AssessmentDate",
            $"Assessment: {item.Title}",
            item.ScheduledAt,
            item.ScheduledAt.AddMinutes(item.Duration),
            item.Location,
            item.Description,
            item.CourseId,
            item.ModuleId,
            null,
            item.Id,
            null,
            null)));

        var slotQuery = db.TimetableSlots
            .AsNoTracking()
            .Where(slot => accessibleModuleIds.Contains(slot.ModuleId));

        var sessions = await timetableService.GetSessionEventsAsync(slotQuery, windowStart, windowEnd, cancellationToken);

        events.AddRange(sessions.Select(session =>
        {
            var eventType = session.IsCancelled
                ? "TimetableCancelled"
                : session.IsRescheduled
                    ? "TimetableRescheduled"
                    : "TimetableSession";

            var title = session.IsCancelled
                ? $"Cancelled class: {session.ModuleTitle}"
                : session.IsRescheduled
                    ? $"Rescheduled class: {session.ModuleTitle}"
                    : $"Class: {session.ModuleTitle}";

            return new CalendarEventResponse(
                eventType,
                title,
                session.SessionStart,
                session.SessionEnd,
                session.Location,
                session.Reason,
                null,
                session.ModuleId,
                null,
                null,
                session.TimetableSlotId,
                null);
        }));

        var courses = await db.Courses
            .AsNoTracking()
            .Where(course => accessibleCourseIds.Contains(course.Id))
            .Select(course => new
            {
                course.Id,
                course.Title,
                course.StartDate,
                course.EndDate
            })
            .ToListAsync(cancellationToken);

        events.AddRange(courses.Where(course => course.StartDate.HasValue)
            .Select(course => new CalendarEventResponse(
                "CourseStart",
                $"Course starts: {course.Title}",
                course.StartDate!.Value,
                null,
                null,
                null,
                course.Id,
                null,
                null,
                null,
                null,
                null)));

        events.AddRange(courses.Where(course => course.EndDate.HasValue)
            .Select(course => new CalendarEventResponse(
                "CourseEnd",
                $"Course ends: {course.Title}",
                course.EndDate!.Value,
                null,
                null,
                null,
                course.Id,
                null,
                null,
                null,
                null,
                null)));

        return Ok(events.OrderBy(item => item.Start).ThenBy(item => item.Type).ToList());
    }

    private async Task<List<int>> GetAccessibleCourseIdsAsync(int actorId, CancellationToken cancellationToken)
    {
        if (User.IsInRole(UserRoles.Admin))
        {
            return await db.Courses
                .AsNoTracking()
                .Select(course => course.Id)
                .ToListAsync(cancellationToken);
        }

        if (User.IsInRole(UserRoles.Instructor))
        {
            return await db.Courses
                .AsNoTracking()
                .Where(course => course.InstructorId == actorId)
                .Select(course => course.Id)
                .ToListAsync(cancellationToken);
        }

        return await db.Courses
            .AsNoTracking()
            .Where(course => course.Students.Any(student => student.Id == actorId))
            .Select(course => course.Id)
            .ToListAsync(cancellationToken);
    }
}
