# College LMS

**Enhanced Moodle-style Learning Management System**

**Stack:** ASP.NET Core 10 (C#) · Angular 21 + Angular Material · PostgreSQL 18 · Docker Compose

**Innovation Features:**
- ★ Student Progress Dashboard — visual analytics with ng2-charts (grade trends, submission rates, course progress, upcoming deadlines)
- ★ Automated Deadline Reminder System — email via MailKit/SendGrid + in-app notification bell with read/unread state

---

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

### 1. Clone the repository
```bash
git clone https://github.com/NewGate110/Learning_management_system.git
cd college-lms
```

### 2. Configure environment variables

A `.env` file is required in the project root. Create one with the following contents:

```env
POSTGRES_DB=collegelms
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123

JWT_SECRET=changeme_at_least_32_chars_secret_key
JWT_ISSUER=CollegeLMS
JWT_AUDIENCE=CollegeLMSUsers
JWT_EXPIRY_HOURS=8

MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=your_sendgrid_api_key
MAIL_FROM=noreply@yourdomain.com
```

> Change `POSTGRES_PASSWORD` and `JWT_SECRET` before deploying to any shared environment.

Key variables in `.env`:

| Variable | Description |
|----------|-------------|
| `POSTGRES_DB` | Database name (default: `collegelms`) |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password — **change this** |
| `JWT_SECRET` | Must be at least 32 characters |
| `JWT_ISSUER` | Token issuer identifier |
| `JWT_AUDIENCE` | Token audience identifier |
| `JWT_EXPIRY_HOURS` | Token lifetime in hours |
| `MAIL_HOST` | SMTP host (e.g. `smtp.sendgrid.net`) |
| `MAIL_PORT` | SMTP port (e.g. `587`) |
| `MAIL_USER` | SMTP username (SendGrid: `apikey`) |
| `MAIL_PASSWORD` | SMTP password / SendGrid API key |
| `MAIL_FROM` | Sender address for reminder emails |

### 3. Start the full stack
```bash
docker compose up --build
```

| Service  | URL                           |
|----------|-------------------------------|
| Frontend | http://localhost              |
| API      | http://localhost:8080         |
| Swagger  | http://localhost:8080/swagger |

> EF Core migrations run automatically on backend startup via `MigrateAsync()` — no manual migration step needed.

#### Resetting the database

To wipe all data and re-run migrations from scratch:

```bash
docker compose down -v   # removes containers AND the postgres_data volume
docker compose up --build
```

---

## Docker Configuration Notes

The following fixes were applied to make the stack work correctly:

### 1. Connection string format (`docker-compose.yml`)
The original connection string used a YAML folded scalar (`>`) split across two lines, which injected a stray space into the string. This was replaced with a single quoted line:
```yaml
ConnectionStrings__DefaultConnection: "Host=db;Port=5432;Database=${POSTGRES_DB};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}"
```

### 2. Swagger available in Docker (`docker-compose.yml`)
Without explicitly setting `ASPNETCORE_ENVIRONMENT`, ASP.NET Core defaults to `Production` inside Docker, which caused Swagger to be skipped. Added to the backend environment:
```yaml
ASPNETCORE_ENVIRONMENT: Development
```
Swagger UI is now accessible at `http://localhost:8080/swagger` when running via Docker Compose.

### 3. `.env` file
The `.env` file is not committed to the repository (it is git-ignored). You must create it manually in the project root before running `docker compose up`. See the template above.

---

## Test Data

The database is automatically seeded with test data on first startup. All accounts use the password `Password123!`.

### Users

| Name | Email | Role |
|------|-------|------|
| Admin User | `admin@lms.com` | Admin |
| Jane Instructor | `instructor@lms.com` | Instructor |
| John Student | `student@lms.com` | Student |

### Courses (taught by Jane Instructor)

| Title | Description |
|-------|-------------|
| Introduction to Programming | Learn the basics of programming using C# |
| Web Development | Build modern web apps with Angular and ASP.NET Core |
| Database Systems | Fundamentals of relational databases and SQL |

### Assignments (2 per course)

| Title | Course | Deadline |
|-------|--------|----------|
| Hello World App | Introduction to Programming | +7 days |
| OOP Exercise | Introduction to Programming | +14 days |
| Angular SPA | Web Development | +10 days |
| REST API Design | Web Development | +3 days |
| ER Diagram | Database Systems | Past |
| SQL Query Challenge | Database Systems | +5 days |

### Other seeded data
- **CourseEnrollments** — John Student enrolled in all 3 courses
- **Grades** — 3 graded submissions for John Student (88.5, 74.0, 91.0)
- **Notifications** — 2 unread deadline reminders + 1 read grading notification for John Student

> To reset and re-seed, run `docker compose down -v && docker compose up --build`

---

## Local Development (without Docker)

### Backend
```bash
cd backend
dotnet restore
# Set environment variables in your shell or appsettings.Development.json
dotnet run --project CollegeLMS.API
```

API runs on `http://localhost:8080`. Swagger UI is available at `http://localhost:8080/swagger` in Development mode.

### Frontend
```bash
cd frontend
npm install
ng serve        # Runs on http://localhost:4200 — proxies /api to localhost:8080
```

The Angular dev server proxies `/api/*` to the backend via `proxy.conf.json`.

---

## Project Structure

```
college-lms/
├── docker/
│   ├── backend.Dockerfile       # ASP.NET Core build + runtime image (.NET 10)
│   ├── frontend.Dockerfile      # Angular build + Nginx serve image
│   ├── nginx.conf               # Nginx config — serves SPA, proxies /api/ to backend
│   └── .env.example             # Environment variable template
├── docker-compose.yml           # Orchestrates db, backend, frontend with health checks
├── .env                         # Local secrets — never commit this file
│
├── backend/
│   └── CollegeLMS.API/
│       ├── Controllers/
│       │   ├── AuthController.cs        # Register, Login — returns JWT
│       │   ├── CourseController.cs      # CRUD for courses
│       │   ├── AssignmentController.cs  # Assignment management + submissions
│       │   ├── UserController.cs        # User management (admin)
│       │   ├── NotificationController.cs # ★ Fetch & mark notifications read
│       │   └── ProgressController.cs    # ★ Per-student progress data for charts
│       ├── Models/
│       │   ├── User.cs
│       │   ├── Course.cs
│       │   ├── Assignment.cs
│       │   ├── Grade.cs
│       │   └── Notification.cs          # ★ read/unread in-app alerts
│       ├── Data/
│       │   └── AppDbContext.cs          # EF Core DbContext
│       ├── Services/
│       │   ├── ProgressService.cs       # ★ Aggregate queries for chart data
│       │   ├── NotificationService.cs   # ★ Create/retrieve notifications
│       │   └── EmailService.cs          # ★ MailKit email sending
│       ├── BackgroundServices/
│       │   └── DeadlineReminderService.cs  # ★ IHostedService — polls for upcoming deadlines
│       ├── Middleware/
│       │   └── ErrorHandlingMiddleware.cs
│       ├── Program.cs                   # App bootstrap, DI, JWT, CORS, Swagger
│       └── appsettings.json
│
├── frontend/
│   └── src/app/
│       ├── pages/
│       │   ├── login/                   # Login page — Reactive Form
│       │   ├── dashboard/               # Main dashboard — notification alert widget
│       │   ├── courses/                 # Course listing
│       │   ├── course-detail/           # Single course view
│       │   ├── assignments/             # Assignment submission
│       │   ├── quiz/                    # Quiz page
│       │   ├── progress-dashboard/      # ★ Analytics page with all charts
│       │   └── admin-panel/             # Admin-only management panel
│       ├── components/
│       │   ├── navbar/                  # Top nav — ★ notification bell with unread badge
│       │   ├── sidebar/                 # Navigation sidebar
│       │   ├── notification-dropdown/   # ★ Dropdown showing recent reminders
│       │   └── progress-charts/
│       │       ├── course-progress-bar/         # ★ Progress bar per course
│       │       ├── grade-line-chart/             # ★ Grade trend line chart
│       │       ├── submission-rate-chart/        # ★ Assignment submission rate
│       │       └── upcoming-deadlines-widget/    # ★ Deadlines widget
│       ├── services/
│       │   ├── api.service.ts           # Base HTTP service — all backend calls
│       │   ├── auth.service.ts          # JWT login, token storage, role helpers
│       │   ├── notification.service.ts  # ★ Poll/fetch notifications, mark as read
│       │   └── progress.service.ts      # ★ Fetch progress data for charts
│       ├── guards/
│       │   └── auth.guard.ts            # Route guard — redirects unauthenticated users
│       └── models/
│           ├── user.model.ts
│           ├── course.model.ts
│           └── notification.model.ts
│
├── docs/                        # UML diagrams + system docs (Person 2)
└── tests/                       # Test plan + test cases (Person 4)
```

---

## Team Responsibilities

| Person | Role | Responsibilities | Key Files |
|--------|------|-----------------|-----------|
| **Person 1** | Project Manager & DevOps | Repo setup, Docker, project skeleton, README, coding standards, final sign-off, demo lead | `docker-compose.yml`, `docker/`, skeleton files |
| **Person 2** | System Designer & UML Lead | System overview, requirements, SDLC methodology, risk assessment, UML diagrams (Use Case, Class, Sequence, Activity) | `docs/` |
| **Person 3** | Database & Backend Developer | ER diagram, PostgreSQL schema, EF Core migrations, JWT auth, all controllers & models, CORS, ★ progress API endpoints, ★ deadline reminder background service + email | `backend/CollegeLMS.API/` |
| **Person 4** | Frontend Developer & QA | All Angular pages & routing, Angular Material styling, reactive forms, ★ progress charts, ★ notification bell UI, test plan (min. 3 test cases), system documentation | `frontend/src/app/`, `tests/` |

---

## Innovation Features

### ★ Student Progress Dashboard
- Dedicated `/progress-dashboard` page with four chart components built with **ng2-charts + Chart.js**
- **Course progress bar** — completion percentage per enrolled course
- **Grade trend line** — grade history over time per course
- **Submission rate chart** — assignment submission rate breakdown
- **Upcoming deadlines widget** — assignments due within the next 7 days
- Backend: `ProgressController` + `ProgressService` return aggregate PostgreSQL query results ready for charts

### ★ Automated Deadline Reminder System
- **Email reminders:** `DeadlineReminderService` (IHostedService) runs on a schedule, queries for upcoming assignment deadlines, and sends emails via **MailKit + SendGrid**
- **In-app notifications:** `Notification` entity stored in PostgreSQL with `IsRead` flag; `NotificationController` exposes endpoints to fetch and mark as read
- **UI:** Notification bell icon in the navbar with an unread count badge; dropdown panel listing recent reminders; alert widget on the main dashboard

---

## Branching Strategy

- `main` — stable, deployable code only; no direct commits
- `dev` — integration branch; all features merge here first via Pull Request
- `feature/<name>` — one branch per feature or task (e.g. `feature/auth`, `feature/progress-dashboard`)
- Person 1 reviews and approves all Pull Requests into `dev`

---

## Coding Standards

- **C#:** Follow Microsoft naming conventions (`PascalCase` for types/methods, `camelCase` for locals); use `async`/`await` throughout; no `var` for non-obvious types
- **TypeScript:** Strict mode enabled; no `any` types; use interfaces from `models/` for all API responses
- **Angular:** Standalone components throughout; lazy-loaded routes per section; Reactive Forms (no template-driven)
- **Commits:** Use Conventional Commits prefixes — `feat:`, `fix:`, `chore:`, `docs:`, `test:`
- **Env secrets:** Never commit `.env` — use `docker/.env.example` as the template; `.env` is in `.gitignore`
