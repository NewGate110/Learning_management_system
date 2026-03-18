/// ★ Innovation Feature — Student Progress Dashboard

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-grade-line-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, BaseChartDirective],
  template: `
    <mat-card>
      <mat-card-header><mat-card-title>Grade trend over time (Line chart)</mat-card-title></mat-card-header>
      <mat-card-content>
        <canvas baseChart
          [data]="chartData"
          [type]="'line'"
          [options]="chartOptions">
        </canvas>
        <!-- TODO (Person 4): Wire chartData from ProgressService response -->
      </mat-card-content>
    </mat-card>
  `,
})
export class GradeLineChartComponent {
  chartData: ChartData<'line'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'line'> = { responsive: true };
  // TODO (Person 4): Inject ProgressService and populate chartData on init
}
