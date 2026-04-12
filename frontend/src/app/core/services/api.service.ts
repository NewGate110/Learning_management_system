import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  AdminDashboardResponse,
  AssessmentGradeResponse,
  AssessmentResponse,
  AssignmentGradeResponse,
  AssignmentResponse,
  AttendancePercentageResponse,
  AttendanceSessionResponse,
  CalendarEventResponse,
  CourseDetailResponse,
  CourseResponse,
  InstructorDashboardResponse,
  ModuleFinalGradeResponse,
  ModuleGradeReleaseResponse,
  ModuleSummaryResponse,
  MyAssignmentSubmissionResponse,
  NotificationResponse,
  PendingSubmissionResponse,
  ProgressSummaryResponse,
  StudentDashboardResponse,
  TimetableExceptionResponse,
  TimetableSessionEventResponse,
  TimetableSlotResponse,
  UserResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getStudentDashboard() {
    return this.http.get<StudentDashboardResponse>(`${this.base}/dashboard/student`);
  }

  getInstructorDashboard() {
    return this.http.get<InstructorDashboardResponse>(`${this.base}/dashboard/instructor`);
  }

  getAdminDashboard() {
    return this.http.get<AdminDashboardResponse>(`${this.base}/dashboard/admin`);
  }

  getCourses() {
    return this.http.get<CourseResponse[]>(`${this.base}/course`);
  }

  getCourse(id: number) {
    return this.http.get<CourseDetailResponse>(`${this.base}/course/${id}`);
  }

  createCourse(body: unknown) {
    return this.http.post<CourseDetailResponse>(`${this.base}/course`, body);
  }

  updateCourse(id: number, body: unknown) {
    return this.http.put<CourseDetailResponse>(`${this.base}/course/${id}`, body);
  }

  deleteCourse(id: number) {
    return this.http.delete(`${this.base}/course/${id}`);
  }

  getModules(courseId?: number) {
    const params = courseId ? `?courseId=${courseId}` : '';
    return this.http.get<ModuleSummaryResponse[]>(`${this.base}/module${params}`);
  }

  getModule(id: number) {
    return this.http.get<ModuleSummaryResponse>(`${this.base}/module/${id}`);
  }

  createModule(body: unknown) {
    return this.http.post<ModuleSummaryResponse>(`${this.base}/module`, body);
  }

  updateModule(id: number, body: unknown) {
    return this.http.put<ModuleSummaryResponse>(`${this.base}/module/${id}`, body);
  }

  deleteModule(id: number) {
    return this.http.delete(`${this.base}/module/${id}`);
  }

  getAssignments(moduleId: number) {
    return this.http.get<AssignmentResponse[]>(`${this.base}/assignment?moduleId=${moduleId}`);
  }

  getAssignment(id: number) {
    return this.http.get<AssignmentResponse>(`${this.base}/assignment/${id}`);
  }

  createAssignment(body: unknown) {
    return this.http.post<AssignmentResponse>(`${this.base}/assignment`, body);
  }

  updateAssignment(id: number, body: unknown) {
    return this.http.put<AssignmentResponse>(`${this.base}/assignment/${id}`, body);
  }

  deleteAssignment(id: number) {
    return this.http.delete(`${this.base}/assignment/${id}`);
  }

  submitAssignment(id: number, body: unknown) {
    return this.http.post(`${this.base}/assignment/${id}/submit`, body);
  }

  getMySubmission(id: number) {
    return this.http.get<MyAssignmentSubmissionResponse>(`${this.base}/assignment/${id}/my-submission`);
  }

  getPendingSubmissions(courseId?: number) {
    const params = courseId ? `?courseId=${courseId}` : '';
    return this.http.get<PendingSubmissionResponse[]>(`${this.base}/assignment/pending-submissions${params}`);
  }

  getAssessments(moduleId?: number) {
    const params = moduleId ? `?moduleId=${moduleId}` : '';
    return this.http.get<AssessmentResponse[]>(`${this.base}/assessment${params}`);
  }

  gradeAssignment(body: unknown) {
    return this.http.post<AssignmentGradeResponse>(`${this.base}/grade/assignment`, body);
  }

  getAssessmentGrades(studentId?: number) {
    const params = studentId ? `?studentId=${studentId}` : '';
    return this.http.get<AssessmentGradeResponse[]>(`${this.base}/grade/assessments${params}`);
  }

  getModuleFinalGrade(moduleId: number, studentId?: number) {
    const params = studentId ? `?studentId=${studentId}` : '';
    return this.http.get<ModuleFinalGradeResponse>(`${this.base}/grade/modules/${moduleId}/final${params}`);
  }

  releaseModuleGrades(moduleId: number) {
    return this.http.post<ModuleGradeReleaseResponse>(`${this.base}/grade/modules/${moduleId}/release`, {});
  }

  getMyGrades() {
    return this.http.get<AssignmentGradeResponse[]>(`${this.base}/grade/assignments`);
  }

  getAttendanceSessions(moduleId: number) {
    return this.http.get<AttendanceSessionResponse[]>(`${this.base}/attendance/modules/${moduleId}/sessions`);
  }

  createAttendanceSession(body: unknown) {
    return this.http.post<AttendanceSessionResponse>(`${this.base}/attendance/sessions`, body);
  }

  getAttendancePercentage(moduleId: number, studentId?: number) {
    const params = studentId ? `?studentId=${studentId}` : '';
    return this.http.get<AttendancePercentageResponse>(`${this.base}/attendance/modules/${moduleId}/percentage${params}`);
  }

  getTimetableSlots(moduleId?: number) {
    const params = moduleId ? `?moduleId=${moduleId}` : '';
    return this.http.get<TimetableSlotResponse[]>(`${this.base}/timetable/slots${params}`);
  }

  createTimetableSlot(body: unknown) {
    return this.http.post<TimetableSlotResponse>(`${this.base}/timetable/slots`, body);
  }

  updateTimetableSlot(id: number, body: unknown) {
    return this.http.put<TimetableSlotResponse>(`${this.base}/timetable/slots/${id}`, body);
  }

  deleteTimetableSlot(id: number) {
    return this.http.delete(`${this.base}/timetable/slots/${id}`);
  }

  getTimetableEvents(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return this.http.get<TimetableSessionEventResponse[]>(`${this.base}/timetable/events?${params}`);
  }

  getTimetableExceptions(timetableSlotId?: number) {
    const params = timetableSlotId ? `?timetableSlotId=${timetableSlotId}` : '';
    return this.http.get<TimetableExceptionResponse[]>(`${this.base}/timetable/exceptions${params}`);
  }

  createTimetableException(body: unknown) {
    return this.http.post<TimetableExceptionResponse>(`${this.base}/timetable/exceptions`, body);
  }

  getNotifications() {
    return this.http.get<NotificationResponse[]>(`${this.base}/notification?userId=${this.auth.userId()}`);
  }

  getUnreadCount() {
    return this.http.get<{ count: number }>(`${this.base}/notification/unread-count?userId=${this.auth.userId()}`);
  }

  markRead(id: number) {
    return this.http.patch(`${this.base}/notification/${id}/read`, {});
  }

  markAllRead() {
    return this.http.patch(`${this.base}/notification/read-all?userId=${this.auth.userId()}`, {});
  }

  getProgressSummary() {
    return this.http.get<ProgressSummaryResponse>(`${this.base}/progress/${this.auth.userId()}`);
  }

  getUsers() {
    return this.http.get<UserResponse[]>(`${this.base}/user`);
  }

  getUser(id: number) {
    return this.http.get<UserResponse>(`${this.base}/user/${id}`);
  }

  updateUser(id: number, body: unknown) {
    return this.http.put<UserResponse>(`${this.base}/user/${id}`, body);
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.base}/user/${id}`);
  }

  getCalendarEvents(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return this.http.get<CalendarEventResponse[]>(`${this.base}/calendar?${params}`);
  }
}
