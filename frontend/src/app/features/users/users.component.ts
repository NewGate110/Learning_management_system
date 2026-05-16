import { Title } from '@angular/platform-browser';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { UserResponse } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header fade-up">
      <h1 class="page-title">Users</h1>
      <p class="page-desc">{{ users().length }} registered users</p>
    </div>
    <div class="page-content">
      <div class="toolbar">
        <input class="search-input" [(ngModel)]="search" placeholder="Search by name or email…">
        <select class="form-input" [(ngModel)]="roleFilter" style="width:auto;min-width:140px;background:var(--surface2)">
          <option value="">All roles</option>
          <option value="Student">Students</option>
          <option value="Instructor">Instructors</option>
          <option value="Admin">Admins</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading"><div class="loading-spinner"></div>Loading…</div>
      } @else if (filtered().length === 0) {
        <div class="card"><div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">No users found</div></div></div>
      } @else {
        <div class="card fade-up">
          <div class="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Role</th><th>Courses</th><th>Teaching</th><th>Actions</th></tr></thead>
              <tbody>
                @for (u of filtered(); track u.id) {
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="user-av">{{ u.name.charAt(0) }}</div>
                        <div>
                          <div class="font-medium">{{ u.name }}</div>
                          <div class="text-muted text-sm">{{ u.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge" [class]="u.role === 'Admin' ? 'badge-red' : u.role === 'Instructor' ? 'badge-accent' : 'badge-blue'">{{ u.role }}</span>
                    </td>
                    <td>{{ u.enrolledCourseIds.length }}</td>
                    <td>{{ u.taughtCourseIds.length }}</td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn secondary sm" (click)="openEdit(u)">Edit</button>
                        <button class="btn danger sm" (click)="confirmDelete(u)">Delete</button>
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

    @if (editing()) {
      <div class="modal-overlay" (click)="editing.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-title">Edit User</div>
          <div class="form-group"><label class="form-label">Name</label><input class="form-input" [(ngModel)]="eForm.name"></div>
          <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" [(ngModel)]="eForm.email"></div>
          <div class="form-group">
            <label class="form-label">Role</label>
            <select class="form-input" [(ngModel)]="eForm.role">
              <option value="Student">Student</option>
              <option value="Instructor">Instructor</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn secondary" (click)="editing.set(null)">Cancel</button>
            <button class="btn primary" (click)="saveEdit()" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button>
          </div>
        </div>
      </div>
    }

    @if (deleteTarget()) {
      <div class="modal-overlay" (click)="deleteTarget.set(null)">
        <div class="modal" style="max-width:400px" (click)="$event.stopPropagation()">
          <div class="modal-title">Delete User?</div>
          <p style="color:var(--muted);font-size:14px">Delete <strong style="color:var(--text)">{{ deleteTarget()!.name }}</strong>? This cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn secondary" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="btn danger" (click)="doDelete()" [disabled]="saving()">Delete</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .user-av {
      width: 32px; height: 32px;
      background: var(--accent-dim);
      border: 1px solid var(--blue);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 600;
      color: var(--blue);
      flex-shrink: 0;
    }
  `]
})
export class UsersComponent implements OnInit {
  private api   = inject(ApiService);
  private title = inject(Title);
  private toast = inject(ToastService);

  users       = signal<UserResponse[]>([]);
  loading     = signal(true);
  editing     = signal<UserResponse | null>(null);
  deleteTarget = signal<UserResponse | null>(null);
  saving      = signal(false);
  search = ''; roleFilter = '';
  eForm = { name: '', email: '', role: 'Student' };

  filtered() {
    const q = this.search.toLowerCase();
    return this.users().filter(u => (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) && (!this.roleFilter || u.role === this.roleFilter));
  }

  ngOnInit() {
    this.title.setTitle('Users — CollegeLMS');
    this.api.getUsers().subscribe({ next: us => { this.users.set(us); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  openEdit(u: UserResponse) { this.editing.set(u); this.eForm = { name: u.name, email: u.email, role: u.role }; }

  saveEdit() {
    this.saving.set(true);
    this.api.updateUser(this.editing()!.id, this.eForm).subscribe({
      next: updated => { this.users.update(us => us.map(u => u.id === updated.id ? updated : u)); this.toast.success('Updated!'); this.editing.set(null); this.saving.set(false); },
      error: (e) => { this.toast.error(e.error?.message ?? 'Failed'); this.saving.set(false); }
    });
  }

  confirmDelete(u: UserResponse) { this.deleteTarget.set(u); }

  doDelete() {
    this.saving.set(true);
    this.api.deleteUser(this.deleteTarget()!.id).subscribe({
      next: () => { this.users.update(us => us.filter(u => u.id !== this.deleteTarget()!.id)); this.toast.success('Deleted'); this.deleteTarget.set(null); this.saving.set(false); },
      error: () => { this.toast.error('Failed'); this.saving.set(false); }
    });
  }
}
