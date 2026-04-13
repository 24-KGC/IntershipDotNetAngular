import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the route they were trying to access so we can redirect back after login
  if (isPlatformBrowser(platformId)) {
    const currentUrl = state.url;
    if (currentUrl !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', currentUrl);
    }
  }
  return router.createUrlTree(['/login']);
};

export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If already authenticated, prevent access to login page - redirect to tasks
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/tasks']);
  }

  return true;
};
