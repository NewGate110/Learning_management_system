/// ★ Innovation Feature — Student Progress Dashboard

import { Component, Input, OnChanges } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { SubmissionRateResponse } from '../../../core/models';

@Component({
  selector: 'app-submission-rate-chart',
  standalone: true,
  imports: [MatCardModule, BaseChartDirective],
  template: `
    <mat-card>
      <mat-card-header><mat-card-title>Submission Breakdown</mat-card-title></mat-card-header>
      <mat-card-content>
        @if (submissions) {
          <canvas baseChart [data]="chartData" [type]="'doughnut'" [options]="chartOptions"></canvas>
        } @else {
          <div style="padding:32px;text-align:center;color:#94a3b8">No submission data yet</div>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class SubmissionRateChartComponent implements OnChanges {
  @Input() submissions: SubmissionRateResponse | null = null;

  chartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  ngOnChanges(): void {
    if (!this.submissions) return;
    this.chartData = {
      labels: ['On Time', 'Late', 'Pending'],
      datasets: [{
        data: [this.submissions.onTime, this.submissions.late, this.submissions.pending],
        backgroundColor: ['#22c55e', '#eab308', '#94a3b8'],
      }],
    };
  }
}
