import { Component, PLATFORM_ID, inject } from '@angular/core';
import { DatePipe, isPlatformBrowser, AsyncPipe  } from '@angular/common';
import { Observable, of, timer } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [DatePipe, AsyncPipe],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
})
export class DashboardComponent {
  private platformId = inject(PLATFORM_ID);

  time$: Observable<Date> = isPlatformBrowser(this.platformId)
    ? timer(0, 1000).pipe(
        map(() => new Date()),
        shareReplay({ bufferSize: 1, refCount: true })
      )
    : of(new Date()); // SSR: render once, no interval
}