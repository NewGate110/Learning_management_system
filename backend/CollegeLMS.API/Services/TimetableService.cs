using CollegeLMS.API.Contracts;
using CollegeLMS.API.Data;
using CollegeLMS.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Services;

public class TimetableService(AppDbContext db)
{
    public async Task<IReadOnlyCollection<TimetableSessionEventResponse>> GetSessionEventsAsync(
        IQueryable<TimetableSlot> slotQuery,
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken = default)
    {
        var normalizedFrom = from.ToUniversalTime();
        var normalizedTo = to.ToUniversalTime();
        if (normalizedTo < normalizedFrom)
        {
            (normalizedFrom, normalizedTo) = (normalizedTo, normalizedFrom);
        }

        var slots = await slotQuery
            .AsNoTracking()
            .Include(slot => slot.Module)
            .Where(slot =>
                slot.EffectiveFrom <= normalizedTo &&
                slot.EffectiveTo >= normalizedFrom)
            .ToListAsync(cancellationToken);

        var slotIds = slots.Select(slot => slot.Id).ToList();
        var exceptions = await db.TimetableExceptions
            .AsNoTracking()
            .Where(exception =>
                slotIds.Contains(exception.TimetableSlotId) &&
                exception.Date >= normalizedFrom.Date &&
                exception.Date <= normalizedTo.Date)
            .ToListAsync(cancellationToken);

        var exceptionsBySlotAndDate = exceptions.ToDictionary(
            exception => (exception.TimetableSlotId, exception.Date.Date),
            exception => exception);

        var events = new List<TimetableSessionEventResponse>();

        foreach (var slot in slots)
        {
            if (!TryParseDayOfWeek(slot.DayOfWeek, out var targetDay))
            {
                continue;
            }

            var rangeStart = Max(slot.EffectiveFrom.Date, normalizedFrom.Date);
            var rangeEnd = Min(slot.EffectiveTo.Date, normalizedTo.Date);
            if (rangeStart > rangeEnd)
            {
                continue;
            }

            for (var date = rangeStart; date <= rangeEnd; date = date.AddDays(1))
            {
                if (date.DayOfWeek != targetDay)
                {
                    continue;
                }

                var sessionStart = date.Add(slot.StartTime);
                var sessionEnd = date.Add(slot.EndTime);
                if (sessionEnd < normalizedFrom || sessionStart > normalizedTo)
                {
                    continue;
                }

                if (exceptionsBySlotAndDate.TryGetValue((slot.Id, date.Date), out var slotException))
                {
                    if (slotException.Status == TimetableExceptionStatuses.Cancelled)
                    {
                        events.Add(new TimetableSessionEventResponse(
                            slot.Id,
                            slot.ModuleId,
                            slot.Module?.Title ?? string.Empty,
                            date,
                            sessionStart,
                            sessionEnd,
                            slot.Location,
                            true,
                            false,
                            slotException.Reason));
                        continue;
                    }

                    var rescheduledDate = slotException.RescheduleDate?.Date ?? date;
                    var rescheduledStart = slotException.RescheduleStartTime ?? slot.StartTime;
                    var rescheduledEnd = slotException.RescheduleEndTime ?? slot.EndTime;
                    var rescheduledStartDateTime = rescheduledDate.Add(rescheduledStart);
                    var rescheduledEndDateTime = rescheduledDate.Add(rescheduledEnd);

                    if (rescheduledEndDateTime < normalizedFrom || rescheduledStartDateTime > normalizedTo)
                    {
                        continue;
                    }

                    events.Add(new TimetableSessionEventResponse(
                        slot.Id,
                        slot.ModuleId,
                        slot.Module?.Title ?? string.Empty,
                        rescheduledDate,
                        rescheduledStartDateTime,
                        rescheduledEndDateTime,
                        slot.Location,
                        false,
                        true,
                        slotException.Reason));
                    continue;
                }

                events.Add(new TimetableSessionEventResponse(
                    slot.Id,
                    slot.ModuleId,
                    slot.Module?.Title ?? string.Empty,
                    date,
                    sessionStart,
                    sessionEnd,
                    slot.Location,
                    false,
                    false,
                    null));
            }
        }

        return events
            .OrderBy(item => item.SessionStart)
            .ThenBy(item => item.ModuleTitle)
            .ToList();
    }

    public static bool TryParseDayOfWeek(string value, out DayOfWeek dayOfWeek)
    {
        dayOfWeek = DayOfWeek.Monday;
        var normalized = value.Trim().ToLowerInvariant();

        return normalized switch
        {
            "mon" or "monday" => Set(DayOfWeek.Monday, out dayOfWeek),
            "tue" or "tues" or "tuesday" => Set(DayOfWeek.Tuesday, out dayOfWeek),
            "wed" or "wednesday" => Set(DayOfWeek.Wednesday, out dayOfWeek),
            "thu" or "thur" or "thursday" => Set(DayOfWeek.Thursday, out dayOfWeek),
            "fri" or "friday" => Set(DayOfWeek.Friday, out dayOfWeek),
            "sat" or "saturday" => Set(DayOfWeek.Saturday, out dayOfWeek),
            "sun" or "sunday" => Set(DayOfWeek.Sunday, out dayOfWeek),
            _ => false
        };
    }

    private static bool Set(DayOfWeek value, out DayOfWeek output)
    {
        output = value;
        return true;
    }

    private static DateTime Max(DateTime first, DateTime second) => first >= second ? first : second;

    private static DateTime Min(DateTime first, DateTime second) => first <= second ? first : second;
}
