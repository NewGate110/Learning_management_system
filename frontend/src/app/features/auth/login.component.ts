import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Title } from '@angular/platform-browser';

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
            [class.input-error]="touched && !email"
            type="email"
            [(ngModel)]="email"
            placeholder="your@email.com"
            (keyup.enter)="login()">
          @if (touched && !email) {
            <span class="field-error">Email is required</span>
          }
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            class="form-input"
            [class.input-error]="touched && !password"
            type="password"
            [(ngModel)]="password"
            placeholder="••••••••"
            (keyup.enter)="login()">
          @if (touched && !password) {
            <span class="field-error">Password is required</span>
          }
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
      width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(37,99,235,.10) 0%, transparent 70%);
      top: -100px; left: -100px;
      pointer-events: none;
    }
    .auth-screen::after {
      content: '';
      position: absolute;
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(245,158,11,.06) 0%, transparent 70%);
      bottom: -50px; right: -50px;
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
      font-family: 'Poppins', sans-serif;
      font-size: 28px;
      color: var(--text);
      margin-bottom: 8px;
      font-weight: 700;
      letter-spacing: -.5px;
    }
    .auth-logo span { color: var(--blue); }
    .auth-subtitle { color: var(--muted); font-size: 14px; margin-bottom: 28px; }
    .input-error { border-color: var(--red) !important; box-shadow: 0 0 0 3px var(--red-dim) !important; }
    .field-error { font-size: 12px; color: var(--red); margin-top: 4px; display: block; }
    @media (max-width: 480px) {
      .auth-box { width: 100%; margin: 16px; padding: 32px 24px; }
    }
  `]
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private title  = inject(Title);

  email    = '';
  password = '';
  touched  = false;
  loading  = signal(false);
  error    = signal('');

  ngOnInit() {
    this.title.setTitle('Sign In — CollegeLMS');
    if (this.auth.isLoggedIn()) this.router.navigate(['/dashboard']);
  }

  login() {
    this.touched = true;
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.error.set('');
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.error.set(e.error?.message ?? 'Invalid credentials. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
