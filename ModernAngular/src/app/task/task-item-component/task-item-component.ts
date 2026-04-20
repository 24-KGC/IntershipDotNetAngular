import { Component, ElementRef, ViewChild, inject, Input, signal } from '@angular/core';
import { TaskNote, TaskStoreService } from '../../services/task-store.service';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClockService } from '../../services/clock.service';

export type TaskViewMode = 'default' | 'priority' | 'days' | 'weeks' | 'months' | 'years';

@Component({
  selector: 'app-task-item-component',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, AsyncPipe],
  templateUrl: './task-item-component.html',
  styleUrl: './task-item-component.css',
})
export class TaskItemComponent {
  private fb = inject(FormBuilder);
  private store = inject(TaskStoreService);
  private clock = inject(ClockService);

  @Input() tasks: TaskNote[] = [];
  @Input() collapsed = false;
  @Input() viewMode: TaskViewMode = 'default';

  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly time$ = this.clock.time$;

  readonly editingId = signal<string | null>(null);
  @ViewChild('taskEditFormAnchor') private taskEditFormAnchor?: ElementRef<HTMLElement>;

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    topic: [''],
    dueDate: [''], 
    priority: [1, [Validators.min(1), Validators.max(5)]],
    estimatedMinutes: [1, [Validators.min(1)]],
    done: [false],
  });

  editTask(task: TaskNote): void {
    this.editingId.set(task.id);
    const dueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
    this.form.patchValue({
      title: task.title,
      topic: task.topic,
      dueDate: dueDate,
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes,
      done: task.done,
    });
    this.scrollEditFormIntoView();
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({
      title: '',
      topic: '',
      dueDate: '',
      priority: 1,
      estimatedMinutes: 1,
      done: false,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const editingId = this.editingId();

    if (editingId) {
      // Update existing task
      const task = this.tasks.find(t => t.id === editingId);
      if (task) {
        const updatedTask: TaskNote = {
          ...task,
          title: v.title.trim(),
          topic: v.topic.trim(),
          dueDate: v.dueDate ? new Date(v.dueDate).toISOString() : '',
          priority: v.priority,
          estimatedMinutes: v.estimatedMinutes,
          done: v.done,
        };

        this.store.updateTask(updatedTask).subscribe({
          next: () => {
            this.cancelEdit();
          }
        });
      }
    } else {
      // Create new task
      const task: TaskNote = {
        id: crypto.randomUUID(),
        title: v.title.trim(),
        topic: v.topic.trim(),
        dueDate: v.dueDate ? new Date(v.dueDate).toISOString() : '',
        priority: v.priority,
        estimatedMinutes: v.estimatedMinutes,
        done: v.done,
        createdAt: new Date().toISOString(),
      };

      this.store.addTask(task).subscribe({
        next: () => {
          this.form.reset({
            title: '',
            topic: '',
            dueDate: '',
            priority: 1,
            estimatedMinutes: 1,
            done: false,
          });
        }
      });
    }
  }

  toggleDone(t: TaskNote): void {
    this.store.updateTask({ ...t, done: !t.done }).subscribe();
  }

  isCompleted(task: TaskNote): boolean {
    return task.done;
  }

  isOverdue(task: TaskNote): boolean {
    return !task.done && !!task.dueDate && new Date(task.dueDate) < new Date();
  }

  getTimeRemaining(task: TaskNote, now: Date | null | undefined): string {
    if (!task.dueDate) {
      return 'No due date';
    }

    const dueTime = new Date(task.dueDate).getTime();
    if (Number.isNaN(dueTime)) {
      return 'No due date';
    }

    const currentTime = now?.getTime() ?? Date.now();
    const diffInSeconds = Math.floor(Math.abs(dueTime - currentTime) / 1000);
    const days = Math.floor(diffInSeconds / 86400);
    const hours = Math.floor((diffInSeconds % 86400) / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;
    const countdown = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    return dueTime >= currentTime ? `${countdown} left` : `overdue by ${countdown}`;
  }

  get inProgressTasks(): TaskNote[] {
    return this.tasks.filter((task) => !this.isCompleted(task) && !this.isOverdue(task));
  }

  get completedTasks(): TaskNote[] {
    return this.tasks.filter((task) => this.isCompleted(task));
  }

  get overduedTasks(): TaskNote[] {
    return this.tasks.filter((task) => this.isOverdue(task));
  }

  get groupedTasks(): { title: string, tasks: TaskNote[] }[] {
    if (this.viewMode === 'default') {
      return [
        { title: 'In Progress', tasks: this.inProgressTasks },
        { title: 'Completed', tasks: this.completedTasks },
        { title: 'Overdue', tasks: this.overduedTasks }
      ];
    }

    if (this.viewMode === 'priority') {
      return [5, 4, 3, 2, 1].map(p => ({
        title: `Priority ${p}`,
        tasks: this.tasks.filter(t => t.priority === p)
      })).filter(g => g.tasks.length > 0); 
    }

    const groups = new Map<string, TaskNote[]>();
    const noDateTasks: TaskNote[] = [];

    this.tasks.forEach(task => {
      if (!task.dueDate) {
        noDateTasks.push(task);
        return;
      }

      const date = new Date(task.dueDate);
      let key = '';

      if (this.viewMode === 'days') {
        key = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      } else if (this.viewMode === 'weeks') {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        key = `Week of ${monday.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`;
      } else if (this.viewMode === 'months') {
        key = `${date.toLocaleString(undefined, { month: 'long' })} ${date.getFullYear()}`;
      } else if (this.viewMode === 'years') {
        key = `${date.getFullYear()}`;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(task);
    });

    const result: { title: string, tasks: TaskNote[], timestamp: number }[] = [];
    groups.forEach((tasks, title) => {
      result.push({ title, tasks, timestamp: new Date(tasks[0].dueDate!).getTime() });
    });

    result.sort((a, b) => a.timestamp - b.timestamp);

    const finalResult: { title: string, tasks: TaskNote[] }[] = result.map(r => ({ title: r.title, tasks: r.tasks }));

    if (noDateTasks.length > 0) {
      finalResult.push({ title: 'No Due Date', tasks: noDateTasks });
    }

    return finalResult;
  }

  remove(t: TaskNote): void {
    this.store.deleteTask(t.id).subscribe();
  }

  trackById = (_: number, t: TaskNote) => t.id;

  private scrollEditFormIntoView(): void {
    this.taskEditFormAnchor?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}