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
public class TimetableController(
    AppDbContext db,
    TimetableService timetableService,
    NotificationService notificationService,
    EmailService emailService) : ControllerBase
{
    [HttpGet("slots")]
    public async Task<ActionResult<IEnumerable<TimetableSlotResponse>>> GetSlots(
        [FromQuery] int? moduleId,
        CancellationToken cancellationToken)
    {
        var query = BuildVisibleSlotsQuery();

        if (moduleId.HasValue && moduleId.Value > 0)
        {
            query = query.Where(slot => slot.ModuleId == moduleId.Value);
        }

        var slots = await query
            .AsNoTracking()
            .OrderBy(slot => slot.DayOfWeek)
            .ThenBy(slot => slot.StartTime)
            .Select(slot => new TimetableSlotResponse(
                slot.Id,
                slot.ModuleId,
                slot.Module!.Title,
                slot.InstructorId,
                slot.Instructor!.Name,
                slot.DayOfWeek,
                slot.StartTime,
                slot.EndTime,
                slot.Location,
                slot.EffectiveFrom,
                slot.EffectiveTo))
            .ToListAsync(cancellationToken);

        return Ok(slots);
    }

    [HttpPost("slots")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<TimetableSlotResponse>> CreateSlot(
        [FromBody] UpsertTimetableSlotRequest request,
        CancellationToken cancellationToken)
    {
        var validation = await ValidateSlotRequestAsync(request, cancellationToken);
        if (validation is not null)
        {
            return validation;
        }

        var slot = new TimetableSlot
        {
            ModuleId = request.ModuleId,
            InstructorId = request.InstructorId,
            DayOfWeek = request.DayOfWeek.Trim(),
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Location = request.Location.Trim(),
            EffectiveFrom = request.EffectiveFrom.ToUniversalTime(),
            EffectiveTo = request.EffectiveTo.ToUniversalTime()
        };

        db.TimetableSlots.Add(slot);
        await db.SaveChangesAsync(cancellationToken);

        var response = await db.TimetableSlots
            .AsNoTracking()
            .Where(item => item.Id == slot.Id)
            .Select(item => new TimetableSlotResponse(
                item.Id,
                item.ModuleId,
                item.Module!.Title,
                item.InstructorId,
                item.Instructor!.Name,
                item.DayOfWeek,
                item.StartTime,
                item.EndTime,
                item.Location,
                item.EffectiveFrom,
                item.EffectiveTo))
            .FirstAsync(cancellationToken);

        return CreatedAtAction(nameof(GetSlots), new { moduleId = slot.ModuleId }, response);
    }

    [HttpPut("slots/{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<ActionResult<TimetableSlotResponse>> UpdateSlot(
        int id,
        [FromBody] UpsertTimetableSlotRequest request,
        CancellationToken cancellationToken)
    {
        var slot = await db.TimetableSlots
            .Include(item => item.Module)
            .Include(item => item.Instructor)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (slot is null)
        {
            return NotFound();
        }

        var validation = await ValidateSlotRequestAsync(request, cancellationToken);
        if (validation is not null)
        {
            return validation;
        }

        slot.ModuleId = request.ModuleId;
        slot.InstructorId = request.InstructorId;
        slot.DayOfWeek = request.DayOfWeek.Trim();
        slot.StartTime = request.StartTime;
        slot.EndTime = request.EndTime;
        slot.Location = request.Location.Trim();
        slot.EffectiveFrom = request.EffectiveFrom.ToUniversalTime();
        slot.EffectiveTo = request.EffectiveTo.ToUniversalTime();

        await db.SaveChangesAsync(cancellationToken);

        await db.Entry(slot).Reference(item => item.Module).LoadAsync(cancellationToken);
        await db.Entry(slot).Reference(item => item.Instructor).LoadAsync(cancellationToken);

        return Ok(new TimetableSlotResponse(
            slot.Id,
            slot.ModuleId,
            slot.Module?.Title ?? string.Empty,
            slot.InstructorId,
            slot.Instructor?.Name ?? string.Empty,
            slot.DayOfWeek,
            slot.StartTime,
            slot.EndTime,
            slot.Location,
            slot.EffectiveFrom,
            slot.EffectiveTo));
    }

    [HttpDelete("slots/{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> DeleteSlot(int id, CancellationToken cancellationToken)
    {
        var slot = await db.TimetableSlots.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (slot is null)
        {
            return NotFound();
        }

        db.TimetableSlots.Remove(slot);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("exceptions")]
    public async Task<ActionResult<IEnumerable<TimetableExceptionResponse>>> GetExceptions(
        [FromQuery] int? timetableSlotId,
        CancellationToken cancellationToken)
    {
        var visibleSlotIds = await BuildVisibleSlotsQuery()
            .AsNoTracking()
            .Select(slot => slot.Id)
            .ToListAsync(cancellationToken);

        var query = db.TimetableExceptions
            .AsNoTracking()
            .Where(exception => visibleSlotIds.Contains(exception.TimetableSlotId));

        if (timetableSlotId.HasValue && timetableSlotId.Value > 0)
        {
            query = query.Where(exception => exception.TimetableSlotId == timetableSlotId.Value);
        }

        var exceptions = await query
            .OrderByDescending(exception => exception.Date)
            .Select(exception => new TimetableExceptionResponse(
                exception.Id,
                exception.TimetableSlotId,
                exception.Date,
                exception.Status,
                exception.RescheduleDate,
                exception.RescheduleStartTime,
                exception.RescheduleEndTime,
                exception.Reason))
            .ToListAsync(cancellationToken);

        return Ok(exceptions);
    }

    [HttpPost("exceptions")]
    [Authorize(Roles = $"{UserRoles.Instructor},{UserRoles.Admin}")]
    public async Task<ActionResult<TimetableExceptionResponse>> CreateException(
        [FromBody] CreateTimetableExceptionRequest request,
        CancellationToken cancellationToken)
    {
        var slot = await db.TimetableSlots
            .Include(item => item.Module)
                .ThenInclude(module => module!.Course)
                    .ThenInclude(course => course!.Students)
            .Include(item => item.Instructor)
            .FirstOrDefaultAsync(item => item.Id == request.TimetableSlotId, cancellationToken);

        if (slot is null || slot.Module?.Course is null || slot.Instructor is null)
        {
            return BadRequest(new { message = "TimetableSlotId does not reference an existing slot." });
        }

        var permission = EnsureCanCreateException(slot);
        if (permission is not null)
        {
            return permission;
        }

        if (request.Date == default)
        {
            return BadRequest(new { message = "Date is required." });
        }

        var status = request.Status.Trim();
        if (!TimetableExceptionStatuses.IsValid(status))
        {
            return BadRequest(new { message = "Status must be Cancelled or Rescheduled." });
        }

        if (status == TimetableExceptionStatuses.Rescheduled)
        {
            if (request.RescheduleDate is null || request.RescheduleStartTime is null || request.RescheduleEndTime is null)
            {
                return BadRequest(new { message = "Rescheduled exceptions require date, start time, and end time." });
            }
        }

        var exception = new TimetableException
        {
            TimetableSlotId = request.TimetableSlotId,
            Date = request.Date.Date.ToUniversalTime(),
            Status = status,
            RescheduleDate = request.RescheduleDate?.Date.ToUniversalTime(),
            RescheduleStartTime = request.RescheduleStartTime,
            RescheduleEndTime = request.RescheduleEndTime,
            Reason = request.Reason.Trim()
        };

        db.TimetableExceptions.Add(exception);
        await db.SaveChangesAsync(cancellationToken);

        await SendExceptionNotificationsAsync(slot, exception, cancellationToken);

        return CreatedAtAction(nameof(GetExceptions), new { timetableSlotId = slot.Id }, new TimetableExceptionResponse(
            exception.Id,
            exception.TimetableSlotId,
            exception.Date,
            exception.Status,
            exception.RescheduleDate,
            exception.RescheduleStartTime,
            exception.RescheduleEndTime,
            exception.Reason));
    }

    [HttpGet("events")]
    public async Task<ActionResult<IEnumerable<TimetableSessionEventResponse>>> GetSessionEvents(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        var windowStart = (from ?? DateTime.UtcNow.Date).ToUniversalTime();
        var windowEnd = (to ?? windowStart.AddDays(7)).ToUniversalTime();

        var events = await timetableService.GetSessionEventsAsync(
            BuildVisibleSlotsQuery(),
            windowStart,
            windowEnd,
            cancellationToken);

        return Ok(events);
    }

    private async Task<ActionResult?> ValidateSlotRequestAsync(
        UpsertTimetableSlotRequest request,
        CancellationToken cancellationToken)
    {
        if (!TimetableService.TryParseDayOfWeek(request.DayOfWeek, out _))
        {
            return BadRequest(new { message = "DayOfWeek must be Mon, Tue, Wed, Thu, Fri, Sat, or Sun." });
        }

        if (request.StartTime >= request.EndTime)
        {
            return BadRequest(new { message = "EndTime must be after StartTime." });
        }

        if (request.EffectiveFrom == default || request.EffectiveTo == default || request.EffectiveTo < request.EffectiveFrom)
        {
            return BadRequest(new { message = "EffectiveTo must be on or after EffectiveFrom." });
        }

        var moduleExists = await db.Modules
            .AsNoTracking()
            .AnyAsync(module => module.Id == request.ModuleId, cancellationToken);

        if (!moduleExists)
        {
            return BadRequest(new { message = "ModuleId does not reference an existing module." });
        }

        var instructor = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == request.InstructorId, cancellationToken);

        if (instructor is null || instructor.Role is not (UserRoles.Instructor or UserRoles.Admin))
        {
            return BadRequest(new { message = "InstructorId must belong to an instructor or admin user." });
        }

        return null;
    }

    private async Task SendExceptionNotificationsAsync(
        TimetableSlot slot,
        TimetableException exception,
        CancellationToken cancellationToken)
    {
        var admins = await db.Users
            .AsNoTracking()
            .Where(user => user.Role == UserRoles.Admin)
            .ToListAsync(cancellationToken);

        var recipients = slot.Module!.Course!.Students
            .Concat(admins)
            .Append(slot.Instructor!)
            .DistinctBy(user => user.Id)
            .ToList();

        var isCancelled = exception.Status == TimetableExceptionStatuses.Cancelled;
        var notificationType = isCancelled
            ? NotificationTypes.ClassCancelled
            : NotificationTypes.ClassRescheduled;

        var message = isCancelled
            ? $"Class cancelled: {slot.Module.Title} on {exception.Date:yyyy-MM-dd}. Reason: {exception.Reason}"
            : $"Class rescheduled: {slot.Module.Title} from {exception.Date:yyyy-MM-dd}. Reason: {exception.Reason}";

        await notificationService.CreateBulkAsync(
            recipients.Select(user => user.Id),
            notificationType,
            message,
            moduleId: slot.ModuleId,
            timetableExceptionId: exception.Id,
            cancellationToken: cancellationToken);

        foreach (var recipient in recipients)
        {
            await emailService.SendClassUpdateAsync(
                recipient.Email,
                recipient.Name,
                slot.Module.Title,
                exception.Date,
                exception.Status,
                exception.Reason,
                exception.RescheduleDate,
                exception.RescheduleStartTime,
                exception.RescheduleEndTime,
                cancellationToken);
        }
    }

    private ActionResult? EnsureCanCreateException(TimetableSlot slot)
    {
        if (User.IsInRole(UserRoles.Admin))
        {
            return null;
        }

        var actorId = User.GetUserId();
        if (actorId is null || !User.IsInRole(UserRoles.Instructor) || slot.InstructorId != actorId.Value)
        {
            return Forbid();
        }

        return null;
    }

    private IQueryable<TimetableSlot> BuildVisibleSlotsQuery()
    {
        var actorId = User.GetUserId();
        if (actorId is null)
        {
            return db.TimetableSlots.Where(slot => false);
        }

        if (User.IsInRole(UserRoles.Admin))
        {
            return db.TimetableSlots
                .Include(slot => slot.Module)
                .Include(slot => slot.Instructor);
        }

        if (User.IsInRole(UserRoles.Instructor))
        {
            return db.TimetableSlots
                .Include(slot => slot.Module)
                .Include(slot => slot.Instructor)
                .Where(slot => slot.InstructorId == actorId.Value);
        }

        return db.TimetableSlots
            .Include(slot => slot.Module)
            .Include(slot => slot.Instructor)
            .Where(slot => slot.Module!.Course!.Students.Any(student => student.Id == actorId.Value));
    }
}
