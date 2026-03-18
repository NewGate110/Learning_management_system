using CollegeLMS.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User>         Users         { get; set; }
    public DbSet<Course>       Courses       { get; set; }
    public DbSet<Assignment>   Assignments   { get; set; }
    public DbSet<Grade>        Grades        { get; set; }
    public DbSet<Notification> Notifications { get; set; } // ★ Innovation — Reminders

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // TODO (Person 3): Add fluent API configuration, indexes, and relationships here
    }
}
