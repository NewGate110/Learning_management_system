import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; message: string; type: 'success' | 'error'; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private next = 0;

  show(message: string, type: 'success' | 'error' = 'success') {
    const id = ++this.next;
    this._toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this._toasts.update(t => t.filter(x => x.id !== id)), 3500);
  }
  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string)   { this.show(msg, 'error'); }
}
