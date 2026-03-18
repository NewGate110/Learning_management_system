import { Component }          from '@angular/core';
import { CommonModule }        from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule }       from '@angular/material/card';
import { MatInputModule }      from '@angular/material/input';
import { MatButtonModule }     from '@angular/material/button';
import { MatFormFieldModule }  from '@angular/material/form-field';
import { Router }              from '@angular/router';
import { AuthService }         from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatInputModule, MatButtonModule, MatFormFieldModule,
  ],
  template: `
    <div class="login-wrapper">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>College LMS — Sign In</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <!-- TODO (Person 4): Build full reactive login form with validation -->
          <p>Login form goes here.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .login-card { width: 400px; padding: 16px; }
  `],
})
export class LoginComponent {
  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor(
    private fb:   FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {}

  // TODO (Person 4): Implement onSubmit — call auth.login(), navigate to /dashboard on success
  onSubmit(): void {}
}
