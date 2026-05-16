import { Title } from '@angular/platform-browser';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { StudentDashboardResponse, InstructorDashboardResponse, AdminDashboardResponse } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header fade-up">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-desc">Welcome back — {{ auth.role() }}</p>
    </div>

    <div class="page-content">

      @if (loading()) {
        <div class="loading"><div class="loading-spinner"></div>Loading…</div>
      }

      <!-- ── STUDENT ── -->
      @if (auth.isStudent() && student()) {
        <div class="stats-grid fade-up">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">{{ student()!.courses.length }}</div>
            <div class="stat-label">Enrolled Courses</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value" style="color:var(--green)">{{ completedCount() }}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-value" style="color:var(--blue)">{{ student()!.upcomingItems.length }}</div>
            <div class="stat-label">Upcoming Items</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-value" style="color:var(--amber)">{{ student()!.modules.length }}</div>
            <div class="stat-label">Modules</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header">
              <span class="card-title">My Courses</span>
              <a routerLink="/courses" class="btn secondary sm">View all</a>
            </div>
            @for (c of student()!.courses; track c.courseId) {
              <div class="detail-row" style="flex-direction:column;align-items:flex-start;gap:8px">
                <div style="display:flex;justify-content:space-between;width:100%;align-items:center">
                  <span class="font-medium">{{ c.courseTitle }}</span>
                  <span class="badge" [class]="c.isCompleted ? 'badge-green' : 'badge-accent'">
                    {{ c.isCompleted ? 'Complete' : 'In progress' }}
                  </span>
                </div>
                <div style="width:100%">
                  <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:4px">
                    <span>{{ c.passedRequiredModules }}/{{ c.totalRequiredModules }} modules</span>
                    <span>{{ c.totalRequiredModules ? ((c.passedRequiredModules/c.totalRequiredModules)*100|number:'1.0-0') : 0 }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" [class]="c.isCompleted ? 'green' : ''"
                         [style.width.%]="c.totalRequiredModules ? (c.passedRequiredModules/c.totalRequiredModules)*100 : 0"></div>
                  </div>
                </div>
              </div>
            }
            @if (!student()!.courses.length) {
              <div class="empty-state" style="padding:24px"><div class="empty-icon">📚</div><div class="empty-title">No courses yet</div></div>
            }
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title">Upcoming</span>
            </div>
            @for (item of student()!.upcomingItems.slice(0,8); track $index) {
              <div class="detail-row">
                <div>
                  <span class="badge" [class]="item.itemType === 'Assignment' ? 'badge-red' : item.itemType === 'Assessment' ? 'badge-yellow' : 'badge-blue'"
                        style="margin-right:8px">{{ item.itemType }}</span>
                  <span style="font-size:13.5px">{{ item.title }}</span>
                </div>
                <span class="text-muted text-sm">{{ item.startsAt | date:'MMM d' }}</span>
              </div>
            }
            @if (!student()!.upcomingItems.length) {
              <div class="empty-state" style="padding:24px"><div class="empty-icon">🎉</div><div class="empty-title">Nothing upcoming!</div></div>
            }
          </div>
        </div>

        <!-- Module progress -->
        <div class="card">
          <div class="card-header"><span class="card-title">Module Progress</span></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Module</th><th>Type</th><th>Status</th><th>Grade</th><th>Attendance</th></tr></thead>
              <tbody>
                @for (m of student()!.modules; track m.moduleId) {
                  <tr>
                    <td class="font-medium">{{ m.moduleTitle }}</td>
                    <td><span class="badge badge-gray">{{ m.type }}</span></td>
                    <td><span class="badge" [class]="m.status === 'Passed' ? 'badge-green' : m.status === 'Failed' ? 'badge-red' : 'badge-accent'">{{ m.status }}</span></td>
                    <td>
                      @if (m.finalGrade !== null && m.finalGrade !== undefined) {
                        <span [class]="'badge ' + (m.finalGrade >= 75 ? 'badge-green' : m.finalGrade >= 50 ? 'badge-yellow' : 'badge-red')">
                          {{ m.finalGrade | number:'1.0-1' }}%
                        </span>
                      } @else { <span class="text-muted">—</span> }
                    </td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px;min-width:120px">
                        <div class="progress-bar" style="flex:1">
                          <div class="progress-fill" [class]="m.attendancePercentage < 75 ? 'red' : 'green'"
                               [style.width.%]="m.attendancePercentage"></div>
                        </div>
                        <span class="text-sm text-muted">{{ m.attendancePercentage | number:'1.0-0' }}%</span>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ── INSTRUCTOR ── -->
      @if (auth.isInstructor() && instructor()) {
        <div class="stats-grid fade-up">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">{{ instructor()!.courses.length }}</div>
            <div class="stat-label">My Courses</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value" style="color:var(--amber)">{{ instructor()!.pendingSubmissionCount }}</div>
            <div class="stat-label">Pending Submissions</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🗓</div>
            <div class="stat-value" style="color:var(--blue)">{{ instructor()!.upcomingSessions.length }}</div>
            <div class="stat-label">Upcoming Sessions</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header"><span class="card-title">My Courses</span><a routerLink="/courses" class="btn secondary sm">View all</a></div>
            @for (c of instructor()!.courses; track c.id) {
              <div class="detail-row">
                <div>
                  <div class="font-medium">{{ c.title }}</div>
                  <div class="text-muted text-sm">{{ c.studentCount }} students · {{ c.moduleCount }} modules</div>
                </div>
                <a [routerLink]="['/courses', c.id]" class="btn secondary sm">View</a>
              </div>
            }
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">Upcoming Sessions</span></div>
            @for (s of instructor()!.upcomingSessions.slice(0,5); track $index) {
              <div class="detail-row">
                <div>
                  <div class="font-medium">{{ s.moduleTitle }}</div>
                  <div class="text-muted text-sm">{{ s.date | date:'EEE, MMM d' }} · {{ s.location }}</div>
                </div>
                @if (s.isCancelled) { <span class="badge badge-red">Cancelled</span> }
                @else if (s.isRescheduled) { <span class="badge badge-yellow">Rescheduled</span> }
                @else { <span class="badge badge-green">Scheduled</span> }
              </div>
            }
            @if (!instructor()!.upcomingSessions.length) {
              <div class="empty-state" style="padding:24px"><div class="empty-icon">📅</div><div class="empty-title">No upcoming sessions</div></div>
            }
          </div>
        </div>
      }

      <!-- ── ADMIN ── -->
      @if (auth.isAdmin() && admin()) {
        <div class="stats-grid fade-up">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-value">{{ admin()!.totalUsers }}</div>
            <div class="stat-label">Total Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value" style="color:var(--blue)">{{ admin()!.totalCourses }}</div>
            <div class="stat-label">Courses</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-value" style="color:var(--blue)">{{ admin()!.totalModules }}</div>
            <div class="stat-label">Modules</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value" style="color:var(--amber)">{{ admin()!.totalAssignments }}</div>
            <div class="stat-label">Assignments</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-value" style="color:var(--green)">{{ admin()!.totalAssessments }}</div>
            <div class="stat-label">Assessments</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔔</div>
            <div class="stat-value" [style.color]="admin()!.unreadNotificationCount > 0 ? 'var(--red)' : 'inherit'">{{ admin()!.unreadNotificationCount }}</div>
            <div class="stat-label">Unread Notifications</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header"><span class="card-title">System Stats</span></div>
            <div class="detail-row"><span class="detail-key">Timetable Slots</span><span>{{ admin()!.totalTimetableSlots }}</span></div>
            <div class="detail-row"><span class="detail-key">Timetable Exceptions</span><span>{{ admin()!.totalTimetableExceptions }}</span></div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">Quick Actions</span></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px">
              <a routerLink="/courses" class="btn secondary" style="justify-content:flex-start;gap:8px">📚 Courses</a>
              <a routerLink="/users"   class="btn secondary" style="justify-content:flex-start;gap:8px">👥 Users</a>
              <a routerLink="/timetable" class="btn secondary" style="justify-content:flex-start;gap:8px">🗓 Timetable</a>
              <a routerLink="/notifications" class="btn secondary" style="justify-content:flex-start;gap:8px">🔔 Notifications</a>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  auth       = inject(AuthService);
  private api = inject(ApiService);
  private title = inject(Title);

  loading    = signal(true);
  student    = signal<StudentDashboardResponse | null>(null);
  instructor = signal<InstructorDashboardResponse | null>(null);
  admin      = signal<AdminDashboardResponse | null>(null);

  completedCount = () => this.student()?.courses.filter(c => c.isCompleted).length ?? 0;

  ngOnInit() {
    this.title.setTitle('Dashboard — CollegeLMS');
    // Reset state on every navigation to this page
    this.loading.set(true);
    this.student.set(null);
    this.instructor.set(null);
    this.admin.set(null);

    const role = this.auth.role();
    if (role === 'Student') {
      this.api.getStudentDashboard().subscribe({ next: d => { this.student.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
    } else if (role === 'Instructor') {
      this.api.getInstructorDashboard().subscribe({ next: d => { this.instructor.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
    } else {
      this.api.getAdminDashboard().subscribe({ next: d => { this.admin.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
    }
  }
}
