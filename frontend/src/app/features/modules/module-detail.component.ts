import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  AssessmentGradeResponse,
  AssessmentResponse,
  AssignmentResponse,
  AttendancePercentageResponse,
  ModuleSummaryResponse,
  MyAssignmentSubmissionResponse,
  TimetableExceptionResponse,
  TimetableSlotResponse,
} from '../../core/models';

interface AssignmentViewModel {
  assignment: AssignmentResponse;
  submission: MyAssignmentSubmissionResponse | null;
}

interface SessionViewModel {
  slot: TimetableSlotResponse;
  latestException: TimetableExceptionResponse | null;
}

@Component({
  selector: 'app-module-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header fade-up">
      @if (module()) {
        <div>
          <a [routerLink]="['/courses', module()!.courseId, 'modules']" class="back-link">← Course modules</a>
          <h1 class="page-title">{{ module()!.title }}</h1>
          <p class="page-desc">{{ module()!.type }} module</p>
        </div>
      } @else {
        <div>
          <h1 class="page-title">Module</h1>
          <p class="page-desc">Module detail</p>
        </div>
      }
    </div>

    <div class="page-content">
      @if (loading()) {
        <div class="loading"><div class="loading-spinner"></div>Loading...</div>
      } @else if (!module()) {
        <div class="card"><div class="empty-state"><div class="empty-title">Module not found</div></div></div>
      } @else {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ assignments().length }}</div>
            <div class="stat-label">Assignments</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--yellow)">{{ assessments().length }}</div>
            <div class="stat-label">Assessments</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--blue)">{{ sessions().length }}</div>
            <div class="stat-label">Timetable Slots</div>
          </div>
          @if (attendance()) {
            <div class="stat-card">
              <div class="stat-value" [style.color]="attendanceLocked() ? 'var(--red)' : 'var(--green)'">
                {{ attendance()!.percentage | number:'1.0-0' }}%
              </div>
              <div class="stat-label">Attendance</div>
            </div>
          }
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Overview</span>
          </div>
          <p class="module-description">{{ module()!.description || 'No description provided.' }}</p>
          @if (attendanceLocked()) {
            <div class="warning-banner">
              Attendance is below 80%. Assignment submissions are currently locked for this module.
            </div>
          }
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Assignments</span>
          </div>
          @if (!assignmentRows().length) {
            <div class="empty-state" style="padding:24px"><div class="empty-title">No assignments yet</div></div>
          } @else {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Submission</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of assignmentRows(); track row.assignment.id) {
                    <tr>
                      <td>
                        <div class="font-medium">{{ row.assignment.title }}</div>
                        <div class="text-muted text-sm">{{ row.assignment.description || 'No description' }}</div>
                      </td>
                      <td class="text-muted text-sm">{{ row.assignment.deadline | date:'MMM d, y h:mm a' }}</td>
                      <td>
                        <span class="badge" [class]="assignmentStatusBadge(row)">
                          {{ assignmentStatusLabel(row) }}
                        </span>
                      </td>
                      <td>
                        @if (row.submission?.fileUrl) {
                          <a [href]="row.submission!.fileUrl" target="_blank" class="btn secondary sm">View</a>
                        } @else {
                          <span class="text-muted text-sm">No file</span>
                        }
                      </td>
                      <td>
                        @if (auth.isStudent()) {
                          @if (attendanceLocked()) {
                            <span class="badge badge-red">Locked</span>
                          } @else {
                            <button class="btn primary sm" (click)="openSubmit(row.assignment)">
                              {{ row.submission?.submissionId ? 'Resubmit' : 'Submit' }}
                            </button>
                          }
                        } @else {
                          <span class="text-muted text-sm">{{ row.assignment.submissionCount }} submissions</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Assessments</span>
            </div>
            @if (!assessments().length) {
              <div class="empty-state" style="padding:24px"><div class="empty-title">No assessments scheduled</div></div>
            } @else {
              @for (assessment of assessments(); track assessment.id) {
                <div class="detail-row" style="align-items:flex-start">
                  <div>
                    <div class="font-medium">{{ assessment.title }}</div>
                    <div class="text-muted text-sm">
                      {{ assessment.scheduledAt | date:'EEE, MMM d h:mm a' }} • {{ assessment.duration }} mins
                    </div>
                    @if (assessment.location) {
                      <div class="text-muted text-sm">{{ assessment.location }}</div>
                    }
                  </div>
                  @if (assessmentGrade(assessment.id); as grade) {
                    <span class="badge badge-green">{{ grade.score | number:'1.0-0' }}</span>
                  } @else {
                    <span class="badge badge-gray">{{ auth.isStudent() ? 'Pending' : 'Scheduled' }}</span>
                  }
                </div>
              }
            }
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title">Timetable Sessions</span>
            </div>
            @if (!sessions().length) {
              <div class="empty-state" style="padding:24px"><div class="empty-title">No timetable sessions</div></div>
            } @else {
              @for (session of sessions(); track session.slot.id) {
                <div class="detail-row" style="align-items:flex-start">
                  <div>
                    <div class="font-medium">{{ session.slot.dayOfWeek }} • {{ session.slot.startTime.slice(0, 5) }} - {{ session.slot.endTime.slice(0, 5) }}</div>
                    <div class="text-muted text-sm">{{ session.slot.location }}</div>
                    @if (session.latestException) {
                      <div class="text-muted text-sm">
                        {{ session.latestException.status }} on {{ session.latestException.date | date:'MMM d, y' }}
                      </div>
                    }
                  </div>
                  @if (session.latestException?.status === 'Cancelled') {
                    <span class="badge badge-red">Cancelled</span>
                  } @else if (session.latestException?.status === 'Rescheduled') {
                    <span class="badge badge-yellow">Rescheduled</span>
                  } @else {
                    <span class="badge badge-green">Active</span>
                  }
                </div>
              }
            }
          </div>
        </div>
      }
    </div>

    @if (showSubmitModal()) {
      <div class="modal-overlay" (click)="closeSubmit()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-title">Submit Assignment</div>
          <p class="text-muted text-sm" style="margin-bottom:16px">{{ submitTarget()?.title }}</p>
          <div class="form-group">
            <label class="form-label">File URL</label>
            <input class="form-input" [(ngModel)]="submitUrl" placeholder="https://example.com/submission.zip">
          </div>
          <div class="modal-actions">
            <button class="btn secondary" (click)="closeSubmit()">Cancel</button>
            <button class="btn primary" (click)="submitAssignment()" [disabled]="saving()">
              {{ saving() ? 'Submitting...' : 'Submit' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .back-link { font-size: 13px; color: var(--muted); display: inline-block; margin-bottom: 8px; }
    .module-description { color: var(--muted); }
    .warning-banner {
      margin-top: 16px;
      background: var(--red-dim);
      color: var(--red);
      border: 1px solid rgba(249,112,102,.2);
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      font-size: 13px;
    }
  `]
})
export class ModuleDetailComponent {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  auth = this.authService;
  loading = signal(true);
  saving = signal(false);
  module = signal<ModuleSummaryResponse | null>(null);
  assignments = signal<AssignmentResponse[]>([]);
  assessments = signal<AssessmentResponse[]>([]);
  assignmentRows = signal<AssignmentViewModel[]>([]);
  sessions = signal<SessionViewModel[]>([]);
  attendance = signal<AttendancePercentageResponse | null>(null);
  assessmentGrades = signal<AssessmentGradeResponse[]>([]);
  showSubmitModal = signal(false);
  submitTarget = signal<AssignmentResponse | null>(null);
  submitUrl = '';

  ngOnInit() {
    const moduleId = Number(this.route.snapshot.paramMap.get('id'));
    const attendance$ = this.auth.isStudent()
      ? this.api.getAttendancePercentage(moduleId).pipe(catchError(() => of(null)))
      : of(null);
    const assessmentGrades$ = this.auth.isStudent()
      ? this.api.getAssessmentGrades().pipe(catchError(() => of([] as AssessmentGradeResponse[])))
      : of([] as AssessmentGradeResponse[]);

    forkJoin({
      module: this.api.getModule(moduleId),
      assignments: this.api.getAssignments(moduleId),
      assessments: this.api.getAssessments(moduleId),
      slots: this.api.getTimetableSlots(moduleId),
      exceptions: this.api.getTimetableExceptions().pipe(catchError(() => of([] as TimetableExceptionResponse[]))),
      attendance: attendance$,
      assessmentGrades: assessmentGrades$
    }).subscribe({
      next: ({ module, assignments, assessments, slots, exceptions, attendance, assessmentGrades }) => {
        this.module.set(module);
        this.assignments.set(assignments);
        this.assessments.set(assessments);
        this.attendance.set(attendance);
        this.assessmentGrades.set(assessmentGrades);
        this.sessions.set(this.buildSessions(slots, exceptions));
        this.loadAssignmentRows(assignments);
      },
      error: () => this.loading.set(false)
    });
  }

  attendanceLocked() {
    return this.auth.isStudent() && (this.attendance()?.percentage ?? 100) < 80;
  }

  assessmentGrade(assessmentId: number) {
    return this.assessmentGrades().find(grade => grade.assessmentId === assessmentId);
  }

  assignmentStatusLabel(row: AssignmentViewModel) {
    if (!row.submission || !row.submission.submissionId) {
      return 'Not Submitted';
    }
    if (row.submission.status === 'Graded') {
      return 'Graded';
    }
    return 'Submitted';
  }

  assignmentStatusBadge(row: AssignmentViewModel) {
    if (!row.submission || !row.submission.submissionId) {
      return 'badge-gray';
    }
    if (row.submission.status === 'Graded') {
      return 'badge-green';
    }
    return 'badge-blue';
  }

  openSubmit(assignment: AssignmentResponse) {
    this.submitTarget.set(assignment);
    this.submitUrl = '';
    this.showSubmitModal.set(true);
  }

  closeSubmit() {
    this.showSubmitModal.set(false);
    this.submitTarget.set(null);
    this.submitUrl = '';
  }

  submitAssignment() {
    if (!this.submitTarget() || !this.submitUrl) {
      return;
    }

    this.saving.set(true);
    this.api.submitAssignment(this.submitTarget()!.id, { fileUrl: this.submitUrl }).subscribe({
      next: () => {
        this.toast.success('Assignment submitted.');
        this.api.getMySubmission(this.submitTarget()!.id).subscribe({
          next: submission => {
            this.assignmentRows.update(rows => rows.map(row =>
              row.assignment.id === this.submitTarget()!.id ? { ...row, submission } : row));
            this.closeSubmit();
            this.saving.set(false);
          },
          error: () => {
            this.closeSubmit();
            this.saving.set(false);
          }
        });
      },
      error: (e) => {
        this.toast.error(e.error?.message ?? 'Failed to submit assignment');
        this.saving.set(false);
      }
    });
  }

  private loadAssignmentRows(assignments: AssignmentResponse[]) {
    if (!this.auth.isStudent() || assignments.length === 0) {
      this.assignmentRows.set(assignments.map(assignment => ({ assignment, submission: null })));
      this.loading.set(false);
      return;
    }

    forkJoin(
      assignments.map(assignment =>
        this.api.getMySubmission(assignment.id).pipe(
          catchError(() => of({
            assignmentId: assignment.id,
            studentId: 0,
            status: 'NotSubmitted'
          } as MyAssignmentSubmissionResponse))
        )
      )
    ).subscribe({
      next: submissions => {
        this.assignmentRows.set(assignments.map((assignment, index) => ({
          assignment,
          submission: submissions[index] ?? null
        })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private buildSessions(slots: TimetableSlotResponse[], exceptions: TimetableExceptionResponse[]) {
    return slots.map(slot => ({
      slot,
      latestException: exceptions
        .filter(item => item.timetableSlotId === slot.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ?? null
    }));
  }
}
