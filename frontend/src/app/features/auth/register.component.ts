import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-panel">
        <div class="auth-brand">
          <span class="logo-mark">LMS</span>
          <h1>College LMS</h1>
        </div>

        <form class="auth-form" (ngSubmit)="submit()">
          <h2>Create account</h2>
          <p class="auth-sub">Student self-registration</p>

          <div class="field">
            <label>Full name</label>
            <input type="text" [(ngModel)]="name" name="name"
              [class.input-error]="touched && !name"
              placeholder="Jane Smith">
            @if (touched && !name) {
              <span class="field-error">Full name is required</span>
            }
          </div>

          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email"
              [class.input-error]="touched && !email"
              placeholder="you@college.edu">
            @if (touched && !email) {
              <span class="field-error">Email is required</span>
            }
          </div>

          <div class="field">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password"
              [class.input-error]="touched && password.length > 0 && password.length < 8"
              placeholder="Min 8 characters">
            @if (touched && !password) {
              <span class="field-error">Password is required</span>
            } @else if (touched && password.length > 0 && password.length < 8) {
              <span class="field-error">Password must be at least 8 characters</span>
            }
          </div>

          @if (error()) {
            <div class="auth-error">{{ error() }}</div>
          }

          <button type="submit" class="btn primary w-full" [disabled]="loading()">
            {{ loading() ? 'Creating account...' : 'Create account' }}
          </button>

          <p class="auth-link">
            Already have an account? <a routerLink="/login">Sign in</a>
          </p>
        </form>
      </div>

      <div class="auth-art">
        <div class="art-inner">
          <h2>Start your<br><em>learning</em><br>journey today</h2>
          <p>Access courses, submit assignments, and track your academic progress.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; }
    .auth-panel {
      width: 480px; min-width: 480px;
      background: var(--surface);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 48px 56px; gap: 32px;
    }
    .auth-brand { text-align: center; }
    .logo-mark {
      display: inline-block;
      background: var(--blue); color: #fff;
      font-family: 'Poppins', sans-serif;
      padding: 6px 14px; border-radius: 8px;
      font-size: 16px; margin-bottom: 12px;
    }
    .auth-brand h1 { font-size: 1.6rem; }
    .auth-form { width: 100%; display: flex; flex-direction: column; gap: 18px; }
    .auth-form h2 { font-size: 1.4rem; }
    .auth-sub { color: var(--muted); font-size: 14px; margin-top: -10px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .5px; }
    .field input {
      width: 100%; background: var(--bg);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 14px; color: var(--text);
      font-family: var(--font-body); font-size: 15px; outline: none;
      transition: border-color .2s, box-shadow .2s;
    }
    .field input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
    .input-error { border-color: var(--red) !important; box-shadow: 0 0 0 3px var(--red-dim) !important; }
    .field-error { font-size: 12px; color: var(--red); margin-top: 2px; }
    .auth-error {
      background: var(--red-dim); color: var(--red);
      padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px;
    }
    .auth-link { text-align: center; font-size: 14px; color: var(--muted); }
    .auth-art {
      flex: 1; background: var(--navy);
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }
    .auth-art::before {
      content: ''; position: absolute;
      width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(37,99,235,.3) 0%, transparent 70%);
      bottom: -100px; left: -100px;
    }
    .art-inner { position: relative; z-index: 1; padding: 48px; }
    .art-inner h2 { font-size: 3rem; line-height: 1.1; color: #fff; margin-bottom: 24px; }
    .art-inner h2 em { font-style: italic; color: rgba(251,191,36,1); }
    .art-inner p { color: rgba(255,255,255,.6); font-size: 16px; max-width: 320px; }
    @media (max-width: 900px) {
      .auth-art { display: none; }
      .auth-panel { width: 100%; min-width: 0; padding: 32px 24px; }
    }
  `]
})
export class RegisterComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private toast  = inject(ToastService);
  private title  = inject(Title);

  name     = '';
  email    = '';
  password = '';
  touched  = false;
  loading  = signal(false);
  error    = signal('');

  ngOnInit() {
    this.title.setTitle('Register — CollegeLMS');
  }

  submit() {
    this.touched = true;
    if (!this.name || !this.email || !this.password || this.password.length < 8) return;

    this.loading.set(true);
    this.error.set('');
    this.auth.register({ name: this.name, email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Account created. Please sign in.');
        this.router.navigate(['/login']);
      },
      error: (e) => {
        this.error.set(e.error?.message ?? 'Registration failed. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
