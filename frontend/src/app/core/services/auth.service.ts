import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'lms_token';
  private readonly USER_KEY  = 'lms_user';

  private _token  = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  private _userId = signal<number | null>(this.loadUserId());
  private _role   = signal<string | null>(this.loadRole());

  readonly token   = this._token.asReadonly();
  readonly userId  = this._userId.asReadonly();
  readonly role    = this._role.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isAdmin = computed(() => this._role() === 'Admin');
  readonly isInstructor = computed(() => this._role() === 'Instructor');
  readonly isStudent = computed(() => this._role() === 'Student');

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap(res => this.persist(res))
    );
  }

  register(req: RegisterRequest) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, req);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._token.set(null);
    this._userId.set(null);
    this._role.set(null);
    this.router.navigate(['/login']);
  }

  private persist(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify({ userId: res.userId, role: res.role }));
    this._token.set(res.token);
    this._userId.set(res.userId);
    this._role.set(res.role);
  }

  private loadUserId(): number | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw).userId : null;
  }
  private loadRole(): string | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw).role : null;
  }
}
