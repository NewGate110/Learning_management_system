import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

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
          <p class="auth-sub">Join as a student</p>

          <div class="field">
            <label>Full name</label>
            <input type="text" [(ngModel)]="name" name="name"
                   placeholder="Jane Smith" required/>
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email"
                   placeholder="you@college.edu" required/>
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password"
                   placeholder="Min 8 characters" required minlength="8"/>
          </div>

          @if (error()) {
            <div class="auth-error">{{ error() }}</div>
          }

          <button type="submit" class="btn primary w-full" [disabled]="loading()">
            @if (loading()) { Creating account… } @else { Create account }
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
      background: var(--lms-paper);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 48px 56px; gap: 32px;
    }
    .auth-brand { text-align: center; }
    .logo-mark { display: inline-block; background: var(--lms-accent); color: #fff; font-family: 'DM Serif Display',serif; padding: 6px 14px; border-radius: 8px; font-size: 16px; margin-bottom: 12px; }
    .auth-brand h1 { font-size: 1.6rem; }
    .auth-form { width: 100%; display: flex; flex-direction: column; gap: 18px; }
    .auth-form h2 { font-size: 1.4rem; }
    .auth-sub { color: var(--lms-muted); font-size: 14px; margin-top: -10px; }
    .auth-error { background: var(--lms-warn-pale); color: var(--lms-warn); padding: 10px 14px; border-radius: var(--lms-radius-sm); font-size: 13px; }
    .auth-link { text-align: center; font-size: 14px; color: var(--lms-muted); }
    .auth-art { flex: 1; background: var(--lms-ink); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
    .auth-art::before { content: ''; position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(45,106,79,.4) 0%, transparent 70%); bottom: -100px; left: -100px; }
    .art-inner { position: relative; z-index: 1; padding: 48px; color: #fff; }
    .art-inner h2 { font-size: 3rem; line-height: 1.1; color: #fff; margin-bottom: 24px; }
    .art-inner h2 em { font-style: italic; color: var(--lms-accent-light); }
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

  name = ''; email = ''; password = '';
  loading = signal(false);
  error   = signal('');

  submit() {
    if (!this.name || !this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.register({ name: this.name, email: this.email, password: this.password }).subscribe({
      next: () => { this.toast.success('Account created!'); this.router.navigate(['/dashboard']); },
      error: (e) => { this.error.set(e.error?.message ?? 'Registration failed'); this.loading.set(false); }
    });
  }
}
