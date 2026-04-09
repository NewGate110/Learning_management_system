import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AssessmentGradeResponse, AssessmentResponse } from '../../core/models';

@Component({
  selector: 'app-assessments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header fade-up">
      <h1 class="page-title">Assessments</h1>
      <p class="page-desc">Upcoming exams, practicals, and released grades</p>
    </div>

    <div class="page-content">
      <div class="toolbar">
        <input class="search-input" [(ngModel)]="search" placeholder="Search by title or module...">
      </div>

      @if (loading()) {
        <div class="loading"><div class="loading-spinner"></div>Loading...</div>
      } @else if (!filteredAssessments().length) {
        <div class="card"><div class="empty-state"><div class="empty-title">No assessments found</div></div></div>
      } @else {
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Module</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                @for (assessment of filteredAssessments(); track assessment.id) {
                  <tr>
                    <td>
                      <div class="font-medium">{{ assessment.title }}</div>
                      <div class="text-muted text-sm">{{ assessment.location || 'No location set' }}</div>
                    </td>
                    <td>
                      <a [routerLink]="['/modules', assessment.moduleId]" class="text-sm">{{ assessment.moduleTitle }}</a>
                    </td>
                    <td class="text-muted text-sm">
                      {{ assessment.scheduledAt | date:'EEE, MMM d, y h:mm a' }}
                    </td>
                    <td>{{ assessment.duration }} mins</td>
                    <td>
                      @if (gradeFor(assessment.id); as grade) {
                        <span class="badge badge-green">{{ grade.score | number:'1.0-0' }}</span>
                      } @else {
                        <span class="badge badge-gray">{{ auth.isStudent() ? 'Pending' : 'Not released' }}</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class AssessmentsComponent {
  private api = inject(ApiService);
  auth = inject(AuthService);

  loading = signal(true);
  assessments = signal<AssessmentResponse[]>([]);
  assessmentGrades = signal<AssessmentGradeResponse[]>([]);
  search = '';

  ngOnInit() {
    const grades$ = this.auth.isStudent()
      ? this.api.getAssessmentGrades()
      : of([] as AssessmentGradeResponse[]);

    forkJoin({
      assessments: this.api.getAssessments(),
      grades: grades$
    }).subscribe({
      next: ({ assessments, grades }) => {
        this.assessments.set(assessments);
        this.assessmentGrades.set(grades);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filteredAssessments() {
    const query = this.search.trim().toLowerCase();
    return this.assessments().filter(assessment =>
      !query ||
      assessment.title.toLowerCase().includes(query) ||
      assessment.moduleTitle.toLowerCase().includes(query));
  }

  gradeFor(assessmentId: number) {
    return this.assessmentGrades().find(grade => grade.assessmentId === assessmentId);
  }
}
