/// ★ Innovation Feature — Automated Deadline Reminder System

import { Component, OnInit } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { MatListModule }      from '@angular/material/list';
import { MatButtonModule }    from '@angular/material/button';
import { MatDividerModule }   from '@angular/material/divider';
import { MatIconModule }      from '@angular/material/icon';
import { NotificationService } from '../../services/notification.service';
import { Notification }        from '../../models/notification.model';
import { AuthService }         from '../../services/auth.service';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, MatListModule, MatButtonModule, MatDividerModule, MatIconModule],
  template: `
    <div class="notification-panel mat-elevation-z4">
      <div class="panel-header">
        <strong>Notifications</strong>
        <button mat-button color="primary" (click)="markAllRead()">Mark all read</button>
      </div>
      <mat-divider />

      <mat-list *ngIf="notifications.length; else empty">
        <mat-list-item *ngFor="let n of notifications" [class.unread]="!n.isRead">
          <mat-icon matListItemIcon>{{ n.isRead ? 'notifications_none' : 'notifications_active' }}</mat-icon>
          <span matListItemTitle>{{ n.message }}</span>
          <span matListItemLine>{{ n.createdAt | date:'short' }}</span>
        </mat-list-item>
      </mat-list>

      <ng-template #empty>
        <p class="empty-msg">No notifications</p>
      </ng-template>
    </div>
  `,
  styles: [`
    .notification-panel {
      position: absolute;
      top: 64px;
      right: 16px;
      width: 340px;
      background: white;
      border-radius: 8px;
      z-index: 1000;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
    }
    .unread { background: #f0f4ff; }
    .empty-msg { padding: 16px; text-align: center; color: #888; }
  `],
})
export class NotificationDropdownComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(
    private notifService: NotificationService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    // TODO (Person 4): Subscribe to fetchNotifications, update unreadCount$ on the service
  }

  markAllRead(): void {
    // TODO (Person 4): Call notifService.markAllAsRead(userId) and refresh list
  }
}
