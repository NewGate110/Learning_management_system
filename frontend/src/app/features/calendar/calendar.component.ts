import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { CalendarEventResponse } from '../../core/models';
import { Title } from '@angular/platform-browser';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface CalendarCell { date: Date; isCurrentMonth: boolean; isToday: boolean; }

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header fade-up">
      <h1 class="page-title">Calendar</h1>
      <p class="page-desc">Your schedule, upcoming sessions and deadlines</p>
    </div>
    <div class="page-content">
      <!-- Month navigation -->
      <div class="cal-nav card" style="margin-bottom:16px">
        <button class="btn secondary sm" (click)="prevMonth()">‹ Prev</button>
        <span class="cal-month-label">{{ monthLabel() }}</span>
        <button class="btn secondary sm" (click)="nextMonth()">Next ›</button>
      </div>

      @if (loading()) {
        <div class="loading"><div class="loading-spinner"></div>Loading…</div>
      } @else {
        <div class="card" style="padding:0;overflow:hidden">
          <!-- Day headers -->
          <div class="calendar-grid calendar-head">
            @for (label of weekdayLabels; track label) {
              <div class="cal-day-label">{{ label }}</div>
            }
          </div>

          <!-- Calendar cells -->
          <div class="calendar-grid">
            @for (cell of cells(); track cell.date.toISOString()) {
              <div class="cal-cell" [class.other-month]="!cell.isCurrentMonth" [class.today]="cell.isToday">
                <div class="cal-date">{{ cell.date.getDate() }}</div>
                <div class="calendar-events">
                  @for (event of eventsForDay(cell.date); track event.title + event.start) {
                    <div class="event-pill" [class]="eventClass(event)" (click)="selectedEvent.set(event)" title="{{ event.title }}">
                      {{ event.title }}
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Empty state when no events this month -->
        @if (eventsThisMonth() === 0) {
          <div class="card" style="margin-top:16px">
            <div class="empty-state">
              <div class="empty-icon">📅</div>
              <div class="empty-title">No events this month</div>
              <div class="empty-desc">Nothing scheduled for {{ monthLabel() }}</div>
            </div>
          </div>
        }
      }
    </div>

    <!-- Event detail modal -->
    @if (selectedEvent()) {
      <div class="modal-overlay" (click)="selectedEvent.set(null)">
        <div class="modal" style="max-width:400px" (click)="$event.stopPropagation()">
          <div class="modal-title">{{ selectedEvent()!.title }}</div>
          <div class="detail-row"><span class="detail-key">Type</span><span class="badge badge-gray">{{ selectedEvent()!.type }}</span></div>
          <div class="detail-row"><span class="detail-key">Start</span><span>{{ selectedEvent()!.start | date:'medium' }}</span></div>
          @if (selectedEvent()!.end) {
            <div class="detail-row"><span class="detail-key">End</span><span>{{ selectedEvent()!.end | date:'medium' }}</span></div>
          }
          @if (selectedEvent()!.location) {
            <div class="detail-row"><span class="detail-key">Location</span><span>{{ selectedEvent()!.location }}</span></div>
          }
          @if (selectedEvent()!.description) {
            <div class="detail-row"><span class="detail-key">Notes</span><span>{{ selectedEvent()!.description }}</span></div>
          }
          <div class="modal-actions">
            <button class="btn secondary" (click)="selectedEvent.set(null)">Close</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cal-nav { display:flex; align-items:center; justify-content:space-between; }
    .cal-month-label { font-family:var(--font-heading); font-size:18px; font-weight:700; color:var(--text); }
    .calendar-grid { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); }
    .calendar-head { border-bottom:1px solid var(--border); background:var(--surface2); }
    .cal-day-label { text-align:center; font-size:12px; font-weight:600; color:var(--text-secondary); padding:10px 4px; text-transform:uppercase; letter-spacing:.5px; }
    .cal-cell { min-height:100px; border-right:1px solid var(--border); border-bottom:1px solid var(--border); padding:8px 6px; }
    .cal-cell:nth-child(7n) { border-right:none; }
    .cal-cell.other-month { background:var(--surface2); opacity:.6; }
    .cal-cell.today .cal-date { background:var(--blue); color:#fff; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; font-weight:700; }
    .cal-date { font-size:13px; font-weight:500; color:var(--text-secondary); margin-bottom:4px; width:26px; height:26px; display:flex; align-items:center; justify-content:center; }
    .calendar-events { display:flex; flex-direction:column; gap:2px; }
    .event-pill { font-size:11px; padding:2px 6px; border-radius:4px; cursor:pointer; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; transition:opacity .15s; font-weight:500; }
    .event-pill:hover { opacity:.8; }
    .event-pill.assignment { background:var(--blue-dim); color:var(--blue); }
    .event-pill.assessment { background:var(--amber-dim); color:var(--amber-dark); }
    .event-pill.session    { background:var(--green-dim); color:var(--green); }
    .event-pill.change     { background:var(--red-dim); color:var(--red); }
    .event-pill.default    { background:var(--surface2); color:var(--text-secondary); }
    @media (max-width:768px) {
      .calendar-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .cal-cell { min-height:60px; }
    }
  `]
})
export class CalendarComponent implements OnInit {
  private api   = inject(ApiService);
  private title = inject(Title);

  loading       = signal(true);
  events        = signal<CalendarEventResponse[]>([]);
  selectedEvent = signal<CalendarEventResponse | null>(null);
  weekdayLabels = DAYS;

  today       = new Date();
  viewYear    = signal(this.today.getFullYear());
  viewMonth   = signal(this.today.getMonth());
  monthLabel  = computed(() => `${MONTHS[this.viewMonth()]} ${this.viewYear()}`);

  cells = computed<CalendarCell[]>(() => {
    const year = this.viewYear(), month = this.viewMonth();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const cells: CalendarCell[] = [];
    for (let i = 0; i < first.getDay(); i++) {
      const d = new Date(year, month, -first.getDay() + i + 1);
      cells.push({ date: d, isCurrentMonth: false, isToday: false });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(year, month, d);
      cells.push({ date, isCurrentMonth: true, isToday: this.isSameDay(date, this.today) });
    }
    while (cells.length % 7 !== 0) {
      const d = new Date(year, month + 1, cells.length - last.getDate() - first.getDay() + 1);
      cells.push({ date: d, isCurrentMonth: false, isToday: false });
    }
    return cells;
  });

  eventsThisMonth = computed(() =>
    this.events().filter(e => {
      const d = new Date(e.start);
      return d.getFullYear() === this.viewYear() && d.getMonth() === this.viewMonth();
    }).length
  );

  ngOnInit() {
    this.title.setTitle('Calendar — CollegeLMS');
    this.loadEvents();
  }

  prevMonth() {
    if (this.viewMonth() === 0) { this.viewMonth.set(11); this.viewYear.update(y => y - 1); }
    else { this.viewMonth.update(m => m - 1); }
    this.loadEvents();
  }

  nextMonth() {
    if (this.viewMonth() === 11) { this.viewMonth.set(0); this.viewYear.update(y => y + 1); }
    else { this.viewMonth.update(m => m + 1); }
    this.loadEvents();
  }

  eventsForDay(date: Date) {
    return this.events().filter(e => this.isSameDay(new Date(e.start), date));
  }

  eventClass(event: CalendarEventResponse) {
    const t = event.type?.toLowerCase() ?? '';
    if (t.includes('assignment')) return 'assignment';
    if (t.includes('assessment') || t.includes('exam')) return 'assessment';
    if (t.includes('session') || t.includes('class')) return 'session';
    if (t.includes('cancel') || t.includes('change') || t.includes('exception')) return 'change';
    return 'default';
  }

  private loadEvents() {
    this.loading.set(true);
    const from = new Date(this.viewYear(), this.viewMonth(), 1).toISOString();
    const to   = new Date(this.viewYear(), this.viewMonth() + 1, 0).toISOString();
    this.api.getCalendarEvents(from, to).subscribe({
      next: evs => { this.events.set(evs); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  private isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
}
