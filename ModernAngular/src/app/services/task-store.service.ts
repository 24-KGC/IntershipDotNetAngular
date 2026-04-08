import { Injectable, PLATFORM_ID, inject } from "@angular/core";
import { isPlatformBrowser } from '@angular/common';
export interface TaskNote {
  id: string;        
  title: string;
  topic: string;
  dueDate: string;
  priority: number;
  estimatedMinutes: number;
  done: boolean;
  createdAt: string; 
}

const KEY = 'demo-tasks';

@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getTasks(): TaskNote[] {
    if (!this.isBrowser) return [];

    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as TaskNote[]) : [];
    } catch {
      return [];
    }
  }

  setTasks(tasks: TaskNote[]): void {
    if (!this.isBrowser) return;
    window.localStorage.setItem(KEY, JSON.stringify(tasks));
  }

  clearTasks(): void {
    if (!this.isBrowser) return;
    window.localStorage.removeItem(KEY);
  }

  addTask(task: TaskNote): TaskNote[] {
    const updated = [task, ...this.getTasks()];
    this.setTasks(updated);
    return updated;
  }

  updateTask(updatedTask: TaskNote): TaskNote[] {
    const updated = this.getTasks().map(t => t.id === updatedTask.id ? updatedTask : t);
    this.setTasks(updated);
    return updated;
  }

  deleteTask(id: string): TaskNote[] {
    const updated = this.getTasks().filter(t => t.id !== id);
    this.setTasks(updated);
    return updated;
  }
}