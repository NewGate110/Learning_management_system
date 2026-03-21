import { Component, OnInit }  from '@angular/core';
import { RouterLink }          from '@angular/router';
import { MatToolbarModule }    from '@angular/material/toolbar';
import { MatButtonModule }     from '@angular/material/button';
import { MatIconModule }       from '@angular/material/icon';
import { MatBadgeModule }      from '@angular/material/badge';
import { AuthService }         from '../../services/auth.service';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    MatToolbarModule, MatButtonModule, MatIconModule, MatBadgeModule,
    NotificationDropdownComponent,
  ],
  template: `
    <mat-toolbar color="primary">
      <span routerLink="/" style="cursor:pointer">College LMS</span>
      <span class="spacer"></span>

      <a mat-button routerLink="/dashboard">Dashboard</a>
      <a mat-button routerLink="/courses">Courses</a>
      <a mat-button routerLink="/assignments">Assignments</a>
      <a mat-button routerLink="/progress">Progress</a>

      <!-- ★ Innovation: Notification bell with unread badge -->
      <button mat-icon-button (click)="toggleNotifications()" aria-label="Notifications">
        <mat-icon [matBadge]="unreadCount || null" matBadgeColor="warn">
          notifications
        </mat-icon>
      </button>
      @if (showDropdown) {
        <app-notification-dropdown />
      }

      <button mat-button (click)="logout()">Logout</button>
    </mat-toolbar>
  `,
  styles: [`.spacer { flex: 1 1 auto; }`],
})
export class NavbarComponent implements OnInit {
  unreadCount = 0;
  showDropdown = false;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    // TODO (Person 4): Subscribe to NotificationService.unreadCount$ here
  }

  toggleNotifications(): void {
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    this.auth.logout();
  }
}
