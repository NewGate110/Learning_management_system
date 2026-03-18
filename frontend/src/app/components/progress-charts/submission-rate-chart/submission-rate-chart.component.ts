/// ★ Innovation Feature — Student Progress Dashboard

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-submission-rate-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, BaseChartDirective],
  template: `
    <mat-card>
      <mat-card-header><mat-card-title>Assignment submission rate chart</mat-card-title></mat-card-header>
      <mat-card-content>
        <canvas baseChart
          [data]="chartData"
          [type]="'doughnut'"
          [options]="chartOptions">
        </canvas>
        <!-- TODO (Person 4): Wire chartData from ProgressService response -->
      </mat-card-content>
    </mat-card>
  `,
})
export class SubmissionRateChartComponent {
  chartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'doughnut'> = { responsive: true };
  // TODO (Person 4): Inject ProgressService and populate chartData on init
}
