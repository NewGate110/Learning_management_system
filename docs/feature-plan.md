# Feature Plan — College LMS Expansion

## Overview
This document outlines all planned features and changes to be implemented in the College LMS system.
No code changes have been made yet — this is a planning document only.

---

## 1. Modules

- New `Modules` table as a layer between Courses and Assignments
- Module types:
  - **Sequential** — must be completed in order, cannot access next module until current is passed
  - **Compulsory** — must be passed to complete the course, no strict order
  - **Optional** — can be skipped, does not block course completion
- Sequential modules have an order number
- Admin can add, edit, delete modules and change their type and order
- Assignments move from Course-level to Module-level

---

## 2. Attendance

- Instructors mark attendance per student per session
- Admin can also create sessions and edit any attendance record
- Tracked at module level
- Students need 80% or above attendance in a module to be eligible to submit assignments
- If below 80% — assignment submission is locked for that student

Attendance % calculated as: (sessions present / total sessions) x 100

---

## 3. Assignments & Assessments

### Assignments
- Student uploads a submission
- Instructor reviews and grades the submission
- Belongs to a Module (not a Course)
- Student must have 80% or above attendance to submit

### Assessments
- Scheduled events only (physical exam or test — not taken on the platform)
- Has a date and duration
- Instructor gives a grade after the assessment date
- Belongs to a Module

### Grading
- Each assignment and assessment grade shown separately
- Final Module Grade only released after ALL assignments and assessments in the module are graded
- Final Course Grade only released after all required modules are completed and graded

---

## 4. Module Progress & Course Completion

Per-student module progress tracked with status: InProgress / Passed / Failed

Course completion rules:
- All Sequential modules passed in correct order
- All Compulsory modules passed
- Optional modules do not affect completion

---

## 5. Timetable

- Fixed weekly recurring schedule
- Set and managed by Admin only
- Instructors cannot edit the timetable but can cancel individual sessions

Timetable fields:
- Module, Instructor, Day of Week, Start Time, End Time, Location, Semester start date, Semester end date

Cancellation / Reschedule:
- Instructor cancels or reschedules a specific session
- System records the exception against the timetable slot
- Reason is required

---

## 6. Calendar

- Visible to all users after login
- Each user only sees events relevant to them
- Admin sees all events system-wide

Events shown on the calendar:

| Event | Visible To |
|-------|------------|
| Assignment deadlines | Enrolled students + instructor |
| Assessment dates | Enrolled students + instructor |
| Timetable sessions | Enrolled students + instructor |
| Cancellations / reschedules | Enrolled students + instructor |
| Course start / end dates | Everyone |

---

## 7. Role-Based Dashboards

### Student Dashboard
- Enrolled courses and progress
- Module completion status
- Attendance percentage per module
- Upcoming assignments and assessments
- Timetable for the week
- Calendar
- Notifications

### Instructor Dashboard
- Courses being taught
- Pending submissions awaiting grading
- Attendance marking
- Upcoming timetable sessions
- Calendar
- Notifications

### Admin Dashboard
- Full course and module management
- All users management
- System-wide timetable roster
- System-wide calendar
- All notifications and activity

---

## 8. Notifications

| Trigger | Channel | Recipients |
|---------|---------|------------|
| Class cancelled | Email + Portal | Enrolled students, Instructor, Admin |
| Class rescheduled | Email + Portal | Enrolled students, Instructor, Admin |
| Assignment deadline approaching | Portal | Enrolled students |
| Assessment date approaching | Portal | Enrolled students |
| Assignment graded | Portal | Student |
| Final grade released | Portal + Email | Student |

---

## 9. GradeController

Handles all grading operations. Separate endpoints for assignment grades and assessment grades.

**Instructor endpoints:**
- Submit a grade for a submitted assignment (score + feedback)
- Submit a grade for an assessment (score)
- Edit an existing grade before final grade is released

**Student endpoints:**
- View all assignment grades for their submissions
- View all assessment grades
- View final module grade (only visible once all items in the module are graded)

Final module grade is calculated and stored in `ModuleProgress.FinalGrade` once every assignment and assessment in that module has been graded.

---

## 10. Frontend Pages

### `/courses/:id/modules` — Modules List Page
Shows all modules belonging to a course.
- Module title, type badge (Sequential / Compulsory / Optional), and current status for the logged-in student
- Sequential modules show a lock icon if the previous module has not been passed
- Progress indicator per module (% of assignments and assessments completed)
- Admin/Instructor: link to add or edit modules

### `/modules/:id` — Module Detail Page
Shows the full content of a single module.
- Module title, type, and description
- List of assignments with submission status (Not Submitted / Submitted / Graded) and grade if available
- List of assessments with scheduled date, duration, and grade if released
- Attendance % for the student in this module, with a warning if below 80%
- Timetable sessions for this module
- Lock notice on assignment submission if attendance is below 80%

### `/assessments` — Assessments Page
Shows all upcoming and past assessments for the logged-in user.
- Assessment title, module, scheduled date, duration, location
- Grade shown once released by instructor
- Instructor view: grade input field per student per assessment

### `/attendance` — Attendance Page
Two views depending on role:

**Instructor view:**
- Select a module and date to create or open an attendance session
- List of enrolled students with present / absent toggle per student
- Save button to submit the session record

**Admin view:**
- All instructor capabilities plus the ability to edit any existing attendance record across all modules
- Can correct or override any student's present / absent status on any session

**Student view:**
- Attendance % per module
- List of sessions with present / absent status per session
- Warning banner if attendance drops below 80% in any module

### `/timetable` — Timetable Page
**Student and Instructor view:**
- Weekly grid (Mon–Fri) showing all sessions for the current week
- Each slot shows module name, time, and location
- Cancelled sessions shown as struck-through with the cancellation reason
- Rescheduled sessions show the new date and time
- Navigation to move between weeks

**Admin view:**
- Full roster management table
- Add / edit / delete timetable slots
- Set module, instructor, day, start time, end time, location, semester dates

---

## 11. Frontend Model Field Definitions

### `assignment-grade.model.ts`
```typescript
export interface AssignmentGrade {
  id: number;
  submissionId: number;
  instructorId: number;
  score: number;
  feedback: string;
  gradedAt: string;
}
```

### `assessment-grade.model.ts`
```typescript
export interface AssessmentGrade {
  id: number;
  assessmentId: number;
  studentId: number;
  instructorId: number;
  score: number;
  gradedAt: string;
}
```

---

## 12. Database Changes

### New Tables

| Table | Purpose |
|-------|---------|
| `Modules` | Middle layer between Courses and Assignments |
| `ModuleProgress` | Per-student module completion status and final grade |
| `AttendanceSessions` | A class session created by a lecturer |
| `AttendanceRecords` | Per-student attendance record for a session |
| `Assessments` | Scheduled exam or test event belonging to a module |
| `AssessmentGrades` | Grade given by instructor after an assessment |
| `Submissions` | Student file upload for an assignment |
| `AssignmentGrades` | Grade given by instructor after reviewing a submission |
| `TimetableSlots` | Weekly recurring class schedule entry |
| `TimetableExceptions` | Per-session cancellation or reschedule override |

### Modified Tables

| Table | Change |
|-------|--------|
| `Assignments` | `CourseId` replaced by `ModuleId` |
| `Grades` | Split into `AssignmentGrades` (linked to Submissions) and `AssessmentGrades` |
| `Notifications` | New trigger types added for timetable events and grade releases |

---

## New File Structure (to be created during implementation)

```
college-lms/
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── docker-compose.yml
├── .env                              ← never commit
├── README.md
│
├── backend/
│   └── CollegeLMS.API/
│       ├── Controllers/
│       │   ├── AuthController.cs
│       │   ├── CourseController.cs
│       │   ├── ModuleController.cs           ← NEW
│       │   ├── AssignmentController.cs
│       │   ├── AssessmentController.cs       ← NEW
│       │   ├── AttendanceController.cs       ← NEW
│       │   ├── GradeController.cs            ← NEW
│       │   ├── TimetableController.cs        ← NEW
│       │   ├── CalendarController.cs         ← NEW
│       │   ├── DashboardController.cs        ← NEW
│       │   ├── UserController.cs
│       │   ├── NotificationController.cs
│       │   └── ProgressController.cs
│       ├── Models/
│       │   ├── User.cs
│       │   ├── Course.cs
│       │   ├── Module.cs                     ← NEW
│       │   ├── Assignment.cs                 (ModuleId replaces CourseId)
│       │   ├── Assessment.cs                 ← NEW
│       │   ├── Submission.cs                 ← NEW
│       │   ├── AssignmentGrade.cs            ← NEW (replaces Grade.cs)
│       │   ├── AssessmentGrade.cs            ← NEW
│       │   ├── ModuleProgress.cs             ← NEW
│       │   ├── AttendanceSession.cs          ← NEW
│       │   ├── AttendanceRecord.cs           ← NEW
│       │   ├── TimetableSlot.cs              ← NEW
│       │   ├── TimetableException.cs         ← NEW
│       │   ├── Grade.cs                      (keep for migration compat or remove)
│       │   └── Notification.cs
│       ├── Data/
│       │   ├── AppDbContext.cs               (add new DbSets)
│       │   └── AppDbContextFactory.cs
│       ├── Services/
│       │   ├── JwtTokenService.cs
│       │   ├── ProgressService.cs
│       │   ├── NotificationService.cs        (extend with new triggers)
│       │   └── EmailService.cs
│       ├── BackgroundServices/
│       │   └── DeadlineReminderService.cs
│       ├── Middleware/
│       │   └── ErrorHandlingMiddleware.cs
│       ├── Migrations/
│       │   └── (EF Core auto-generated)
│       ├── Program.cs
│       └── appsettings.json
│
├── frontend/
│   └── src/app/
│       ├── pages/
│       │   ├── login/
│       │   ├── dashboard/                    (role-based: student/instructor/admin)
│       │   ├── courses/
│       │   ├── course-detail/
│       │   ├── modules/                      ← NEW  (/courses/:id/modules)
│       │   ├── module-detail/                ← NEW  (/modules/:id)
│       │   ├── assignments/
│       │   ├── assessments/                  ← NEW
│       │   ├── attendance/                   ← NEW
│       │   ├── timetable/                    ← NEW
│       │   ├── calendar/                     ← NEW  (/calendar)
│       │   ├── progress-dashboard/
│       │   ├── quiz/
│       │   └── admin-panel/                  (extend with modules, timetable, users)
│       ├── components/
│       │   ├── navbar/
│       │   ├── sidebar/
│       │   ├── notification-dropdown/
│       │   └── progress-charts/
│       │       ├── course-progress-bar/
│       │       ├── grade-line-chart/
│       │       ├── submission-rate-chart/
│       │       └── upcoming-deadlines-widget/
│       ├── services/
│       │   ├── api.service.ts
│       │   ├── auth.service.ts
│       │   ├── notification.service.ts
│       │   └── progress.service.ts
│       ├── guards/
│       │   └── auth.guard.ts
│       └── models/
│           ├── user.model.ts
│           ├── course.model.ts
│           ├── module.model.ts               ← NEW
│           ├── assessment.model.ts           ← NEW
│           ├── submission.model.ts           ← NEW
│           ├── assignment-grade.model.ts     ← NEW
│           ├── assessment-grade.model.ts     ← NEW
│           ├── module-progress.model.ts      ← NEW
│           ├── attendance.model.ts           ← NEW
│           ├── timetable-slot.model.ts       ← NEW
│           ├── calendar-event.model.ts       ← NEW
│           └── notification.model.ts
│
├── docs/
│   ├── feature-plan.md               ← this file
│   ├── backend-map.md
│   ├── frontend-map.md
│   ├── handoff-person2-uml-lead.md
│   ├── handoff-person3-backend-dev.md
│   └── handoff-person4-frontend-qa.md
│
└── tests/                            ← Person 4 writes test cases here
```

