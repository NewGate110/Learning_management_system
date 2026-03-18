import { Routes }   from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },

  // Protected routes — require AuthGuard
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'courses',
        loadComponent: () => import('./pages/courses/courses.component').then(m => m.CoursesComponent),
      },
      {
        path: 'courses/:id',
        loadComponent: () => import('./pages/course-detail/course-detail.component').then(m => m.CourseDetailComponent),
      },
      {
        path: 'assignments',
        loadComponent: () => import('./pages/assignments/assignments.component').then(m => m.AssignmentsComponent),
      },
      {
        path: 'quiz',
        loadComponent: () => import('./pages/quiz/quiz.component').then(m => m.QuizComponent),
      },
      {
        path: 'progress',  // ★ Innovation — Student Progress Dashboard
        loadComponent: () => import('./pages/progress-dashboard/progress-dashboard.component').then(m => m.ProgressDashboardComponent),
      },
      {
        path: 'admin',
        loadComponent: () => import('./pages/admin-panel/admin-panel.component').then(m => m.AdminPanelComponent),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'login' },
];
