/// ★ Innovation Feature — Student Progress Dashboard

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ProgressService } from '../../services/progress.service';

@Component({
  selector: 'app-progress-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <h1>Student Progress Dashboard</h1>
    <!-- TODO (Person 4): Implement full ProgressDashboardComponent -->
    <p>Student Progress Dashboard content goes here.</p>
  `,
})
export class ProgressDashboardComponent {
  constructor(private progressService: ProgressService) {}
  // TODO (Person 4): Call progressService methods on init, bind data to chart components
}
