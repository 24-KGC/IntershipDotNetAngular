import { Component, inject, OnInit } from '@angular/core';
import { TaskStoreService } from '../../services/task-store.service';
import { DatePipe, AsyncPipe, DecimalPipe } from '@angular/common';
import { ClockService } from '../../services/clock.service';
import { TaskItemComponent } from '../task-item-component/task-item-component';

type SortField = 'id' | 'topic' | 'dueDate' | 'priority' | 'estimatedMinutes';

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
  private currentSortField: SortField | null = null;
  private ascending = true;

  ngOnInit(): void {
    this.store.loadTasks().subscribe({
      error: () => {
        // Error is tracked in store.
      }
    });
  }

  get totalEstimatedMinutes(): number {
    return this.tasks()
      .filter(t => !t.done)
      .reduce((sum, t) => sum + t.estimatedMinutes, 0);
  }
  get remainingTasksCount(): number {
    return this.tasks().filter(t => !t.done).length;
  }
  collapsed = false;

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }

  sortBy(field: SortField): void {
    if (this.currentSortField === field) {
      this.ascending = !this.ascending;
    } else {
      this.currentSortField = field;
      this.ascending = true;
    }

    const sorted = [...this.tasks()].sort((a, b) => {
      let result = 0;

      switch (field) {
        case 'id':
          result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'topic':
          result = a.topic.localeCompare(b.topic, undefined, { sensitivity: 'base' });
          break;
        case 'dueDate': {
          const aEmpty = !a.dueDate;
          const bEmpty = !b.dueDate;
          if (aEmpty && bEmpty) result = 0;
          else if (aEmpty) result = 1;
          else if (bEmpty) result = -1;
          else result = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        }
        case 'priority':
          result = a.priority - b.priority;
          break;
        case 'estimatedMinutes':
          result = a.estimatedMinutes - b.estimatedMinutes;
          break;
      }

      return this.ascending ? result : -result;
    });

    this.store.tasks.set(sorted);
  }
}
