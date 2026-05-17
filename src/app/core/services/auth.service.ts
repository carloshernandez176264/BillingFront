import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { AuthResponse, LoginRequest, ChangePasswordRequest, TokenPayload } from '@core/models';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY   = 'bp_access_token';
  private readonly REFRESH_KEY = 'bp_refresh_token';

  private _currentUser = signal<TokenPayload | null>(this.decodeStoredToken());
  readonly currentUser  = this._currentUser.asReadonly();
  readonly isLoggedIn   = computed(() => !!this._currentUser());
  readonly userRoles    = computed(() => this._currentUser()?.roles ?? []);

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap(res => this.storeTokens(res))
    );
  }

  refreshToken() {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/auth/refresh`,
      { refreshToken }
    ).pipe(tap(res => this.storeTokens(res)));
  }

  logout() {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken })
        .subscribe({ error: () => {} });
    }
    this.clearTokens();
    this.router.navigate(['/auth/login']);
  }

  changePassword(request: ChangePasswordRequest) {
    return this.http.post(`${environment.apiUrl}/auth/change-password`, request);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasRole(role: string): boolean {
    return this.userRoles().includes(`ROLE_${role}`) || this.userRoles().includes(role);
  }

  hasPermission(permission: string): boolean {
    return this.userRoles().includes(permission);
  }

  hasAnyRole(...roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  private storeTokens(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY,   res.accessToken);
    localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
    this._currentUser.set(this.decodeToken(res.accessToken));
  }

  private clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this._currentUser.set(null);
  }

  private decodeStoredToken(): TokenPayload | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return token ? this.decodeToken(token) : null;
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}
