# Handoff Note — Person 3 (Database & Backend Developer)

From Person 1 | Updated: 2026-03-22

---

## What Person 1 has set up for you

Everything is scaffolded. You do **not** need to create projects, install packages, or configure Docker — just open the backend folder and start implementing.

---

## How to start

```bash
# Option A — run everything in Docker (recommended)
docker compose up --build

# Option B — run backend locally
cd backend
dotnet restore
dotnet run --project CollegeLMS.API
# API at http://localhost:8080
# Swagger at http://localhost:8080/swagger
```

---

## What is already done

### Packages installed
- `Microsoft.EntityFrameworkCore` 10.0.0
- `Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.0
- `Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.0
- `Microsoft.AspNetCore.Identity` (PasswordHasher)
- `MailKit` 4.3.0
- `Swashbuckle.AspNetCore` (Swagger with Bearer auth)

### Program.cs
- `AppDbContext` registered with Npgsql
- JWT Bearer authentication configured from `.env`
- CORS policy allows Angular frontend
- All services registered
- `MigrateAsync()` runs on startup — no manual migration needed
- Database is seeded with test data on first run (see Test Data section)

### Existing Models (already implemented)
- `User` — Id, Name, Email, Role, PasswordHash
- `Course` — Id, Title, Description, InstructorId
- `Assignment` — Id, Title, Description, Deadline, ModuleId
- `Grade` — Id, UserId, AssignmentId, Score, SubmittedAt
- `Notification` — Id, UserId, AssignmentId, Message, IsRead, CreatedAt, ReadAt

### Existing Controllers (already implemented)
- `AuthController` — register and login with JWT
- `CourseController` — CRUD
- `AssignmentController` — CRUD
- `UserController` — user management
- `NotificationController` — fetch and mark as read
- `ProgressController` — chart data endpoints

### Existing Services (already implemented)
- `JwtTokenService` — generates signed JWT tokens
- `ProgressService` — aggregate queries for charts
- `NotificationService` — create and fetch notifications
- `EmailService` — sends email via MailKit
- `DeadlineReminderService` — background service, runs every 60 minutes

---

## Your tasks — New Features

### 1. Modules

Add a `Module` model between `Course` and `Assignment`:

| Field | Type | Notes |
|-------|------|-------|
| Id | int | PK |
| CourseId | int | FK → Course |
| Title | string | |
| Description | string | |
| Type | string | `Sequential`, `Compulsory`, `Optional` |
| Order | int | for sequential ordering |

- Update `Assignment` to use `ModuleId` instead of `CourseId`
- Create `ModuleController` with full CRUD (Admin only)
- Module type and order must be editable by Admin

---

### 2. Attendance

New models:

**`AttendanceSession`**
| Field | Type | Notes |
|-------|------|-------|
| Id | int | PK |
| ModuleId | int | FK → Module |
| Date | DateTime | |
| CreatedByInstructorId | int | FK → User |

**`AttendanceRecord`**
| Field | Type | Notes |
|-------|------|-------|
| Id | int | PK |
| AttendanceSessionId | int | FK → AttendanceSession |
| StudentId | int | FK → User |
| IsPresent | bool | |

- Create `AttendanceController` — Instructors mark attendance per session; Admin can create sessions and edit any record
- Add attendance % calculation: `(sessions present / total sessions) * 100`
- Block assignment submission if student attendance is below 80% in that module
- Role access: `[Authorize(Roles = "Instructor,Admin")]` on create/edit endpoints

---

### 3. Submissions & Grading

**`Submission`**
| Field | Type | Notes |
|-------|------|-------|
| Id | int | PK |
| AssignmentId | int | FK → Assignment |
| StudentId | int | FK → User |
| FileUrl | string | |
| SubmittedAt | DateTime | |

**`Assessment`** (scheduled event only — not taken on platform)
| Field | Type | Notes |
|-------|------|-------|
| Id | int | PK |
| ModuleId | int | FK → Module |
| Title | string | |
| Description | string | |
| ScheduledAt | DateTime | |
| Duration | int | minutes |

**`AssignmentGrade`** (replaces Grade)
| Field | Type | Notes |
|-------|------|-------|
| Id | int | PK |
| SubmissionId | int | FK → Submission |
| InstructorId | int | FK → User |
| Score | double | |
| GradedAt | DateTime | |
| Feedback | string | |

**`AssessmentGrade`**
| Field | Type | Notes |
|-------|------|-------|
| Id | int | PK |
| AssessmentId | int | FK → Assessment |
| StudentId | int | FK → User |
| InstructorId | int | FK → User |
| Score | double | |
| GradedAt | DateTime | |

- Grades for assignments and assessments shown separately
- Final Module Grade only released after ALL assignments and assessments in a module are graded
- Create `GradeController` — Instructors submit grades
- Create `AssessmentController` — CRUD for assessments (Instructor/Admin)

---

### 4. Module Progress & Course Completion

**`ModuleProgress`**
| Field | Type | Notes |
|-------|------|-------|
| Id | int | PK |
| StudentId | int | FK → User |
| ModuleId | int | FK → Module |
| Status | string | `InProgress`, `Passed`, `Failed` |
| FinalGrade | double? | nullable — set when all items graded |

Course completion logic:
- All Sequential modules passed in correct order ✓
- All Compulsory modules passed ✓
- Optional modules ignored ✓

---

### 5. Timetable

**`TimetableSlot`** (set by Admin)
| Field | Type | Notes |
|-------|------|-------|
| Id | int | PK |
| ModuleId | int | FK → Module |
| InstructorId | int | FK → User |
| DayOfWeek | string | Mon/Tue/Wed/Thu/Fri |
| StartTime | TimeSpan | |
| EndTime | TimeSpan | |
| Location | string | |
| EffectiveFrom | DateTime | semester start |
| EffectiveTo | DateTime | semester end |

**`TimetableException`** (cancellation or reschedule by Instructor)
| Field | Type | Notes |
|-------|------|-------|
| Id | int | PK |
| TimetableSlotId | int | FK → TimetableSlot |
| Date | DateTime | specific session date |
| Status | string | `Cancelled` or `Rescheduled` |
| RescheduleDate | DateTime? | nullable |
| RescheduleStartTime | TimeSpan? | nullable |
| RescheduleEndTime | TimeSpan? | nullable |
| Reason | string | required |

- Create `TimetableController`
- Admin: full CRUD on TimetableSlots
- Instructor: can only create TimetableExceptions (cancel/reschedule their own sessions)
- On cancellation or reschedule — trigger notifications (email + portal) to all enrolled students, the instructor, and admin

---

### 6. Calendar Endpoint

Create `CalendarController` with `GET /api/calendar`:
- Returns all events relevant to the requesting user
- Events include: assignment deadlines, assessment dates, timetable sessions, cancellations/reschedules, course start/end dates
- Students see only their enrolled modules
- Instructors see only their taught modules
- Admin sees everything

---

### 7. Notifications — New Triggers

Extend `NotificationService` to handle new notification types:

| Trigger | Recipients | Channel |
|---------|------------|---------|
| Class cancelled | Enrolled students, Instructor, Admin | Email + Portal |
| Class rescheduled | Enrolled students, Instructor, Admin | Email + Portal |
| Assignment deadline approaching | Enrolled students | Portal |
| Assessment date approaching | Enrolled students | Portal |
| Assignment graded | Student | Portal |
| Final grade released | Student | Portal + Email |

---

### 8. Role-Based Dashboards

Create `DashboardController` with separate endpoints per role:
- `GET /api/dashboard/student` — enrolled courses, module progress, attendance %, upcoming items
- `GET /api/dashboard/instructor` — courses taught, pending submissions, upcoming sessions
- `GET /api/dashboard/admin` — system overview, all courses, all users

---

## Test Accounts (already seeded)

| Name | Email | Password | Role |
|------|-------|----------|------|
| Admin User | admin@lms.com | Password123! | Admin |
| Jane Instructor | instructor@lms.com | Password123! | Instructor |
| John Student | student@lms.com | Password123! | Student |

---

## Environment Variables

```
POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE, JWT_EXPIRY_HOURS
MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD, MAIL_FROM
```

---

## Migrations

After adding new models:
```bash
dotnet ef migrations add <MigrationName> --project CollegeLMS.API
```
Migrations run automatically on startup — no manual step needed.

---

## Coding Conventions

- `async`/`await` on all database and I/O calls
- `PascalCase` for types and methods
- No `var` for non-obvious types
- `[Authorize]` on all protected endpoints
- Role-based access: `[Authorize(Roles = "Admin")]`
- Commits: `feat:`, `fix:`, `chore:` prefixes
- Branch from `dev`: `git checkout -b feature/<name>`
- Open a Pull Request into `dev` when done — Person 1 reviews

For full feature details see `docs/feature-plan.md`.
