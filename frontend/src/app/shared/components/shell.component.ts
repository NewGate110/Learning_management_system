import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

interface NavItem { path: string; label: string; icon: string; roles?: string[]; section?: string; }

const NAV: NavItem[] = [
  { path: '/dashboard',     label: 'Dashboard',     icon: 'dashboard',        section: 'MAIN' },
  { path: '/courses',       label: 'Courses',       icon: 'menu_book',        section: 'MAIN' },
  { path: '/assignments',   label: 'Assignments',   icon: 'assignment',       section: 'MAIN' },
  { path: '/assessments',   label: 'Assessments',   icon: 'quiz',             section: 'MAIN' },
  { path: '/grades',        label: 'Grades',        icon: 'grade',            section: 'MAIN' },
  { path: '/attendance',    label: 'Attendance',    icon: 'fact_check',       section: 'MAIN' },
  { path: '/calendar',      label: 'Calendar',      icon: 'calendar_month',   section: 'MAIN' },
  { path: '/timetable',     label: 'Timetable',     icon: 'calendar_month',   section: 'MAIN' },
  { path: '/progress',      label: 'Progress',      icon: 'trending_up',      roles: ['Student'], section: 'MAIN' },
  { path: '/notifications', label: 'Notifications', icon: 'notifications',    section: 'OTHER' },
  { path: '/admin',         label: 'Admin Panel',   icon: 'admin_panel_settings', roles: ['Admin'], section: 'ADMIN' },
  { path: '/users',         label: 'Users',         icon: 'group',            roles: ['Admin'], section: 'ADMIN' },
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
          <span class="mobile-logo">College<span style="color:var(--accent2)">LMS</span></span>
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
      width: 240px;
      min-width: 240px;
      height: 100vh;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      z-index: 100;
    }
    .sidebar-logo {
      padding: 24px 20px 20px;
      font-family: 'DM Serif Display', serif;
      font-size: 22px;
      color: var(--text);
      border-bottom: 1px solid var(--border);
      letter-spacing: -.3px;
      flex-shrink: 0;
    }
    .sidebar-logo span { color: var(--accent2); }
    .sidebar-section {
      padding: 16px 12px 8px;
      font-size: 10px;
      font-weight: 600;
      color: var(--muted);
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      margin: 1px 8px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--muted);
      font-size: 13.5px;
      font-weight: 400;
      transition: all .15s;
      border: none;
      background: none;
      width: calc(100% - 16px);
      text-decoration: none;
    }
    .nav-item:hover { background: var(--surface2); color: var(--text); text-decoration: none; }
    .nav-item.active { background: var(--accent-dim); color: var(--accent2); font-weight: 500; }
    .nav-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
    .nav-badge {
      margin-left: auto;
      background: var(--red);
      color: #fff;
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 20px;
      min-width: 18px;
      text-align: center;
    }
    .sidebar-user {
      margin-top: auto;
      padding: 16px;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .user-avatar {
      width: 32px; height: 32px;
      background: var(--accent-dim);
      border: 1px solid var(--accent);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 600;
      color: var(--accent2);
      flex-shrink: 0;
    }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 11px; color: var(--muted); background: var(--surface2); padding: 1px 6px; border-radius: 4px; display: inline-block; }
    .logout-btn { background: none; border: none; color: var(--muted); cursor: pointer; padding: 4px; border-radius: 4px; font-size: 16px; transition: color .2s; }
    .logout-btn:hover { color: var(--red); }
    .main { flex: 1; height: 100vh; overflow-y: auto; background: var(--bg); min-width: 0; }
    .mobile-topbar { display: none; }
    .mobile-overlay { display: none; }
    @media (max-width: 768px) {
      .sidebar { position: fixed; left: 0; top: 0; transform: translateX(-100%); transition: transform .25s ease; }
      .sidebar.mobile-open { transform: none; }
      .mobile-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 99; }
      .mobile-topbar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 16px;
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        position: sticky; top: 0; z-index: 50;
      }
      .hamburger { background: none; border: none; color: var(--text); font-size: 20px; cursor: pointer; }
      .mobile-logo { font-family: 'DM Serif Display', serif; font-size: 18px; }
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
