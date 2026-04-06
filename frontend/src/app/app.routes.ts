import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login',    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', redirectTo: '/login', pathMatch: 'full' },
  {
    path: '',
    loadComponent: () => import('./shared/components/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard',     loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'courses',       loadComponent: () => import('./features/courses/courses.component').then(m => m.CoursesComponent) },
      { path: 'courses/:id',   loadComponent: () => import('./features/courses/course-detail.component').then(m => m.CourseDetailComponent) },
      { path: 'assignments',   loadComponent: () => import('./features/assignments/assignments.component').then(m => m.AssignmentsComponent) },
      { path: 'grades',        loadComponent: () => import('./features/grades/grades.component').then(m => m.GradesComponent) },
      { path: 'attendance',    loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent) },
      { path: 'timetable',     loadComponent: () => import('./features/timetable/timetable.component').then(m => m.TimetableComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'progress',      loadComponent: () => import('./features/progress/progress.component').then(m => m.ProgressComponent) },
      { path: 'users',         loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
