using CollegeLMS.API.Extensions;
using CollegeLMS.API.Models;
using CollegeLMS.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollegeLMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProgressController(ProgressService progressService) : ControllerBase
{
    [HttpGet("{userId:int}")]
    public async Task<IActionResult> GetProgress(int userId, CancellationToken cancellationToken)
    {
        var accessResult = await EnsureAccessibleAsync(userId, cancellationToken);
        if (accessResult is not null)
        {
            return accessResult;
        }

        var summary = await progressService.GetProgressSummaryAsync(userId, cancellationToken);
        return Ok(summary);
    }

    [HttpGet("{userId:int}/grades")]
    public async Task<IActionResult> GetGradeTrend(int userId, CancellationToken cancellationToken)
    {
        var accessResult = await EnsureAccessibleAsync(userId, cancellationToken);
        if (accessResult is not null)
        {
            return accessResult;
        }

        return Ok(await progressService.GetGradeTrendAsync(userId, cancellationToken));
    }

    [HttpGet("{userId:int}/courses")]
    public async Task<IActionResult> GetCourseCompletion(int userId, CancellationToken cancellationToken)
    {
        var accessResult = await EnsureAccessibleAsync(userId, cancellationToken);
        if (accessResult is not null)
        {
            return accessResult;
        }

        return Ok(await progressService.GetCourseCompletionAsync(userId, cancellationToken));
    }

    [HttpGet("{userId:int}/submissions")]
    public async Task<IActionResult> GetSubmissionRate(int userId, CancellationToken cancellationToken)
    {
        var accessResult = await EnsureAccessibleAsync(userId, cancellationToken);
        if (accessResult is not null)
        {
            return accessResult;
        }

        return Ok(await progressService.GetSubmissionRateAsync(userId, cancellationToken));
    }

    [HttpGet("{userId:int}/deadlines")]
    public async Task<IActionResult> GetUpcomingDeadlines(int userId, CancellationToken cancellationToken)
    {
        var accessResult = await EnsureAccessibleAsync(userId, cancellationToken);
        if (accessResult is not null)
        {
            return accessResult;
        }

        return Ok(await progressService.GetUpcomingDeadlinesAsync(userId, cancellationToken));
    }

    private async Task<IActionResult?> EnsureAccessibleAsync(int userId, CancellationToken cancellationToken)
    {
        if (!User.CanAccessUser(userId) && !User.IsInRole(UserRoles.Instructor))
        {
            return Forbid();
        }

        if (!await progressService.UserExistsAsync(userId, cancellationToken))
        {
            return NotFound();
        }

        return null;
    }
}
