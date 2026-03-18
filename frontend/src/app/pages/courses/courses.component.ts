import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <h1>Course listing</h1>
    <!-- TODO (Person 4): Implement full CoursesComponent -->
    <p>Course listing content goes here.</p>
  `,
})
export class CoursesComponent {
}
