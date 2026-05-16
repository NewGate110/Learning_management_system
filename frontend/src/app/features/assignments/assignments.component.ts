import { Title } from '@angular/platform-browser';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header fade-up">
        <div>
          <h1>Assignments</h1>
          <p>{{ auth.isStudent() ? 'Your assignments and submissions' : 'Pending submissions to grade' }}</p>
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton" style="height:300px"></div>
      } @else if (submissions().length === 0) {
        <div class="card empty-state">
          <div class="icon">📝</div>
          <h3>No pending submissions</h3>
          <p>{{ auth.isStudent() ? 'Submit assignments through your course modules' : 'All submissions have been graded' }}</p>
        </div>
      } @else {
        <div class="card fade-up fade-up-1">
          <table class="">
            <thead>
              <tr>
                <th>Student</th>
                <th>Assignment</th>
                <th>Submitted</th>
                <th>File</th>
                @if (!auth.isStudent()) { <th>Action</th> }
              </tr>
            </thead>
            <tbody>
              @for (s of submissions(); track s.id) {
                <tr>
                  <td>
                    <div class="font-medium">{{ s.studentName }}</div>
                    <div class="text-xs text-muted">ID: {{ s.studentId }}</div>
                  </td>
                  <td>
                    <div class="font-medium">{{ s.assignmentTitle }}</div>
                    <div class="text-xs text-muted">{{ s.moduleTitle }}</div>
                  </td>
                  <td>
                    <div class="text-sm">{{ s.submittedAt | date:'MMM d, y' }}</div>
                    <div class="text-xs text-muted">{{ s.submittedAt | date:'h:mm a' }}</div>
                  </td>
                  <td>
                    <a [href]="s.fileUrl" target="_blank" class="btn secondary sm">View File</a>
                  </td>
                  @if (!auth.isStudent()) {
                    <td>
                      <button class="btn primary sm" (click)="openGrade(s)">Grade</button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Grade Modal -->
    @if (grading()) {
      <div class="modal-backdrop" (click)="grading.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Grade Submission</h2>
            <button class="btn secondary sm" (click)="grading.set(null)">✕</button>
          </div>
          <div class="grade-info">
            <p><strong>{{ grading()!.studentName }}</strong></p>
            <p class="text-sm text-muted">{{ grading()!.assignmentTitle }}</p>
            <a [href]="grading()!.fileUrl" target="_blank" class="btn secondary sm mt-8">View Submission</a>
          </div>
          <div class="flex-col gap-16 mt-16">
            <div class="field">
              <label>Score (0–100)</label>
              <input type="number" [(ngModel)]="score" min="0" max="100" placeholder="85"/>
            </div>
            <div class="field">
              <label>Feedback</label>
              <textarea [(ngModel)]="feedback" placeholder="Provide detailed feedback…"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn secondary" (click)="grading.set(null)">Cancel</button>
            <button class="btn primary" (click)="submitGrade()" [disabled]="saving()">
              {{ saving() ? 'Submitting…' : 'Submit Grade' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .grade-info { background: var(--surface); padding: 14px; border-radius: var(--radius-sm); }
    .mt-8 { margin-top: 8px; }
    .mt-16 { margin-top: 16px; }
  `]
})
export class AssignmentsComponent implements OnInit {
  auth     = inject(AuthService);
  private api   = inject(ApiService);
  private title = inject(Title);
  private toast = inject(ToastService);

  submissions = signal<any[]>([]);
  loading     = signal(true);
  grading     = signal<any>(null);
  saving      = signal(false);
  score = 0;
  feedback = '';

  ngOnInit() {
    this.title.setTitle('Assignments — CollegeLMS');
    this.api.getPendingSubmissions().subscribe({
      next: s => { this.submissions.set(s); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openGrade(s: any) {
    this.grading.set(s);
    this.score = 0;
    this.feedback = '';
  }

  submitGrade() {
    if (this.score < 0 || this.score > 100) return;
    this.saving.set(true);
    this.api.gradeAssignment({
      submissionId: this.grading()!.id,
      score: Number(this.score),
      feedback: this.feedback
    }).subscribe({
      next: () => {
        this.toast.success('Grade submitted!');
        this.submissions.update(ss => ss.filter(s => s.id !== this.grading()!.id));
        this.grading.set(null);
        this.saving.set(false);
      },
      error: (e) => { this.toast.error(e.error?.message ?? 'Failed'); this.saving.set(false); }
    });
  }
}
