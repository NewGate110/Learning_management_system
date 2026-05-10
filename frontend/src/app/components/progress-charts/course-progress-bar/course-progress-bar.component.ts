/// ★ Innovation Feature — Student Progress Dashboard

import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { CourseCompletionItem } from '../../../core/models';

@Component({
  selector: 'app-course-progress-bar',
  standalone: true,
  imports: [CommonModule, MatCardModule, BaseChartDirective],
  template: `
    <mat-card>
      <mat-card-header><mat-card-title>Per-Course Completion</mat-card-title></mat-card-header>
      <mat-card-content>
        @if (courses.length) {
          <canvas baseChart [data]="chartData" [type]="'bar'" [options]="chartOptions"></canvas>
        } @else {
          <div style="padding:32px;text-align:center;color:#94a3b8">No course data yet</div>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class CourseProgressBarComponent implements OnChanges {
  @Input() courses: CourseCompletionItem[] = [];

  chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { x: { min: 0, max: 100, ticks: { callback: v => v + '%' } } },
  };

  ngOnChanges(): void {
    this.chartData = {
      labels: this.courses.map(c => c.courseTitle),
      datasets: [{
        data: this.courses.map(c => c.completionPercentage),
        label: 'Completion %',
        backgroundColor: this.courses.map(c =>
          c.completionPercentage >= 75 ? '#22c55e' : c.completionPercentage >= 50 ? '#eab308' : '#ef4444'
        ),
        borderRadius: 4,
      }],
    };
  }
}
