import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CourseResponse } from '../../core/models';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header fade-up">
      <h1 class="page-title">Courses</h1>
      <p class="page-desc">{{ courses().length }} courses available</p>
    </div>
    <div class="page-content">
      <div class="toolbar">
        <input class="search-input" [(ngModel)]="search" placeholder="Search courses…">
        @if (auth.isAdmin() || auth.isInstructor()) {
          <button class="btn primary" (click)="showModal.set(true)">+ New Course</button>
        }
      </div>

      @if (loading()) {
        <div class="loading"><div class="loading-spinner"></div>Loading…</div>
      } @else if (filtered().length === 0) {
        <div class="card"><div class="empty-state"><div class="empty-icon">📚</div><div class="empty-title">No courses found</div><div class="empty-desc">{{ search ? 'Try a different search' : 'No courses yet' }}</div></div></div>
      } @else {
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Course</th><th>Instructor</th><th>Students</th><th>Modules</th><th>Tasks</th><th>Actions</th></tr></thead>
              <tbody>
                @for (c of filtered(); track c.id) {
                  <tr>
                    <td>
                      <div class="font-medium">{{ c.title }}</div>
                      <div class="text-muted text-sm truncate" style="max-width:220px">{{ c.description }}</div>
                    </td>
                    <td class="text-muted">{{ c.instructorName }}</td>
                    <td>{{ c.studentCount }}</td>
                    <td>{{ c.moduleCount }}</td>
                    <td>{{ c.assignmentCount }}</td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <a [routerLink]="['/courses', c.id]" class="btn secondary sm">View</a>
                        <a [routerLink]="['/courses', c.id, 'modules']" class="btn secondary sm">Modules</a>
                        @if (auth.isAdmin()) {
                          <button class="btn danger sm" (click)="confirmDelete(c)">Delete</button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="showModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-title">New Course</div>
          <div class="form-group"><label class="form-label">Title</label><input class="form-input" [(ngModel)]="form.title" placeholder="Course title"></div>
          <div class="form-group"><label class="form-label">Description</label><textarea class="form-input" [(ngModel)]="form.description" rows="3"></textarea></div>
          <div class="form-group"><label class="form-label">Instructor ID</label><input class="form-input" type="number" [(ngModel)]="form.instructorId"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">Start Date</label><input class="form-input" type="date" [(ngModel)]="form.startDate"></div>
            <div class="form-group"><label class="form-label">End Date</label><input class="form-input" type="date" [(ngModel)]="form.endDate"></div>
          </div>
          <div class="modal-actions">
            <button class="btn secondary" (click)="showModal.set(false)">Cancel</button>
            <button class="btn primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Creating…' : 'Create Course' }}</button>
          </div>
        </div>
      </div>
    }

    @if (deleteTarget()) {
      <div class="modal-overlay" (click)="deleteTarget.set(null)">
        <div class="modal" style="max-width:400px" (click)="$event.stopPropagation()">
          <div class="modal-title">Delete Course?</div>
          <p style="color:var(--muted);font-size:14px">Are you sure you want to delete <strong style="color:var(--text)">{{ deleteTarget()!.title }}</strong>? This cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn secondary" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="btn danger" (click)="doDelete()" [disabled]="saving()">Delete</button>
          </div>
        </div>
      </div>
    }
  `
})
export class CoursesComponent implements OnInit {
  auth  = inject(AuthService);
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  courses     = signal<CourseResponse[]>([]);
  loading     = signal(true);
  showModal   = signal(false);
  saving      = signal(false);
  deleteTarget = signal<CourseResponse | null>(null);
  search = '';
  form = { title: '', description: '', instructorId: 0, startDate: '', endDate: '' };

  filtered() {
    const q = this.search.toLowerCase();
    return this.courses().filter(c => c.title.toLowerCase().includes(q) || c.instructorName.toLowerCase().includes(q));
  }

  ngOnInit() {
    this.api.getCourses().subscribe({ next: cs => { this.courses.set(cs); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  save() {
    if (!this.form.title) return;
    this.saving.set(true);
    this.api.createCourse({ title: this.form.title, description: this.form.description, instructorId: Number(this.form.instructorId), startDate: this.form.startDate || null, endDate: this.form.endDate || null, studentIds: [] }).subscribe({
      next: () => { this.toast.success('Course created!'); this.saving.set(false); this.showModal.set(false); this.ngOnInit(); },
      error: (e) => { this.toast.error(e.error?.message ?? 'Failed'); this.saving.set(false); }
    });
  }

  confirmDelete(c: CourseResponse) { this.deleteTarget.set(c); }

  doDelete() {
    this.saving.set(true);
    this.api.deleteCourse(this.deleteTarget()!.id).subscribe({
      next: () => { this.toast.success('Deleted'); this.courses.update(cs => cs.filter(c => c.id !== this.deleteTarget()!.id)); this.deleteTarget.set(null); this.saving.set(false); },
      error: () => { this.toast.error('Delete failed'); this.saving.set(false); }
    });
  }
}
