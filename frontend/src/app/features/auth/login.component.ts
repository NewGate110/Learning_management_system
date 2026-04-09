import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-screen">
      <div class="auth-box">
        <div class="auth-logo">College<span>LMS</span></div>
        <p class="auth-subtitle">Sign in to your learning workspace</p>

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }

        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            class="form-input"
            type="email"
            [(ngModel)]="email"
            placeholder="your@email.com"
            (keyup.enter)="login()">
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            class="form-input"
            type="password"
            [(ngModel)]="password"
            placeholder="••••••••"
            (keyup.enter)="login()">
        </div>

        <button class="btn primary full" (click)="login()" [disabled]="loading()" style="margin-top:8px">
          {{ loading() ? 'Signing in...' : 'Sign in' }}
        </button>

        <p class="text-muted text-sm" style="margin-top:16px;text-align:center">
          Don't have an account? <a routerLink="/register">Create one</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-screen {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      position: relative;
      overflow: hidden;
    }
    .auth-screen::before {
      content: '';
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(108,99,255,.15) 0%, transparent 70%);
      top: -100px;
      left: -100px;
      pointer-events: none;
    }
    .auth-screen::after {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(62,207,142,.08) 0%, transparent 70%);
      bottom: -50px;
      right: -50px;
      pointer-events: none;
    }
    .auth-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 48px;
      width: 420px;
      position: relative;
      z-index: 1;
      box-shadow: var(--shadow);
    }
    .auth-logo {
      font-family: 'DM Serif Display', serif;
      font-size: 28px;
      color: var(--text);
      margin-bottom: 8px;
      letter-spacing: -.5px;
    }
    .auth-logo span { color: var(--accent2); }
    .auth-subtitle { color: var(--muted); font-size: 14px; margin-bottom: 28px; }
    @media (max-width: 480px) {
      .auth-box { width: 100%; margin: 16px; padding: 32px 24px; }
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  login() {
    if (!this.email || !this.password) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.error.set(e.error?.message ?? 'Invalid credentials');
        this.loading.set(false);
      }
    });
  }
}
