import { Component, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { DatePipe, DecimalPipe, AsyncPipe  } from '@angular/common';
import { ClockService } from '../services/clock.service';
import { TaskNote, TaskStoreService } from '../services/task-store.service';
import { combineLatestWith, map } from 'rxjs';
@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [DatePipe, AsyncPipe, DecimalPipe],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
})
export class DashboardComponent {
  Math = Math; // for template 
  clock = inject(ClockService);          
  time$ = this.clock.time$;     

  private store = inject(TaskStoreService);
  
  tasks: TaskNote[] = [];
  
  ngOnInit(): void {
    this.tasks = this.store.getTasks();
  }
  
  get totalEstimatedMinutes(): number {
    return this.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  }
  get remainingTasksCount(): number {
    return this.tasks.filter(t => !t.done).length;
  }
  collapsed = true;
  
  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }
  overdueCount$ = this.clock.time$.pipe(
  map(now =>
    this.tasks.filter(t => !t.done && !!t.dueDate && new Date(t.dueDate) < now).length
  )
);

}