import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <h1>Admin management panel</h1>
    <!-- TODO (Person 4): Implement full AdminPanelComponent -->
    <p>Admin management panel content goes here.</p>
  `,
})
export class AdminPanelComponent {
}
