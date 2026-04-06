import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AttendanceSessionResponse } from '../../core/models';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header fade-up">
        <div>
          <h1>Attendance</h1>
          <p>Track attendance sessions by module</p>
        </div>
        @if (auth.isInstructor() || auth.isAdmin()) {
          <button class="btn primary" (click)="showCreate.set(true)">+ New Session</button>
        }
      </div>

      <!-- Module selector -->
      <div class="module-selector fade-up fade-up-1">
        <div class="field" style="max-width:300px">
          <label>Module ID</label>
          <input type="number" [(ngModel)]="moduleId" placeholder="Enter module ID" (keyup.enter)="load()"/>
        </div>
        <button class="btn secondary" (click)="load()">Load Sessions</button>
      </div>

      @if (loading()) {
        <div class="skeleton" style="height:200px"></div>
      } @else if (sessions().length === 0 && searched()) {
        <div class="card empty-state">
          <div class="icon">✅</div>
          <h3>No sessions found</h3>
          <p>No attendance sessions recorded for this module</p>
        </div>
      } @else {
        @for (s of sessions(); track s.id) {
          <div class="card session-card fade-up fade-up-2">
            <div class="session-header">
              <div>
                <h3>Session — {{ s.date | date:'fullDate' }}</h3>
                <div class="text-sm text-muted">Module #{{ s.moduleId }}</div>
              </div>
              <div class="session-stats">
                <span class="stat-chip green">{{ presentCount(s) }} present</span>
                <span class="stat-chip red">{{ absentCount(s) }} absent</span>
              </div>
            </div>

            <!-- Attendance rate bar -->
            <div class="attendance-bar">
              <div class="flex justify-between text-xs text-muted mb-4">
                <span>Attendance rate</span>
                <span>{{ attendanceRate(s) | number:'1.0-0' }}%</span>
              </div>
              <div class="progress-bar" [class]="attendanceRate(s) < 75 ? 'warn' : ''">
                <div class="fill" [style.width.%]="attendanceRate(s)"></div>
              </div>
            </div>

            <table class="lms-table mt-16">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (r of s.records; track r.id) {
                  <tr>
                    <td>{{ r.studentName }}</td>
                    <td>
                      <span class="stat-chip" [class]="r.isPresent ? 'green' : 'red'">
                        {{ r.isPresent ? '✓ Present' : '✕ Absent' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>

    <!-- Create Session Modal -->
    @if (showCreate()) {
      <div class="modal-backdrop" (click)="showCreate.set(false)">
        <div class="modal" style="max-width:600px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Create Attendance Session</h2>
            <button class="btn secondary sm" (click)="showCreate.set(false)">✕</button>
          </div>

          <div class="flex-col gap-16">
            <div class="field">
              <label>Module ID</label>
              <input type="number" [(ngModel)]="newSession.moduleId" placeholder="Module ID"/>
            </div>
            <div class="field">
              <label>Date</label>
              <input type="date" [(ngModel)]="newSession.date"/>
            </div>

            <div>
              <h4 class="mb-8">Student Records</h4>
              <p class="text-sm text-muted mb-16">Add student IDs and mark attendance</p>
              @for (r of newSession.records; track $index; let i = $index) {
                <div class="student-row">
                  <input type="number" [(ngModel)]="r.studentId" placeholder="Student ID" class="student-id-input"/>
                  <label class="toggle-label">
                    <input type="checkbox" [(ngModel)]="r.isPresent"/>
                    Present
                  </label>
                  <button class="btn secondary sm" (click)="removeRecord(i)">✕</button>
                </div>
              }
              <button class="btn secondary sm mt-8" (click)="addRecord()">+ Add Student</button>
            </div>
          </div>

          <div class="modal-footer">
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
    .module-selector { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 24px; }
    .session-card { margin-bottom: 16px; }
    .session-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .session-stats { display: flex; gap: 8px; }
    .attendance-bar { margin-bottom: 8px; }
    .mt-16 { margin-top: 16px; }
    .mb-4  { margin-bottom: 4px; }
    .mb-8  { margin-bottom: 8px; }
    .mb-16 { margin-bottom: 16px; }
    .mt-8  { margin-top: 8px; }
    .student-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .student-id-input { padding: 8px 12px; border: 1.5px solid var(--lms-border); border-radius: var(--lms-radius-sm); font-family: 'DM Sans',sans-serif; font-size: 14px; width: 140px; }
    .toggle-label { display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; }
  `]
})
export class AttendanceComponent implements OnInit {
  auth     = inject(AuthService);
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  sessions   = signal<AttendanceSessionResponse[]>([]);
  loading    = signal(false);
  showCreate = signal(false);
  saving     = signal(false);
  searched   = signal(false);
  moduleId   = '';

  newSession = {
    moduleId: 0,
    date: '',
    records: [{ studentId: 0, isPresent: true }]
  };

  presentCount = (s: AttendanceSessionResponse) => s.records.filter(r => r.isPresent).length;
  absentCount  = (s: AttendanceSessionResponse) => s.records.filter(r => !r.isPresent).length;
  attendanceRate = (s: AttendanceSessionResponse) =>
    s.records.length ? (this.presentCount(s) / s.records.length) * 100 : 0;

  ngOnInit() {}

  load() {
    if (!this.moduleId) return;
    this.loading.set(true);
    this.searched.set(true);
    this.api.getAttendanceSessions(Number(this.moduleId)).subscribe({
      next: ss => { this.sessions.set(ss); this.loading.set(false); },
      error: () => { this.sessions.set([]); this.loading.set(false); }
    });
  }

  addRecord()       { this.newSession.records.push({ studentId: 0, isPresent: true }); }
  removeRecord(i: number) { this.newSession.records.splice(i, 1); }

  createSession() {
    if (!this.newSession.moduleId || !this.newSession.date) return;
    this.saving.set(true);
    this.api.createAttendanceSession({
      moduleId: Number(this.newSession.moduleId),
      date: new Date(this.newSession.date).toISOString(),
      records: this.newSession.records.map(r => ({ studentId: Number(r.studentId), isPresent: r.isPresent }))
    }).subscribe({
      next: s => {
        this.toast.success('Session created!');
        this.sessions.update(ss => [s, ...ss]);
        this.showCreate.set(false);
        this.saving.set(false);
      },
      error: (e) => { this.toast.error(e.error?.message ?? 'Failed'); this.saving.set(false); }
    });
  }
}
