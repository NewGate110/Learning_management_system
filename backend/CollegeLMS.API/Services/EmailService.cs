namespace CollegeLMS.API.Services;

/// <summary>
/// ★ Innovation Feature — Automated Deadline Reminder System
/// Sends deadline reminder emails via MailKit + SendGrid / Mailgun.
/// </summary>
public class EmailService(IConfiguration config, ILogger<EmailService> logger)
{
    // TODO (Person 3):
    // - Resolve MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, MAIL_FROM from config
    // - Use MailKit's SmtpClient to connect and authenticate
    // - Build MimeMessage with a formatted HTML reminder body

    /// <summary>Sends a deadline reminder email to a student.</summary>
    public Task SendReminderAsync(string toEmail, string studentName, string assignmentTitle, DateTime deadline)
    {
        logger.LogInformation(
            "Email reminder queued → {Email} for '{Assignment}' due {Deadline} — not yet implemented",
            toEmail, assignmentTitle, deadline);

        return Task.CompletedTask;
    }
}
