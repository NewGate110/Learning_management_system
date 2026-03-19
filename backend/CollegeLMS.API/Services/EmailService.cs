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
}
