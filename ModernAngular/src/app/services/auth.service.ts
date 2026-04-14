import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  expiresAtUtc: string;
}

interface StoredSession {
  token: string;
  userId: string;
  email: string;
  expiresAtUtc: string;
}

const SESSION_KEY = 'auth-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly session = signal<StoredSession | null>(this.readSession());

  readonly token = computed(() => this.getValidSession()?.token ?? null);
  readonly email = computed(() => this.session()?.email ?? null);
  readonly isAuthenticated = computed(() => !!this.getValidSession()?.token);

  register(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, { email, password })
      .pipe(tap((response) => this.setSession(response)));
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((response) => this.setSession(response)));
  }

  logout(): void {
    this.session.set(null);
    if (isPlatformBrowser(this.platformId)) {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }

  hasValidSession(): boolean {
    return !!this.getValidSession();
  }

  getCurrentUrlForLoginRedirect(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return window.location.pathname + window.location.search + window.location.hash;
  }

  private setSession(response: AuthResponse): void {
    const session: StoredSession = {
      token: response.token,
      userId: response.userId,
      email: response.email,
      expiresAtUtc: response.expiresAtUtc
    };

    this.session.set(session);
    if (isPlatformBrowser(this.platformId)) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      console.log('[AuthService] Session saved to localStorage for user:', response.email);
    }
  }

  private readSession(): StoredSession | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) {
      console.log('[AuthService] No session found in localStorage');
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as StoredSession;
      if (!parsed?.token || !parsed?.email || !parsed?.userId || !parsed?.expiresAtUtc) {
        console.log('[AuthService] Invalid session data in localStorage');
        return null;
      }

      if (this.isExpired(parsed)) {
        console.log('[AuthService] Session expired in localStorage');
        this.logout();
        return null;
      }

      console.log('[AuthService] Session restored from localStorage for user:', parsed.email);
      return parsed;
    } catch (error) {
      console.error('[AuthService] Failed to parse session from localStorage:', error);
      return null;
    }
  }

  private getValidSession(): StoredSession | null {
    const session = this.session();

    if (!session) {
      return null;
    }

    if (this.isExpired(session)) {
      this.logout();
      return null;
    }

    return session;
  }

  private isExpired(session: StoredSession): boolean {
    return new Date(session.expiresAtUtc).getTime() <= Date.now();
  }
}
