import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

interface NavItem { path: string; label: string; icon: string; roles?: string[]; section?: string; }

const NAV: NavItem[] = [
  { path: '/dashboard',     label: 'Dashboard',     icon: 'dashboard',            section: 'MAIN' },
  { path: '/courses',       label: 'Courses',       icon: 'menu_book',            section: 'MAIN' },
  { path: '/assignments',   label: 'Assignments',   icon: 'assignment',           roles: ['Student', 'Instructor'], section: 'MAIN' },
  { path: '/assessments',   label: 'Assessments',   icon: 'quiz',                 roles: ['Student', 'Instructor'], section: 'MAIN' },
  { path: '/grades',        label: 'Grades',        icon: 'grade',                roles: ['Student', 'Instructor'], section: 'MAIN' },
  { path: '/attendance',    label: 'Attendance',    icon: 'fact_check',           roles: ['Instructor', 'Admin'],   section: 'MAIN' },
  { path: '/calendar',      label: 'Calendar',      icon: 'calendar_month',       section: 'MAIN' },
  { path: '/timetable',     label: 'Timetable',     icon: 'schedule',             section: 'MAIN' },
  { path: '/progress',      label: 'Progress',      icon: 'trending_up',          roles: ['Student'],               section: 'MAIN' },
  { path: '/notifications', label: 'Notifications', icon: 'notifications',        section: 'OTHER' },
  { path: '/admin',         label: 'Admin Panel',   icon: 'admin_panel_settings', roles: ['Admin'],                 section: 'ADMIN' },
  { path: '/users',         label: 'Users',         icon: 'group',                roles: ['Admin'],                 section: 'ADMIN' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div style="display:flex;height:100vh;overflow:hidden;">

      <!-- Sidebar -->
      <nav class="sidebar" [class.mobile-open]="menuOpen()">
        <div class="sidebar-logo">College<span>LMS</span></div>

        <div id="sidebar-nav">
          @for (section of sections(); track section) {
            <div class="sidebar-section">{{ section }}</div>
            @for (item of navBySection(section); track item.path) {
              <a [routerLink]="item.path" routerLinkActive="active"
                 class="nav-item" (click)="menuOpen.set(false)">
                <span class="material-icons nav-icon">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
                @if (item.path === '/notifications' && unread() > 0) {
                  <span class="nav-badge">{{ unread() }}</span>
                }
              </a>
            }
          }
        </div>

        <div class="sidebar-user">
          <div class="user-avatar">{{ initials() }}</div>
          <div class="user-info">
            <div class="user-name">{{ auth.role() }}</div>
            <span class="user-role">ID {{ auth.userId() }}</span>
          </div>
          <button class="logout-btn" title="Sign out" (click)="auth.logout()">↩</button>
        </div>
      </nav>

      <!-- Mobile overlay -->
      @if (menuOpen()) {
        <div class="mobile-overlay" (click)="menuOpen.set(false)"></div>
      }

      <!-- Main -->
      <div class="main">
        <!-- Mobile topbar -->
        <div class="mobile-topbar">
          <button class="hamburger" (click)="menuOpen.set(true)">☰</button>
          <span class="mobile-logo">College<span style="color:rgba(251,191,36,1)">LMS</span></span>
          <a routerLink="/notifications" style="font-size:18px;position:relative">
            <span class="material-icons" style="font-size:22px;vertical-align:middle">notifications</span>
            @if (unread() > 0) {
              <span class="nav-badge" style="position:absolute;top:-4px;right:-4px;font-size:9px">{{ unread() }}</span>
            }
          </a>
        </div>
        <router-outlet/>
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 248px;
      min-width: 248px;
      height: 100vh;
      background: var(--sidebar-bg);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      z-index: 100;
      box-shadow: 2px 0 12px rgba(30,58,138,0.15);
    }
    .sidebar-logo {
      padding: 24px 20px 22px;
      font-family: var(--font-heading);
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      border-bottom: 1px solid var(--sidebar-border);
      letter-spacing: -.3px;
      flex-shrink: 0;
    }
    .sidebar-logo span {
      color: rgba(251,191,36,1);
    }
    .sidebar-section {
      padding: 18px 16px 6px;
      font-size: 10px;
      font-weight: 600;
      color: rgba(255,255,255,0.40);
      letter-spacing: 1.2px;
      text-transform: uppercase;
      font-family: var(--font-body);
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      margin: 2px 10px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--sidebar-text);
      font-size: 14px;
      font-weight: 400;
      font-family: var(--font-body);
      transition: all .15s;
      border: none;
      background: none;
      width: calc(100% - 20px);
      text-decoration: none;
    }
    .nav-item:hover {
      background: var(--sidebar-hover);
      color: #fff;
      text-decoration: none;
    }
    .nav-item.active {
      background: rgba(255,255,255,0.15);
      color: var(--sidebar-active);
      font-weight: 600;
      box-shadow: inset 3px 0 0 rgba(251,191,36,1);
    }
    .nav-icon { font-size: 18px; width: 22px; text-align: center; flex-shrink: 0; }
    .nav-badge {
      margin-left: auto;
      background: var(--amber);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 20px;
      min-width: 20px;
      text-align: center;
    }
    .sidebar-user {
      margin-top: auto;
      padding: 16px;
      border-top: 1px solid var(--sidebar-border);
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .user-avatar {
      width: 34px; height: 34px;
      background: rgba(251,191,36,0.20);
      border: 2px solid rgba(251,191,36,0.60);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700;
      color: rgba(251,191,36,1);
      flex-shrink: 0;
      font-family: var(--font-heading);
    }
    .user-info { flex: 1; min-width: 0; }
    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: var(--font-body);
    }
    .user-role {
      font-size: 11px;
      color: var(--sidebar-text);
      background: rgba(255,255,255,0.10);
      padding: 1px 7px;
      border-radius: 4px;
      display: inline-block;
    }
    .logout-btn {
      background: none;
      border: none;
      color: var(--sidebar-text);
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      font-size: 16px;
      transition: all .2s;
      line-height: 1;
    }
    .logout-btn:hover { color: #fff; background: rgba(220,38,38,0.25); }
    .main { flex: 1; height: 100vh; overflow-y: auto; background: var(--bg); min-width: 0; }
    .mobile-topbar { display: none; }
    .mobile-overlay { display: none; }
    @media (max-width: 768px) {
      .sidebar { position: fixed; left: 0; top: 0; transform: translateX(-100%); transition: transform .25s ease; }
      .sidebar.mobile-open { transform: none; }
      .mobile-overlay { display: block; position: fixed; inset: 0; background: rgba(30,58,138,0.40); backdrop-filter: blur(2px); z-index: 99; }
      .mobile-topbar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 16px;
        background: var(--navy);
        border-bottom: 1px solid var(--sidebar-border);
        position: sticky; top: 0; z-index: 50;
      }
      .hamburger { background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; }
      .mobile-logo { font-family: var(--font-heading); font-size: 18px; color: #fff; font-weight: 700; }
    }
  `]
})
export class ShellComponent implements OnInit {
  auth     = inject(AuthService);
  private api  = inject(ApiService);
  menuOpen = signal(false);
  unread   = signal(0);

  initials = computed(() => (this.auth.role() ?? 'U').charAt(0));

  sections = computed(() => {
    const role = this.auth.role() ?? '';
    const visible = NAV.filter(n => !n.roles || n.roles.includes(role));
    return [...new Set(visible.map(n => n.section ?? 'MAIN'))];
  });

  navBySection(section: string) {
    const role = this.auth.role() ?? '';
    return NAV.filter(n => (n.section ?? 'MAIN') === section && (!n.roles || n.roles.includes(role)));
  }

  ngOnInit() {
    this.api.getUnreadCount().subscribe({ next: r => this.unread.set(r.count), error: () => {} });
  }
}
