namespace CollegeLMS.API.Contracts;

public sealed record GradeTrendPoint(
    string Label,
    double Score,
    DateTime SubmittedAt);

public sealed record GradeTrendResponse(
    IReadOnlyCollection<GradeTrendPoint> Points,
    double AverageScore);

public sealed record CourseCompletionItem(
    int CourseId,
    string CourseTitle,
    int SubmittedAssignments,
    int TotalAssignments,
    double CompletionPercentage,
    double AverageScore);

public sealed record CourseCompletionResponse(
    IReadOnlyCollection<CourseCompletionItem> Courses);

public sealed record SubmissionRateResponse(
    int TotalAssignments,
    int Submitted,
    int Pending,
    int OnTime,
    int Late,
    double SubmissionRatePercentage);

public sealed record UpcomingDeadlineItem(
    int AssignmentId,
    string Title,
    int CourseId,
    string CourseTitle,
    DateTime Deadline,
    double HoursRemaining);

public sealed record UpcomingDeadlinesResponse(
    IReadOnlyCollection<UpcomingDeadlineItem> Assignments);

public sealed record ProgressSummaryResponse(
    GradeTrendResponse GradeTrend,
    CourseCompletionResponse Courses,
    SubmissionRateResponse Submissions,
    UpcomingDeadlinesResponse UpcomingDeadlines);
