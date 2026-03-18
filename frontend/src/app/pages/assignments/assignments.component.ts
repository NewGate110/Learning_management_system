import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <h1>Assignments list and submission</h1>
    <!-- TODO (Person 4): Implement full AssignmentsComponent -->
    <p>Assignments list and submission content goes here.</p>
  `,
})
export class AssignmentsComponent {
}
