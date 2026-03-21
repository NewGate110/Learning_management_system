# Handoff Note — Person 4 (Frontend Developer & QA)

From Person 1 | Updated: 2026-03-22

---

## What Person 1 has set up for you

The full Angular project is scaffolded. Every page, component, service, guard, and model file already exists — you just need to implement the templates and logic inside each one.

---

## How to start

```bash
# Option A — run everything in Docker (recommended for integration)
docker compose up --build
# Frontend at http://localhost

# Option B — Angular dev server (faster for UI work)
cd frontend
npm install
ng serve
# Frontend at http://localhost:4200
# API calls to /api/* are proxied to http://localhost:8080 via proxy.conf.json
```

---

## What is already done

### Packages installed (`package.json`)
- `@angular/core`, `@angular/material`, `@angular/cdk` — v21
- `@angular/router`, `@angular/forms` — v21
- `ng2-charts` ^10.0.0 + `chart.js` ^4.4.0
- `rxjs` ~7.8.0
- TypeScript 5.9, strict mode enabled

### App Config & Bootstrap
- Standalone component architecture throughout — no `NgModule`
- `provideRouter`, `provideHttpClient`, Angular Material configured

### Routing — fully set up
All routes use lazy-loaded standalone components:

| Route | Component | Guard |
|-------|-----------|-------|
| `/login` | `LoginComponent` | none (public) |
| `/dashboard` | `DashboardComponent` | AuthGuard |
| `/courses` | `CoursesComponent` | AuthGuard |
| `/courses/:id` | `CourseDetailComponent` | AuthGuard |
| `/assignments` | `AssignmentsComponent` | AuthGuard |
| `/quiz` | `QuizComponent` | AuthGuard |
| `/progress` ★ | `ProgressDashboardComponent` | AuthGuard |
| `/admin` | `AdminPanelComponent` | AuthGuard |
| `**` | redirect → `/login` | |

### AuthGuard
Already implemented — checks `AuthService.isLoggedIn()` and redirects to `/login` if false.

### AuthService — fully implemented
- `login(email, password)` — POSTs to `/api/auth/login`, stores `token`, `userId`, `role` in localStorage
- `logout()` — clears localStorage, navigates to `/login`
- `isLoggedIn()` — returns bool
- `userId` getter — returns number
- `role` getter — returns `Student`, `Instructor`, or `Admin`

### ApiService
Base HTTP service — use this for **all** backend calls. Automatically attaches `Authorization: Bearer <token>` to every request.

### NotificationService ★
Handles fetching notifications and unread count. Calls `/api/notification`.

### ProgressService ★
Calls the `/api/progress/*` endpoints and returns observables for chart components.

---

## Test Accounts (already seeded)

| Name | Email | Password | Role |
|------|-------|----------|------|
| Admin User | admin@lms.com | Password123! | Admin |
| Jane Instructor | instructor@lms.com | Password123! | Instructor |
| John Student | student@lms.com | Password123! | Student |

---

## Your tasks — New Features

### 1. Role-Based Dashboards

Each role must see a different dashboard on login. Use `AuthService.role` to determine which dashboard to render.

**Student Dashboard** (`/dashboard`):
- Enrolled courses and module progress (InProgress / Passed / Failed)
- Attendance % per module
- Upcoming assignments and assessments
- Timetable for the current week
- Mini calendar widget
- Unread notifications

**Instructor Dashboard** (`/dashboard`):
- Courses being taught
- List of submissions pending grading
- Attendance marking shortcut
- Upcoming timetable sessions
- Calendar

**Admin Dashboard** (`/dashboard`):
- System overview (total users, courses, modules)
- Quick links to manage courses, modules, users
- Full timetable roster
- System-wide calendar

---

### 2. Modules

New routes and pages needed:

| Route | Purpose |
|-------|---------|
| `/courses/:id/modules` | List of modules in a course |
| `/modules/:id` | Module detail — assignments, assessments, timetable |

Module list must show:
- Module title, type (Sequential / Compulsory / Optional), student's status
- Lock icon on Sequential modules not yet unlocked
- Progress indicator per module

---

### 3. Attendance

- Instructor view: mark present/absent per student per session
- Admin view: same as instructor plus ability to edit any existing attendance record across all modules
- Student view: show attendance % per module, warning if below 80%
- If student attendance is below 80% for a module — show locked state on assignment submission

---

### 4. Assignments & Submissions

- Student uploads a file to submit an assignment (check attendance % first)
- Show lock if attendance below 80%
- Show submission status: Not Submitted / Submitted / Graded
- Show individual grade and feedback once graded

---

### 5. Assessments

- Show as scheduled events (date, time, location, duration)
- Appear in upcoming list and calendar
- Show grade once released by instructor

---

### 6. Grading Views

- Instructor: list of submitted assignments with grade input and feedback field
- Student: view all grades per assignment and assessment separately
- Final module grade shown only after all items are graded
- Final grade displayed prominently on module completion

---

### 7. Timetable

- Student and Instructor: weekly timetable view (Mon–Fri grid)
- Show module name, time, location per slot
- Cancelled sessions shown as struck-through with reason
- Rescheduled sessions show new date and time
- Admin: full roster management UI — add/edit/delete timetable slots

---

### 8. Calendar

New page at `/calendar`:
- Monthly calendar view showing all events
- Each user sees only their relevant events:
  - Assignment deadlines
  - Assessment dates
  - Timetable sessions
  - Cancellations / reschedules
  - Course start/end dates
- Click on event to see details

---

### 9. Notifications — Extended

Extend the notification dropdown and portal to handle new triggers:

| Trigger | What to show |
|---------|-------------|
| Class cancelled | "Your [Module] class on [Date] has been cancelled" |
| Class rescheduled | "Your [Module] class has been moved to [New Date/Time]" |
| Assignment graded | "[Assignment] has been graded — [Score]" |
| Final grade released | "Your final grade for [Module] is now available" |
| Deadline approaching | "[Assignment] is due in [X] days" |

---

### 10. Admin Panel — Extended

Admin panel must support:
- Add / edit / delete Courses
- Add / edit / delete Modules (set type: Sequential / Compulsory / Optional, set order)
- Add / edit / delete Users
- Manage timetable roster (add/edit/delete TimetableSlots)
- View all enrollments

---

### 11. Progress Dashboard ★ (existing — extend)

Extend the existing progress dashboard to show:
- Per-module completion status
- Attendance % per module
- Grade breakdown per assignment and assessment
- Final module grade (when available)

---

## New Models needed (TypeScript interfaces)

Add these to `src/app/models/`:

```typescript
module.model.ts         — id, courseId, title, type, order, status
assessment.model.ts     — id, moduleId, title, scheduledAt, duration
submission.model.ts     — id, assignmentId, studentId, fileUrl, submittedAt
assignment-grade.model.ts — id, submissionId, score, feedback, gradedAt
assessment-grade.model.ts — id, assessmentId, studentId, score, gradedAt
module-progress.model.ts  — studentId, moduleId, status, finalGrade
attendance.model.ts     — sessionId, studentId, isPresent
timetable-slot.model.ts — id, moduleId, dayOfWeek, startTime, endTime, location
calendar-event.model.ts — id, title, date, type, details
```

---

## Key Patterns to Follow

### Making API calls
```typescript
// Always use ApiService
this.api.get<Module[]>(`/module?courseId=${id}`).subscribe(modules => this.modules = modules);
```

### Role-based UI
```typescript
get isAdmin(): boolean { return this.authService.role === 'Admin'; }
get isInstructor(): boolean { return this.authService.role === 'Instructor'; }
get isStudent(): boolean { return this.authService.role === 'Student'; }
```

### No `any` types
Always use interfaces from `src/app/models/`.

### Reactive Forms (not template-driven)
```typescript
form = this.fb.group({
  email:    ['', [Validators.required, Validators.email]],
  password: ['', Validators.required],
});
```

### New control flow syntax (Angular 21)
```html
@if (isAdmin) { <app-admin-panel /> }
@for (module of modules; track module.id) { <app-module-card [module]="module" /> }
```

---

## Tests (QA responsibility)

Write the test plan in `tests/`. Each test case must include:
- **Test ID** (e.g. TC-01)
- **Preconditions**
- **Steps**
- **Expected result**
- **Actual result**

Minimum test cases to cover:
1. Login — each role sees the correct dashboard
2. Student blocked from submitting if attendance below 80%
3. Instructor marks attendance
4. Assignment submission and grading flow
5. Class cancellation triggers notification
6. Calendar shows correct events per role
7. Module locked until previous sequential module is passed
8. Progress dashboard renders charts with real data

---

## Coding Conventions

- Standalone components only — no `NgModule`
- Strict TypeScript — no `any`
- Angular Material for all UI components
- New control flow: `@if`, `@for` instead of `*ngIf`, `*ngFor`
- Commits: `feat:`, `fix:`, `chore:` prefixes
- Branch from `dev`: `git checkout -b feature/<name>`
- Open a Pull Request into `dev` when done — Person 1 reviews

For full feature details see `docs/feature-plan.md`.
