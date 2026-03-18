import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <h1>Quiz interface</h1>
    <!-- TODO (Person 4): Implement full QuizComponent -->
    <p>Quiz interface content goes here.</p>
  `,
})
export class QuizComponent {
}
