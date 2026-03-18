using CollegeLMS.API.Data;

namespace CollegeLMS.API.Services;

/// <summary>
/// ★ Innovation Feature — Student Progress Dashboard
/// Aggregates grade, completion, and submission data for chart-ready responses.
/// </summary>
public class ProgressService(AppDbContext db)
{
    // TODO (Person 3): Implement each method with PostgreSQL aggregate queries

    /// <summary>Returns grade scores over time for a student (line chart data).</summary>
    public Task<object> GetGradeTrendAsync(int userId) =>
        Task.FromResult<object>(new { message = "Not yet implemented" });

    /// <summary>Returns % completion per course for a student (progress bars).</summary>
    public Task<object> GetCourseCompletionAsync(int userId) =>
        Task.FromResult<object>(new { message = "Not yet implemented" });

    /// <summary>Returns on-time vs late submission ratio (doughnut/bar chart).</summary>
    public Task<object> GetSubmissionRateAsync(int userId) =>
        Task.FromResult<object>(new { message = "Not yet implemented" });

    /// <summary>Returns upcoming deadlines within the next 7 days.</summary>
    public Task<object> GetUpcomingDeadlinesAsync(int userId) =>
        Task.FromResult<object>(new { message = "Not yet implemented" });
}
