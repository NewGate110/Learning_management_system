import { Injectable }       from '@angular/core';
import { ApiService }       from './api.service';
import { BehaviorSubject }  from 'rxjs';
import { Notification }     from '../models/notification.model';

/// ★ Innovation Feature — Automated Deadline Reminder System

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount.asObservable();

  constructor(private api: ApiService) {}

  // TODO (Person 4): Implement polling or WebSocket for real-time updates

  fetchNotifications(userId: number) {
    return this.api.get<Notification[]>(`/notification?userId=${userId}`);
  }

  fetchUnreadCount(userId: number) {
    return this.api.get<{ count: number }>(`/notification/unread-count?userId=${userId}`);
  }

  markAsRead(notificationId: number) {
    return this.api.patch(`/notification/${notificationId}/read`);
  }

  markAllAsRead(userId: number) {
    return this.api.patch(`/notification/read-all?userId=${userId}`);
  }
}
