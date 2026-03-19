namespace CollegeLMS.API.Contracts;

public sealed record NotificationResponse(
    int Id,
    int UserId,
    string Message,
    bool IsRead,
    DateTime CreatedAt,
    DateTime? ReadAt);

public sealed record UnreadCountResponse(int Count);
