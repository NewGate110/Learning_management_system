using System.Text;
using CollegeLMS.API.BackgroundServices;
using CollegeLMS.API.Data;
using CollegeLMS.API.Middleware;
using CollegeLMS.API.Models;
using CollegeLMS.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

var jwtSecret = builder.Configuration["JWT_SECRET"];
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    if (builder.Environment.IsDevelopment())
    {
        jwtSecret = "development-only-jwt-secret-change-in-env";
        builder.Configuration["JWT_SECRET"] = jwtSecret;
    }
    else
    {
        throw new InvalidOperationException("JWT_SECRET is not configured.");
    }
}

var jwtIssuer = builder.Configuration["JWT_ISSUER"] ?? "CollegeLMS";
var jwtAudience = builder.Configuration["JWT_AUDIENCE"] ?? "CollegeLMSUsers";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddProblemDetails();

var corsOrigins =
    builder.Configuration["CORS_ALLOWED_ORIGINS"]?
        .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ??
    ["http://localhost", "http://localhost:80", "http://localhost:4200"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<ProgressService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<AttendanceService>();
builder.Services.AddScoped<ModuleProgressService>();
builder.Services.AddScoped<TimetableService>();
builder.Services.AddHostedService<DeadlineReminderService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CollegeLMS API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    if (!db.Users.Any())
    {
        await SeedTestDataAsync(scope.ServiceProvider, db);
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

static async Task SeedTestDataAsync(IServiceProvider services, AppDbContext db)
{
    var hasher = services.GetRequiredService<IPasswordHasher<User>>();

    var admin = new User { Name = "Admin User", Email = "admin@lms.com", Role = UserRoles.Admin };
    var instructor = new User
    {
        Name = "Jane Instructor",
        Email = "instructor@lms.com",
        Role = UserRoles.Instructor
    };
    var student = new User { Name = "John Student", Email = "student@lms.com", Role = UserRoles.Student };

    foreach (var user in new[] { admin, instructor, student })
    {
        user.PasswordHash = hasher.HashPassword(user, "Password123!");
    }

    db.Users.AddRange(admin, instructor, student);
    await db.SaveChangesAsync();

    var now = DateTime.UtcNow;

    var course1 = new Course
    {
        Title = "Introduction to Programming",
        Description = "Learn the basics of programming using C#.",
        InstructorId = instructor.Id,
        StartDate = now.Date,
        EndDate = now.Date.AddMonths(4)
    };
    var course2 = new Course
    {
        Title = "Web Development",
        Description = "Build modern web apps with Angular and ASP.NET Core.",
        InstructorId = instructor.Id,
        StartDate = now.Date,
        EndDate = now.Date.AddMonths(4)
    };
    var course3 = new Course
    {
        Title = "Database Systems",
        Description = "Fundamentals of relational databases and SQL.",
        InstructorId = instructor.Id,
        StartDate = now.Date,
        EndDate = now.Date.AddMonths(4)
    };

    db.Courses.AddRange(course1, course2, course3);
    await db.SaveChangesAsync();

    student.EnrolledCourses.Add(course1);
    student.EnrolledCourses.Add(course2);
    student.EnrolledCourses.Add(course3);
    await db.SaveChangesAsync();

    var module11 = new Module
    {
        CourseId = course1.Id,
        Title = "Programming Basics",
        Description = "Variables, control flow, and functions.",
        Type = ModuleTypes.Sequential,
        Order = 1
    };
    var module12 = new Module
    {
        CourseId = course1.Id,
        Title = "Object-Oriented Programming",
        Description = "Classes, inheritance, and encapsulation.",
        Type = ModuleTypes.Sequential,
        Order = 2
    };
    var module21 = new Module
    {
        CourseId = course2.Id,
        Title = "Frontend Foundations",
        Description = "Angular basics and component architecture.",
        Type = ModuleTypes.Compulsory,
        Order = 0
    };
    var module22 = new Module
    {
        CourseId = course2.Id,
        Title = "Backend APIs",
        Description = "REST API design and implementation.",
        Type = ModuleTypes.Compulsory,
        Order = 0
    };
    var module31 = new Module
    {
        CourseId = course3.Id,
        Title = "Relational Design",
        Description = "ER modeling and normalization.",
        Type = ModuleTypes.Compulsory,
        Order = 0
    };
    var module32 = new Module
    {
        CourseId = course3.Id,
        Title = "Advanced SQL",
        Description = "Complex querying and optimization.",
        Type = ModuleTypes.Optional,
        Order = 0
    };

    db.Modules.AddRange(module11, module12, module21, module22, module31, module32);
    await db.SaveChangesAsync();

    var assignments = new[]
    {
        new Assignment
        {
            Title = "Hello World App",
            Description = "Write a simple console application.",
            Deadline = now.AddDays(7),
            ModuleId = module11.Id
        },
        new Assignment
        {
            Title = "Control Flow Challenge",
            Description = "Solve branching and loop exercises.",
            Deadline = now.AddDays(10),
            ModuleId = module11.Id
        },
        new Assignment
        {
            Title = "OOP Exercise",
            Description = "Implement a class hierarchy for a bank system.",
            Deadline = now.AddDays(14),
            ModuleId = module12.Id
        },
        new Assignment
        {
            Title = "Angular SPA",
            Description = "Build a single-page app using Angular.",
            Deadline = now.AddDays(9),
            ModuleId = module21.Id
        },
        new Assignment
        {
            Title = "REST API Design",
            Description = "Design and document a RESTful API.",
            Deadline = now.AddDays(5),
            ModuleId = module22.Id
        },
        new Assignment
        {
            Title = "ER Diagram",
            Description = "Draw an ER diagram for a library system.",
            Deadline = now.AddDays(4),
            ModuleId = module31.Id
        },
        new Assignment
        {
            Title = "SQL Query Challenge",
            Description = "Write complex SQL queries for a given schema.",
            Deadline = now.AddDays(8),
            ModuleId = module32.Id
        }
    };

    db.Assignments.AddRange(assignments);
    await db.SaveChangesAsync();

    var assessments = new[]
    {
        new Assessment
        {
            ModuleId = module11.Id,
            Title = "Programming Midterm",
            Description = "Written test on programming fundamentals.",
            ScheduledAt = now.AddDays(12),
            Duration = 90,
            Location = "Room A-101"
        },
        new Assessment
        {
            ModuleId = module22.Id,
            Title = "Backend Practical",
            Description = "In-person backend design assessment.",
            ScheduledAt = now.AddDays(15),
            Duration = 120,
            Location = "Lab B-205"
        }
    };

    db.Assessments.AddRange(assessments);
    await db.SaveChangesAsync();

    var session1 = new AttendanceSession
    {
        ModuleId = module11.Id,
        Date = now.Date.AddDays(-6),
        CreatedByInstructorId = instructor.Id
    };
    var session2 = new AttendanceSession
    {
        ModuleId = module11.Id,
        Date = now.Date.AddDays(-4),
        CreatedByInstructorId = instructor.Id
    };
    var session3 = new AttendanceSession
    {
        ModuleId = module11.Id,
        Date = now.Date.AddDays(-2),
        CreatedByInstructorId = instructor.Id
    };

    session1.Records.Add(new AttendanceRecord { StudentId = student.Id, IsPresent = true });
    session2.Records.Add(new AttendanceRecord { StudentId = student.Id, IsPresent = true });
    session3.Records.Add(new AttendanceRecord { StudentId = student.Id, IsPresent = false });

    db.AttendanceSessions.AddRange(session1, session2, session3);
    await db.SaveChangesAsync();

    var submission1 = new Submission
    {
        AssignmentId = assignments[0].Id,
        StudentId = student.Id,
        FileUrl = "https://example.com/submissions/hello-world.zip",
        SubmittedAt = now.AddDays(-2)
    };
    var submission2 = new Submission
    {
        AssignmentId = assignments[3].Id,
        StudentId = student.Id,
        FileUrl = "https://example.com/submissions/angular-spa.zip",
        SubmittedAt = now.AddDays(-1)
    };

    db.Submissions.AddRange(submission1, submission2);
    await db.SaveChangesAsync();

    var assignmentGrade1 = new AssignmentGrade
    {
        SubmissionId = submission1.Id,
        InstructorId = instructor.Id,
        Score = 88.5,
        Feedback = "Good structure and clean naming.",
        GradedAt = now.AddDays(-1)
    };
    var assignmentGrade2 = new AssignmentGrade
    {
        SubmissionId = submission2.Id,
        InstructorId = instructor.Id,
        Score = 74.0,
        Feedback = "Solid work; improve error handling.",
        GradedAt = now.AddHours(-10)
    };

    db.AssignmentGrades.AddRange(assignmentGrade1, assignmentGrade2);
    await db.SaveChangesAsync();

    db.AssessmentGrades.Add(new AssessmentGrade
    {
        AssessmentId = assessments[0].Id,
        StudentId = student.Id,
        InstructorId = instructor.Id,
        Score = 82.0,
        GradedAt = now.AddHours(-6)
    });
    await db.SaveChangesAsync();

    db.ModuleProgresses.Add(new ModuleProgress
    {
        StudentId = student.Id,
        ModuleId = module11.Id,
        Status = ModuleProgressStatuses.InProgress
    });

    db.TimetableSlots.AddRange(
        new TimetableSlot
        {
            ModuleId = module11.Id,
            InstructorId = instructor.Id,
            DayOfWeek = "Mon",
            StartTime = new TimeSpan(9, 0, 0),
            EndTime = new TimeSpan(10, 30, 0),
            Location = "Room A-101",
            EffectiveFrom = course1.StartDate!.Value,
            EffectiveTo = course1.EndDate!.Value
        },
        new TimetableSlot
        {
            ModuleId = module22.Id,
            InstructorId = instructor.Id,
            DayOfWeek = "Wed",
            StartTime = new TimeSpan(13, 0, 0),
            EndTime = new TimeSpan(14, 30, 0),
            Location = "Lab B-205",
            EffectiveFrom = course2.StartDate!.Value,
            EffectiveTo = course2.EndDate!.Value
        });

    db.Notifications.AddRange(
        new Notification
        {
            UserId = student.Id,
            AssignmentId = assignments[4].Id,
            ModuleId = assignments[4].ModuleId,
            Type = NotificationTypes.AssignmentDeadline,
            Message = "Reminder: 'REST API Design' is due in 5 days.",
            IsRead = false,
            CreatedAt = now.AddHours(-2)
        },
        new Notification
        {
            UserId = student.Id,
            AssignmentId = assignments[0].Id,
            ModuleId = assignments[0].ModuleId,
            Type = NotificationTypes.AssignmentGraded,
            Message = "Your submission for 'Hello World App' has been graded.",
            IsRead = true,
            CreatedAt = now.AddDays(-1),
            ReadAt = now.AddHours(-12)
        });

    await db.SaveChangesAsync();
}
