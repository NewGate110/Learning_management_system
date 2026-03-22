using System.Net;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace CollegeLMS.API.Services;

public class EmailService(IConfiguration config, ILogger<EmailService> logger)
{
    public async Task SendReminderAsync(
        string toEmail,
        string studentName,
        string assignmentTitle,
        DateTime deadline,
        CancellationToken cancellationToken = default)
    {
        var host = config["MAIL_HOST"];
        var from = config["MAIL_FROM"];
        var username = config["MAIL_USER"];
        var password = config["MAIL_PASSWORD"];
        var port = int.TryParse(config["MAIL_PORT"], out var parsedPort) ? parsedPort : 587;

        if (string.IsNullOrWhiteSpace(toEmail))
        {
            logger.LogWarning("Skipping reminder email because the recipient address is missing.");
            return;
        }

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
        {
            logger.LogWarning(
                "Skipping reminder email to {Email} because MAIL_HOST or MAIL_FROM is not configured.",
                toEmail);
            return;
        }

        var encodedName = WebUtility.HtmlEncode(studentName);
        var encodedAssignment = WebUtility.HtmlEncode(assignmentTitle);

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(from));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = $"Assignment reminder: {assignmentTitle}";
        message.Body = new BodyBuilder
        {
            HtmlBody =
                $"<p>Hello {encodedName},</p>" +
                $"<p>This is a reminder that <strong>{encodedAssignment}</strong> is due on " +
                $"<strong>{deadline:yyyy-MM-dd HH:mm} UTC</strong>.</p>" +
                "<p>Please submit it before the deadline.</p>" +
                "<p>College LMS</p>"
        }.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, SecureSocketOptions.StartTlsWhenAvailable, cancellationToken);

        if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
        {
            await client.AuthenticateAsync(username, password, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        logger.LogInformation(
            "Sent reminder email to {Email} for assignment {AssignmentTitle}.",
            toEmail,
            assignmentTitle);
    }

    public Task SendClassUpdateAsync(
        string toEmail,
        string recipientName,
        string moduleTitle,
        DateTime sessionDate,
        string status,
        string reason,
        DateTime? rescheduleDate,
        TimeSpan? rescheduleStartTime,
        TimeSpan? rescheduleEndTime,
        CancellationToken cancellationToken = default)
    {
        var subject = status == Models.TimetableExceptionStatuses.Cancelled
            ? $"Class cancelled: {moduleTitle}"
            : $"Class rescheduled: {moduleTitle}";

        var body = status == Models.TimetableExceptionStatuses.Cancelled
            ? $"<p>Your class for <strong>{WebUtility.HtmlEncode(moduleTitle)}</strong> on {sessionDate:yyyy-MM-dd} was cancelled.</p>"
            : $"<p>Your class for <strong>{WebUtility.HtmlEncode(moduleTitle)}</strong> on {sessionDate:yyyy-MM-dd} was rescheduled.</p>" +
              $"<p>New time: <strong>{rescheduleDate:yyyy-MM-dd} {rescheduleStartTime:hh\\:mm} - {rescheduleEndTime:hh\\:mm} UTC</strong></p>";

        body += $"<p>Reason: {WebUtility.HtmlEncode(reason)}</p><p>College LMS</p>";

        return SendGenericEmailAsync(toEmail, recipientName, subject, body, cancellationToken);
    }

    public Task SendFinalGradeReleasedAsync(
        string toEmail,
        string studentName,
        string moduleTitle,
        double finalGrade,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Final grade released: {moduleTitle}";
        var body =
            $"<p>Hello {WebUtility.HtmlEncode(studentName)},</p>" +
            $"<p>Your final module grade for <strong>{WebUtility.HtmlEncode(moduleTitle)}</strong> is now available.</p>" +
            $"<p><strong>Final Grade: {finalGrade:F2}</strong></p>" +
            "<p>College LMS</p>";

        return SendGenericEmailAsync(toEmail, studentName, subject, body, cancellationToken);
    }

    private async Task SendGenericEmailAsync(
        string toEmail,
        string recipientName,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken)
    {
        var host = config["MAIL_HOST"];
        var from = config["MAIL_FROM"];
        var username = config["MAIL_USER"];
        var password = config["MAIL_PASSWORD"];
        var port = int.TryParse(config["MAIL_PORT"], out var parsedPort) ? parsedPort : 587;

        if (string.IsNullOrWhiteSpace(toEmail))
        {
            logger.LogWarning("Skipping email because the recipient address is missing.");
            return;
        }

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
        {
            logger.LogWarning(
                "Skipping email to {Email} because MAIL_HOST or MAIL_FROM is not configured.",
                toEmail);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(from));
        message.To.Add(new MailboxAddress(recipientName, toEmail));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, SecureSocketOptions.StartTlsWhenAvailable, cancellationToken);

        if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
        {
            await client.AuthenticateAsync(username, password, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        logger.LogInformation("Sent email \"{Subject}\" to {Email}.", subject, toEmail);
    }
}
