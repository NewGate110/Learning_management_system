import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <h1>Single course view</h1>
    <!-- TODO (Person 4): Implement full CourseDetailComponent -->
    <p>Single course view content goes here.</p>
  `,
})
export class CourseDetailComponent {
}
