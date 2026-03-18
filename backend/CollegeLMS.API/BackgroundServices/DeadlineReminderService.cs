namespace CollegeLMS.API.BackgroundServices;

/// <summary>
/// ★ Innovation Feature — Automated Deadline Reminder System
/// Runs on a scheduled interval, checks for upcoming assignment deadlines,
/// sends email reminders via EmailService, and creates in-app Notifications.
/// </summary>
public class DeadlineReminderService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DeadlineReminderService> _logger;

    // Check every hour in production; adjust for testing
    private readonly TimeSpan _interval = TimeSpan.FromHours(1);

    public DeadlineReminderService(
        IServiceScopeFactory scopeFactory,
        ILogger<DeadlineReminderService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DeadlineReminderService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndSendRemindersAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DeadlineReminderService.");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task CheckAndSendRemindersAsync()
    {
        using var scope = _scopeFactory.CreateScope();

        // TODO (Person 3):
        // 1. Resolve AppDbContext, EmailService, NotificationService from scope
        // 2. Query assignments where Deadline is within the next 24-48 hours
        // 3. For each assignment, find enrolled students
        // 4. Call EmailService.SendReminderAsync(student, assignment)
        // 5. Call NotificationService.CreateAsync(userId, message)

        _logger.LogInformation("[{Time}] Deadline check ran — implementation pending.",
            DateTime.UtcNow);

        await Task.CompletedTask;
    }
}
