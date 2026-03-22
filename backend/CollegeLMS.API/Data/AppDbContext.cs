using CollegeLMS.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CollegeLMS.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<Module> Modules { get; set; }
    public DbSet<Assignment> Assignments { get; set; }
    public DbSet<Submission> Submissions { get; set; }
    public DbSet<AssignmentGrade> AssignmentGrades { get; set; }
    public DbSet<Assessment> Assessments { get; set; }
    public DbSet<AssessmentGrade> AssessmentGrades { get; set; }
    public DbSet<ModuleProgress> ModuleProgresses { get; set; }
    public DbSet<AttendanceSession> AttendanceSessions { get; set; }
    public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
    public DbSet<TimetableSlot> TimetableSlots { get; set; }
    public DbSet<TimetableException> TimetableExceptions { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUsers(modelBuilder);
        ConfigureCourses(modelBuilder);
        ConfigureModules(modelBuilder);
        ConfigureAssignments(modelBuilder);
        ConfigureSubmissions(modelBuilder);
        ConfigureAssignmentGrades(modelBuilder);
        ConfigureAssessments(modelBuilder);
        ConfigureAssessmentGrades(modelBuilder);
        ConfigureModuleProgress(modelBuilder);
        ConfigureAttendance(modelBuilder);
        ConfigureTimetable(modelBuilder);
        ConfigureNotifications(modelBuilder);
    }

    private static void ConfigureUsers(ModelBuilder modelBuilder)
    {
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
    }

    private static void ConfigureCourses(ModelBuilder modelBuilder)
    {
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
    }

    private static void ConfigureModules(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Module>(entity =>
        {
            entity.Property(module => module.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(module => module.Description)
                .HasMaxLength(4000);

            entity.Property(module => module.Type)
                .HasMaxLength(32)
                .IsRequired();

            entity.HasIndex(module => new { module.CourseId, module.Order });
            entity.HasIndex(module => module.CourseId);

            entity.HasOne(module => module.Course)
                .WithMany(course => course.Modules)
                .HasForeignKey(module => module.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.ToTable(table =>
            {
                table.HasCheckConstraint(
                    "CK_Modules_Type",
                    "\"Type\" IN ('Sequential', 'Compulsory', 'Optional')");
            });
        });
    }

    private static void ConfigureAssignments(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.Property(assignment => assignment.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(assignment => assignment.Description)
                .HasMaxLength(4000);

            entity.HasIndex(assignment => new { assignment.ModuleId, assignment.Deadline });

            entity.HasOne(assignment => assignment.Module)
                .WithMany(module => module.Assignments)
                .HasForeignKey(assignment => assignment.ModuleId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureSubmissions(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Submission>(entity =>
        {
            entity.Property(submission => submission.FileUrl)
                .HasMaxLength(2048)
                .IsRequired();

            entity.HasIndex(submission => new { submission.AssignmentId, submission.StudentId })
                .IsUnique();
            entity.HasIndex(submission => submission.SubmittedAt);

            entity.HasOne(submission => submission.Assignment)
                .WithMany(assignment => assignment.Submissions)
                .HasForeignKey(submission => submission.AssignmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(submission => submission.Student)
                .WithMany(user => user.Submissions)
                .HasForeignKey(submission => submission.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureAssignmentGrades(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AssignmentGrade>(entity =>
        {
            entity.Property(grade => grade.Feedback)
                .HasMaxLength(2000);

            entity.HasIndex(grade => grade.SubmissionId).IsUnique();
            entity.HasIndex(grade => new { grade.InstructorId, grade.GradedAt });

            entity.HasOne(grade => grade.Submission)
                .WithOne(submission => submission.AssignmentGrade)
                .HasForeignKey<AssignmentGrade>(grade => grade.SubmissionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(grade => grade.Instructor)
                .WithMany(user => user.AssignmentGradesGiven)
                .HasForeignKey(grade => grade.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureAssessments(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Assessment>(entity =>
        {
            entity.Property(assessment => assessment.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(assessment => assessment.Description)
                .HasMaxLength(4000);

            entity.Property(assessment => assessment.Location)
                .HasMaxLength(200);

            entity.HasIndex(assessment => new { assessment.ModuleId, assessment.ScheduledAt });

            entity.HasOne(assessment => assessment.Module)
                .WithMany(module => module.Assessments)
                .HasForeignKey(assessment => assessment.ModuleId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureAssessmentGrades(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AssessmentGrade>(entity =>
        {
            entity.HasIndex(grade => new { grade.AssessmentId, grade.StudentId }).IsUnique();
            entity.HasIndex(grade => new { grade.StudentId, grade.GradedAt });

            entity.HasOne(grade => grade.Assessment)
                .WithMany(assessment => assessment.Grades)
                .HasForeignKey(grade => grade.AssessmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(grade => grade.Student)
                .WithMany(user => user.AssessmentGradesReceived)
                .HasForeignKey(grade => grade.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(grade => grade.Instructor)
                .WithMany(user => user.AssessmentGradesGiven)
                .HasForeignKey(grade => grade.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureModuleProgress(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ModuleProgress>(entity =>
        {
            entity.Property(progress => progress.Status)
                .HasMaxLength(32)
                .IsRequired();

            entity.HasIndex(progress => new { progress.StudentId, progress.ModuleId })
                .IsUnique();

            entity.HasOne(progress => progress.Student)
                .WithMany(user => user.ModuleProgresses)
                .HasForeignKey(progress => progress.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(progress => progress.Module)
                .WithMany(module => module.Progresses)
                .HasForeignKey(progress => progress.ModuleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.ToTable(table =>
            {
                table.HasCheckConstraint(
                    "CK_ModuleProgress_Status",
                    "\"Status\" IN ('InProgress', 'Passed', 'Failed')");
            });
        });
    }

    private static void ConfigureAttendance(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AttendanceSession>(entity =>
        {
            entity.HasIndex(session => new { session.ModuleId, session.Date }).IsUnique();
            entity.HasIndex(session => session.CreatedByInstructorId);

            entity.HasOne(session => session.Module)
                .WithMany(module => module.AttendanceSessions)
                .HasForeignKey(session => session.ModuleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(session => session.CreatedByInstructor)
                .WithMany(user => user.AttendanceSessionsCreated)
                .HasForeignKey(session => session.CreatedByInstructorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AttendanceRecord>(entity =>
        {
            entity.HasIndex(record => new { record.AttendanceSessionId, record.StudentId })
                .IsUnique();

            entity.HasOne(record => record.AttendanceSession)
                .WithMany(session => session.Records)
                .HasForeignKey(record => record.AttendanceSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(record => record.Student)
                .WithMany(user => user.AttendanceRecords)
                .HasForeignKey(record => record.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureTimetable(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TimetableSlot>(entity =>
        {
            entity.Property(slot => slot.DayOfWeek)
                .HasMaxLength(12)
                .IsRequired();

            entity.Property(slot => slot.Location)
                .HasMaxLength(200)
                .IsRequired();

            entity.HasIndex(slot => new
            {
                slot.ModuleId,
                slot.DayOfWeek,
                slot.StartTime,
                slot.EndTime
            });

            entity.HasOne(slot => slot.Module)
                .WithMany(module => module.TimetableSlots)
                .HasForeignKey(slot => slot.ModuleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(slot => slot.Instructor)
                .WithMany(user => user.TimetableSlotsTeaching)
                .HasForeignKey(slot => slot.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.ToTable(table =>
            {
                table.HasCheckConstraint(
                    "CK_TimetableSlots_DayOfWeek",
                    "\"DayOfWeek\" IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')");
            });
        });

        modelBuilder.Entity<TimetableException>(entity =>
        {
            entity.Property(exception => exception.Status)
                .HasMaxLength(24)
                .IsRequired();

            entity.Property(exception => exception.Reason)
                .HasMaxLength(500)
                .IsRequired();

            entity.HasIndex(exception => new { exception.TimetableSlotId, exception.Date }).IsUnique();

            entity.HasOne(exception => exception.TimetableSlot)
                .WithMany(slot => slot.Exceptions)
                .HasForeignKey(exception => exception.TimetableSlotId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.ToTable(table =>
            {
                table.HasCheckConstraint(
                    "CK_TimetableExceptions_Status",
                    "\"Status\" IN ('Cancelled', 'Rescheduled')");
            });
        });
    }

    private static void ConfigureNotifications(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(notification => notification.Message)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(notification => notification.Type)
                .HasMaxLength(64)
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
                notification.Type,
                notification.CreatedAt
            });

            entity.HasOne(notification => notification.User)
                .WithMany(user => user.Notifications)
                .HasForeignKey(notification => notification.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(notification => notification.Assignment)
                .WithMany(assignment => assignment.Notifications)
                .HasForeignKey(notification => notification.AssignmentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(notification => notification.Assessment)
                .WithMany(assessment => assessment.Notifications)
                .HasForeignKey(notification => notification.AssessmentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(notification => notification.Module)
                .WithMany(module => module.Notifications)
                .HasForeignKey(notification => notification.ModuleId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(notification => notification.TimetableException)
                .WithMany(exception => exception.Notifications)
                .HasForeignKey(notification => notification.TimetableExceptionId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.ToTable(table =>
            {
                table.HasCheckConstraint(
                    "CK_Notifications_Type",
                    "\"Type\" IN ('General', 'ClassCancelled', 'ClassRescheduled', 'AssignmentDeadline', 'AssessmentDate', 'AssignmentGraded', 'FinalGradeReleased')");
            });
        });
    }
}
