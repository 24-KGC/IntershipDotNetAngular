import { Component, EventEmitter, inject, input, OnInit, Output } from '@angular/core';
import { TaskNote, TaskStoreService } from '../../services/task-store.service';
import { DatePipe, AsyncPipe, DecimalPipe } from '@angular/common';
import { ClockService } from '../../services/clock.service';
import { TaskItemComponent } from '../task-item-component/task-item-component';
@Component({
  selector: 'app-tasks-page-component',
  standalone: true,
  imports: [DatePipe, AsyncPipe, DecimalPipe, TaskItemComponent],
  templateUrl: './tasks-page-component.html',
  styleUrl: './tasks-page-component.css',
})
export class TasksPageComponent implements OnInit {
  Math = Math; // for template
  clock = inject(ClockService);          
  time$ = this.clock.time$;              
  private store = inject(TaskStoreService);

  readonly tasks = this.store.tasks;

  ngOnInit(): void {
    this.store.loadTasks().subscribe({
      error: () => {
        // Error is tracked in store.
      }
    });
  }

  get totalEstimatedMinutes(): number {
    return this.tasks().reduce((sum, t) => sum + t.estimatedMinutes, 0);
  }
  get remainingTasksCount(): number {
    return this.tasks().filter(t => !t.done).length;
  }
  collapsed = false;

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }
}
