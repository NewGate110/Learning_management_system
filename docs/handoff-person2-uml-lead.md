# Handoff Note — Person 2 (System Designer & UML Lead)

From Person 1 | Updated: 2026-05-16

---

## Current Status

| Deliverable | Status |
|---|---|
| `docs/requirements.md` — System overview, functional/non-functional requirements, SDLC | Done |
| Class diagram | Not started |
| ER diagram | Not started |
| Use case diagram | Not started |
| Sequence diagrams | Not started |
| `docs/risk-assessment.md` | Done |

All diagrams should be saved under `docs/diagrams/` as PNG or SVG files.

---

## Tech Stack (for your System Overview)

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core 10 (C#), .NET 10 |
| ORM | Entity Framework Core 10 + Npgsql |
| Auth | JWT Bearer tokens |
| Frontend | Angular 19.2.20, standalone components |
| UI Library | Angular Material 19.2.19 |
| Charts | ng2-charts + Chart.js |
| Database | PostgreSQL 18 |
| Email | MailKit + SendGrid (SMTP) |
| Containers | Docker Compose — Nginx serves frontend, proxies /api/* to backend |

---

## Entities (for Class & ER Diagrams)

All 14 entities are implemented in the backend and have applied migrations. Use these as your source of truth.

### `User`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| Name | string | |
| Email | string | Unique |
| Role | string | `Student`, `Instructor`, or `Admin` |
| PasswordHash | string | Hashed via ASP.NET Identity |
| Grades | ICollection\<AssignmentGrade\> | navigation |
| Notifications | ICollection\<Notification\> | navigation |
| EnrolledCourses | ICollection\<Course\> | many-to-many via CourseEnrollments join table |
| CoursesTeaching | ICollection\<Course\> | navigation (Instructor only) |

### `Course`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| Title | string | |
| Description | string | |
| InstructorId | int | FK → User |
| StartDate | DateTime? | nullable — semester start |
| EndDate | DateTime? | nullable — semester end |
| Modules | ICollection\<Module\> | navigation |

### `Module`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| CourseId | int | FK → Course |
| Title | string | |
| Description | string | |
| Type | string | `Sequential`, `Compulsory`, or `Optional` |
| Order | int | Used for sequential ordering |

### `Assignment`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| Title | string | |
| Description | string | |
| Deadline | DateTime | |
| ModuleId | int | FK → Module (not CourseId) |

### `Submission`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| AssignmentId | int | FK → Assignment |
| StudentId | int | FK → User |
| FileUrl | string | uploaded file path |
| SubmittedAt | DateTime | |

### `Assessment`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| ModuleId | int | FK → Module |
| Title | string | |
| Description | string | |
| ScheduledAt | DateTime | |
| Duration | int | minutes |
| Location | string | room or venue |

### `AssignmentGrade`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| SubmissionId | int | FK → Submission |
| InstructorId | int | FK → User |
| Score | double | |
| Feedback | string | |
| GradedAt | DateTime | |

### `AssessmentGrade`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| AssessmentId | int | FK → Assessment |
| StudentId | int | FK → User |
| InstructorId | int | FK → User |
| Score | double | |
| GradedAt | DateTime | |

### `ModuleProgress`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| StudentId | int | FK → User |
| ModuleId | int | FK → Module |
| Status | string | `InProgress`, `Passed`, `Failed` |
| FinalGrade | double? | nullable — only set once all items in module are graded |
| IsReleased | bool | false until instructor releases the final grade to the student |

### `AttendanceSession`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| ModuleId | int | FK → Module |
| Date | DateTime | |
| CreatedByInstructorId | int | FK → User |

### `AttendanceRecord`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| AttendanceSessionId | int | FK → AttendanceSession |
| StudentId | int | FK → User |
| IsPresent | bool | |

### `TimetableSlot`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| ModuleId | int | FK → Module |
| InstructorId | int | FK → User |
| DayOfWeek | string | Mon / Tue / Wed / Thu / Fri |
| StartTime | TimeSpan | |
| EndTime | TimeSpan | |
| Location | string | |
| EffectiveFrom | DateTime | semester start date |
| EffectiveTo | DateTime | semester end date |

### `TimetableException`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| TimetableSlotId | int | FK → TimetableSlot |
| Date | DateTime | the specific session date affected |
| Status | string | `Cancelled` or `Rescheduled` |
| RescheduleDate | DateTime? | nullable |
| RescheduleStartTime | TimeSpan? | nullable |
| RescheduleEndTime | TimeSpan? | nullable |
| Reason | string | required |

### `Notification`
| Property | Type | Notes |
|---|---|---|
| Id | int | PK |
| UserId | int | FK → User |
| AssignmentId | int? | nullable FK → Assignment |
| AssessmentId | int? | nullable FK → Assessment |
| ModuleId | int? | nullable FK → Module |
| TimetableExceptionId | int? | nullable FK → TimetableException |
| Type | string | `General`, `ClassCancelled`, `ClassRescheduled`, `AssignmentDeadline`, `AssessmentDate`, `AssignmentGraded`, `FinalGradeReleased` |
| Message | string | |
| IsRead | bool | |
| CreatedAt | DateTime | UTC |
| ReadAt | DateTime? | nullable |

---

## Entity Relationships Summary

```
Course ──────────────► Module            (one-to-many)
Module ──────────────► Assignment        (one-to-many)
Module ──────────────► Assessment        (one-to-many)
Module ──────────────► TimetableSlot     (one-to-many)
Module ──────────────► AttendanceSession (one-to-many)
TimetableSlot ───────► TimetableException (one-to-many)
AttendanceSession ───► AttendanceRecord  (one-to-many)
Assignment ──────────► Submission        (one-to-many)
Submission ──────────► AssignmentGrade   (one-to-one)
Assessment ──────────► AssessmentGrade   (one per student)
User (Student) ──────► ModuleProgress    (one per student per module)
User (Student) ──────► Submission        (one-to-many)
User (Student) ──────► AttendanceRecord  (one per session)
User ↔ Course ────────────────────────── (many-to-many via CourseEnrollments)
User ────────────────► Notification      (one-to-many)
```

---

## API Endpoints (for Sequence & Use Case Diagrams)

| Controller | Key Routes | Access |
|---|---|---|
| AuthController | `POST /api/auth/register`, `POST /api/auth/login` | Public |
| CourseController | CRUD `/api/course` | Admin |
| ModuleController | CRUD `/api/module` | Admin |
| AssignmentController | CRUD + submissions `/api/assignment` | Instructor / Admin |
| AssessmentController | CRUD `/api/assessment` | Instructor / Admin |
| AttendanceController | Mark attendance `/api/attendance` | Instructor |
| TimetableController | CRUD slots + cancel `/api/timetable` | Admin / Instructor |
| GradeController | Submit grades `/api/grade` | Instructor |
| ProgressController | Chart data `/api/progress` | Student |
| NotificationController | Fetch + mark read `/api/notification` | All roles |
| CalendarController | Events per user `/api/calendar` | All roles |
| DashboardController | Role-based summary `/api/dashboard` | All roles |
| UserController | User management `/api/user` | Admin |

---

## Role-Based Use Cases (for Use Case Diagram)

### Student
- Log in → view role-based dashboard
- View enrolled courses and module progress
- View attendance percentage per module (warning if below 80%)
- Submit assignments (blocked if attendance < 80%)
- View assignment and assessment grades
- View final module grade (only visible once all items are graded)
- View timetable (weekly grid)
- View calendar (deadlines, assessment dates, timetable sessions)
- Receive and read notifications

### Instructor
- Log in → view role-based dashboard
- Mark attendance per session (present/absent per student)
- Grade submitted assignments (score + feedback)
- Grade assessments (score)
- Cancel or reschedule a timetable session (triggers notification to students)
- View timetable and calendar

### Admin
- Log in → view role-based dashboard
- Add / edit / delete courses
- Add / edit / delete modules (set type: Sequential / Compulsory / Optional, and order)
- Manage all timetable slots (set module, instructor, day, time, location, semester dates)
- Manage all users
- Edit any attendance record
- View system-wide calendar and notifications

---

## Key Business Rules (important for sequence diagrams)

- **Attendance gate:** A student cannot submit an assignment if their attendance in that module is below 80%. Backend enforces this on `POST /api/assignment/submit`.
- **Sequential module locking:** A Sequential module cannot be started until the previous Sequential module (by Order) has status `Passed`.
- **Final grade release:** `ModuleProgress.FinalGrade` is only calculated and made visible to students after every assignment and assessment in the module has been graded by an instructor.
- **Deadline reminder:** `DeadlineReminderService` runs every 60 minutes, looks 48 hours ahead, sends email + creates in-app notification. Duplicate notifications are suppressed.
- **Timetable cancellation notification:** When an instructor cancels a session, all enrolled students and the admin receive an email + in-app notification automatically.

---

## Pending Diagram Deliverables

### 1. Class Diagram
Save to: `docs/diagrams/class-diagram.png`
Show all 14 entities with properties, types, and relationships including multiplicities.

### 2. ER Diagram
Save to: `docs/diagrams/er-diagram.png`
Database-level view — tables, PKs, FKs, nullable columns, and the CourseEnrollments join table.
Tip: DBeaver can auto-generate this from the live PostgreSQL instance at localhost:5432.

### 3. Use Case Diagram
Save to: `docs/diagrams/use-case-diagram.png`
Three actors (Student, Instructor, Admin) with all use cases from the section above.
Use `<<include>>` for shared use cases like login and view calendar.

### 4. Sequence Diagrams
Save each to `docs/diagrams/`:

| Filename | Flow to show |
|---|---|
| `seq-login.png` | Client → POST /api/auth/login → JWT returned |
| `seq-submit-assignment.png` | Student submits → attendance check → submission stored |
| `seq-mark-attendance.png` | Instructor creates session → marks per student → saves records |
| `seq-grade-release.png` | Instructor grades last item → FinalGrade set → notification sent |
| `seq-deadline-reminder.png` | Background service fires → queries deadlines → sends email + notification |

---

## Recommended Tools

| Tool | Use |
|---|---|
| [draw.io](https://draw.io) | All diagram types — free, exports PNG/SVG, works in browser or desktop |
| [PlantUML](https://plantuml.com) | Text-based diagrams — great for sequence diagrams, version-control friendly |
| [DBeaver](https://dbeaver.io) | Auto-generate ER diagram from live PostgreSQL database |

---

## SDLC Methodology

The project follows an **Agile/iterative** approach. Person 1 built the skeleton and Docker stack. Person 3 completed the backend. Person 4 is implementing the frontend. Person 1 reviews PRs into `dev` before merging to `main`.

Branching strategy: `main` ← `dev` ← `feature/*` or named branches (e.g. `backendDb`, `frontend`).

For full feature details see `docs/feature-plan.md`.
