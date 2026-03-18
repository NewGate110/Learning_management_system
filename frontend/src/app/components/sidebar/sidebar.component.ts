import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  template: `
    <mat-nav-list>
      <a mat-list-item routerLink="/dashboard"    routerLinkActive="active"><mat-icon>dashboard</mat-icon> Dashboard</a>
      <a mat-list-item routerLink="/courses"      routerLinkActive="active"><mat-icon>school</mat-icon> Courses</a>
      <a mat-list-item routerLink="/assignments"  routerLinkActive="active"><mat-icon>assignment</mat-icon> Assignments</a>
      <a mat-list-item routerLink="/quiz"         routerLinkActive="active"><mat-icon>quiz</mat-icon> Quiz</a>
      <a mat-list-item routerLink="/progress"     routerLinkActive="active"><mat-icon>bar_chart</mat-icon> My Progress ★</a>
      <a mat-list-item routerLink="/admin"        routerLinkActive="active"><mat-icon>admin_panel_settings</mat-icon> Admin</a>
    </mat-nav-list>
  `,
  styles: [`.active { background: rgba(0,0,0,0.08); }`],
})
export class SidebarComponent {}
