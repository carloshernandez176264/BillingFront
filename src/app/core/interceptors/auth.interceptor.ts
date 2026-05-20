import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';

// Control para evitar múltiples refresh simultáneos
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  // No interceptar peticiones de auth
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const token = authService.getAccessToken();

  // Si el token existe y está por vencer (menos de 2 minutos), refrescar proactivamente
  if (token && authService.isTokenExpiringSoon(token)) {
    return handleRefresh(req, next, authService, router);
  }

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        return handleRefresh(req, next, authService, router);
      }
      return throwError(() => err);
    })
  );
};

function handleRefresh(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
) {
  if (isRefreshing) {
    // Esperar a que termine el refresh en curso
    return refreshSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      })))
    );
  }

  isRefreshing = true;
  refreshSubject.next(null);

  return authService.refreshToken().pipe(
    switchMap(res => {
      isRefreshing = false;
      refreshSubject.next(res.accessToken);
      return next(req.clone({
        setHeaders: { Authorization: `Bearer ${res.accessToken}` }
      }));
    }),
    catchError(err => {
      isRefreshing = false;
      refreshSubject.next(null);
      authService.logout();
      router.navigate(['/auth/login']);
      return throwError(() => err);
    })
  );
}