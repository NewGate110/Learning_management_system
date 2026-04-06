import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AssignmentGradeResponse } from '../../core/models';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header fade-up">
      <h1 class="page-title">Grades</h1>
      <p class="page-desc">Your graded assignments</p>
    </div>
    <div class="page-content">

      @if (grades().length > 0) {
        <div class="stats-grid fade-up">
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value">{{ grades().length }}</div>
            <div class="stat-label">Graded</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-value" [style.color]="avgColor()">{{ average() | number:'1.1-1' }}</div>
            <div class="stat-label">Average Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-value" style="color:var(--green)">{{ highest() }}</div>
            <div class="stat-label">Highest Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📉</div>
            <div class="stat-value" style="color:var(--red)">{{ lowest() }}</div>
            <div class="stat-label">Lowest Score</div>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="loading"><div class="loading-spinner"></div>Loading…</div>
      } @else if (grades().length === 0) {
        <div class="card"><div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-title">No grades yet</div><div class="empty-desc">Grades appear once your assignments are reviewed</div></div></div>
      } @else {
        <div class="card fade-up">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Assignment</th><th>Score</th><th>Feedback</th><th>Graded At</th></tr></thead>
              <tbody>
                @for (g of grades(); track g.id) {
                  <tr>
                    <td>
                      <div class="font-medium">Assignment #{{ g.assignmentId }}</div>
                      <div class="text-muted text-sm">Module #{{ g.moduleId }}</div>
                    </td>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <span class="score-big" [class]="scoreClass(g.score)">{{ g.score | number:'1.0-0' }}</span>
                        <div style="flex:1;min-width:80px">
                          <div class="progress-bar">
                            <div class="progress-fill" [class]="scoreClass(g.score)" [style.width.%]="g.score"></div>
                          </div>
                          <div class="text-sm text-muted" style="margin-top:2px">/100</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="text-muted" style="font-size:13px;max-width:250px;display:block">{{ g.feedback || '—' }}</span></td>
                    <td class="text-muted text-sm">{{ g.gradedAt | date:'MMM d, y' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .score-big { font-family: 'DM Serif Display',serif; font-size: 24px; letter-spacing: -1px; line-height: 1; }
    .score-big.good { color: var(--green); }
    .score-big.ok   { color: var(--yellow); }
    .score-big.bad  { color: var(--red); }
  `]
})
export class GradesComponent implements OnInit {
  auth     = inject(AuthService);
  private api = inject(ApiService);

  grades  = signal<AssignmentGradeResponse[]>([]);
  loading = signal(true);

  average  = computed(() => this.grades().length ? this.grades().reduce((a, g) => a + g.score, 0) / this.grades().length : 0);
  highest  = computed(() => this.grades().length ? Math.max(...this.grades().map(g => g.score)) : 0);
  lowest   = computed(() => this.grades().length ? Math.min(...this.grades().map(g => g.score)) : 0);
  avgColor = computed(() => this.average() >= 75 ? 'var(--green)' : this.average() >= 50 ? 'var(--yellow)' : 'var(--red)');

  scoreClass(s: number) { return s >= 75 ? 'good' : s >= 50 ? 'ok' : 'bad'; }

  ngOnInit() {
    this.api.getMyGrades().subscribe({ next: gs => { this.grades.set(gs); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
}
