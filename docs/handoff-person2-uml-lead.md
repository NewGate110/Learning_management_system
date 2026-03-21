# Handoff Note — Person 2 (System Designer & UML Lead)

From Person 1 | Updated: 2026-03-22

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
| Frontend | Angular 21, standalone components |
| UI Library | Angular Material 21 |
| Charts | ng2-charts + Chart.js |
| Database | PostgreSQL 18 |
| Email | MailKit + SendGrid (SMTP) |
| Containers | Docker Compose — Nginx serves frontend |

---

## Entities (for Class & ER Diagrams)

### Existing Models

#### `User`
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| Name | string | |
| Email | string | Unique |
| Role | string | `Student`, `Instructor`, or `Admin` |
| PasswordHash | string | Hashed via ASP.NET Identity |
| Grades | ICollection\<Grade\> | navigation |
| Notifications | ICollection\<Notification\> | navigation |
| EnrolledCourses | ICollection\<Course\> | many-to-many via CourseEnrollments |
| CoursesTeaching | ICollection\<Course\> | navigation |

#### `Course`
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| Title | string | |
| Description | string | |
| InstructorId | int | FK → User |
| Modules | ICollection\<Module\> | navigation |

#### `Module` *(new)*
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| CourseId | int | FK → Course |
| Title | string | |
| Description | string | |
| Type | string | `Sequential`, `Compulsory`, or `Optional` |
| Order | int | Used for sequential ordering |

#### `Assignment`
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| Title | string | |
| Description | string | |
| Deadline | DateTime | |
| ModuleId | int | FK → Module (changed from CourseId) |

#### `Submission` *(new)*
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| AssignmentId | int | FK → Assignment |
| StudentId | int | FK → User |
| FileUrl | string | uploaded file |
| SubmittedAt | DateTime | |

#### `Assessment` *(new)*
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| ModuleId | int | FK → Module |
| Title | string | |
| Description | string | |
| ScheduledAt | DateTime | |
| Duration | int | minutes |

#### `Grade` *(split into two)*
- `AssignmentGrade` — links to Submission, given by instructor
- `AssessmentGrade` — links to Assessment, given by instructor
- Final Module Grade only released after all items are graded

#### `ModuleProgress` *(new)*
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| StudentId | int | FK → User |
| ModuleId | int | FK → Module |
| Status | string | `InProgress`, `Passed`, `Failed` |
| FinalGrade | double? | nullable until all graded |

#### `AttendanceSession` *(new)*
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| ModuleId | int | FK → Module |
| Date | DateTime | |
| CreatedByInstructorId | int | FK → User |

#### `AttendanceRecord` *(new)*
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| AttendanceSessionId | int | FK → AttendanceSession |
| StudentId | int | FK → User |
| IsPresent | bool | |

#### `TimetableSlot` *(new)*
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| ModuleId | int | FK → Module |
| InstructorId | int | FK → User |
| DayOfWeek | string | Mon/Tue/Wed/Thu/Fri |
| StartTime | TimeSpan | |
| EndTime | TimeSpan | |
| Location | string | |
| EffectiveFrom | DateTime | semester start |
| EffectiveTo | DateTime | semester end |

#### `TimetableException` *(new)*
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| TimetableSlotId | int | FK → TimetableSlot |
| Date | DateTime | the specific session date |
| Status | string | `Cancelled` or `Rescheduled` |
| RescheduleDate | DateTime? | nullable |
| RescheduleStartTime | TimeSpan? | nullable |
| RescheduleEndTime | TimeSpan? | nullable |
| Reason | string | |

#### `Notification`
| Property | Type | Notes |
|----------|------|-------|
| Id | int | PK |
| UserId | int | FK → User |
| AssignmentId | int? | nullable FK |
| Message | string | |
| IsRead | bool | |
| CreatedAt | DateTime | UTC |
| ReadAt | DateTime? | nullable |

---

## API Endpoints (for Sequence & Use Case Diagrams)

| Controller | Key Routes | Notes |
|------------|-----------|-------|
| AuthController | `POST /api/auth/register`, `POST /api/auth/login` | Public |
| CourseController | CRUD `/api/course` | Admin |
| ModuleController | CRUD `/api/module` | Admin |
| AssignmentController | CRUD + submissions `/api/assignment` | Instructor/Admin |
| AssessmentController | CRUD `/api/assessment` | Instructor/Admin |
| AttendanceController | Mark attendance `/api/attendance` | Instructor |
| TimetableController | CRUD slots + cancel `/api/timetable` | Admin/Instructor |
| GradeController | Submit grades `/api/grade` | Instructor |
| ProgressController ★ | Chart data `/api/progress` | Student |
| NotificationController ★ | Fetch + mark read `/api/notification` | All |
| CalendarController | Events per user `/api/calendar` | All |

---

## Relationships Summary

```
Course ──────────────► Modules (one course has many modules)
Module ──────────────► Assignments (one module has many assignments)
Module ──────────────► Assessments (one module has many assessments)
Module ──────────────► TimetableSlots (weekly schedule)
Module ──────────────► AttendanceSessions
TimetableSlot ───────► TimetableExceptions (cancellations)
Assignment ──────────► Submissions (student uploads)
Submission ──────────► AssignmentGrade (instructor grades)
Assessment ──────────► AssessmentGrade (instructor grades)
User (Student) ──────► ModuleProgress (per student per module)
User (Student) ──────► CourseEnrollments (many-to-many with Course)
User ────────────────► Notifications
```

---

## Role-Based Use Cases (for Use Case Diagram)

### Student
- Log in → view role dashboard
- View enrolled courses and module progress
- View timetable and calendar
- Submit assignments (if attendance ≥ 80%)
- View grades per assignment and assessment
- View final module grade (when released)
- Receive and read notifications

### Instructor
- Log in → view role dashboard
- Mark attendance per session
- Grade submitted assignments
- Grade assessments
- Cancel a timetable session (triggers notification)
- View timetable and calendar

### Admin
- Log in → view role dashboard
- Add / edit / delete courses
- Add / edit / delete modules (set type and order)
- Set timetable roster
- Manage all users
- View system-wide calendar

---

## SDLC Suggestion

The project follows an **Agile/iterative** approach — skeleton first (Person 1), then parallel feature development by Persons 3 and 4, with Person 1 reviewing PRs into `dev`.

For detailed feature plans see `docs/feature-plan.md`.
