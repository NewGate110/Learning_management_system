using CollegeLMS.API.Contracts;
using CollegeLMS.API.Data;
using CollegeLMS.API.Extensions;
using CollegeLMS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssessmentController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssessmentResponse>>> GetAll(
        [FromQuery] int? moduleId,
        CancellationToken cancellationToken)
    {
        var query = db.Assessments.AsNoTracking().AsQueryable();

        if (moduleId.HasValue && moduleId.Value > 0)
        {
            query = query.Where(assessment => assessment.ModuleId == moduleId.Value);
        }

        var assessments = await query
            .OrderBy(assessment => assessment.ScheduledAt)
            .Select(assessment => new AssessmentResponse(
                assessment.Id,
                assessment.ModuleId,
                assessment.Module!.Title,
                assessment.Title,
                assessment.Description,
                assessment.ScheduledAt,
                assessment.Duration,
                assessment.Location))
            .ToListAsync(cancellationToken);

        return Ok(assessments);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AssessmentResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var assessment = await db.Assessments
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new AssessmentResponse(
                item.Id,
                item.ModuleId,
                item.Module!.Title,
                item.Title,
                item.Description,
                item.ScheduledAt,
                item.Duration,
                item.Location))
            .FirstOrDefaultAsync(cancellationToken);

        return assessment is null ? NotFound() : Ok(assessment);
    }

    [HttpPost]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<AssessmentResponse>> Create(
        [FromBody] UpsertAssessmentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.ScheduledAt == default)
        {
            return BadRequest(new { message = "ScheduledAt is required." });
        }

        var module = await db.Modules
            .AsNoTracking()
            .Include(item => item.Course)
            .FirstOrDefaultAsync(item => item.Id == request.ModuleId, cancellationToken);

        if (module is null || module.Course is null)
        {
            return BadRequest(new { message = "ModuleId does not reference an existing module." });
        }

        var permission = EnsureCanManageModule(module.Course.InstructorId);
        if (permission is not null)
        {
            return permission;
        }

        var assessment = new Assessment
        {
            ModuleId = request.ModuleId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            ScheduledAt = request.ScheduledAt.ToUniversalTime(),
            Duration = request.Duration,
            Location = request.Location.Trim()
        };

        db.Assessments.Add(assessment);
        await db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = assessment.Id }, new AssessmentResponse(
            assessment.Id,
            assessment.ModuleId,
            module.Title,
            assessment.Title,
            assessment.Description,
            assessment.ScheduledAt,
            assessment.Duration,
            assessment.Location));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<AssessmentResponse>> Update(
        int id,
        [FromBody] UpsertAssessmentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.ScheduledAt == default)
        {
            return BadRequest(new { message = "ScheduledAt is required." });
        }

        var assessment = await db.Assessments
            .Include(item => item.Module)
                .ThenInclude(module => module!.Course)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (assessment is null || assessment.Module?.Course is null)
        {
            return NotFound();
        }

        var permission = EnsureCanManageModule(assessment.Module.Course.InstructorId);
        if (permission is not null)
        {
            return permission;
        }

        if (request.ModuleId != assessment.ModuleId)
        {
            var targetModule = await db.Modules
                .AsNoTracking()
                .Include(module => module.Course)
                .FirstOrDefaultAsync(module => module.Id == request.ModuleId, cancellationToken);

            if (targetModule is null || targetModule.Course is null)
            {
                return BadRequest(new { message = "ModuleId does not reference an existing module." });
            }

            var targetPermission = EnsureCanManageModule(targetModule.Course.InstructorId);
            if (targetPermission is not null)
            {
                return targetPermission;
            }

            assessment.ModuleId = targetModule.Id;
            assessment.Module = targetModule;
        }

        assessment.Title = request.Title.Trim();
        assessment.Description = request.Description.Trim();
        assessment.ScheduledAt = request.ScheduledAt.ToUniversalTime();
        assessment.Duration = request.Duration;
        assessment.Location = request.Location.Trim();

        await db.SaveChangesAsync(cancellationToken);

        return Ok(new AssessmentResponse(
            assessment.Id,
            assessment.ModuleId,
            assessment.Module?.Title ?? string.Empty,
            assessment.Title,
            assessment.Description,
            assessment.ScheduledAt,
            assessment.Duration,
            assessment.Location));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var assessment = await db.Assessments
            .Include(item => item.Module)
                .ThenInclude(module => module!.Course)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (assessment is null || assessment.Module?.Course is null)
        {
            return NotFound();
        }

        var permission = EnsureCanManageModule(assessment.Module.Course.InstructorId);
        if (permission is not null)
        {
            return permission;
        }

        db.Assessments.Remove(assessment);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private ActionResult? EnsureCanManageModule(int instructorId)
    {
        if (User.IsInRole(UserRoles.Admin))
        {
            return null;
        }

        var actorId = User.GetUserId();
        if (actorId is null || actorId.Value != instructorId)
        {
            return Forbid();
        }

        return null;
    }
}
