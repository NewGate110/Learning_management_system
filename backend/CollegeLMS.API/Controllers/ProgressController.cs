using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollegeLMS.API.Controllers;

/// <summary>
/// ★ Innovation Feature — Student Progress Dashboard
/// Returns per-student analytics data ready for ng2-charts / ngx-charts.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProgressController : ControllerBase
{
    // TODO (Person 3): Inject ProgressService

    /// <summary>GET /api/progress/{userId} — Full progress summary</summary>
    [HttpGet("{userId}")]
    public IActionResult GetProgress(int userId) =>
        Ok(new { message = $"Progress summary for user {userId} — not yet implemented" });

    /// <summary>GET /api/progress/{userId}/grades — Grade trend over time</summary>
    [HttpGet("{userId}/grades")]
    public IActionResult GetGradeTrend(int userId) =>
        Ok(new { message = $"Grade trend for user {userId} — not yet implemented" });

    /// <summary>GET /api/progress/{userId}/courses — Per-course completion %</summary>
    [HttpGet("{userId}/courses")]
    public IActionResult GetCourseCompletion(int userId) =>
        Ok(new { message = $"Course completion for user {userId} — not yet implemented" });

    /// <summary>GET /api/progress/{userId}/submissions — Submission rate stats</summary>
    [HttpGet("{userId}/submissions")]
    public IActionResult GetSubmissionRate(int userId) =>
        Ok(new { message = $"Submission rate for user {userId} — not yet implemented" });

    /// <summary>GET /api/progress/{userId}/deadlines — Upcoming deadlines</summary>
    [HttpGet("{userId}/deadlines")]
    public IActionResult GetUpcomingDeadlines(int userId) =>
        Ok(new { message = $"Upcoming deadlines for user {userId} — not yet implemented" });
}
