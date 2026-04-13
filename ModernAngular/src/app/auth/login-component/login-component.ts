import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-login-component',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly registerMode = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  toggleMode(): void {
    this.registerMode.update((v) => !v);
    this.error.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    const request$ = this.registerMode()
      ? this.auth.register(email.trim(), password)
      : this.auth.login(email.trim(), password);

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.redirectAfterLogin();
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Authentication failed. Check your credentials and try again.');
      }
    });
  }

  private redirectAfterLogin(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.router.navigateByUrl('/tasks');
      return;
    }

    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      sessionStorage.removeItem('redirectAfterLogin');
      this.router.navigateByUrl(redirectUrl);
    } else {
      this.router.navigateByUrl('/tasks');
    }
  }
}
