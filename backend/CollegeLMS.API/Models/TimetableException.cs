namespace CollegeLMS.API.Models;

public class TimetableException
{
    public int Id { get; set; }
    public int TimetableSlotId { get; set; }
    public DateTime Date { get; set; }
    public string Status { get; set; } = TimetableExceptionStatuses.Cancelled;
    public DateTime? RescheduleDate { get; set; }
    public TimeSpan? RescheduleStartTime { get; set; }
    public TimeSpan? RescheduleEndTime { get; set; }
    public string Reason { get; set; } = string.Empty;

    public TimetableSlot? TimetableSlot { get; set; }
    public ICollection<Notification> Notifications { get; set; } = [];
}

public static class TimetableExceptionStatuses
{
    public const string Cancelled = "Cancelled";
    public const string Rescheduled = "Rescheduled";

    public static bool IsValid(string status) =>
        status is Cancelled or Rescheduled;
}
