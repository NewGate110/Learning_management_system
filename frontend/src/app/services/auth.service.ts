import { Injectable }  from '@angular/core';
import { ApiService } from './api.service';
import { Router }     from '@angular/router';
import { tap }        from 'rxjs/operators';

interface LoginResponse {
  token: string;
  userId: number;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY  = 'token';
  private readonly USER_KEY   = 'userId';
  private readonly ROLE_KEY   = 'role';

  constructor(private api: ApiService, private router: Router) {}

  login(email: string, password: string) {
    return this.api.post<LoginResponse>('/auth/login', { email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY,  String(res.userId));
        localStorage.setItem(this.ROLE_KEY,  res.role);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  get userId(): number {
    return Number(localStorage.getItem(this.USER_KEY));
  }

  get role(): string {
    return localStorage.getItem(this.ROLE_KEY) ?? '';
  }
}
