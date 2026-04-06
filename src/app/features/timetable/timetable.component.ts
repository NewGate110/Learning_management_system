import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TimetableSlotResponse, TimetableSessionEventResponse } from '../../core/models';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header fade-up">
      <h1 class="page-title">Timetable</h1>
      <p class="page-desc">Weekly schedule and sessions</p>
    </div>
    <div class="page-content">

      <div class="section-tabs">
        <button class="section-tab" [class.active]="tab() === 'weekly'" (click)="tab.set('weekly')">Weekly View</button>
        <button class="section-tab" [class.active]="tab() === 'slots'"  (click)="tab.set('slots')">All Slots</button>
        <button class="section-tab" [class.active]="tab() === 'events'" (click)="tab.set('events')">Upcoming Events</button>
      </div>

      <!-- Weekly -->
      @if (tab() === 'weekly') {
        <div class="card" style="overflow-x:auto">
          <div class="weekly-grid">
            @for (day of DAYS; track day) {
              <div class="day-col">
                <div class="day-header">{{ day.slice(0,3) }}</div>
                @for (s of slotsForDay(day); track s.id) {
                  <div class="slot-pill">
                    <div style="font-size:11px;color:var(--accent2);font-weight:600">{{ s.startTime.slice(0,5) }}–{{ s.endTime.slice(0,5) }}</div>
                    <div style="font-size:12px;font-weight:500;margin-top:2px">{{ s.moduleTitle }}</div>
                    <div style="font-size:11px;color:var(--muted);margin-top:1px">📍 {{ s.location }}</div>
                  </div>
                }
                @if (!slotsForDay(day).length) {
                  <div style="color:var(--border2);text-align:center;padding:12px;font-size:20px">—</div>
                }
              </div>
            }
          </div>
        </div>
        @if (auth.isAdmin()) {
          <button class="btn primary" (click)="showCreate.set(true)">+ Add Slot</button>
        }
      }

      <!-- Slots table -->
      @if (tab() === 'slots') {
        @if (loading()) {
          <div class="loading"><div class="loading-spinner"></div>Loading…</div>
        } @else {
          <div class="toolbar">
            <div style="flex:1"></div>
            @if (auth.isAdmin()) { <button class="btn primary" (click)="showCreate.set(true)">+ Add Slot</button> }
          </div>
          <div class="card">
            <div class="table-wrap">
              <table>
                <thead><tr><th>Module</th><th>Instructor</th><th>Day & Time</th><th>Location</th><th>Period</th>@if (auth.isAdmin()) { <th>Actions</th> }</tr></thead>
                <tbody>
                  @for (s of slots(); track s.id) {
                    <tr>
                      <td class="font-medium">{{ s.moduleTitle }}</td>
                      <td class="text-muted">{{ s.instructorName }}</td>
                      <td>
                        <span class="badge badge-accent">{{ s.dayOfWeek }}</span>
                        <div class="text-muted text-sm" style="margin-top:4px">{{ s.startTime.slice(0,5) }} – {{ s.endTime.slice(0,5) }}</div>
                      </td>
                      <td>{{ s.location }}</td>
                      <td class="text-muted text-sm">{{ s.effectiveFrom | date:'MMM d' }} – {{ s.effectiveTo | date:'MMM d, y' }}</td>
                      @if (auth.isAdmin()) {
                        <td><button class="btn danger sm" (click)="deleteSlot(s.id)">Delete</button></td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
              @if (!slots().length) { <div class="empty-state"><div class="empty-icon">🗓</div><div class="empty-title">No timetable slots</div></div> }
            </div>
          </div>
        }
      }

      <!-- Events -->
      @if (tab() === 'events') {
        @if (evLoading()) {
          <div class="loading"><div class="loading-spinner"></div>Loading…</div>
        } @else if (!events().length) {
          <div class="card"><div class="empty-state"><div class="empty-icon">📅</div><div class="empty-title">No upcoming events</div></div></div>
        } @else {
          <div class="card">
            <div class="table-wrap">
              <table>
                <thead><tr><th>Module</th><th>Date</th><th>Time</th><th>Location</th><th>Status</th></tr></thead>
                <tbody>
                  @for (e of events(); track $index) {
                    <tr>
                      <td class="font-medium">{{ e.moduleTitle }}</td>
                      <td>{{ e.date | date:'EEE, MMM d' }}</td>
                      <td class="text-muted text-sm">{{ e.sessionStart | date:'h:mm a' }} – {{ e.sessionEnd | date:'h:mm a' }}</td>
                      <td class="text-muted">{{ e.location }}</td>
                      <td>
                        @if (e.isCancelled) { <span class="badge badge-red">Cancelled</span> }
                        @else if (e.isRescheduled) { <span class="badge badge-yellow">Rescheduled</span> }
                        @else { <span class="badge badge-green">Scheduled</span> }
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

    @if (showCreate()) {
      <div class="modal-overlay" (click)="showCreate.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-title">Add Timetable Slot</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">Module ID</label><input class="form-input" type="number" [(ngModel)]="sForm.moduleId"></div>
            <div class="form-group"><label class="form-label">Instructor ID</label><input class="form-input" type="number" [(ngModel)]="sForm.instructorId"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Day of Week</label>
            <select class="form-input" [(ngModel)]="sForm.dayOfWeek">
              @for (d of DAYS; track d) { <option [value]="d">{{ d }}</option> }
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">Start Time</label><input class="form-input" type="time" [(ngModel)]="sForm.startTime"></div>
            <div class="form-group"><label class="form-label">End Time</label><input class="form-input" type="time" [(ngModel)]="sForm.endTime"></div>
          </div>
          <div class="form-group"><label class="form-label">Location</label><input class="form-input" [(ngModel)]="sForm.location" placeholder="Room 101"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">Effective From</label><input class="form-input" type="date" [(ngModel)]="sForm.effectiveFrom"></div>
            <div class="form-group"><label class="form-label">Effective To</label><input class="form-input" type="date" [(ngModel)]="sForm.effectiveTo"></div>
          </div>
          <div class="modal-actions">
            <button class="btn secondary" (click)="showCreate.set(false)">Cancel</button>
            <button class="btn primary" (click)="createSlot()" [disabled]="saving()">{{ saving() ? 'Creating…' : 'Create' }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .weekly-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; min-width: 700px; }
    .day-col { display: flex; flex-direction: column; gap: 6px; }
    .day-header { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; padding-bottom: 8px; border-bottom: 1px solid var(--border); text-align: center; }
    .slot-pill { background: var(--accent-dim); border: 1px solid rgba(108,99,255,.25); border-radius: 6px; padding: 8px; }
  `]
})
export class TimetableComponent implements OnInit {
  auth       = inject(AuthService);
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  DAYS       = DAYS;
  slots      = signal<TimetableSlotResponse[]>([]);
  events     = signal<TimetableSessionEventResponse[]>([]);
  loading    = signal(true);
  evLoading  = signal(true);
  showCreate = signal(false);
  saving     = signal(false);
  tab        = signal<'weekly'|'slots'|'events'>('weekly');

  sForm = { moduleId: 0, instructorId: 0, dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', location: '', effectiveFrom: '', effectiveTo: '' };

  slotsForDay = (day: string) => this.slots().filter(s => s.dayOfWeek === day);

  ngOnInit() {
    this.api.getTimetableSlots().subscribe({ next: ss => { this.slots.set(ss); this.loading.set(false); }, error: () => this.loading.set(false) });
    const from = new Date().toISOString();
    const to   = new Date(Date.now() + 30*24*3600*1000).toISOString();
    this.api.getTimetableEvents(from, to).subscribe({ next: ev => { this.events.set(ev); this.evLoading.set(false); }, error: () => this.evLoading.set(false) });
  }

  createSlot() {
    this.saving.set(true);
    this.api.createTimetableSlot({ moduleId: Number(this.sForm.moduleId), instructorId: Number(this.sForm.instructorId), dayOfWeek: this.sForm.dayOfWeek, startTime: this.sForm.startTime + ':00', endTime: this.sForm.endTime + ':00', location: this.sForm.location, effectiveFrom: new Date(this.sForm.effectiveFrom).toISOString(), effectiveTo: new Date(this.sForm.effectiveTo).toISOString() }).subscribe({
      next: s => { this.toast.success('Slot created!'); this.slots.update(ss => [...ss, s]); this.showCreate.set(false); this.saving.set(false); },
      error: (e) => { this.toast.error(e.error?.message ?? 'Failed'); this.saving.set(false); }
    });
  }

  deleteSlot(id: number) {
    if (!confirm('Delete this slot?')) return;
    this.api.deleteTimetableSlot(id).subscribe({ next: () => { this.toast.success('Deleted'); this.slots.update(ss => ss.filter(s => s.id !== id)); }, error: () => this.toast.error('Failed') });
  }
}
