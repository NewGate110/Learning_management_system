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
public class DashboardController(
    AppDbContext db,
    AttendanceService attendanceService,
    ModuleProgressService moduleProgressService,
    TimetableService timetableService) : ControllerBase
{
    [HttpGet("student")]
    [Authorize(Roles = UserRoles.Student)]
    public async Task<ActionResult<StudentDashboardResponse>> GetStudentDashboard(
        CancellationToken cancellationToken)
    {
        var studentId = User.GetUserId();
        if (studentId is null)
        {
            return Unauthorized();
        }

        var courses = await db.Courses
            .AsNoTracking()
            .Where(course => course.Students.Any(student => student.Id == studentId.Value))
            .OrderBy(course => course.Title)
            .Select(course => new { course.Id, course.Title })
            .ToListAsync(cancellationToken);

        var courseSummaries = new List<StudentCourseSummary>();
        foreach (var course in courses)
        {
            var completion = await moduleProgressService.GetCourseCompletionAsync(
                course.Id,
                studentId.Value,
                cancellationToken);

            courseSummaries.Add(new StudentCourseSummary(
                course.Id,
                course.Title,
                completion.IsCompleted,
                completion.PassedRequiredModules,
                completion.TotalRequiredModules));
        }

        var modules = await db.Modules
            .AsNoTracking()
            .Where(module => module.Course!.Students.Any(student => student.Id == studentId.Value))
            .OrderBy(module => module.CourseId)
            .ThenBy(module => module.Order)
            .Select(module => new
            {
                module.Id,
                module.Title,
                module.Type
            })
            .ToListAsync(cancellationToken);

        var progressByModuleId = await db.ModuleProgresses
            .AsNoTracking()
            .Where(progress => progress.StudentId == studentId.Value)
            .ToDictionaryAsync(progress => progress.ModuleId, cancellationToken);

        var moduleSummaries = new List<StudentModuleSummary>();
        foreach (var module in modules)
        {
            var attendance = await attendanceService.GetAttendanceSummaryAsync(
                module.Id,
                studentId.Value,
                cancellationToken);

            progressByModuleId.TryGetValue(module.Id, out var progress);
            moduleSummaries.Add(new StudentModuleSummary(
                module.Id,
                module.Title,
                module.Type,
                progress?.Status ?? ModuleProgressStatuses.InProgress,
                progress?.IsReleased == true ? progress.FinalGrade : null,
                attendance.Percentage));
        }

        var now = DateTime.UtcNow;
        var cutoff = now.AddDays(14);

        var upcomingAssignments = await db.Assignments
            .AsNoTracking()
            .Where(assignment =>
                assignment.Module!.Course!.Students.Any(student => student.Id == studentId.Value) &&
                assignment.Deadline >= now &&
                assignment.Deadline <= cutoff &&
                !assignment.Submissions.Any(submission => submission.StudentId == studentId.Value))
            .Select(assignment => new StudentUpcomingItem(
                "Assignment",
                assignment.Title,
                assignment.Deadline,
                assignment.Id,
                null,
                assignment.ModuleId))
            .ToListAsync(cancellationToken);

        var upcomingAssessments = await db.Assessments
            .AsNoTracking()
            .Where(assessment =>
                assessment.Module!.Course!.Students.Any(student => student.Id == studentId.Value) &&
                assessment.ScheduledAt >= now &&
                assessment.ScheduledAt <= cutoff)
            .Select(assessment => new StudentUpcomingItem(
                "Assessment",
                assessment.Title,
                assessment.ScheduledAt,
                null,
                assessment.Id,
                assessment.ModuleId))
            .ToListAsync(cancellationToken);

        var enrolledModuleIds = modules.Select(module => module.Id).ToList();
        var timetableEvents = await timetableService.GetSessionEventsAsync(
            db.TimetableSlots.AsNoTracking().Where(slot => enrolledModuleIds.Contains(slot.ModuleId)),
            now,
            cutoff,
            cancellationToken);

        var upcomingSessions = timetableEvents
            .Where(item => !item.IsCancelled)
            .Select(item => new StudentUpcomingItem(
                "Session",
                item.ModuleTitle,
                item.SessionStart,
                null,
                null,
                item.ModuleId))
            .ToList();

        var upcomingItems = upcomingAssignments
            .Concat(upcomingAssessments)
            .Concat(upcomingSessions)
            .OrderBy(item => item.StartsAt)
            .Take(25)
            .ToList();

        return Ok(new StudentDashboardResponse(courseSummaries, moduleSummaries, upcomingItems));
    }

    [HttpGet("instructor")]
    [Authorize(Roles = UserRoles.Instructor)]
    public async Task<ActionResult<InstructorDashboardResponse>> GetInstructorDashboard(
        CancellationToken cancellationToken)
    {
        var instructorId = User.GetUserId();
        if (instructorId is null)
        {
            return Unauthorized();
        }

        var courses = await db.Courses
            .AsNoTracking()
            .Where(course => course.InstructorId == instructorId.Value)
            .OrderBy(course => course.Title)
            .Select(course => new CourseResponse(
                course.Id,
                course.Title,
                course.Description,
                course.InstructorId,
                course.Instructor!.Name,
                course.Students.Count,
                course.Modules.Count,
                course.Modules.SelectMany(module => module.Assignments).Count()))
            .ToListAsync(cancellationToken);

        var pendingSubmissionCount = await db.Submissions
            .AsNoTracking()
            .CountAsync(
                submission =>
                    submission.Assignment!.Module!.Course!.InstructorId == instructorId.Value &&
                    submission.AssignmentGrade == null,
                cancellationToken);

        var upcomingSessions = await timetableService.GetSessionEventsAsync(
            db.TimetableSlots.AsNoTracking().Where(slot => slot.InstructorId == instructorId.Value),
            DateTime.UtcNow,
            DateTime.UtcNow.AddDays(7),
            cancellationToken);

        return Ok(new InstructorDashboardResponse(courses, pendingSubmissionCount, upcomingSessions));
    }

    [HttpGet("admin")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<AdminDashboardResponse>> GetAdminDashboard(
        CancellationToken cancellationToken)
    {
        var totalUsersTask = db.Users.AsNoTracking().CountAsync(cancellationToken);
        var totalCoursesTask = db.Courses.AsNoTracking().CountAsync(cancellationToken);
        var totalModulesTask = db.Modules.AsNoTracking().CountAsync(cancellationToken);
        var totalAssignmentsTask = db.Assignments.AsNoTracking().CountAsync(cancellationToken);
        var totalAssessmentsTask = db.Assessments.AsNoTracking().CountAsync(cancellationToken);
        var totalSlotsTask = db.TimetableSlots.AsNoTracking().CountAsync(cancellationToken);
        var totalExceptionsTask = db.TimetableExceptions.AsNoTracking().CountAsync(cancellationToken);
        var unreadNotificationsTask = db.Notifications
            .AsNoTracking()
            .CountAsync(notification => !notification.IsRead, cancellationToken);

        await Task.WhenAll(
            totalUsersTask,
            totalCoursesTask,
            totalModulesTask,
            totalAssignmentsTask,
            totalAssessmentsTask,
            totalSlotsTask,
            totalExceptionsTask,
            unreadNotificationsTask);

        return Ok(new AdminDashboardResponse(
            totalUsersTask.Result,
            totalCoursesTask.Result,
            totalModulesTask.Result,
            totalAssignmentsTask.Result,
            totalAssessmentsTask.Result,
            totalSlotsTask.Result,
            totalExceptionsTask.Result,
            unreadNotificationsTask.Result));
    }
}
