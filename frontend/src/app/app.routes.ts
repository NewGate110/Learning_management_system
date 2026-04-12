import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login',    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
  {
    path: '',
    loadComponent: () => import('./shared/components/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard',     loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'courses',       loadComponent: () => import('./features/courses/courses.component').then(m => m.CoursesComponent) },
      { path: 'courses/:id/modules', loadComponent: () => import('./features/courses/course-modules.component').then(m => m.CourseModulesComponent) },
      { path: 'courses/:id',   loadComponent: () => import('./features/courses/course-detail.component').then(m => m.CourseDetailComponent) },
      { path: 'modules/:id',   loadComponent: () => import('./features/modules/module-detail.component').then(m => m.ModuleDetailComponent) },
      { path: 'assignments',   loadComponent: () => import('./features/assignments/assignments.component').then(m => m.AssignmentsComponent) },
      { path: 'assessments',   loadComponent: () => import('./features/assessments/assessments.component').then(m => m.AssessmentsComponent) },
      { path: 'grades',        loadComponent: () => import('./features/grades/grades.component').then(m => m.GradesComponent) },
      { path: 'attendance',    loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent) },
      { path: 'calendar',      loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent) },
      { path: 'timetable',     loadComponent: () => import('./features/timetable/timetable.component').then(m => m.TimetableComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'progress',      loadComponent: () => import('./features/progress/progress.component').then(m => m.ProgressComponent) },
      { path: 'admin',         loadComponent: () => import('./pages/admin-panel/admin-panel.component').then(m => m.AdminPanelComponent) },
      { path: 'users',         loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
