import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, timer } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ClockService {
  private platformId = inject(PLATFORM_ID);

  /** Emits current time every second in browser; emits once on server (SSR-safe). */
  readonly time$: Observable<Date> = isPlatformBrowser(this.platformId)
    ? timer(0, 1).pipe(
        map(() => new Date()),
        shareReplay({ bufferSize: 1, refCount: true })
      )
    : of(new Date());
}