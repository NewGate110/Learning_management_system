using CollegeLMS.API.Contracts;
using CollegeLMS.API.Data;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Services;

public class ProgressService(AppDbContext db)
{
    public Task<bool> UserExistsAsync(int userId, CancellationToken cancellationToken = default) =>
        db.Users.AsNoTracking().AnyAsync(user => user.Id == userId, cancellationToken);

    public async Task<ProgressSummaryResponse> GetProgressSummaryAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var gradeTrend = await GetGradeTrendAsync(userId, cancellationToken);
        var courses = await GetCourseCompletionAsync(userId, cancellationToken);
        var submissions = await GetSubmissionRateAsync(userId, cancellationToken);
        var deadlines = await GetUpcomingDeadlinesAsync(userId, cancellationToken);

        return new ProgressSummaryResponse(gradeTrend, courses, submissions, deadlines);
    }

    public async Task<GradeTrendResponse> GetGradeTrendAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var points = await db.AssignmentGrades
            .AsNoTracking()
            .Where(grade => grade.Submission!.StudentId == userId)
            .OrderBy(grade => grade.GradedAt)
            .Select(grade => new GradeTrendPoint(
                grade.Submission!.Assignment!.Title,
                Math.Round(grade.Score, 2),
                grade.GradedAt))
            .ToListAsync(cancellationToken);

        var averageScore = points.Count == 0
            ? 0
            : Math.Round(points.Average(point => point.Score), 2);

        return new GradeTrendResponse(points, averageScore);
    }

    public async Task<CourseCompletionResponse> GetCourseCompletionAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var courses = await db.Courses
            .AsNoTracking()
            .Where(course => course.Students.Any(student => student.Id == userId))
            .OrderBy(course => course.Title)
            .Select(course => new
            {
                course.Id,
                course.Title,
                TotalAssignments = course.Modules.SelectMany(module => module.Assignments).Count(),
                SubmittedAssignments = course.Modules
                    .SelectMany(module => module.Assignments)
                    .Count(assignment => assignment.Submissions.Any(submission => submission.StudentId == userId)),
                AverageScore = course.Modules
                    .SelectMany(module => module.Assignments)
                    .SelectMany(assignment => assignment.Submissions
                        .Where(submission => submission.StudentId == userId && submission.AssignmentGrade != null)
                        .Select(submission => (double?)submission.AssignmentGrade!.Score))
                    .Average() ?? 0
            })
            .ToListAsync(cancellationToken);

        return new CourseCompletionResponse(
            courses.Select(course =>
            {
                var completionPercentage = course.TotalAssignments == 0
                    ? 0
                    : Math.Round(course.SubmittedAssignments * 100d / course.TotalAssignments, 2);

                return new CourseCompletionItem(
                    course.Id,
                    course.Title,
                    course.SubmittedAssignments,
                    course.TotalAssignments,
                    completionPercentage,
                    Math.Round(course.AverageScore, 2));
            }).ToList());
    }

    public async Task<SubmissionRateResponse> GetSubmissionRateAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var totalAssignments = await db.Assignments
            .AsNoTracking()
            .CountAsync(
                assignment =>
                    assignment.Module!.Course!.Students.Any(student => student.Id == userId),
                cancellationToken);

        var submissions = await db.Submissions
            .AsNoTracking()
            .Where(submission =>
                submission.StudentId == userId &&
                submission.Assignment!.Module!.Course!.Students.Any(student => student.Id == userId))
            .Select(submission => new
            {
                submission.SubmittedAt,
                submission.Assignment!.Deadline
            })
            .ToListAsync(cancellationToken);

        var submitted = submissions.Count;
        var onTime = submissions.Count(submission => submission.SubmittedAt <= submission.Deadline);
        var late = submitted - onTime;
        var pending = Math.Max(totalAssignments - submitted, 0);
        var submissionRatePercentage = totalAssignments == 0
            ? 0
            : Math.Round(submitted * 100d / totalAssignments, 2);

        return new SubmissionRateResponse(
            totalAssignments,
            submitted,
            pending,
            onTime,
            late,
            submissionRatePercentage);
    }

    public async Task<UpcomingDeadlinesResponse> GetUpcomingDeadlinesAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var cutoff = now.AddDays(7);

        var deadlines = await db.Assignments
            .AsNoTracking()
            .Where(assignment =>
                assignment.Module!.Course!.Students.Any(student => student.Id == userId) &&
                assignment.Deadline >= now &&
                assignment.Deadline <= cutoff &&
                !assignment.Submissions.Any(submission => submission.StudentId == userId))
            .OrderBy(assignment => assignment.Deadline)
            .Select(assignment => new
            {
                assignment.Id,
                assignment.Title,
                CourseId = assignment.Module!.CourseId,
                CourseTitle = assignment.Module!.Course!.Title,
                assignment.Deadline
            })
            .ToListAsync(cancellationToken);

        return new UpcomingDeadlinesResponse(
            deadlines.Select(deadline => new UpcomingDeadlineItem(
                deadline.Id,
                deadline.Title,
                deadline.CourseId,
                deadline.CourseTitle,
                deadline.Deadline,
                Math.Max(Math.Round((deadline.Deadline - now).TotalHours, 1), 0)))
            .ToList());
    }
}
