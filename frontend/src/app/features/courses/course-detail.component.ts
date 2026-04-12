import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CourseDetailResponse, ModuleSummaryResponse, AssignmentResponse } from '../../core/models';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      @if (loading()) {
        <div class="skeleton" style="height:80px;margin-bottom:24px"></div>
      } @else if (course()) {
        <div class="page-header fade-up">
          <div>
            <a routerLink="/courses" class="back-link">← Courses</a>
            <h1>{{ course()!.title }}</h1>
            <p>{{ course()!.instructorName }} · {{ course()!.studentIds.length }} students</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <a [routerLink]="['/courses', course()!.id, 'modules']" class="btn secondary">Open Modules</a>
            @if (auth.isAdmin() || auth.isInstructor()) {
              <button class="btn primary" (click)="showModuleModal.set(true)">+ Add Module</button>
            }
          </div>
        </div>

        <p class="course-desc fade-up fade-up-1">{{ course()!.description }}</p>

        @if (course()!.startDate || course()!.endDate) {
          <div class="date-row fade-up fade-up-1">
            @if (course()!.startDate) {
              <span class="stat-chip grey">Start: {{ course()!.startDate | date:'mediumDate' }}</span>
            }
            @if (course()!.endDate) {
              <span class="stat-chip grey">End: {{ course()!.endDate | date:'mediumDate' }}</span>
            }
          </div>
        }

        <!-- Modules -->
        <h2 class="section-title fade-up fade-up-2">Modules</h2>
        @if (course()!.modules.length === 0) {
          <div class="card empty-state"><div class="icon">📦</div><h3>No modules yet</h3></div>
        } @else {
          <div class="modules-list fade-up fade-up-2">
            @for (m of course()!.modules; track m.id) {
              <div class="module-row card" [class.expanded]="expandedModule() === m.id">
                <div class="module-header" (click)="toggleModule(m.id)">
                  <div class="module-order">{{ m.order + 1 }}</div>
                  <div class="flex-1">
                    <div class="font-medium">{{ m.title }}</div>
                    <div class="text-sm text-muted">{{ m.type }}</div>
                  </div>
                  <div class="flex gap-8 items-center">
                    <span class="stat-chip grey">{{ m.assignmentCount }} tasks</span>
                    <span class="chevron">{{ expandedModule() === m.id ? '▲' : '▼' }}</span>
                  </div>
                </div>

                @if (expandedModule() === m.id) {
                  <div class="module-body">
                    <p class="text-sm text-muted">{{ m.description }}</p>
                    <!-- Assignments for this module -->
                    <div class="assignments-section">
                      <div class="flex justify-between items-center mb-16">
                        <h4>Assignments</h4>
                        @if (auth.isInstructor() || auth.isAdmin()) {
                          <button class="btn secondary sm" (click)="openAssignment(m)">+ Assignment</button>
                        }
                      </div>
                      @for (a of moduleAssignments(m.id); track a.id) {
                        <div class="assignment-row">
                          <div class="flex-1">
                            <div class="font-medium text-sm">{{ a.title }}</div>
                            <div class="text-xs text-muted">Due: {{ a.deadline | date:'MMM d, y h:mm a' }}</div>
                          </div>
                          <span class="stat-chip" [class]="deadlineChip(a.deadline)">
                            {{ deadlineLabel(a.deadline) }}
                          </span>
                          @if (auth.isStudent()) {
                            <button class="btn primary sm" (click)="openSubmit(a)">Submit</button>
                          }
                        </div>
                      }
                      @if (!moduleAssignments(m.id).length) {
                        <p class="text-sm text-muted">No assignments in this module</p>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>

    <!-- Add Module Modal -->
    @if (showModuleModal()) {
      <div class="modal-backdrop" (click)="showModuleModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Add Module</h2>
            <button class="btn secondary sm" (click)="showModuleModal.set(false)">✕</button>
          </div>
          <div class="flex-col gap-16">
            <div class="field"><label>Title</label><input [(ngModel)]="mForm.title" placeholder="Module title"/></div>
            <div class="field"><label>Description</label><textarea [(ngModel)]="mForm.description"></textarea></div>
            <div class="field">
              <label>Type</label>
              <select [(ngModel)]="mForm.type">
                <option value="Lecture">Lecture</option>
                <option value="Lab">Lab</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Seminar">Seminar</option>
                <option value="Workshop">Workshop</option>
              </select>
            </div>
            <div class="field"><label>Order</label><input type="number" [(ngModel)]="mForm.order"/></div>
          </div>
          <div class="modal-footer">
            <button class="btn secondary" (click)="showModuleModal.set(false)">Cancel</button>
            <button class="btn primary" (click)="saveModule()" [disabled]="saving()">
              {{ saving() ? 'Saving…' : 'Add Module' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Add Assignment Modal -->
    @if (showAssignmentModal()) {
      <div class="modal-backdrop" (click)="showAssignmentModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Add Assignment</h2>
            <button class="btn secondary sm" (click)="showAssignmentModal.set(false)">✕</button>
          </div>
          <div class="flex-col gap-16">
            <div class="field"><label>Title</label><input [(ngModel)]="aForm.title" placeholder="Assignment title"/></div>
            <div class="field"><label>Description</label><textarea [(ngModel)]="aForm.description"></textarea></div>
            <div class="field"><label>Deadline</label><input type="datetime-local" [(ngModel)]="aForm.deadline"/></div>
          </div>
          <div class="modal-footer">
            <button class="btn secondary" (click)="showAssignmentModal.set(false)">Cancel</button>
            <button class="btn primary" (click)="saveAssignment()" [disabled]="saving()">
              {{ saving() ? 'Saving…' : 'Add Assignment' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Submit Assignment Modal -->
    @if (showSubmitModal()) {
      <div class="modal-backdrop" (click)="showSubmitModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Submit Assignment</h2>
            <button class="btn secondary sm" (click)="showSubmitModal.set(false)">✕</button>
          </div>
          <p class="text-sm text-muted mb-16">{{ submitTarget()?.title }}</p>
          <div class="field"><label>File URL</label><input [(ngModel)]="submitUrl" placeholder="https://…"/></div>
          <div class="modal-footer">
            <button class="btn secondary" (click)="showSubmitModal.set(false)">Cancel</button>
            <button class="btn primary" (click)="submitAssignment()" [disabled]="saving()">Submit</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .back-link { font-size: 13px; color: var(--lms-muted); display: block; margin-bottom: 8px; }
    .back-link:hover { color: var(--lms-accent); }
    .course-desc { color: var(--lms-muted); margin-bottom: 16px; max-width: 700px; }
    .date-row { display: flex; gap: 8px; margin-bottom: 32px; }
    .section-title { font-size: 1.3rem; margin-bottom: 16px; }
    .modules-list { display: flex; flex-direction: column; gap: 12px; }
    .module-row { padding: 0; overflow: hidden; }
    .module-header { display: flex; align-items: center; gap: 16px; padding: 18px 24px; cursor: pointer; }
    .module-header:hover { background: var(--lms-surface); }
    .module-order { width: 32px; height: 32px; background: var(--lms-accent-pale); color: var(--lms-accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }
    .flex-1 { flex: 1; }
    .chevron { color: var(--lms-muted); font-size: 12px; }
    .module-body { padding: 0 24px 24px; border-top: 1px solid var(--lms-border); padding-top: 16px; }
    .assignments-section { margin-top: 16px; }
    .assignment-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--lms-border); }
    .assignment-row:last-child { border-bottom: none; }
    .mb-16 { margin-bottom: 16px; }
  `]
})
export class CourseDetailComponent implements OnInit {
  auth      = inject(AuthService);
  private api   = inject(ApiService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  course         = signal<CourseDetailResponse | null>(null);
  loading        = signal(true);
  expandedModule = signal<number | null>(null);
  showModuleModal     = signal(false);
  showAssignmentModal = signal(false);
  showSubmitModal     = signal(false);
  saving         = signal(false);
  submitTarget   = signal<AssignmentResponse | null>(null);
  submitUrl      = '';
  activeModuleId = 0;

  mForm = { title: '', description: '', type: 'Lecture', order: 0 };
  aForm = { title: '', description: '', deadline: '' };

  moduleAssignments(moduleId: number) {
    return this.course()?.assignments.filter(a => a.moduleId === moduleId) ?? [];
  }

  deadlineChip(d: string) {
    const hrs = (new Date(d).getTime() - Date.now()) / 3600000;
    return hrs < 0 ? 'red' : hrs < 48 ? 'amber' : 'green';
  }
  deadlineLabel(d: string) {
    const hrs = (new Date(d).getTime() - Date.now()) / 3600000;
    return hrs < 0 ? 'Past due' : hrs < 48 ? 'Due soon' : 'Open';
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getCourse(id).subscribe({
      next: c => { this.course.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  toggleModule(id: number) {
    this.expandedModule.set(this.expandedModule() === id ? null : id);
  }

  openAssignment(m: ModuleSummaryResponse) {
    this.activeModuleId = m.id;
    this.aForm = { title: '', description: '', deadline: '' };
    this.showAssignmentModal.set(true);
  }

  openSubmit(a: AssignmentResponse) {
    this.submitTarget.set(a);
    this.submitUrl = '';
    this.showSubmitModal.set(true);
  }

  saveModule() {
    if (!this.mForm.title) return;
    this.saving.set(true);
    this.api.createModule({
      courseId: this.course()!.id,
      title: this.mForm.title,
      description: this.mForm.description,
      type: this.mForm.type,
      order: Number(this.mForm.order)
    }).subscribe({
      next: () => {
        this.toast.success('Module added!');
        this.saving.set(false);
        this.showModuleModal.set(false);
        this.ngOnInit();
      },
      error: (e) => { this.toast.error(e.error?.message ?? 'Failed'); this.saving.set(false); }
    });
  }

  saveAssignment() {
    if (!this.aForm.title || !this.aForm.deadline) return;
    this.saving.set(true);
    this.api.createAssignment({
      moduleId: this.activeModuleId,
      title: this.aForm.title,
      description: this.aForm.description,
      deadline: new Date(this.aForm.deadline).toISOString()
    }).subscribe({
      next: () => {
        this.toast.success('Assignment added!');
        this.saving.set(false);
        this.showAssignmentModal.set(false);
        this.ngOnInit();
      },
      error: (e) => { this.toast.error(e.error?.message ?? 'Failed'); this.saving.set(false); }
    });
  }

  submitAssignment() {
    if (!this.submitUrl) return;
    this.saving.set(true);
    this.api.submitAssignment(this.submitTarget()!.id, { fileUrl: this.submitUrl }).subscribe({
      next: () => {
        this.toast.success('Submitted!');
        this.saving.set(false);
        this.showSubmitModal.set(false);
      },
      error: (e) => { this.toast.error(e.error?.message ?? 'Failed'); this.saving.set(false); }
    });
  }
}
