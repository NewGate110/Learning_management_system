import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ProgressSummaryResponse } from '../../core/models';
import { GradeLineChartComponent } from '../../components/progress-charts/grade-line-chart/grade-line-chart.component';
import { SubmissionRateChartComponent } from '../../components/progress-charts/submission-rate-chart/submission-rate-chart.component';
import { CourseProgressBarComponent } from '../../components/progress-charts/course-progress-bar/course-progress-bar.component';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, GradeLineChartComponent, SubmissionRateChartComponent, CourseProgressBarComponent],
  template: `
    <div class="page-header fade-up">
      <h1 class="page-title">Progress</h1>
      <p class="page-desc">Your academic performance overview</p>
    </div>
    <div class="page-content">

      @if (loading()) {
        <div class="loading"><div class="loading-spinner"></div>Loading…</div>
      } @else if (data()) {

        <div class="stats-grid fade-up">
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value">{{ data()!.submissions.totalAssignments }}</div>
            <div class="stat-label">Total Assignments</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value" style="color:var(--green)">{{ data()!.submissions.submitted }}</div>
            <div class="stat-label">Submitted</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏰</div>
            <div class="stat-value" style="color:var(--yellow)">{{ data()!.submissions.onTime }}</div>
            <div class="stat-label">On Time</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🕐</div>
            <div class="stat-value" style="color:var(--red)">{{ data()!.submissions.late }}</div>
            <div class="stat-label">Late</div>
          </div>
        </div>

        <div class="grid-2">
          <!-- Grade trend -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Grade Trend</span>
              <span class="badge" [class]="avgBadge()">Avg: {{ data()!.gradeTrend.averageScore | number:'1.1-1' }}</span>
            </div>
            @if (data()!.gradeTrend.points.length === 0) {
              <div class="empty-state" style="padding:32px"><div class="empty-icon">📊</div><div class="empty-title">No data yet</div></div>
            } @else {
              <div class="chart-area">
                @for (p of data()!.gradeTrend.points; track $index) {
                  <div class="chart-bar-wrap">
                    <div class="chart-score" [style.color]="p.score >= 75 ? 'var(--green)' : p.score >= 50 ? 'var(--yellow)' : 'var(--red)'">{{ p.score | number:'1.0-0' }}</div>
                    <div class="chart-bar-bg">
                      <div class="chart-bar-fill" [style.height.%]="p.score"
                           [style.background]="p.score >= 75 ? 'var(--green)' : p.score >= 50 ? 'var(--yellow)' : 'var(--red)'"></div>
                    </div>
                    <div class="chart-label">{{ p.label | slice:0:12 }}</div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Submission rate -->
          <div class="card">
            <div class="card-header"><span class="card-title">Submission Rate</span></div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:20px">
              <div class="ring-wrap">
                <svg width="120" height="120" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" stroke-width="8"/>
                  <circle cx="50" cy="50" r="42" fill="none"
                          stroke="var(--accent)"
                          stroke-width="8"
                          [attr.stroke-dasharray]="circumference()"
                          [attr.stroke-dashoffset]="dashOffset()"
                          stroke-linecap="round"
                          transform="rotate(-90 50 50)"/>
                </svg>
                <div class="ring-label">
                  <div style="font-family:'DM Serif Display',serif;font-size:22px">{{ data()!.submissions.submissionRatePercentage | number:'1.0-0' }}%</div>
                  <div style="font-size:11px;color:var(--muted)">submitted</div>
                </div>
              </div>
              <div style="width:100%;display:flex;flex-direction:column;gap:8px">
                <div style="display:flex;justify-content:space-between;font-size:13px">
                  <span style="color:var(--green)">● On time</span><span>{{ data()!.submissions.onTime }}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:13px">
                  <span style="color:var(--yellow)">● Late</span><span>{{ data()!.submissions.late }}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:13px">
                  <span style="color:var(--muted)">● Pending</span><span>{{ data()!.submissions.pending }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Course completion -->
        <div class="card">
          <div class="card-header"><span class="card-title">Course Completion</span></div>
          @for (c of data()!.courses.courses; track c.courseId) {
            <div style="margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span class="font-medium">{{ c.courseTitle }}</span>
                <div style="display:flex;gap:8px;align-items:center">
                  <span class="text-muted text-sm">{{ c.submittedAssignments }}/{{ c.totalAssignments }}</span>
                  <span class="badge" [class]="c.averageScore >= 75 ? 'badge-green' : c.averageScore >= 50 ? 'badge-yellow' : 'badge-red'">{{ c.averageScore | number:'1.0-1' }}</span>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="c.completionPercentage"
                     [class]="c.completionPercentage >= 75 ? 'green' : c.completionPercentage >= 50 ? 'yellow' : 'red'"></div>
              </div>
              <div class="text-sm text-muted" style="margin-top:3px">{{ c.completionPercentage | number:'1.0-0' }}% complete</div>
            </div>
          }
          @if (!data()!.courses.courses.length) {
            <div class="empty-state" style="padding:24px"><div class="empty-icon">📚</div><div class="empty-title">No course data</div></div>
          }
        </div>

        <!-- Upcoming deadlines -->
        @if (data()!.upcomingDeadlines.assignments.length) {
          <div class="card">
            <div class="card-header"><span class="card-title">Upcoming Deadlines</span></div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Assignment</th><th>Course</th><th>Deadline</th><th>Time Left</th></tr></thead>
                <tbody>
                  @for (d of data()!.upcomingDeadlines.assignments; track d.assignmentId) {
                    <tr>
                      <td class="font-medium">{{ d.title }}</td>
                      <td class="text-muted">{{ d.courseTitle }}</td>
                      <td class="text-muted text-sm">{{ d.deadline | date:'MMM d, h:mm a' }}</td>
                      <td>
                        <span class="badge" [class]="d.hoursRemaining < 24 ? 'badge-red' : d.hoursRemaining < 72 ? 'badge-yellow' : 'badge-green'">
                          {{ d.hoursRemaining | number:'1.0-0' }}h
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Interactive Charts -->
        <div class="page-header fade-up" style="margin-top:24px">
          <h2 class="page-title" style="font-size:1.25rem">Interactive Charts</h2>
        </div>
        <app-grade-line-chart [points]="data()!.gradeTrend.points" />
        <div class="grid-2" style="margin-top:16px">
          <app-submission-rate-chart [submissions]="data()!.submissions" />
          <app-course-progress-bar [courses]="data()!.courses.courses" />
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-area { display: flex; gap: 6px; align-items: flex-end; height: 140px; padding-top: 20px; }
    .chart-bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
    .chart-score { font-size: 11px; font-weight: 600; }
    .chart-bar-bg { width: 100%; flex: 1; background: var(--surface2); border-radius: 4px 4px 0 0; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden; }
    .chart-bar-fill { width: 100%; border-radius: 4px 4px 0 0; opacity: .85; transition: height .4s ease; }
    .chart-label { font-size: 9px; color: var(--muted); text-align: center; width: 100%; overflow: hidden; }
    .ring-wrap { position: relative; width: 120px; height: 120px; }
    .ring-wrap svg { position: absolute; inset: 0; }
    .ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  `]
})
export class ProgressComponent implements OnInit {
  private api = inject(ApiService);
  data    = signal<ProgressSummaryResponse | null>(null);
  loading = signal(true);

  circumference = () => 2 * Math.PI * 42;
  dashOffset    = () => this.circumference() * (1 - (this.data()?.submissions.submissionRatePercentage ?? 0) / 100);
  avgBadge      = () => { const a = this.data()?.gradeTrend.averageScore ?? 0; return a >= 75 ? 'badge-green' : a >= 50 ? 'badge-yellow' : 'badge-red'; };

  ngOnInit() {
    this.api.getProgressSummary().subscribe({ next: d => { this.data.set(d); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
}
