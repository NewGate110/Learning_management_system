import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CourseDetailResponse, ModuleSummaryResponse, StudentDashboardResponse, StudentModuleSummary } from '../../core/models';

@Component({
  selector: 'app-course-modules',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header fade-up">
      @if (course()) {
        <div>
          <a [routerLink]="['/courses', course()!.id]" class="back-link">← Course overview</a>
          <h1 class="page-title">{{ course()!.title }} Modules</h1>
          <p class="page-desc">{{ orderedModules().length }} modules in this course</p>
        </div>
      } @else {
        <div>
          <h1 class="page-title">Modules</h1>
          <p class="page-desc">Course module list</p>
        </div>
      }
    </div>

    <div class="page-content">
      @if (loading()) {
        <div class="loading"><div class="loading-spinner"></div>Loading...</div>
      } @else if (!course()) {
        <div class="card"><div class="empty-state"><div class="empty-title">Course not found</div></div></div>
      } @else {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ orderedModules().length }}</div>
            <div class="stat-label">Total Modules</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--green)">{{ completedCount() }}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--amber)">{{ lockedCount() }}</div>
            <div class="stat-label">Locked Sequential</div>
          </div>
        </div>

        <div class="module-grid">
          @for (module of orderedModules(); track module.id) {
            <a class="module-card card" [routerLink]="['/modules', module.id]">
              <div class="module-top">
                <div>
                  <div class="module-index">{{ modulePosition(module) }}</div>
                  <h2>{{ module.title }}</h2>
                </div>
                <div class="module-badges">
                  <span class="badge badge-gray">{{ module.type }}</span>
                  @if (studentStatus(module.id); as status) {
                    <span class="badge" [class]="statusBadge(status.status)">{{ status.status }}</span>
                  } @else {
                    <span class="badge badge-blue">{{ auth.role() }}</span>
                  }
                </div>
              </div>

              <p class="module-desc">{{ module.description || 'No description provided.' }}</p>

              <div class="detail-row">
                <span class="detail-key">Assignments</span>
                <span>{{ module.assignmentCount }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-key">Assessments</span>
                <span>{{ module.assessmentCount }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-key">Availability</span>
                <span class="flex-center gap-8">
                  @if (isLocked(module)) {
                    <span class="lock">🔒</span>
                    <span>Locked</span>
                  } @else {
                    <span>Open</span>
                  }
                </span>
              </div>

              <div class="module-progress">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                  <span class="text-sm text-muted">Progress</span>
                  <span class="text-sm text-muted">{{ progressValue(module.id) }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [class]="progressBarClass(module.id)" [style.width.%]="progressValue(module.id)"></div>
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .back-link { font-size: 13px; color: var(--muted); display: inline-block; margin-bottom: 8px; }
    .module-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }
    .module-card {
      display: block;
      color: inherit;
      text-decoration: none;
      transition: transform .15s ease, border-color .15s ease;
    }
    .module-card:hover {
      transform: translateY(-2px);
      border-color: var(--blue);
    }
    .module-top {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .module-top h2 { font-size: 1.2rem; }
    .module-index {
      color: var(--blue);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .6px;
      margin-bottom: 6px;
    }
    .module-badges {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .module-desc {
      color: var(--muted);
      font-size: 13px;
      min-height: 42px;
      margin-bottom: 12px;
    }
    .module-progress { margin-top: 16px; }
    .lock { font-size: 14px; }
  `]
})
export class CourseModulesComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  auth = inject(AuthService);
  loading = signal(true);
  course = signal<CourseDetailResponse | null>(null);
  studentDashboard = signal<StudentDashboardResponse | null>(null);

  ngOnInit() {
    const courseId = Number(this.route.snapshot.paramMap.get('id'));
    const studentDashboard$ = this.auth.isStudent() ? this.api.getStudentDashboard() : of(null);

    forkJoin({
      course: this.api.getCourse(courseId),
      studentDashboard: studentDashboard$
    }).subscribe({
      next: ({ course, studentDashboard }) => {
        this.course.set(course);
        this.studentDashboard.set(studentDashboard);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  orderedModules() {
    return [...(this.course()?.modules ?? [])].sort((a, b) => {
      if (a.type === 'Sequential' && b.type === 'Sequential') {
        return a.order - b.order;
      }
      if (a.type === 'Sequential') {
        return -1;
      }
      if (b.type === 'Sequential') {
        return 1;
      }
      return a.title.localeCompare(b.title);
    });
  }

  studentStatus(moduleId: number): StudentModuleSummary | undefined {
    return this.studentDashboard()?.modules.find(module => module.moduleId === moduleId);
  }

  modulePosition(module: ModuleSummaryResponse) {
    return `Module ${this.orderedModules().findIndex(item => item.id === module.id) + 1}`;
  }

  isLocked(module: ModuleSummaryResponse) {
    if (!this.auth.isStudent() || module.type !== 'Sequential') {
      return false;
    }

    const previousSequential = this.orderedModules()
      .filter(item => item.type === 'Sequential' && item.order < module.order);

    return previousSequential.some(item => this.studentStatus(item.id)?.status !== 'Passed');
  }

  progressValue(moduleId: number) {
    const status = this.studentStatus(moduleId)?.status;
    if (status === 'Passed') {
      return 100;
    }
    if (status === 'Failed') {
      return 100;
    }
    if (this.isLocked(this.orderedModules().find(module => module.id === moduleId)!)) {
      return 0;
    }
    return status === 'InProgress' ? 55 : 20;
  }

  progressBarClass(moduleId: number) {
    const status = this.studentStatus(moduleId)?.status;
    if (status === 'Passed') {
      return 'green';
    }
    if (status === 'Failed') {
      return 'red';
    }
    return '';
  }

  statusBadge(status: string) {
    if (status === 'Passed') {
      return 'badge-green';
    }
    if (status === 'Failed') {
      return 'badge-red';
    }
    return 'badge-accent';
  }

  completedCount() {
    return this.studentDashboard()?.modules.filter(module => module.status === 'Passed').length ?? 0;
  }

  lockedCount() {
    return this.orderedModules().filter(module => this.isLocked(module)).length;
  }
}
