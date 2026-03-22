namespace CollegeLMS.API.Contracts;

public sealed record StudentCourseSummary(
    int CourseId,
    string CourseTitle,
    bool IsCompleted,
    int PassedRequiredModules,
    int TotalRequiredModules);

public sealed record StudentModuleSummary(
    int ModuleId,
    string ModuleTitle,
    string Type,
    string Status,
    double? FinalGrade,
    double AttendancePercentage);

public sealed record StudentUpcomingItem(
    string ItemType,
    string Title,
    DateTime StartsAt,
    int? AssignmentId,
    int? AssessmentId,
    int? ModuleId);

public sealed record StudentDashboardResponse(
    IReadOnlyCollection<StudentCourseSummary> Courses,
    IReadOnlyCollection<StudentModuleSummary> Modules,
    IReadOnlyCollection<StudentUpcomingItem> UpcomingItems);

public sealed record InstructorDashboardResponse(
    IReadOnlyCollection<CourseResponse> Courses,
    int PendingSubmissionCount,
    IReadOnlyCollection<TimetableSessionEventResponse> UpcomingSessions);

public sealed record AdminDashboardResponse(
    int TotalUsers,
    int TotalCourses,
    int TotalModules,
    int TotalAssignments,
    int TotalAssessments,
    int TotalTimetableSlots,
    int TotalTimetableExceptions,
    int UnreadNotificationCount);
