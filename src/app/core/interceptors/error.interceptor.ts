import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 || err.status === 0) {
        return throwError(() => err);
      }

      const detail = err.error?.detail ?? err.error?.message ?? 'An unexpected error occurred';
      const summary = getErrorSummary(err.status);

      messageService.add({ severity: 'error', summary, detail, life: 5000 });
      return throwError(() => err);
    })
  );
};

function getErrorSummary(status: number): string {
  switch (status) {
    case 400: return 'Validation Error';
    case 403: return 'Access Denied';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Business Error';
    case 423: return 'Account Locked';
    case 429: return 'Too Many Requests';
    default:  return 'Error';
  }
}
