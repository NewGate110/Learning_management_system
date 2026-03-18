# Handoff Note — Person 2 (System Designer & UML Lead)

From Person 1 | Updated: 2026-03-18

---

## What Person 1 has set up

The full project skeleton is in place and the stack is running via Docker. Here is what exists so far that your diagrams **must reflect**.

---

## Tech Stack (for your System Overview)

| Layer | Technology |
|-------|-----------|
| Backend | ASP.NET Core 10 (C#), .NET 10 |
| ORM | Entity Framework Core 10 + Npgsql |
| Auth | JWT Bearer tokens |
| Frontend | Angular 18, standalone components |
| UI Library | Angular Material 18 |
| Charts | ng2-charts + Chart.js |
| Database | PostgreSQL 16 |
| Email | MailKit + SendGrid (SMTP) |
| Containers | Docker Compose — Nginx serves frontend |

---

## Entities (for Class & ER Diagrams)

These are the C# models in `backend/CollegeLMS.API/Models/`:

### `User`
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| Name | string | |
| Email | string | |
| Role | string | `"Student"`, `"Instructor"`, or `"Admin"` |
| Password | string | Will be hashed by Person 3 |
| Grades | ICollection\<Grade\> | navigation |
| Notifications | ICollection\<Notification\> | ★ innovation |

### `Course`
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| Title | string | |
| Description | string | |
| InstructorId | int | FK → User |
| Assignments | ICollection\<Assignment\> | navigation |

### `Assignment`
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| Title | string | |
| Description | string | |
| Deadline | DateTime | used by ★ reminder service |
| CourseId | int | FK → Course |
| Course | Course? | navigation |

### `Grade`
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| (Person 3 will expand) | | |

### `Notification` ★ Innovation
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| UserId | int | FK → User |
| Message | string | reminder text |
| IsRead | bool | default false |
| CreatedAt | DateTime | UTC |

---

## API Endpoints (for Sequence & Use Case Diagrams)

These controller shells exist in `backend/CollegeLMS.API/Controllers/`:

| Controller | Routes scaffolded | Implemented? |
|------------|------------------|--------------|
| AuthController | `POST /api/auth/register`, `POST /api/auth/login` | No — Person 3 |
| CourseController | CRUD under `/api/course` | No — Person 3 |
| AssignmentController | CRUD + submissions under `/api/assignment` | No — Person 3 |
| UserController | `/api/user` | No — Person 3 |
| NotificationController ★ | `/api/notification` — fetch & mark read | No — Person 3 |
| ProgressController ★ | `/api/progress` — chart data per student | No — Person 3 |

---

## Services (for Class Diagram — Angular side)

These exist in `frontend/src/app/services/`:

| Service | Purpose |
|---------|---------|
| `ApiService` | Base HTTP wrapper — all backend calls go through this |
| `AuthService` | Handles login/logout, stores JWT + userId + role in localStorage |
| `NotificationService` ★ | Polls backend for notifications, exposes unread count |
| `ProgressService` ★ | Fetches chart data from `ProgressController` |

---

## Route Guard (for Activity Diagram)

`AuthGuard` is in `frontend/src/app/guards/auth.guard.ts`. It protects all routes except `/login`. If `AuthService.isLoggedIn()` returns false, it redirects to `/login`.

Angular routes:
- `/login` — public
- `/dashboard` — protected
- `/courses`, `/courses/:id` — protected
- `/assignments` — protected
- `/quiz` — protected
- `/progress` ★ — protected (Progress Dashboard)
- `/admin` — protected

---

## Innovation Feature Architecture (must appear in your diagrams)

### ★ Progress Dashboard
- `ProgressService` (backend) has 4 stub methods: `GetGradeTrendAsync`, `GetCourseCompletionAsync`, `GetSubmissionRateAsync`, `GetUpcomingDeadlinesAsync`
- `ProgressController` calls these and returns JSON to the Angular `ProgressService`
- The `progress-dashboard` page renders 4 chart components

### ★ Deadline Reminder System
- `DeadlineReminderService` is a background service (`IHostedService`) that loops every 1 hour
- It will query assignments where `Deadline` is within 24–48 hours
- It calls `EmailService` (MailKit) to send email + `NotificationService` to write a `Notification` row
- Angular `NotificationService` polls the backend and the navbar bell shows unread count

---

## SDLC Suggestion

The project follows an **Agile/iterative** approach — skeleton first (Person 1), then parallel feature development by Persons 3 and 4, with Person 1 reviewing PRs into `dev`.
