import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, RouterLink],
  template: `
    <h1>Dashboard</h1>

    <!-- ★ Innovation: Notification alert widget goes here (Person 4) -->
    <!-- ★ Innovation: Upcoming deadlines widget goes here (Person 4) -->

    <!-- TODO (Person 4): Build full dashboard with quick-access cards -->
    <p>Dashboard content goes here.</p>
  `,
})
export class DashboardComponent {}
