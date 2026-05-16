import { Title } from '@angular/platform-browser';
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { NotificationResponse } from '../../core/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header fade-up">
      <h1 class="page-title">Notifications</h1>
      <p class="page-desc">{{ unreadCount() }} unread</p>
    </div>
    <div class="page-content">
      @if (unreadCount() > 0) {
        <div style="margin-bottom:12px">
          <button class="btn secondary sm" (click)="markAll()">Mark all as read</button>
        </div>
      }

      @if (loading()) {
        <div class="loading"><div class="loading-spinner"></div>Loading…</div>
      } @else if (notifications().length === 0) {
        <div class="card">
          <div class="empty-state">
            <div class="empty-icon">🔔</div>
            <div class="empty-title">No notifications</div>
            <div class="empty-desc">You're all caught up!</div>
          </div>
        </div>
      } @else {
        @for (n of notifications(); track n.id) {
          <div class="notif-item" [class.unread]="!n.isRead" (click)="markRead(n)">
            @if (!n.isRead) { <div class="notif-dot"></div> }
            <div class="notif-content">
              <div class="notif-msg">{{ n.message }}</div>
              <div class="notif-time">
                <span class="badge badge-gray" style="margin-right:6px">{{ n.type }}</span>
                {{ n.createdAt | date:'MMM d, h:mm a' }}
              </div>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class NotificationsComponent implements OnInit {
  private api   = inject(ApiService);
  private title = inject(Title);
  private auth  = inject(AuthService);
  private toast = inject(ToastService);

  notifications = signal<NotificationResponse[]>([]);
  loading       = signal(true);

  // Computed directly from loaded notifications — single source of truth
  unreadCount = () => this.notifications().filter(n => !n.isRead).length;

  ngOnInit() {
    this.title.setTitle('Notifications — CollegeLMS');
    this.api.getNotifications().subscribe({
      next: ns => {
        this.notifications.set(ns);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  markRead(n: NotificationResponse) {
    if (n.isRead) return;
    this.api.markRead(n.id).subscribe({
      next: () => this.notifications.update(ns =>
        ns.map(x => x.id === n.id ? { ...x, isRead: true } : x)
      )
    });
  }

  markAll() {
    this.api.markAllRead().subscribe({
      next: () => {
        this.notifications.update(ns => ns.map(n => ({ ...n, isRead: true })));
        this.toast.success('All marked as read');
      }
    });
  }
}
