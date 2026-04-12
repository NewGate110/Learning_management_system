import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { CalendarEventResponse } from '../../core/models';

interface CalendarCell {
  date: Date;
  inMonth: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header fade-up">
      <h1 class="page-title">Calendar</h1>
      <p class="page-desc">Monthly calendar of deadlines, assessments, and timetable changes</p>
    </div>

    <div class="page-content">
      <div class="card">
        <div class="calendar-toolbar">
          <button class="btn secondary sm" (click)="changeMonth(-1)">Previous</button>
          <div class="calendar-month">{{ monthLabel() }}</div>
          <button class="btn secondary sm" (click)="changeMonth(1)">Next</button>
        </div>

        @if (loading()) {
          <div class="loading"><div class="loading-spinner"></div>Loading...</div>
        } @else {
          <div class="weekdays">
            @for (label of weekdayLabels; track label) {
              <div>{{ label }}</div>
            }
          </div>

          <div class="calendar-grid">
            @for (cell of cells(); track cell.date.toISOString()) {
              <div class="calendar-cell" [class.outside]="!cell.inMonth">
                <div class="calendar-day">{{ cell.date.getDate() }}</div>
                <div class="calendar-events">
                  @for (event of eventsForDay(cell.date); track event.title + event.start) {
                    <button class="event-pill" [class]="eventPillClass(event.type)" (click)="selectedEvent.set(event)">
                      {{ event.title }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      @if (selectedEvent()) {
        <div class="card">
          <div class="card-header">
            <span class="card-title">Event Details</span>
            <button class="btn secondary sm" (click)="selectedEvent.set(null)">Close</button>
          </div>
          <div class="detail-row"><span class="detail-key">Title</span><span>{{ selectedEvent()!.title }}</span></div>
          <div class="detail-row"><span class="detail-key">Type</span><span>{{ selectedEvent()!.type }}</span></div>
          <div class="detail-row"><span class="detail-key">Start</span><span>{{ selectedEvent()!.start | date:'EEE, MMM d, y h:mm a' }}</span></div>
          @if (selectedEvent()!.end) {
            <div class="detail-row"><span class="detail-key">End</span><span>{{ selectedEvent()!.end | date:'EEE, MMM d, y h:mm a' }}</span></div>
          }
          @if (selectedEvent()!.location) {
            <div class="detail-row"><span class="detail-key">Location</span><span>{{ selectedEvent()!.location }}</span></div>
          }
          @if (selectedEvent()!.description) {
            <div class="detail-row"><span class="detail-key">Details</span><span>{{ selectedEvent()!.description }}</span></div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .calendar-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .calendar-month {
      font-family: 'DM Serif Display', serif;
      font-size: 1.3rem;
    }
    .weekdays,
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 8px;
    }
    .weekdays {
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .6px;
      margin-bottom: 8px;
    }
    .calendar-cell {
      min-height: 132px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px;
    }
    .calendar-cell.outside {
      opacity: .45;
    }
    .calendar-day {
      font-weight: 600;
      margin-bottom: 8px;
    }
    .calendar-events {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .event-pill {
      border: none;
      border-radius: 999px;
      padding: 6px 8px;
      text-align: left;
      font: inherit;
      font-size: 11px;
      cursor: pointer;
      color: var(--text);
      background: var(--accent-dim);
    }
    .event-pill.assignment { background: var(--red-dim); color: var(--red); }
    .event-pill.assessment { background: var(--yellow-dim); color: var(--yellow); }
    .event-pill.session { background: var(--blue-dim); color: var(--blue); }
    .event-pill.change { background: var(--accent-dim); color: var(--accent2); }
    @media (max-width: 900px) {
      .weekdays,
      .calendar-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `]
})
export class CalendarComponent {
  private api = inject(ApiService);

  weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  month = signal(this.startOfMonth(new Date()));
  loading = signal(true);
  events = signal<CalendarEventResponse[]>([]);
  selectedEvent = signal<CalendarEventResponse | null>(null);

  ngOnInit() {
    this.loadMonth();
  }

  changeMonth(offset: number) {
    const current = this.month();
    this.month.set(new Date(current.getFullYear(), current.getMonth() + offset, 1));
    this.loadMonth();
  }

  monthLabel() {
    return this.month().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  cells(): CalendarCell[] {
    const monthStart = this.month();
    const firstVisible = new Date(monthStart);
    firstVisible.setDate(firstVisible.getDate() - this.dayIndex(firstVisible));

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstVisible);
      date.setDate(firstVisible.getDate() + index);
      return {
        date,
        inMonth: date.getMonth() === monthStart.getMonth()
      };
    });
  }

  eventsForDay(date: Date) {
    return this.events().filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate();
    });
  }

  eventPillClass(type: string) {
    if (type.includes('Assignment')) {
      return 'assignment';
    }
    if (type.includes('Assessment')) {
      return 'assessment';
    }
    if (type.includes('Timetable') || type.includes('Course')) {
      return 'change';
    }
    return 'session';
  }

  private loadMonth() {
    const start = new Date(this.month().getFullYear(), this.month().getMonth(), 1);
    const end = new Date(this.month().getFullYear(), this.month().getMonth() + 1, 0, 23, 59, 59, 999);
    this.loading.set(true);
    this.selectedEvent.set(null);
    this.api.getCalendarEvents(start.toISOString(), end.toISOString()).subscribe({
      next: events => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private dayIndex(date: Date) {
    const jsDay = date.getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }
}
