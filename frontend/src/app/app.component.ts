import { Component }        from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent }  from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    @if (router.url !== '/login') {
      <app-navbar />
    }
    <main class="main-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    .main-content {
      padding: 24px;
      max-width: 1280px;
      margin: 0 auto;
    }
  `],
})
export class AppComponent {
  constructor(public router: Router) {}
}
