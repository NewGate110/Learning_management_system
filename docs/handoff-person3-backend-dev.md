# Handoff Note — Person 3 (Database & Backend Developer)

From Person 1 | Updated: 2026-03-18

---

## What Person 1 has set up for you

Everything is scaffolded. You do **not** need to create projects, install packages, or configure Docker — just open the backend folder and start filling in the `TODO (Person 3)` comments.

---

## How to start

```bash
# Option A — run everything in Docker (recommended)
docker compose up --build

# Option B — run backend locally
cd backend
dotnet restore
dotnet run --project CollegeLMS.API
# API available at http://localhost:8080
# Swagger UI at http://localhost:8080/swagger
```

---

## What is already done

### Packages installed (`CollegeLMS.API.csproj`)
- `Microsoft.EntityFrameworkCore` 10.0.0
- `Microsoft.EntityFrameworkCore.Design` 10.0.0
- `Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.0
- `Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.0
- `System.IdentityModel.Tokens.Jwt` 8.0.1
- `MailKit` 4.3.0
- `Swashbuckle.AspNetCore` 6.5.0 (Swagger)

### Program.cs — fully configured
- `AppDbContext` registered with Npgsql connection string from environment
- JWT Bearer authentication configured — reads `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` from `.env`
- CORS policy `"AllowAngular"` allows `http://localhost` and `http://localhost:4200`
- `ProgressService`, `NotificationService`, `EmailService` registered as scoped
- `DeadlineReminderService` registered as a hosted background service
- EF Core `db.Database.Migrate()` runs automatically on startup
- Swagger with Bearer auth header configured

### AppDbContext (`Data/AppDbContext.cs`)
Five `DbSet`s are declared — you just need to configure relationships:
```csharp
DbSet<User>         Users
DbSet<Course>       Courses
DbSet<Assignment>   Assignments
DbSet<Grade>        Grades
DbSet<Notification> Notifications   // ★ Innovation
```
Add your fluent API config inside `OnModelCreating`.

### Models — scaffolded with basic properties

**`User`** — Id, Name, Email, Role (`"Student"/"Instructor"/"Admin"`), Password (store hashed), navigation to Grades + Notifications

**`Course`** — Id, Title, Description, InstructorId, navigation to Assignments

**`Assignment`** — Id, Title, Description, **Deadline** (DateTime — critical for reminder service), CourseId

**`Grade`** — Id + basics (expand with Score, StudentId, AssignmentId as needed)

**`Notification`** ★ — Id, UserId, Message, **IsRead** (bool), CreatedAt (UTC)

### Controllers — stub shells with route annotations
All controllers exist at `Controllers/` with correct `[ApiController]` and `[Route("api/[controller]")]` attributes and placeholder `return Ok(...)` responses:
- `AuthController` — `POST /api/auth/register`, `POST /api/auth/login`
- `CourseController`
- `AssignmentController`
- `UserController`
- `NotificationController` ★
- `ProgressController` ★

### Services — stub shells
- `ProgressService` — 4 methods stubbed: `GetGradeTrendAsync`, `GetCourseCompletionAsync`, `GetSubmissionRateAsync`, `GetUpcomingDeadlinesAsync`
- `NotificationService` — stub, inject `AppDbContext`
- `EmailService` — stub, inject `IConfiguration` to read `MAIL_*` env vars and send via MailKit

### Background Service
`DeadlineReminderService` at `BackgroundServices/DeadlineReminderService.cs`:
- Already inherits `BackgroundService` and loops every 1 hour
- Uses `IServiceScopeFactory` to create a DI scope (required for scoped services in a singleton background service)
- The loop and error handling are done — you only need to fill in `CheckAndSendRemindersAsync()`

---

## Your tasks

### 1. Models & Database
- Expand `Grade` model (add `Score`, `StudentId`, `AssignmentId` at minimum)
- Add a `CourseEnrollment` join table if students need to enrol in courses
- Configure relationships in `AppDbContext.OnModelCreating` (foreign keys, indexes, cascade deletes)
- Add a `migrations/` folder: `dotnet ef migrations add InitialCreate`
  - Migrations run automatically on startup via `db.Database.Migrate()` — no manual step needed after that

### 2. AuthController
- Accept a `RegisterDto` and `LoginDto` (create DTOs in a `DTOs/` folder)
- Hash passwords with `BCrypt` or `PBKDF2` — never store plain text
- On login, issue a JWT using `System.IdentityModel.Tokens.Jwt`
- Return `{ token, userId, role }` — the Angular `AuthService` expects exactly this shape

### 3. Other Controllers
- Implement CRUD for Course, Assignment, User
- Use `[Authorize]` attribute on protected endpoints
- Use role-based access where needed: `[Authorize(Roles = "Admin")]`

### 4. ProgressService ★ Innovation
Fill in the 4 methods with real PostgreSQL aggregate queries via EF Core:
- `GetGradeTrendAsync(userId)` — grade scores over time (for line chart)
- `GetCourseCompletionAsync(userId)` — % completion per course (for progress bars)
- `GetSubmissionRateAsync(userId)` — on-time vs late ratio (for doughnut chart)
- `GetUpcomingDeadlinesAsync(userId)` — assignments due within 7 days

### 5. NotificationService ★ Innovation
- `CreateAsync(userId, message)` — inserts a `Notification` row
- `GetUnreadAsync(userId)` — returns unread notifications
- `MarkAsReadAsync(notificationId)` — sets `IsRead = true`

### 6. DeadlineReminderService ★ Innovation
Inside `CheckAndSendRemindersAsync()`:
1. Resolve `AppDbContext`, `EmailService`, `NotificationService` from `_scopeFactory`
2. Query assignments where `Deadline` is within the next 24–48 hours
3. For each assignment, find enrolled students
4. Call `EmailService.SendReminderAsync(student, assignment)`
5. Call `NotificationService.CreateAsync(userId, message)`

### 7. EmailService ★ Innovation
Read `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` from `IConfiguration` and send via MailKit `SmtpClient`.

---

## Environment variables available to you

Defined in `.env` and passed into the container automatically:

```
POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE, JWT_EXPIRY_HOURS
MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, MAIL_FROM
```

Connection string is already wired: `builder.Configuration.GetConnectionString("DefaultConnection")`.
JWT secret: `builder.Configuration["JWT_SECRET"]`.

---

## Coding conventions

- Use `async`/`await` on all database and I/O calls
- Follow Microsoft naming conventions (`PascalCase` for types and methods)
- No `var` for non-obvious types
- Commits: `feat:`, `fix:`, `chore:` prefixes
- Branch from `dev`: `git checkout -b feature/auth`
- Open a Pull Request into `dev` when done — Person 1 reviews
