using CollegeLMS.API.Contracts;
using CollegeLMS.API.Data;
using CollegeLMS.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ModuleController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ModuleSummaryResponse>>> GetAll(
        [FromQuery] int? courseId,
        CancellationToken cancellationToken)
    {
        var query = db.Modules.AsNoTracking().AsQueryable();

        if (courseId.HasValue && courseId.Value > 0)
        {
            query = query.Where(module => module.CourseId == courseId.Value);
        }

        var modules = await query
            .OrderBy(module => module.CourseId)
            .ThenBy(module => module.Order)
            .ThenBy(module => module.Title)
            .Select(module => new ModuleSummaryResponse(
                module.Id,
                module.CourseId,
                module.Title,
                module.Description,
                module.Type,
                module.Order,
                module.Assignments.Count,
                module.Assessments.Count))
            .ToListAsync(cancellationToken);

        return Ok(modules);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ModuleSummaryResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var module = await db.Modules
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new ModuleSummaryResponse(
                item.Id,
                item.CourseId,
                item.Title,
                item.Description,
                item.Type,
                item.Order,
                item.Assignments.Count,
                item.Assessments.Count))
            .FirstOrDefaultAsync(cancellationToken);

        return module is null ? NotFound() : Ok(module);
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<ModuleSummaryResponse>> Create(
        [FromBody] UpsertModuleRequest request,
        CancellationToken cancellationToken)
    {
        var validation = await ValidateRequestAsync(request, cancellationToken);
        if (validation is not null)
        {
            return validation;
        }

        var module = new Module
        {
            CourseId = request.CourseId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Type = request.Type.Trim(),
            Order = request.Type == ModuleTypes.Sequential ? request.Order : 0
        };

        db.Modules.Add(module);
        await db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = module.Id }, ToResponse(module));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<ModuleSummaryResponse>> Update(
        int id,
        [FromBody] UpsertModuleRequest request,
        CancellationToken cancellationToken)
    {
        var module = await db.Modules
            .Include(item => item.Assignments)
            .Include(item => item.Assessments)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (module is null)
        {
            return NotFound();
        }

        var validation = await ValidateRequestAsync(request, cancellationToken);
        if (validation is not null)
        {
            return validation;
        }

        module.CourseId = request.CourseId;
        module.Title = request.Title.Trim();
        module.Description = request.Description.Trim();
        module.Type = request.Type.Trim();
        module.Order = request.Type == ModuleTypes.Sequential ? request.Order : 0;

        await db.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(module));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var module = await db.Modules.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (module is null)
        {
            return NotFound();
        }

        db.Modules.Remove(module);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<ActionResult?> ValidateRequestAsync(
        UpsertModuleRequest request,
        CancellationToken cancellationToken)
    {
        var normalizedType = request.Type.Trim();
        if (!ModuleTypes.IsValid(normalizedType))
        {
            return BadRequest(new { message = "Type must be Sequential, Compulsory, or Optional." });
        }

        if (normalizedType == ModuleTypes.Sequential && request.Order <= 0)
        {
            return BadRequest(new { message = "Sequential modules must have an order greater than zero." });
        }

        var courseExists = await db.Courses
            .AsNoTracking()
            .AnyAsync(course => course.Id == request.CourseId, cancellationToken);

        if (!courseExists)
        {
            return BadRequest(new { message = "CourseId does not reference an existing course." });
        }

        return null;
    }

    private static ModuleSummaryResponse ToResponse(Module module) =>
        new(
            module.Id,
            module.CourseId,
            module.Title,
            module.Description,
            module.Type,
            module.Order,
            module.Assignments.Count,
            module.Assessments.Count);
}
