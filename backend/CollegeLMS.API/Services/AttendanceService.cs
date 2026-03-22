using CollegeLMS.API.Data;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Services;

public class AttendanceService(AppDbContext db)
{
    public async Task<(int PresentSessions, int TotalSessions, double Percentage)> GetAttendanceSummaryAsync(
        int moduleId,
        int studentId,
        CancellationToken cancellationToken = default)
    {
        var totalSessions = await db.AttendanceSessions
            .AsNoTracking()
            .CountAsync(session => session.ModuleId == moduleId, cancellationToken);

        if (totalSessions == 0)
        {
            return (0, 0, 100);
        }

        var presentSessions = await db.AttendanceRecords
            .AsNoTracking()
            .CountAsync(
                record =>
                    record.StudentId == studentId &&
                    record.IsPresent &&
                    record.AttendanceSession!.ModuleId == moduleId,
                cancellationToken);

        var percentage = Math.Round(presentSessions * 100d / totalSessions, 2);
        return (presentSessions, totalSessions, percentage);
    }

    public async Task<bool> IsEligibleForSubmissionAsync(
        int moduleId,
        int studentId,
        CancellationToken cancellationToken = default)
    {
        var (_, _, percentage) = await GetAttendanceSummaryAsync(moduleId, studentId, cancellationToken);
        return percentage >= 80;
    }
}
