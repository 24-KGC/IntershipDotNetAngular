import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
export interface TaskNote {
  id: string;        
  title: string;
  topic: string;
  dueDate: string;
  priority: number;
  estimatedMinutes: number;
  actualMinutes: number;
  done: boolean;
  createdAt: string; 
}

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tasks`;

  readonly tasks = signal<TaskNote[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadTasks() {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<TaskNote[]>(this.baseUrl).pipe(
      tap((tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('Failed to load tasks.');
        return throwError(() => error);
      })
    );
  }

  addTask(task: TaskNote) {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<TaskNote>(this.baseUrl, task).pipe(
      tap((created) => {
        this.tasks.update((tasks) => [created, ...tasks]);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('Failed to create task.');
        return throwError(() => error);
      })
    );
  }

  updateTask(updatedTask: TaskNote) {
    this.loading.set(true);
    this.error.set(null);

    const body = {
      title: updatedTask.title,
      topic: updatedTask.topic,
      dueDate: updatedTask.dueDate,
      priority: updatedTask.priority,
      estimatedMinutes: updatedTask.estimatedMinutes,
      actualMinutes: updatedTask.actualMinutes,
      done: updatedTask.done
    };

    return this.http.put<TaskNote>(`${this.baseUrl}/${updatedTask.id}`, body).pipe(
      tap((saved) => {
        this.tasks.update((tasks) => tasks.map((t) => (t.id === saved.id ? saved : t)));
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('Failed to update task.');
        return throwError(() => error);
      })
    );
  }

  deleteTask(id: string) {
    this.loading.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.tasks.update((tasks) => tasks.filter((t) => t.id !== id));
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('Failed to delete task.');
        return throwError(() => error);
      })
    );
  }
}