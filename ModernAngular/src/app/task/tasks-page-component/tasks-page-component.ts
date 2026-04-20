import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TaskNote, TaskStoreService } from '../../services/task-store.service';
import { DatePipe, AsyncPipe, DecimalPipe } from '@angular/common';
import { ClockService } from '../../services/clock.service';
import { TaskItemComponent, TaskViewMode } from '../task-item-component/task-item-component';

type SortField = 'dateAdded' | 'estimatedMinutes';

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
  readonly searchQuery = signal('');
  readonly filteredTasks = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();

    if (!query) {
      return this.tasks();
    }

    return this.tasks().filter((task: TaskNote) => {
      return task.title.toLowerCase().includes(query) || task.topic.toLowerCase().includes(query);
    });
  });
  private currentSortField: SortField | null = null;
  private ascending = true;
  viewMode: TaskViewMode = 'default';

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

  setSearchQuery(value: string): void {
    this.searchQuery.set(value);
  }

  isSortActive(field: SortField): boolean {
    return this.currentSortField === field;
  }

  getSortArrow(field: SortField): string {
    if (this.currentSortField !== field) {
      return '';
    }

    return this.ascending ? '↑' : '↓';
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
        case 'dateAdded': {
          result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        }
        case 'estimatedMinutes':
          result = a.estimatedMinutes - b.estimatedMinutes;
          break;
      }

      return this.ascending ? result : -result;
    });

    this.store.tasks.set(sorted);
  }

  setViewMode(mode: TaskViewMode): void {
    this.viewMode = mode;
  }
}
