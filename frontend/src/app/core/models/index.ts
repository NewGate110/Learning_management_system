// Auth
export interface AuthResponse { token: string; userId: number; role: string; }
export interface LoginRequest  { email: string; password: string; }
export interface RegisterRequest { name: string; email: string; password: string; role?: string; }

// Users
export interface UserResponse {
  id: number; name: string; email: string; role: string;
  enrolledCourseIds: number[]; taughtCourseIds: number[];
}

// Courses
export interface CourseResponse {
  id: number; title: string; description: string;
  instructorId: number; instructorName: string;
  studentCount: number; moduleCount: number; assignmentCount: number;
}
export interface CourseDetailResponse extends CourseResponse {
  startDate?: string; endDate?: string;
  studentIds: number[];
  modules: ModuleSummaryResponse[];
  assignments: AssignmentResponse[];
}

// Modules
export interface ModuleSummaryResponse {
  id: number; courseId: number; title: string; description: string;
  type: string; order: number; assignmentCount: number; assessmentCount: number;
}

// Assignments
export interface AssignmentResponse {
  id: number; title: string; description: string;
  deadline: string; moduleId: number; submissionCount: number;
}
export interface PendingSubmissionResponse {
  id: number; assignmentId: number; assignmentTitle: string;
  moduleId: number; moduleTitle: string; courseId: number; courseTitle: string;
  studentId: number; studentName: string; fileUrl: string;
  submittedAt: string; deadline: string;
}
export interface MyAssignmentSubmissionResponse {
  assignmentId: number; studentId: number; submissionId?: number;
  fileUrl?: string; submittedAt?: string; status: string;
  assignmentGradeId?: number; score?: number; feedback?: string; gradedAt?: string;
}

// Assessments
export interface AssessmentResponse {
  id: number; moduleId: number; moduleTitle: string;
  title: string; description: string; scheduledAt: string;
  duration: number; location: string;
}

// Grades
export interface AssignmentGradeResponse {
  id: number; submissionId: number; assignmentId: number; moduleId: number;
  studentId: number; instructorId: number; score: number; feedback: string; gradedAt: string;
}
export interface AssessmentGradeResponse {
  id: number; assessmentId: number; moduleId: number;
  studentId: number; instructorId: number; score: number; gradedAt: string;
}
export interface ModuleFinalGradeResponse {
  moduleId: number; studentId: number; status: string; finalGrade?: number; isReleased: boolean;
}
export interface ModuleGradeReleaseResponse {
  moduleId: number; releasedStudentCount: number; alreadyReleasedStudentCount: number;
}

// Attendance
export interface AttendanceRecordResponse { id: number; studentId: number; studentName: string; isPresent: boolean; }
export interface AttendanceSessionResponse {
  id: number; moduleId: number; date: string;
  createdByInstructorId: number; records: AttendanceRecordResponse[];
}
export interface AttendancePercentageResponse {
  moduleId: number; studentId: number;
  presentSessions: number; totalSessions: number;
  percentage: number; eligibleForSubmission: boolean;
}

// Timetable
export interface TimetableSlotResponse {
  id: number; moduleId: number; moduleTitle: string;
  instructorId: number; instructorName: string;
  dayOfWeek: string; startTime: string; endTime: string;
  location: string; effectiveFrom: string; effectiveTo: string;
}
export interface TimetableSessionEventResponse {
  timetableSlotId: number; moduleId: number; moduleTitle: string;
  date: string; sessionStart: string; sessionEnd: string;
  location: string; isCancelled: boolean; isRescheduled: boolean; reason?: string;
}
export interface TimetableExceptionResponse {
  id: number; timetableSlotId: number; date: string; status: string;
  rescheduleDate?: string; rescheduleStartTime?: string; rescheduleEndTime?: string; reason: string;
}

// Notifications
export interface NotificationResponse {
  id: number; userId: number; type: string; message: string;
  isRead: boolean; createdAt: string; readAt?: string;
  assignmentId?: number; assessmentId?: number; moduleId?: number; timetableExceptionId?: number;
}

// Calendar
export interface CalendarEventResponse {
  type: string; title: string; start: string; end?: string;
  location?: string; description?: string;
  courseId?: number; moduleId?: number; assignmentId?: number; assessmentId?: number;
  timetableSlotId?: number; timetableExceptionId?: number;
}

// Dashboard
export interface StudentDashboardResponse {
  courses: StudentCourseSummary[];
  modules: StudentModuleSummary[];
  upcomingItems: StudentUpcomingItem[];
}
export interface StudentCourseSummary {
  courseId: number; courseTitle: string; isCompleted: boolean;
  passedRequiredModules: number; totalRequiredModules: number;
}
export interface StudentModuleSummary {
  moduleId: number; moduleTitle: string; type: string;
  status: string; finalGrade?: number; attendancePercentage: number;
}
export interface StudentUpcomingItem {
  itemType: string; title: string; startsAt: string;
  assignmentId?: number; assessmentId?: number; moduleId?: number;
}
export interface InstructorDashboardResponse {
  courses: CourseResponse[];
  pendingSubmissionCount: number;
  upcomingSessions: TimetableSessionEventResponse[];
}
export interface AdminDashboardResponse {
  totalUsers: number; totalCourses: number; totalModules: number;
  totalAssignments: number; totalAssessments: number;
  totalTimetableSlots: number; totalTimetableExceptions: number;
  unreadNotificationCount: number;
}

// Progress
export interface ProgressSummaryResponse {
  gradeTrend: GradeTrendResponse;
  courses: CourseCompletionResponse;
  submissions: SubmissionRateResponse;
  upcomingDeadlines: UpcomingDeadlinesResponse;
}
export interface GradeTrendResponse { points: GradeTrendPoint[]; averageScore: number; }
export interface GradeTrendPoint { label: string; score: number; submittedAt: string; }
export interface CourseCompletionResponse { courses: CourseCompletionItem[]; }
export interface CourseCompletionItem {
  courseId: number; courseTitle: string;
  submittedAssignments: number; totalAssignments: number;
  completionPercentage: number; averageScore: number;
}
export interface SubmissionRateResponse {
  totalAssignments: number; submitted: number; pending: number;
  onTime: number; late: number; submissionRatePercentage: number;
}
export interface UpcomingDeadlinesResponse { assignments: UpcomingDeadlineItem[]; }
export interface UpcomingDeadlineItem {
  assignmentId: number; title: string; courseId: number; courseTitle: string;
  deadline: string; hoursRemaining: number;
}

// ─── Request Interfaces ───────────────────────────────────────────────────────
// These define the exact shape of data sent TO the API.
// Using these instead of 'unknown' gives TypeScript compile-time safety.

export interface CreateCourseRequest {
  title: string;
  description?: string;
  instructorId: number;
  startDate?: string | null;
  endDate?: string | null;
  studentIds?: number[];
}
export type UpdateCourseRequest = CreateCourseRequest;

export interface CreateModuleRequest {
  courseId: number;
  title: string;
  description?: string;
  type: string;
  order?: number;
}
export type UpdateModuleRequest = CreateModuleRequest;

export interface CreateAssignmentRequest {
  moduleId: number;
  title: string;
  description?: string;
  deadline: string;
}
export type UpdateAssignmentRequest = CreateAssignmentRequest;

export interface SubmitAssignmentRequest {
  fileUrl: string;
}

export interface GradeAssignmentRequest {
  submissionId: number;
  score: number;
  feedback?: string;
}

export interface CreateAttendanceSessionRequest {
  moduleId: number;
  date: string;
  records: AttendanceRecordRequest[];
}
export interface AttendanceRecordRequest {
  studentId: number;
  isPresent: boolean;
}

export interface CreateTimetableSlotRequest {
  moduleId: number;
  instructorId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location?: string;
  effectiveFrom: string;
  effectiveTo: string;
}
export type UpdateTimetableSlotRequest = CreateTimetableSlotRequest;

export interface CreateTimetableExceptionRequest {
  timetableSlotId: number;
  date: string;
  status: string;
  reason?: string | null;
  rescheduleDate?: string | null;
  rescheduleStartTime?: string | null;
  rescheduleEndTime?: string | null;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  role: string;
}
