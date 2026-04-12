import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CourseResponse, ModuleSummaryResponse, TimetableSlotResponse, UserResponse } from '../../core/models';

type AdminTab = 'users' | 'courses' | 'modules' | 'slots';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header fade-up">
      <h1 class="page-title">Admin Panel</h1>
      <p class="page-desc">Manage users, courses, modules, and timetable slots</p>
    </div>

    <div class="page-content">
      @if (!auth.isAdmin()) {
        <div class="card"><div class="empty-state"><div class="empty-title">Admin access required</div></div></div>
      } @else {
        <div class="section-tabs">
          <button class="section-tab" [class.active]="tab() === 'users'" (click)="tab.set('users')">Users</button>
          <button class="section-tab" [class.active]="tab() === 'courses'" (click)="tab.set('courses')">Courses</button>
          <button class="section-tab" [class.active]="tab() === 'modules'" (click)="tab.set('modules')">Modules</button>
          <button class="section-tab" [class.active]="tab() === 'slots'" (click)="tab.set('slots')">Timetable Slots</button>
        </div>

        @if (loading()) {
          <div class="loading"><div class="loading-spinner"></div>Loading...</div>
        } @else {
          @if (tab() === 'users') {
            <div class="grid-2">
              <div class="card">
                <div class="card-header"><span class="card-title">Users</span></div>
                <div class="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Role</th><th>Actions</th></tr></thead>
                    <tbody>
                      @for (user of users(); track user.id) {
                        <tr>
                          <td>
                            <div class="font-medium">{{ user.name }}</div>
                            <div class="text-muted text-sm">{{ user.email }}</div>
                          </td>
                          <td><span class="badge" [class]="user.role === 'Admin' ? 'badge-red' : user.role === 'Instructor' ? 'badge-accent' : 'badge-blue'">{{ user.role }}</span></td>
                          <td>
                            <div style="display:flex;gap:6px">
                              <button class="btn secondary sm" (click)="editUser(user)">Edit</button>
                              <button class="btn danger sm" (click)="deleteUser(user)">Delete</button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="card">
                <div class="card-header"><span class="card-title">{{ userForm.id ? 'Edit User' : 'Select a user' }}</span></div>
                @if (userForm.id) {
                  <div class="form-group"><label class="form-label">Name</label><input class="form-input" [(ngModel)]="userForm.name"></div>
                  <div class="form-group"><label class="form-label">Email</label><input class="form-input" [(ngModel)]="userForm.email"></div>
                  <div class="form-group">
                    <label class="form-label">Role</label>
                    <select class="form-input" [(ngModel)]="userForm.role">
                      <option value="Student">Student</option>
                      <option value="Instructor">Instructor</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div class="modal-actions">
                    <button class="btn secondary" (click)="resetUserForm()">Cancel</button>
                    <button class="btn primary" (click)="saveUser()" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Save User' }}</button>
                  </div>
                } @else {
                  <p class="text-muted">Choose a user from the list to edit or delete them.</p>
                }
              </div>
            </div>
          }

          @if (tab() === 'courses') {
            <div class="grid-2">
              <div class="card">
                <div class="card-header"><span class="card-title">Courses</span></div>
                <div class="table-wrap">
                  <table>
                    <thead><tr><th>Course</th><th>Instructor</th><th>Actions</th></tr></thead>
                    <tbody>
                      @for (course of courses(); track course.id) {
                        <tr>
                          <td>
                            <div class="font-medium">{{ course.title }}</div>
                            <div class="text-muted text-sm">{{ course.description }}</div>
                          </td>
                          <td>{{ course.instructorName }}</td>
                          <td>
                            <div style="display:flex;gap:6px">
                              <button class="btn secondary sm" (click)="editCourse(course)">Edit</button>
                              <button class="btn danger sm" (click)="deleteCourse(course)">Delete</button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="card">
                <div class="card-header"><span class="card-title">{{ courseForm.id ? 'Edit Course' : 'Create Course' }}</span></div>
                <div class="form-group"><label class="form-label">Title</label><input class="form-input" [(ngModel)]="courseForm.title"></div>
                <div class="form-group"><label class="form-label">Description</label><textarea class="form-input" rows="3" [(ngModel)]="courseForm.description"></textarea></div>
                <div class="form-group"><label class="form-label">Instructor ID</label><input class="form-input" type="number" [(ngModel)]="courseForm.instructorId"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <div class="form-group"><label class="form-label">Start Date</label><input class="form-input" type="date" [(ngModel)]="courseForm.startDate"></div>
                  <div class="form-group"><label class="form-label">End Date</label><input class="form-input" type="date" [(ngModel)]="courseForm.endDate"></div>
                </div>
                <div class="modal-actions">
                  @if (courseForm.id) {
                    <button class="btn secondary" (click)="resetCourseForm()">Cancel</button>
                  }
                  <button class="btn primary" (click)="saveCourse()" [disabled]="saving()">{{ saving() ? 'Saving...' : courseForm.id ? 'Update Course' : 'Create Course' }}</button>
                </div>
              </div>
            </div>
          }

          @if (tab() === 'modules') {
            <div class="grid-2">
              <div class="card">
                <div class="card-header"><span class="card-title">Modules</span></div>
                <div class="table-wrap">
                  <table>
                    <thead><tr><th>Module</th><th>Course</th><th>Type</th><th>Actions</th></tr></thead>
                    <tbody>
                      @for (module of modules(); track module.id) {
                        <tr>
                          <td>
                            <div class="font-medium">{{ module.title }}</div>
                            <div class="text-muted text-sm">Order {{ module.order }}</div>
                          </td>
                          <td>{{ module.courseId }}</td>
                          <td><span class="badge badge-gray">{{ module.type }}</span></td>
                          <td>
                            <div style="display:flex;gap:6px">
                              <button class="btn secondary sm" (click)="editModule(module)">Edit</button>
                              <button class="btn danger sm" (click)="deleteModule(module)">Delete</button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="card">
                <div class="card-header"><span class="card-title">{{ moduleForm.id ? 'Edit Module' : 'Create Module' }}</span></div>
                <div class="form-group"><label class="form-label">Course ID</label><input class="form-input" type="number" [(ngModel)]="moduleForm.courseId"></div>
                <div class="form-group"><label class="form-label">Title</label><input class="form-input" [(ngModel)]="moduleForm.title"></div>
                <div class="form-group"><label class="form-label">Description</label><textarea class="form-input" rows="3" [(ngModel)]="moduleForm.description"></textarea></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <div class="form-group">
                    <label class="form-label">Type</label>
                    <select class="form-input" [(ngModel)]="moduleForm.type">
                      <option value="Sequential">Sequential</option>
                      <option value="Compulsory">Compulsory</option>
                      <option value="Optional">Optional</option>
                    </select>
                  </div>
                  <div class="form-group"><label class="form-label">Order</label><input class="form-input" type="number" [(ngModel)]="moduleForm.order"></div>
                </div>
                <div class="modal-actions">
                  @if (moduleForm.id) {
                    <button class="btn secondary" (click)="resetModuleForm()">Cancel</button>
                  }
                  <button class="btn primary" (click)="saveModule()" [disabled]="saving()">{{ saving() ? 'Saving...' : moduleForm.id ? 'Update Module' : 'Create Module' }}</button>
                </div>
              </div>
            </div>
          }

          @if (tab() === 'slots') {
            <div class="grid-2">
              <div class="card">
                <div class="card-header"><span class="card-title">Timetable Slots</span></div>
                <div class="table-wrap">
                  <table>
                    <thead><tr><th>Module</th><th>Schedule</th><th>Actions</th></tr></thead>
                    <tbody>
                      @for (slot of slots(); track slot.id) {
                        <tr>
                          <td>
                            <div class="font-medium">{{ slot.moduleTitle }}</div>
                            <div class="text-muted text-sm">{{ slot.instructorName }}</div>
                          </td>
                          <td class="text-muted text-sm">{{ slot.dayOfWeek }} {{ slot.startTime.slice(0, 5) }} - {{ slot.endTime.slice(0, 5) }}</td>
                          <td>
                            <div style="display:flex;gap:6px">
                              <button class="btn secondary sm" (click)="editSlot(slot)">Edit</button>
                              <button class="btn danger sm" (click)="deleteSlot(slot)">Delete</button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="card">
                <div class="card-header"><span class="card-title">{{ slotForm.id ? 'Edit Slot' : 'Create Slot' }}</span></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <div class="form-group"><label class="form-label">Module ID</label><input class="form-input" type="number" [(ngModel)]="slotForm.moduleId"></div>
                  <div class="form-group"><label class="form-label">Instructor ID</label><input class="form-input" type="number" [(ngModel)]="slotForm.instructorId"></div>
                </div>
                <div class="form-group">
                  <label class="form-label">Day of Week</label>
                  <select class="form-input" [(ngModel)]="slotForm.dayOfWeek">
                    <option value="Mon">Mon</option>
                    <option value="Tue">Tue</option>
                    <option value="Wed">Wed</option>
                    <option value="Thu">Thu</option>
                    <option value="Fri">Fri</option>
                    <option value="Sat">Sat</option>
                    <option value="Sun">Sun</option>
                  </select>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <div class="form-group"><label class="form-label">Start Time</label><input class="form-input" type="time" [(ngModel)]="slotForm.startTime"></div>
                  <div class="form-group"><label class="form-label">End Time</label><input class="form-input" type="time" [(ngModel)]="slotForm.endTime"></div>
                </div>
                <div class="form-group"><label class="form-label">Location</label><input class="form-input" [(ngModel)]="slotForm.location"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <div class="form-group"><label class="form-label">Effective From</label><input class="form-input" type="date" [(ngModel)]="slotForm.effectiveFrom"></div>
                  <div class="form-group"><label class="form-label">Effective To</label><input class="form-input" type="date" [(ngModel)]="slotForm.effectiveTo"></div>
                </div>
                <div class="modal-actions">
                  @if (slotForm.id) {
                    <button class="btn secondary" (click)="resetSlotForm()">Cancel</button>
                  }
                  <button class="btn primary" (click)="saveSlot()" [disabled]="saving()">{{ saving() ? 'Saving...' : slotForm.id ? 'Update Slot' : 'Create Slot' }}</button>
                </div>
              </div>
            </div>
          }
        }
      }
    </div>
  `
})
export class AdminPanelComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  auth = inject(AuthService);
  tab = signal<AdminTab>('users');
  loading = signal(true);
  saving = signal(false);
  users = signal<UserResponse[]>([]);
  courses = signal<CourseResponse[]>([]);
  modules = signal<ModuleSummaryResponse[]>([]);
  slots = signal<TimetableSlotResponse[]>([]);

  userForm = { id: 0, name: '', email: '', role: 'Student' };
  courseForm = { id: 0, title: '', description: '', instructorId: 0, startDate: '', endDate: '' };
  moduleForm = { id: 0, courseId: 0, title: '', description: '', type: 'Compulsory', order: 0 };
  slotForm = {
    id: 0,
    moduleId: 0,
    instructorId: 0,
    dayOfWeek: 'Mon',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    effectiveFrom: '',
    effectiveTo: ''
  };

  ngOnInit() {
    this.loadAll();
  }

  editUser(user: UserResponse) {
    this.userForm = { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  saveUser() {
    this.saving.set(true);
    this.api.updateUser(this.userForm.id, {
      name: this.userForm.name,
      email: this.userForm.email,
      role: this.userForm.role
    }).subscribe({
      next: updated => {
        this.users.update(users => users.map(user => user.id === updated.id ? updated : user));
        this.toast.success('User updated.');
        this.resetUserForm();
        this.saving.set(false);
      },
      error: (e) => {
        this.toast.error(e.error?.message ?? 'Failed to save user');
        this.saving.set(false);
      }
    });
  }

  deleteUser(user: UserResponse) {
    if (!confirm(`Delete ${user.name}?`)) {
      return;
    }

    this.api.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update(users => users.filter(item => item.id !== user.id));
        this.toast.success('User deleted.');
      },
      error: (e) => this.toast.error(e.error?.message ?? 'Failed to delete user')
    });
  }

  editCourse(course: CourseResponse) {
    this.courseForm = {
      id: course.id,
      title: course.title,
      description: course.description,
      instructorId: course.instructorId,
      startDate: '',
      endDate: ''
    };
  }

  saveCourse() {
    this.saving.set(true);
    const payload = {
      title: this.courseForm.title,
      description: this.courseForm.description,
      instructorId: Number(this.courseForm.instructorId),
      startDate: this.courseForm.startDate || null,
      endDate: this.courseForm.endDate || null,
      studentIds: []
    };

    const request = this.courseForm.id
      ? this.api.updateCourse(this.courseForm.id, payload)
      : this.api.createCourse(payload);

    request.subscribe({
      next: () => {
        this.toast.success(this.courseForm.id ? 'Course updated.' : 'Course created.');
        this.resetCourseForm();
        this.loadAll();
      },
      error: (e) => {
        this.toast.error(e.error?.message ?? 'Failed to save course');
        this.saving.set(false);
      }
    });
  }

  deleteCourse(course: CourseResponse) {
    if (!confirm(`Delete ${course.title}?`)) {
      return;
    }

    this.api.deleteCourse(course.id).subscribe({
      next: () => {
        this.courses.update(courses => courses.filter(item => item.id !== course.id));
        this.toast.success('Course deleted.');
      },
      error: (e) => this.toast.error(e.error?.message ?? 'Failed to delete course')
    });
  }

  editModule(module: ModuleSummaryResponse) {
    this.moduleForm = {
      id: module.id,
      courseId: module.courseId,
      title: module.title,
      description: module.description,
      type: module.type,
      order: module.order
    };
  }

  saveModule() {
    this.saving.set(true);
    const payload = {
      courseId: Number(this.moduleForm.courseId),
      title: this.moduleForm.title,
      description: this.moduleForm.description,
      type: this.moduleForm.type,
      order: Number(this.moduleForm.order)
    };

    const request = this.moduleForm.id
      ? this.api.updateModule(this.moduleForm.id, payload)
      : this.api.createModule(payload);

    request.subscribe({
      next: () => {
        this.toast.success(this.moduleForm.id ? 'Module updated.' : 'Module created.');
        this.resetModuleForm();
        this.loadAll();
      },
      error: (e) => {
        this.toast.error(e.error?.message ?? 'Failed to save module');
        this.saving.set(false);
      }
    });
  }

  deleteModule(module: ModuleSummaryResponse) {
    if (!confirm(`Delete ${module.title}?`)) {
      return;
    }

    this.api.deleteModule(module.id).subscribe({
      next: () => {
        this.modules.update(modules => modules.filter(item => item.id !== module.id));
        this.toast.success('Module deleted.');
      },
      error: (e) => this.toast.error(e.error?.message ?? 'Failed to delete module')
    });
  }

  editSlot(slot: TimetableSlotResponse) {
    this.slotForm = {
      id: slot.id,
      moduleId: slot.moduleId,
      instructorId: slot.instructorId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime.slice(0, 5),
      endTime: slot.endTime.slice(0, 5),
      location: slot.location,
      effectiveFrom: this.toDateInput(slot.effectiveFrom),
      effectiveTo: this.toDateInput(slot.effectiveTo)
    };
  }

  saveSlot() {
    this.saving.set(true);
    const payload = {
      moduleId: Number(this.slotForm.moduleId),
      instructorId: Number(this.slotForm.instructorId),
      dayOfWeek: this.slotForm.dayOfWeek,
      startTime: `${this.slotForm.startTime}:00`,
      endTime: `${this.slotForm.endTime}:00`,
      location: this.slotForm.location,
      effectiveFrom: new Date(this.slotForm.effectiveFrom).toISOString(),
      effectiveTo: new Date(this.slotForm.effectiveTo).toISOString()
    };

    const request = this.slotForm.id
      ? this.api.updateTimetableSlot(this.slotForm.id, payload)
      : this.api.createTimetableSlot(payload);

    request.subscribe({
      next: () => {
        this.toast.success(this.slotForm.id ? 'Timetable slot updated.' : 'Timetable slot created.');
        this.resetSlotForm();
        this.loadAll();
      },
      error: (e) => {
        this.toast.error(e.error?.message ?? 'Failed to save timetable slot');
        this.saving.set(false);
      }
    });
  }

  deleteSlot(slot: TimetableSlotResponse) {
    if (!confirm(`Delete timetable slot for ${slot.moduleTitle}?`)) {
      return;
    }

    this.api.deleteTimetableSlot(slot.id).subscribe({
      next: () => {
        this.slots.update(slots => slots.filter(item => item.id !== slot.id));
        this.toast.success('Timetable slot deleted.');
      },
      error: (e) => this.toast.error(e.error?.message ?? 'Failed to delete timetable slot')
    });
  }

  resetUserForm() {
    this.userForm = { id: 0, name: '', email: '', role: 'Student' };
  }

  resetCourseForm() {
    this.courseForm = { id: 0, title: '', description: '', instructorId: 0, startDate: '', endDate: '' };
  }

  resetModuleForm() {
    this.moduleForm = { id: 0, courseId: 0, title: '', description: '', type: 'Compulsory', order: 0 };
  }

  resetSlotForm() {
    this.slotForm = {
      id: 0,
      moduleId: 0,
      instructorId: 0,
      dayOfWeek: 'Mon',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      effectiveFrom: '',
      effectiveTo: ''
    };
  }

  private loadAll() {
    this.loading.set(true);
    this.saving.set(false);
    forkJoin({
      users: this.api.getUsers(),
      courses: this.api.getCourses(),
      modules: this.api.getModules(),
      slots: this.api.getTimetableSlots()
    }).subscribe({
      next: ({ users, courses, modules, slots }) => {
        this.users.set(users);
        this.courses.set(courses);
        this.modules.set(modules);
        this.slots.set(slots);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.saving.set(false);
      }
    });
  }

  private toDateInput(value: string) {
    return new Date(value).toISOString().slice(0, 10);
  }
}
