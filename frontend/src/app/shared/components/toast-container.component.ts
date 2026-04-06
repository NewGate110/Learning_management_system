import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="t.type">
          <span>{{ t.type === 'success' ? '✓' : '⚠' }}</span>
          <span>{{ t.message }}</span>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  toast = inject(ToastService);
}
