import { Component, inject, Input, signal } from '@angular/core';
import { TaskNote, TaskStoreService } from '../../services/task-store.service';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClockService } from '../../services/clock.service';
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
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly time$ = this.clock.time$;

  readonly editingId = signal<string | null>(null);

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

  remove(t: TaskNote): void {
    this.store.deleteTask(t.id).subscribe();
  }

  trackById = (_: number, t: TaskNote) => t.id;
  @Input() collapsed = false;
}