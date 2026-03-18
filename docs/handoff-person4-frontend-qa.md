# Handoff Note — Person 4 (Frontend Developer & QA)

From Person 1 | Updated: 2026-03-18

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
- `@angular/core`, `@angular/material`, `@angular/cdk` — v18
- `@angular/router`, `@angular/forms` — v18
- `ng2-charts` ^6.0.0 + `chart.js` ^4.4.0 — for all progress charts
- `rxjs` ~7.8.0
- TypeScript strict mode enabled

### App Config & Bootstrap (`src/app/app.config.ts`, `src/main.ts`)
- Standalone component architecture throughout — no `NgModule` needed
- `provideRouter`, `provideHttpClient`, Angular Material theme are configured

### Routing (`src/app/app.routes.ts`) — fully set up
All routes use lazy-loaded standalone components. Already configured:

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
| `**` | redirects to `/login` | |

### AuthGuard (`src/app/guards/auth.guard.ts`)
Already implemented — checks `AuthService.isLoggedIn()` and redirects to `/login` if false. You don't need to touch this.

### AuthService (`src/app/services/auth.service.ts`) — fully implemented
- `login(email, password)` — POSTs to `/api/auth/login`, stores `token`, `userId`, `role` in localStorage
- `logout()` — clears localStorage, navigates to `/login`
- `isLoggedIn()` — returns bool
- `userId` getter — returns number
- `role` getter — returns `"Student"`, `"Instructor"`, or `"Admin"`

### ApiService (`src/app/services/api.service.ts`)
Base HTTP service — use this for **all** backend calls. Do not use `HttpClient` directly in pages.

### NotificationService ★ (`src/app/services/notification.service.ts`)
Stubbed — you need to implement polling and the unread count observable. It calls `GET /api/notification`.

### ProgressService ★ (`src/app/services/progress.service.ts`)
Stubbed — calls the 4 `GET /api/progress/*` endpoints and returns observables for each chart component.

### Models (`src/app/models/`)
TypeScript interfaces are scaffolded:
- `user.model.ts` — User interface
- `course.model.ts` — Course interface
- `notification.model.ts` — Notification interface (has `id`, `message`, `isRead`, `createdAt`)

### All page & component files exist (empty shells)
You just need to add the `@Component` decorator template and logic:

**Pages:**
- `login/login.component.ts`
- `dashboard/dashboard.component.ts`
- `courses/courses.component.ts`
- `course-detail/course-detail.component.ts`
- `assignments/assignments.component.ts`
- `quiz/quiz.component.ts`
- `progress-dashboard/progress-dashboard.component.ts` ★
- `admin-panel/admin-panel.component.ts`

**Components:**
- `navbar/navbar.component.ts` — ★ notification bell goes here
- `sidebar/sidebar.component.ts`
- `notification-dropdown/notification-dropdown.component.ts` ★
- `progress-charts/course-progress-bar/course-progress-bar.component.ts` ★
- `progress-charts/grade-line-chart/grade-line-chart.component.ts` ★
- `progress-charts/submission-rate-chart/submission-rate-chart.component.ts` ★
- `progress-charts/upcoming-deadlines-widget/upcoming-deadlines-widget.component.ts` ★

---

## Your tasks

### 1. Login Page (`/login`)
- Reactive Form with `email` and `password` fields (use `FormBuilder`)
- On submit, call `AuthService.login(email, password).subscribe(...)`
- On success, navigate to `/dashboard`
- Show error message on failure
- Use Angular Material `mat-form-field`, `mat-input`, `mat-button`

### 2. Dashboard (`/dashboard`)
- Fetch and display enrolled courses summary
- ★ Show notification alert widget (recent unread reminders from `NotificationService`)
- Link to `/progress` for the full analytics view

### 3. Courses (`/courses` and `/courses/:id`)
- List all courses via `ApiService.get('/course')`
- Course detail page shows assignments and allows submission

### 4. Assignments (`/assignments`)
- List assignments with deadlines
- Reactive Form for submission

### 5. Quiz (`/quiz`)
- Basic quiz UI — questions and answer selection

### 6. Progress Dashboard ★ Innovation (`/progress`)
Use the 4 chart components — each takes data as `@Input()`:
- `<app-course-progress-bar>` — `ng2-charts` horizontal bar chart
- `<app-grade-line-chart>` — `ng2-charts` line chart
- `<app-submission-rate-chart>` — `ng2-charts` doughnut chart
- `<app-upcoming-deadlines-widget>` — list of upcoming deadlines

Fetch data via `ProgressService` and pass to each component.

### 7. Navbar ★ Innovation
- Bell icon (`mat-icon`) with badge showing unread count from `NotificationService`
- Clicking the bell opens `<app-notification-dropdown>`

### 8. Notification Dropdown ★ Innovation
- List recent `Notification` objects from `NotificationService`
- Show message, timestamp, bold if unread
- On click, call `NotificationService.markAsRead(id)` and update UI

### 9. Admin Panel (`/admin`)
- Accessible only to users with `role === 'Admin'`
- Manage users and courses

---

## Key patterns to follow

### Making API calls
Always use `ApiService`, never inject `HttpClient` directly:
```typescript
// Good
constructor(private api: ApiService) {}
this.api.get<Course[]>('/course').subscribe(courses => this.courses = courses);

// Bad
constructor(private http: HttpClient) {}
```

### Role-based UI
Use `AuthService.role` to conditionally show admin controls:
```typescript
get isAdmin(): boolean { return this.authService.role === 'Admin'; }
```

### No `any` types
Always use the interfaces from `src/app/models/`. Add new interfaces there if needed.

### Reactive Forms (not template-driven)
```typescript
form = this.fb.group({
  email:    ['', [Validators.required, Validators.email]],
  password: ['', Validators.required],
});
```

---

## Tests (your QA responsibility)

Write the test plan in `tests/`. Each test case must include:
- **Test ID** (e.g. TC-01)
- **Preconditions**
- **Steps**
- **Expected result**
- **Actual result**

Minimum 3 test cases, covering:
1. A core feature (e.g. login, view courses)
2. A second core feature (e.g. assignment submission)
3. At least one innovation feature (e.g. notification bell shows unread count, progress chart renders)

---

## Coding conventions

- Standalone components only — no `NgModule`
- Strict TypeScript — no `any`
- Angular Material for all UI components
- Commits: `feat:`, `fix:`, `chore:` prefixes
- Branch from `dev`: `git checkout -b feature/login-page`
- Open a Pull Request into `dev` when done — Person 1 reviews
