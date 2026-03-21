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

    // ── Seed test data (only if no users exist) ──────────────
    if (!db.Users.Any())
    {
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

        // Users
        var admin      = new User { Name = "Admin User",      Email = "admin@lms.com",      Role = UserRoles.Admin };
        var instructor = new User { Name = "Jane Instructor", Email = "instructor@lms.com", Role = UserRoles.Instructor };
        var student    = new User { Name = "John Student",    Email = "student@lms.com",    Role = UserRoles.Student };

        foreach (var u in new[] { admin, instructor, student })
            u.PasswordHash = hasher.HashPassword(u, "Password123!");

        db.Users.AddRange(admin, instructor, student);
        await db.SaveChangesAsync();

        // Courses (taught by Jane Instructor)
        var course1 = new Course { Title = "Introduction to Programming", Description = "Learn the basics of programming using C#.", InstructorId = instructor.Id };
        var course2 = new Course { Title = "Web Development",             Description = "Build modern web apps with Angular and ASP.NET Core.", InstructorId = instructor.Id };
        var course3 = new Course { Title = "Database Systems",            Description = "Fundamentals of relational databases and SQL.", InstructorId = instructor.Id };

        db.Courses.AddRange(course1, course2, course3);
        await db.SaveChangesAsync();

        // Enrol student in all three courses
        student.EnrolledCourses.Add(course1);
        student.EnrolledCourses.Add(course2);
        student.EnrolledCourses.Add(course3);
        await db.SaveChangesAsync();

        // Assignments
        var now = DateTime.UtcNow;
        var a1 = new Assignment { Title = "Hello World App",       Description = "Write a simple console application.",          Deadline = now.AddDays(7),  CourseId = course1.Id };
        var a2 = new Assignment { Title = "OOP Exercise",          Description = "Implement a class hierarchy for a bank system.", Deadline = now.AddDays(14), CourseId = course1.Id };
        var a3 = new Assignment { Title = "Angular SPA",           Description = "Build a single-page app using Angular.",        Deadline = now.AddDays(10), CourseId = course2.Id };
        var a4 = new Assignment { Title = "REST API Design",       Description = "Design and document a RESTful API.",            Deadline = now.AddDays(3),  CourseId = course2.Id };
        var a5 = new Assignment { Title = "ER Diagram",            Description = "Draw an ER diagram for a library system.",      Deadline = now.AddDays(-2), CourseId = course3.Id };
        var a6 = new Assignment { Title = "SQL Query Challenge",   Description = "Write complex SQL queries for a given schema.",  Deadline = now.AddDays(5),  CourseId = course3.Id };

        db.Assignments.AddRange(a1, a2, a3, a4, a5, a6);
        await db.SaveChangesAsync();

        // Grades (student's submitted work)
        db.Grades.AddRange(
            new Grade { UserId = student.Id, AssignmentId = a1.Id, Score = 88.5, SubmittedAt = now.AddDays(-3) },
            new Grade { UserId = student.Id, AssignmentId = a3.Id, Score = 74.0, SubmittedAt = now.AddDays(-1) },
            new Grade { UserId = student.Id, AssignmentId = a5.Id, Score = 91.0, SubmittedAt = now.AddDays(-5) }
        );
        await db.SaveChangesAsync();

        // Notifications (deadline reminders for student)
        db.Notifications.AddRange(
            new Notification { UserId = student.Id, AssignmentId = a4.Id, Message = "Reminder: 'REST API Design' is due in 3 days.",     IsRead = false, CreatedAt = now.AddHours(-2) },
            new Notification { UserId = student.Id, AssignmentId = a6.Id, Message = "Reminder: 'SQL Query Challenge' is due in 5 days.", IsRead = false, CreatedAt = now.AddHours(-1) },
            new Notification { UserId = student.Id, AssignmentId = a1.Id, Message = "Your submission for 'Hello World App' was graded.",  IsRead = true,  CreatedAt = now.AddDays(-3), ReadAt = now.AddDays(-2) }
        );
        await db.SaveChangesAsync();
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
