/// ★ Innovation Feature — Student Progress Dashboard

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-upcoming-deadlines-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule],
  template: `
    <mat-card>
      <mat-card-header><mat-card-title>Upcoming Deadlines</mat-card-title></mat-card-header>
      <mat-card-content>
        <mat-list>
          <mat-list-item *ngFor="let item of deadlines">
            <mat-icon matListItemIcon color="warn">event</mat-icon>
            <span matListItemTitle>{{ item.title }}</span>
            <span matListItemLine>{{ item.deadline | date:'mediumDate' }}</span>
          </mat-list-item>
        </mat-list>
        <!-- TODO (Person 4): Populate deadlines from ProgressService -->
      </mat-card-content>
    </mat-card>
  `,
})
export class UpcomingDeadlinesWidgetComponent {
  deadlines: { title: string; deadline: string }[] = [];
  // TODO (Person 4): Inject ProgressService and load deadlines on init
}
