import { Component, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { DatePipe, isPlatformBrowser, AsyncPipe  } from '@angular/common';
import { ClockService } from '../services/clock.service';
@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [DatePipe, AsyncPipe],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
})
export class DashboardComponent {
  clock = inject(ClockService);          // then use clock.time$
  time$ = this.clock.time$;              // convenience
}