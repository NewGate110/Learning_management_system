using CollegeLMS.API.Data;
using CollegeLMS.API.Models;
using CollegeLMS.API.Services;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.BackgroundServices;

public class DeadlineReminderService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DeadlineReminderService> _logger;
    private readonly TimeSpan _interval;
    private readonly TimeSpan _lookAheadWindow;

    public DeadlineReminderService(
        IServiceScopeFactory scopeFactory,
        IConfiguration config,
        ILogger<DeadlineReminderService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _interval = TimeSpan.FromMinutes(GetPositiveInt(config, "REMINDER_INTERVAL_MINUTES", 60));
        _lookAheadWindow = TimeSpan.FromHours(GetPositiveInt(config, "REMINDER_LOOKAHEAD_HOURS", 48));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Deadline reminder service started with a {IntervalMinutes} minute interval and a {LookAheadHours} hour look-ahead window.",
            _interval.TotalMinutes,
            _lookAheadWindow.TotalHours);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndSendRemindersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Deadline reminder service run failed.");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task CheckAndSendRemindersAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<EmailService>();
        var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

        var now = DateTime.UtcNow;
        var cutoff = now.Add(_lookAheadWindow);

        var dueAssignments = await db.Assignments
            .AsNoTracking()
            .Include(assignment => assignment.Course)
                .ThenInclude(course => course!.Students)
            .Include(assignment => assignment.Grades)
            .Where(assignment => assignment.Deadline >= now && assignment.Deadline <= cutoff)
            .OrderBy(assignment => assignment.Deadline)
            .ToListAsync(cancellationToken);

        var remindersCreated = 0;

        foreach (var assignment in dueAssignments)
        {
            var course = assignment.Course;
            if (course is null)
            {
                continue;
            }

            var submittedStudentIds = assignment.Grades
                .Select(grade => grade.UserId)
                .ToHashSet();

            foreach (var student in course.Students.Where(student =>
                         student.Role == UserRoles.Student &&
                         !submittedStudentIds.Contains(student.Id)))
            {
                var message =
                    $"Reminder: '{assignment.Title}' for {course.Title} is due on {assignment.Deadline:yyyy-MM-dd HH:mm} UTC.";

                var created = await notificationService.CreateAsync(
                    student.Id,
                    message,
                    assignment.Id,
                    cancellationToken);

                if (!created)
                {
                    continue;
                }

                remindersCreated++;

                await emailService.SendReminderAsync(
                    student.Email,
                    student.Name,
                    assignment.Title,
                    assignment.Deadline,
                    cancellationToken);
            }
        }

        _logger.LogInformation(
            "Deadline reminder check completed. {AssignmentCount} assignments were in scope and {ReminderCount} reminders were created.",
            dueAssignments.Count,
            remindersCreated);
    }

    private static int GetPositiveInt(IConfiguration config, string key, int defaultValue)
    {
        return int.TryParse(config[key], out var parsedValue) && parsedValue > 0
            ? parsedValue
            : defaultValue;
    }
}
