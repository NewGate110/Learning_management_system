/// ★ Innovation Feature — Student Progress Dashboard

import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { GradeTrendPoint } from '../../../core/models';

@Component({
  selector: 'app-grade-line-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, BaseChartDirective],
  template: `
    <mat-card>
      <mat-card-header><mat-card-title>Grade Trend</mat-card-title></mat-card-header>
      <mat-card-content>
        @if (points.length) {
          <canvas baseChart [data]="chartData" [type]="'line'" [options]="chartOptions"></canvas>
        } @else {
          <div style="padding:32px;text-align:center;color:#94a3b8">No grade data yet</div>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class GradeLineChartComponent implements OnChanges {
  @Input() points: GradeTrendPoint[] = [];

  chartData: ChartData<'line'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { min: 0, max: 100, ticks: { stepSize: 25 } } },
  };

  ngOnChanges(): void {
    this.chartData = {
      labels: this.points.map(p => p.label),
      datasets: [{
        data: this.points.map(p => p.score),
        label: 'Score',
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.15)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#6366f1',
      }],
    };
  }
}
