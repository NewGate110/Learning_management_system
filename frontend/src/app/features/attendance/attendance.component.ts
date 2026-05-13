import { Title } from '@angular/platform-browser';
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AttendanceSessionResponse, ModuleSummaryResponse, UserResponse } from '../../core/models';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header fade-up">
        <div>
          <h1 class="page-title">Attendance</h1>
          <p class="page-desc">Track attendance sessions by module</p>
        </div>
        @if (auth.isInstructor() || auth.isAdmin()) {
          <button class="btn primary" (click)="openCreate()">+ New Session</button>
        }
      </div>

      <!-- Module selector dropdown -->
      <div class="module-selector fade-up">
        <div class="field" style="max-width:360px">
          <label class="form-label">Select Module</label>
          @if (loadingModules()) {
            <div class="form-input text-muted">Loading modules…</div>
          } @else if (modules().length === 0) {
            <div class="form-input text-muted">No modules available</div>
          } @else {
            <select class="form-input" [(ngModel)]="selectedModuleId" (ngModelChange)="load()">
              <option value="">— Choose a module —</option>
              @for (m of modules(); track m.id) {
                <option [value]="m.id">{{ m.title }}</option>
              }
            </select>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton" style="height:200px;border-radius:12px"></div>
      } @else if (sessions().length === 0 && selectedModuleId) {
        <div class="card">
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <div class="empty-title">No sessions found</div>
            <div class="empty-desc">No attendance sessions recorded for this module yet</div>
          </div>
        </div>
      } @else {
        @for (s of sessions(); track s.id) {
          <div class="card fade-up" style="margin-bottom:16px">
            <div class="session-header">
              <div>
                <div class="card-title">Session — {{ s.date | date:'fullDate' }}</div>
                <div class="text-sm text-muted">{{ moduleName(s.moduleId) }}</div>
              </div>
              <div style="display:flex;gap:8px">
                <span class="badge badge-green">{{ presentCount(s) }} present</span>
                <span class="badge badge-red">{{ absentCount(s) }} absent</span>
              </div>
            </div>

            <!-- Attendance rate -->
            <div style="margin:12px 0 16px">
              <div class="flex-between text-xs text-muted mb-8">
                <span>Attendance rate</span>
                <span>{{ attendanceRate(s) | number:'1.0-0' }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill"
                  [class.green]="attendanceRate(s) >= 75"
                  [class.red]="attendanceRate(s) < 50"
                  [style.width.%]="attendanceRate(s)">
                </div>
              </div>
            </div>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>Student</th><th>Status</th></tr>
                </thead>
                <tbody>
                  @for (r of s.records; track r.id) {
                    <tr>
                      <td>{{ r.studentName }}</td>
                      <td>
                        <span class="badge" [class]="r.isPresent ? 'badge-green' : 'badge-red'">
                          {{ r.isPresent ? '✓ Present' : '✕ Absent' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>

    <!-- Create Session Modal -->
    @if (showCreate()) {
      <div class="modal-overlay" (click)="showCreate.set(false)">
        <div class="modal" style="max-width:600px" (click)="$event.stopPropagation()">
          <div class="modal-title">Create Attendance Session</div>

          <div class="form-group">
            <label class="form-label">Module</label>
            <select class="form-input" [(ngModel)]="newSession.moduleId">
              <option value="">— Choose a module —</option>
              @for (m of modules(); track m.id) {
                <option [value]="m.id">{{ m.title }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="form-input" type="date" [(ngModel)]="newSession.date"/>
          </div>

          <div style="margin-bottom:16px">
            <div class="font-semibold mb-8">Student Records</div>
            @if (loadingStudents()) {
              <div class="text-muted text-sm">Loading students…</div>
            } @else if (students().length === 0) {
              <div class="text-muted text-sm">No students found. Add manually below.</div>
              @for (r of newSession.records; track $index; let i = $index) {
                <div class="student-row">
                  <input class="form-input" style="width:140px" type="number"
                    [(ngModel)]="r.studentId" placeholder="Student ID"/>
                  <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer">
                    <input type="checkbox" [(ngModel)]="r.isPresent"/> Present
                  </label>
                  <button class="btn secondary sm" (click)="removeRecord(i)">✕</button>
                </div>
              }
              <button class="btn secondary sm" style="margin-top:8px" (click)="addRecord()">+ Add Student</button>
            } @else {
              <div class="students-list">
                @for (s of students(); track s.id) {
                  <div class="student-check-row">
                    <span class="student-name">{{ s.name }}</span>
                    <div class="toggle-group">
                      <label class="toggle-option" [class.selected]="isPresent(s.id)">
                        <input type="radio" [name]="'student-'+s.id" [value]="true"
                          [checked]="isPresent(s.id)" (change)="setPresent(s.id, true)"/>
                        ✓ Present
                      </label>
                      <label class="toggle-option absent" [class.selected]="!isPresent(s.id)">
                        <input type="radio" [name]="'student-'+s.id" [value]="false"
                          [checked]="!isPresent(s.id)" (change)="setPresent(s.id, false)"/>
                        ✕ Absent
                      </label>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <div class="modal-actions">
            <button class="btn secondary" (click)="showCreate.set(false)">Cancel</button>
            <button class="btn primary" (click)="createSession()" [disabled]="saving()">
              {{ saving() ? 'Creating…' : 'Create Session' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; }
    .module-selector { margin-bottom: 24px; }
    .session-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
    .mb-8 { margin-bottom: 8px; }
    .student-row { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
    .students-list { display:flex; flex-direction:column; gap:8px; }
    .student-check-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; background: var(--surface2);
      border-radius: var(--radius-sm); border: 1px solid var(--border);
    }
    .student-name { font-size: 14px; font-weight: 500; color: var(--text); }
    .toggle-group { display: flex; gap: 6px; }
    .toggle-option {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;
      cursor: pointer; border: 1.5px solid var(--border);
      color: var(--text-secondary); background: var(--surface);
      transition: all .15s;
    }
    .toggle-option input { display: none; }
    .toggle-option.selected { background: var(--green-dim); color: var(--green); border-color: var(--green); }
    .toggle-option.absent.selected { background: var(--red-dim); color: var(--red); border-color: var(--red); }
  `]
})
export class AttendanceComponent implements OnInit {
  auth          = inject(AuthService);
  private api   = inject(ApiService);
  private title = inject(Title);
  private toast = inject(ToastService);

  sessions        = signal<AttendanceSessionResponse[]>([]);
  modules         = signal<ModuleSummaryResponse[]>([]);
  students        = signal<UserResponse[]>([]);
  loading         = signal(false);
  loadingModules  = signal(true);
  loadingStudents = signal(false);
  showCreate      = signal(false);
  saving          = signal(false);
  selectedModuleId: number | string = '';

  // Track present/absent per student in the create form
  private attendanceMap = new Map<number, boolean>();

  newSession = { moduleId: 0, date: '', records: [{ studentId: 0, isPresent: true }] };

  presentCount   = (s: AttendanceSessionResponse) => s.records.filter(r => r.isPresent).length;
  absentCount    = (s: AttendanceSessionResponse) => s.records.filter(r => !r.isPresent).length;
  attendanceRate = (s: AttendanceSessionResponse) =>
    s.records.length ? (this.presentCount(s) / s.records.length) * 100 : 0;
  moduleName     = (id: number) => this.modules().find(m => m.id === id)?.title ?? `Module #${id}`;
  isPresent      = (studentId: number) => this.attendanceMap.get(studentId) ?? true;

  setPresent(studentId: number, value: boolean) {
    this.attendanceMap.set(studentId, value);
    // Force change detection by updating the students signal
    this.students.update(s => [...s]);
  }

  ngOnInit() {
    this.title.setTitle('Attendance — CollegeLMS');
    this.api.getModules().subscribe({
      next: ms => { this.modules.set(ms); this.loadingModules.set(false); },
      error: () => this.loadingModules.set(false)
    });
  }

  load() {
    if (!this.selectedModuleId) return;
    this.loading.set(true);
    this.api.getAttendanceSessions(Number(this.selectedModuleId)).subscribe({
      next: ss => { this.sessions.set(ss); this.loading.set(false); },
      error: () => { this.sessions.set([]); this.loading.set(false); }
    });
  }

  openCreate() {
    this.attendanceMap.clear();
    this.newSession = { moduleId: Number(this.selectedModuleId) || 0, date: '', records: [] };
    this.showCreate.set(true);
    this.loadingStudents.set(true);

    // Find the course ID for the selected module
    const selectedModule = this.modules().find(m => m.id === Number(this.selectedModuleId));
    if (!selectedModule) {
      this.loadingStudents.set(false);
      return;
    }

    // Fetch course detail to get enrolled student IDs and names
    // (instructor has access to their own course details)
    this.api.getCourse(selectedModule.courseId).subscribe({
      next: course => {
        // Build student list from existing attendance session records
        // since course.studentIds is just numbers, not names
        this.api.getAttendanceSessions(Number(this.selectedModuleId)).subscribe({
          next: sessions => {
            // Extract unique students from existing session records
            const studentMap = new Map<number, string>();
            sessions.forEach(s =>
              s.records.forEach(r => studentMap.set(r.studentId, r.studentName))
            );

            if (studentMap.size > 0) {
              // We have student names from previous sessions
              const students = Array.from(studentMap.entries()).map(([id, name]) =>
                ({ id, name, email: '', role: 'Student', enrolledCourseIds: [], taughtCourseIds: [] })
              );
              this.students.set(students);
              students.forEach(s => this.attendanceMap.set(s.id, true));
            } else {
              // No previous sessions — fall back to manual entry
              this.students.set([]);
              this.newSession.records = [{ studentId: 0, isPresent: true }];
            }
            this.loadingStudents.set(false);
          },
          error: () => { this.students.set([]); this.loadingStudents.set(false); }
        });
      },
      error: () => { this.students.set([]); this.loadingStudents.set(false); }
    });
  }

  addRecord()         { this.newSession.records.push({ studentId: 0, isPresent: true }); }
  removeRecord(i: number) { this.newSession.records.splice(i, 1); }

  createSession() {
    if (!this.newSession.moduleId || !this.newSession.date) {
      this.toast.error('Please select a module and date');
      return;
    }
    this.saving.set(true);

    // Build records from student toggles if students were loaded, else from manual entries
    const records = this.students().length > 0
      ? this.students().map(s => ({ studentId: s.id, isPresent: this.attendanceMap.get(s.id) ?? true }))
      : this.newSession.records.map(r => ({ studentId: Number(r.studentId), isPresent: r.isPresent }));

    this.api.createAttendanceSession({
      moduleId: Number(this.newSession.moduleId),
      date: new Date(this.newSession.date).toISOString(),
      records
    }).subscribe({
      next: s => {
        this.toast.success('Session created!');
        this.sessions.update(ss => [s, ...ss]);
        this.showCreate.set(false);
        this.saving.set(false);
      },
      error: (e) => { this.toast.error(e.error?.message ?? 'Failed to create session'); this.saving.set(false); }
    });
  }
}
