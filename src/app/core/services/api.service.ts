import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  CourseResponse, CourseDetailResponse,
  ModuleSummaryResponse, AssignmentResponse,
  AttendanceSessionResponse, AttendancePercentageResponse,
  TimetableSlotResponse, TimetableSessionEventResponse, TimetableExceptionResponse,
  NotificationResponse, StudentDashboardResponse, InstructorDashboardResponse,
  AdminDashboardResponse, UserResponse, AssignmentGradeResponse, ModuleFinalGradeResponse,
  ProgressSummaryResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  // ── Dashboard ────────────────────────────────────────
  getStudentDashboard()    { return this.http.get<StudentDashboardResponse>(`${this.base}/dashboard/student`); }
  getInstructorDashboard() { return this.http.get<InstructorDashboardResponse>(`${this.base}/dashboard/instructor`); }
  getAdminDashboard()      { return this.http.get<AdminDashboardResponse>(`${this.base}/dashboard/admin`); }

  // ── Courses ──────────────────────────────────────────
  getCourses()              { return this.http.get<CourseResponse[]>(`${this.base}/course`); }
  getCourse(id: number)     { return this.http.get<CourseDetailResponse>(`${this.base}/course/${id}`); }
  createCourse(body: any)   { return this.http.post<CourseDetailResponse>(`${this.base}/course`, body); }
  updateCourse(id: number, body: any) { return this.http.put<CourseDetailResponse>(`${this.base}/course/${id}`, body); }
  deleteCourse(id: number)  { return this.http.delete(`${this.base}/course/${id}`); }

  // ── Modules ──────────────────────────────────────────
  getModules(courseId: number) { return this.http.get<ModuleSummaryResponse[]>(`${this.base}/module?courseId=${courseId}`); }
  getModule(id: number)        { return this.http.get<ModuleSummaryResponse>(`${this.base}/module/${id}`); }
  createModule(body: any)      { return this.http.post<ModuleSummaryResponse>(`${this.base}/module`, body); }
  updateModule(id: number, b: any) { return this.http.put<ModuleSummaryResponse>(`${this.base}/module/${id}`, b); }
  deleteModule(id: number)     { return this.http.delete(`${this.base}/module/${id}`); }

  // ── Assignments ──────────────────────────────────────
  getAssignments(moduleId: number) { return this.http.get<AssignmentResponse[]>(`${this.base}/assignment?moduleId=${moduleId}`); }
  getAssignment(id: number)        { return this.http.get<AssignmentResponse>(`${this.base}/assignment/${id}`); }
  createAssignment(body: any)      { return this.http.post<AssignmentResponse>(`${this.base}/assignment`, body); }
  updateAssignment(id: number, b: any) { return this.http.put<AssignmentResponse>(`${this.base}/assignment/${id}`, b); }
  deleteAssignment(id: number)     { return this.http.delete(`${this.base}/assignment/${id}`); }
  submitAssignment(id: number, b: any) { return this.http.post(`${this.base}/assignment/${id}/submit`, b); }
  getMySubmission(id: number)      { return this.http.get(`${this.base}/assignment/${id}/my-submission`); }
  getPendingSubmissions(courseId?: number) {
    const url = courseId ? `${this.base}/assignment/pending-submissions?courseId=${courseId}` : `${this.base}/assignment/pending-submissions`;
    return this.http.get<any[]>(url);
  }

  // ── Grades ───────────────────────────────────────────
  gradeAssignment(body: any) { return this.http.post<AssignmentGradeResponse>(`${this.base}/grade/assignment`, body); }
  getModuleFinalGrade(moduleId: number, studentId?: number) {
    const params = studentId ? `?studentId=${studentId}` : '';
    return this.http.get<ModuleFinalGradeResponse>(`${this.base}/grade/module/${moduleId}/final${params}`);
  }
  releaseModuleGrades(moduleId: number) { return this.http.post(`${this.base}/grade/module/${moduleId}/release`, {}); }
  getMyGrades() { return this.http.get<AssignmentGradeResponse[]>(`${this.base}/grade/assignments`); }

  // ── Attendance ───────────────────────────────────────
  getAttendanceSessions(moduleId: number) {
    return this.http.get<AttendanceSessionResponse[]>(`${this.base}/attendance/modules/${moduleId}/sessions`);
  }
  createAttendanceSession(body: any) { return this.http.post<AttendanceSessionResponse>(`${this.base}/attendance/sessions`, body); }
  getAttendancePercentage(moduleId: number, studentId?: number) {
    const params = studentId ? `?studentId=${studentId}` : '';
    return this.http.get<AttendancePercentageResponse>(`${this.base}/attendance/modules/${moduleId}/percentage${params}`);
  }

  // ── Timetable ────────────────────────────────────────
  getTimetableSlots(moduleId?: number) {
    const params = moduleId ? `?moduleId=${moduleId}` : '';
    return this.http.get<TimetableSlotResponse[]>(`${this.base}/timetable/slots${params}`);
  }
  createTimetableSlot(body: any)       { return this.http.post<TimetableSlotResponse>(`${this.base}/timetable/slots`, body); }
  updateTimetableSlot(id: number, b: any) { return this.http.put<TimetableSlotResponse>(`${this.base}/timetable/slots/${id}`, b); }
  deleteTimetableSlot(id: number)      { return this.http.delete(`${this.base}/timetable/slots/${id}`); }
  getTimetableEvents(from?: string, to?: string) {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    return this.http.get<TimetableSessionEventResponse[]>(`${this.base}/timetable/events?${p}`);
  }
  createTimetableException(body: any)  { return this.http.post<TimetableExceptionResponse>(`${this.base}/timetable/exceptions`, body); }

  // ── Notifications ────────────────────────────────────
  getNotifications()       { return this.http.get<NotificationResponse[]>(`${this.base}/notification?userId=${this.auth.userId()}`); }
  getUnreadCount()         { return this.http.get<{count: number}>(`${this.base}/notification/unread-count?userId=${this.auth.userId()}`); }
  markRead(id: number)     { return this.http.patch(`${this.base}/notification/${id}/read`, {}); }
  markAllRead()            { return this.http.patch(`${this.base}/notification/read-all?userId=${this.auth.userId()}`, {}); }

  // ── Progress ─────────────────────────────────────────
  getProgressSummary() { return this.http.get<ProgressSummaryResponse>(`${this.base}/progress/${this.auth.userId()}`); }

  // ── Users ─────────────────────────────────────────────
  getUsers()               { return this.http.get<UserResponse[]>(`${this.base}/user`); }
  getUser(id: number)      { return this.http.get<UserResponse>(`${this.base}/user/${id}`); }
  updateUser(id: number, b: any) { return this.http.put<UserResponse>(`${this.base}/user/${id}`, b); }
  deleteUser(id: number)   { return this.http.delete(`${this.base}/user/${id}`); }

  // ── Calendar ──────────────────────────────────────────
  getCalendarEvents(from?: string, to?: string) {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    return this.http.get<any[]>(`${this.base}/calendar?${p}`);
  }
}
