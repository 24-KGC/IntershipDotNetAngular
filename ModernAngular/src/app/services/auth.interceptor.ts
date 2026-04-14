import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const token = authService.token();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  ).pipe(
    catchError((error) => {
      if (error?.status === 401) {
        authService.logout();

        if (isPlatformBrowser(platformId) && router.url !== '/login') {
          sessionStorage.setItem('redirectAfterLogin', router.url);
        }

        router.navigateByUrl('/login');
      }

      return throwError(() => error);
    })
  );
};
