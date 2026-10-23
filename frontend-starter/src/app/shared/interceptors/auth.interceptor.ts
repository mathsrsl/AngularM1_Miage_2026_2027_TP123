import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Adds the bearer token to API requests and handles 401 responses
 * by clearing the session and redirecting to /login.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const outgoing = token
    ? request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : request;

  return next(outgoing).pipe(
    catchError((error) => {
      // If the API returns 401 on a protected route, the token is invalid
      // or expired: clean up and redirect to login.
      if (error.status === 401 && token) {
        auth.logout();
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
