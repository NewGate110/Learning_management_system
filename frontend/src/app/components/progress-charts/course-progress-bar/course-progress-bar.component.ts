/// ★ Innovation Feature — Student Progress Dashboard

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-course-progress-bar',
  standalone: true,
  imports: [CommonModule, MatCardModule, BaseChartDirective],
  template: `
    <mat-card>
      <mat-card-header><mat-card-title>Per-course completion progress bar</mat-card-title></mat-card-header>
      <mat-card-content>
        <canvas baseChart
          [data]="chartData"
          [type]="'bar'"
          [options]="chartOptions">
        </canvas>
        <!-- TODO (Person 4): Wire chartData from ProgressService response -->
      </mat-card-content>
    </mat-card>
  `,
})
export class CourseProgressBarComponent {
  chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'bar'> = { responsive: true };
  // TODO (Person 4): Inject ProgressService and populate chartData on init
}
