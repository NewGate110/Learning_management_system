import { Title } from '@angular/platform-browser';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TimetableSessionEventResponse, TimetableSlotResponse, UserResponse, ModuleSummaryResponse } from '../../core/models';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header fade-up">
      <h1 class="page-title">Timetable</h1>
      <p class="page-desc">Weekly schedule, upcoming sessions, and timetable exceptions</p>
    </div>

    <div class="page-content">
      <div class="section-tabs">
        <button class="section-tab" [class.active]="tab() === 'weekly'" (click)="tab.set('weekly')">Weekly View</button>
        <button class="section-tab" [class.active]="tab() === 'slots'" (click)="tab.set('slots')">All Slots</button>
        <button class="section-tab" [class.active]="tab() === 'events'" (click)="tab.set('events')">Upcoming Events</button>
      </div>

      <div class="toolbar">
        <div style="flex:1"></div>
        @if (canCreateException()) {
          <button class="btn secondary" (click)="showExceptionModal.set(true)">Post Exception</button>
        }
        @if (auth.isAdmin()) {
          <button class="btn primary" (click)="showCreateModal.set(true)">+ Add Slot</button>
        }
      </div>

      @if (tab() === 'weekly') {
        <div class="card" style="overflow-x:auto">
          <div class="weekly-grid">
            @for (day of DAYS; track day) {
              <div class="day-col">
                <div class="day-header">{{ day }}</div>
                @for (slot of slotsForDay(day); track slot.id) {
                  <div class="slot-pill">
                    <div class="slot-time">{{ slot.startTime.slice(0, 5) }} - {{ slot.endTime.slice(0, 5) }}</div>
                    <div class="font-medium">{{ slot.moduleTitle }}</div>
                    <div class="text-sm text-muted">{{ slot.location }}</div>
                  </div>
                }
                @if (!slotsForDay(day).length) {
                  <div class="empty-placeholder">—</div>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (tab() === 'slots') {
        @if (loading()) {
          <div class="loading"><div class="loading-spinner"></div>Loading...</div>
        } @else {
          <div class="card">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Instructor</th>
                    <th>Day & Time</th>
                    <th>Location</th>
                    <th>Period</th>
                    @if (auth.isAdmin()) { <th>Actions</th> }
                  </tr>
                </thead>
                <tbody>
                  @for (slot of slots(); track slot.id) {
                    <tr>
                      <td class="font-medium">{{ slot.moduleTitle }}</td>
                      <td class="text-muted">{{ slot.instructorName }}</td>
                      <td>
                        <span class="badge badge-accent">{{ slot.dayOfWeek }}</span>
                        <div class="text-muted text-sm">{{ slot.startTime.slice(0, 5) }} - {{ slot.endTime.slice(0, 5) }}</div>
                      </td>
                      <td>{{ slot.location }}</td>
                      <td class="text-muted text-sm">{{ slot.effectiveFrom | date:'MMM d' }} - {{ slot.effectiveTo | date:'MMM d, y' }}</td>
                      @if (auth.isAdmin()) {
                        <td><button class="btn danger sm" (click)="deleteSlot(slot.id)">Delete</button></td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
              @if (!slots().length) {
                <div class="empty-state"><div class="empty-title">No timetable slots</div></div>
              }
            </div>
          </div>
        }
      }

      @if (tab() === 'events') {
        @if (eventsLoading()) {
          <div class="loading"><div class="loading-spinner"></div>Loading...</div>
        } @else if (!events().length) {
          <div class="card"><div class="empty-state"><div class="empty-title">No upcoming events</div></div></div>
        } @else {
          <div class="card">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (event of events(); track event.moduleId + event.sessionStart) {
                    <tr>
                      <td class="font-medium">{{ event.moduleTitle }}</td>
                      <td>{{ event.date | date:'EEE, MMM d' }}</td>
                      <td class="text-muted text-sm">{{ event.sessionStart | date:'h:mm a' }} - {{ event.sessionEnd | date:'h:mm a' }}</td>
                      <td>{{ event.location }}</td>
                      <td>
                        @if (event.isCancelled) {
                          <span class="badge badge-red">Cancelled</span>
                        } @else if (event.isRescheduled) {
                          <span class="badge badge-yellow">Rescheduled</span>
                        } @else {
                          <span class="badge badge-green">Scheduled</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>

    @if (showCreateModal()) {
      <div class="modal-overlay" (click)="showCreateModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-title">Add Timetable Slot</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">Module</label>
              <select class="form-input" [(ngModel)]="slotForm.moduleId">
                <option value="0">— Select module —</option>
                @for (m of modules(); track m.id) {
                  <option [value]="m.id">{{ m.title }}</option>
                }
              </select>
            </div>
            <div class="form-group"><label class="form-label">Instructor</label>
              <select class="form-input" [(ngModel)]="slotForm.instructorId">
                <option value="0">— Select instructor —</option>
                @for (u of instructors(); track u.id) {
                  <option [value]="u.id">{{ u.name }}</option>
                }
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Day of Week</label>
            <select class="form-input" [(ngModel)]="slotForm.dayOfWeek">
              @for (day of DAYS; track day) {
                <option [value]="day">{{ day }}</option>
              }
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
            <button class="btn secondary" (click)="showCreateModal.set(false)">Cancel</button>
            <button class="btn primary" (click)="createSlot()" [disabled]="saving()">{{ saving() ? 'Creating...' : 'Create' }}</button>
          </div>
        </div>
      </div>
    }

    @if (showExceptionModal()) {
      <div class="modal-overlay" (click)="showExceptionModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-title">Post Timetable Exception</div>
          <div class="form-group">
            <label class="form-label">Timetable Slot</label>
            <select class="form-input" [(ngModel)]="exceptionForm.timetableSlotId">
              <option [ngValue]="0">Select a slot</option>
              @for (slot of slots(); track slot.id) {
                <option [ngValue]="slot.id">{{ slot.moduleTitle }} • {{ slot.dayOfWeek }} {{ slot.startTime.slice(0, 5) }}</option>
              }
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">Date</label><input class="form-input" type="date" [(ngModel)]="exceptionForm.date"></div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-input" [(ngModel)]="exceptionForm.status">
                <option value="Cancelled">Cancelled</option>
                <option value="Rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Reason</label><textarea class="form-input" [(ngModel)]="exceptionForm.reason" rows="3"></textarea></div>
          @if (exceptionForm.status === 'Rescheduled') {
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
              <div class="form-group"><label class="form-label">New Date</label><input class="form-input" type="date" [(ngModel)]="exceptionForm.rescheduleDate"></div>
              <div class="form-group"><label class="form-label">Start</label><input class="form-input" type="time" [(ngModel)]="exceptionForm.rescheduleStartTime"></div>
              <div class="form-group"><label class="form-label">End</label><input class="form-input" type="time" [(ngModel)]="exceptionForm.rescheduleEndTime"></div>
            </div>
          }
          <div class="modal-actions">
            <button class="btn secondary" (click)="showExceptionModal.set(false)">Cancel</button>
            <button class="btn primary" (click)="createException()" [disabled]="saving()">{{ saving() ? 'Posting...' : 'Post Exception' }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .weekly-grid { display: grid; grid-template-columns: repeat(7, minmax(120px, 1fr)); gap: 8px; min-width: 840px; }
    .day-col { display: flex; flex-direction: column; gap: 6px; }
    .day-header { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; padding-bottom: 8px; border-bottom: 1px solid var(--border); text-align: center; }
    .slot-pill { background: var(--blue-dim); border: 1px solid rgba(108,99,255,.25); border-radius: 6px; padding: 8px; }
    .slot-time { font-size: 11px; color: var(--blue); font-weight: 600; margin-bottom: 2px; }
    .empty-placeholder { color: var(--border2); text-align: center; padding: 12px; font-size: 20px; }
  `]
})
export class TimetableComponent {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private title = inject(Title);
  private toast = inject(ToastService);

  DAYS = DAYS;
  tab = signal<'weekly' | 'slots' | 'events'>('weekly');
  loading = signal(true);
  eventsLoading = signal(true);
  saving = signal(false);
  showCreateModal = signal(false);
  showExceptionModal = signal(false);
  slots = signal<TimetableSlotResponse[]>([]);
  events = signal<TimetableSessionEventResponse[]>([]);
  instructors = signal<UserResponse[]>([]);
  modules = signal<ModuleSummaryResponse[]>([]);

  slotForm = {
    moduleId: 0,
    instructorId: 0,
    dayOfWeek: 'Mon',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    effectiveFrom: '',
    effectiveTo: ''
  };

  exceptionForm = {
    timetableSlotId: 0,
    date: '',
    status: 'Cancelled',
    reason: '',
    rescheduleDate: '',
    rescheduleStartTime: '09:00',
    rescheduleEndTime: '10:00'
  };

  ngOnInit() {
    this.title.setTitle('Timetable — CollegeLMS');
    this.reloadSlots();
    this.reloadEvents();
    // Fetch dropdowns for slot creation (Admin only)
    if (this.auth.isAdmin()) {
      this.api.getUsers().subscribe({ next: us => this.instructors.set(us.filter(u => u.role === 'Instructor')), error: () => {} });
      this.api.getModules().subscribe({ next: ms => this.modules.set(ms), error: () => {} });
    }
  }

  canCreateException() {
    return this.auth.isInstructor() || this.auth.isAdmin();
  }

  slotsForDay(day: string) {
    return this.slots().filter(slot => slot.dayOfWeek === day);
  }

  createSlot() {
    this.saving.set(true);
    this.api.createTimetableSlot({
      moduleId: Number(this.slotForm.moduleId),
      instructorId: Number(this.slotForm.instructorId),
      dayOfWeek: this.slotForm.dayOfWeek,
      startTime: `${this.slotForm.startTime}:00`,
      endTime: `${this.slotForm.endTime}:00`,
      location: this.slotForm.location,
      effectiveFrom: new Date(this.slotForm.effectiveFrom).toISOString(),
      effectiveTo: new Date(this.slotForm.effectiveTo).toISOString()
    }).subscribe({
      next: slot => {
        this.toast.success('Timetable slot created.');
        this.slots.update(slots => [...slots, slot]);
        this.showCreateModal.set(false);
        this.saving.set(false);
      },
      error: (e) => {
        this.toast.error(e.error?.message ?? 'Failed to create slot');
        this.saving.set(false);
      }
    });
  }

  createException() {
    this.saving.set(true);
    this.api.createTimetableException({
      timetableSlotId: Number(this.exceptionForm.timetableSlotId),
      date: new Date(this.exceptionForm.date).toISOString(),
      status: this.exceptionForm.status,
      reason: this.exceptionForm.reason,
      rescheduleDate: this.exceptionForm.status === 'Rescheduled' && this.exceptionForm.rescheduleDate
        ? new Date(this.exceptionForm.rescheduleDate).toISOString()
        : null,
      rescheduleStartTime: this.exceptionForm.status === 'Rescheduled' ? `${this.exceptionForm.rescheduleStartTime}:00` : null,
      rescheduleEndTime: this.exceptionForm.status === 'Rescheduled' ? `${this.exceptionForm.rescheduleEndTime}:00` : null
    }).subscribe({
      next: () => {
        this.toast.success('Timetable exception posted successfully.');
        this.showExceptionModal.set(false);
        this.saving.set(false);
        this.reloadEvents();
      },
      error: (e) => {
        this.toast.error(e.error?.message ?? 'Failed to post timetable exception');
        this.saving.set(false);
      }
    });
  }

  deleteSlot(id: number) {
    if (!confirm('Delete this slot?')) {
      return;
    }

    this.api.deleteTimetableSlot(id).subscribe({
      next: () => {
        this.toast.success('Timetable slot deleted.');
        this.slots.update(slots => slots.filter(slot => slot.id !== id));
      },
      error: () => this.toast.error('Failed to delete slot')
    });
  }

  private reloadSlots() {
    this.loading.set(true);
    this.api.getTimetableSlots().subscribe({
      next: slots => {
        this.slots.set(slots);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private reloadEvents() {
    this.eventsLoading.set(true);
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    this.api.getTimetableEvents(from, to).subscribe({
      next: events => {
        this.events.set(events);
        this.eventsLoading.set(false);
      },
      error: () => this.eventsLoading.set(false)
    });
  }
}
