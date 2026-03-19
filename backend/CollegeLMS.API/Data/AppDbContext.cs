using CollegeLMS.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<Assignment> Assignments { get; set; }
    public DbSet<Grade> Grades { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(user => user.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(user => user.Email)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(user => user.Role)
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(user => user.PasswordHash)
                .HasMaxLength(512)
                .IsRequired();

            entity.HasIndex(user => user.Email).IsUnique();

            entity.ToTable(table =>
            {
                table.HasCheckConstraint(
                    "CK_Users_Role",
                    "\"Role\" IN ('Student', 'Instructor', 'Admin')");
            });

            entity.HasMany(user => user.EnrolledCourses)
                .WithMany(course => course.Students)
                .UsingEntity<Dictionary<string, object>>(
                    "CourseEnrollment",
                    right => right.HasOne<Course>()
                        .WithMany()
                        .HasForeignKey("CourseId")
                        .OnDelete(DeleteBehavior.Cascade),
                    left => left.HasOne<User>()
                        .WithMany()
                        .HasForeignKey("StudentId")
                        .OnDelete(DeleteBehavior.Cascade),
                    join =>
                    {
                        join.ToTable("CourseEnrollments");
                        join.HasKey("CourseId", "StudentId");
                    });
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.Property(course => course.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(course => course.Description)
                .HasMaxLength(4000);

            entity.HasIndex(course => course.InstructorId);

            entity.HasOne(course => course.Instructor)
                .WithMany(user => user.CoursesTeaching)
                .HasForeignKey(course => course.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.Property(assignment => assignment.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(assignment => assignment.Description)
                .HasMaxLength(4000);

            entity.HasIndex(assignment => new { assignment.CourseId, assignment.Deadline });

            entity.HasOne(assignment => assignment.Course)
                .WithMany(course => course.Assignments)
                .HasForeignKey(assignment => assignment.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Grade>(entity =>
        {
            entity.HasIndex(grade => new { grade.UserId, grade.AssignmentId }).IsUnique();
            entity.HasIndex(grade => grade.SubmittedAt);

            entity.HasOne(grade => grade.User)
                .WithMany(user => user.Grades)
                .HasForeignKey(grade => grade.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(grade => grade.Assignment)
                .WithMany(assignment => assignment.Grades)
                .HasForeignKey(grade => grade.AssignmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(notification => notification.Message)
                .HasMaxLength(500)
                .IsRequired();

            entity.HasIndex(notification => new
            {
                notification.UserId,
                notification.IsRead,
                notification.CreatedAt
            });

            entity.HasIndex(notification => new
            {
                notification.UserId,
                notification.AssignmentId
            }).IsUnique();

            entity.HasOne(notification => notification.User)
                .WithMany(user => user.Notifications)
                .HasForeignKey(notification => notification.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(notification => notification.Assignment)
                .WithMany()
                .HasForeignKey(notification => notification.AssignmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
