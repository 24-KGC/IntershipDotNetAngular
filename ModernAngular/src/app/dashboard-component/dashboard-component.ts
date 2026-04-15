import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe, AsyncPipe  } from '@angular/common';
import { ClockService } from '../services/clock.service';
import { TaskStoreService } from '../services/task-store.service';
import { RecipeStoreService } from '../services/recipe-store.service';

import { map } from 'rxjs';
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
  private recipeStore = inject(RecipeStoreService);
  
  readonly tasks = this.store.tasks;
  readonly recipes = this.recipeStore.recipes;
  
  ngOnInit(): void {
    this.store.loadTasks().subscribe({
      error: () => {
        // Error is tracked in store.
      }
    });

    this.recipeStore.loadRecipes().subscribe({
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

  get completedTasksCount(): number {
    return this.tasks().filter(t => t.done).length;
  }

  get taskCompletionPercent(): number {
    const total = this.tasks().length;
    if (!total) {
      return 0;
    }

    return Math.round((this.completedTasksCount / total) * 100);
  }

  get remainingRecipesCount(): number {
    return this.recipes().filter(r => !r.completed).length;
  }

  get completedRecipesCount(): number {
    return this.recipes().filter(r => r.completed).length;
  }

  get recipeCompletionPercent(): number {
    const total = this.recipes().length;
    if (!total) {
      return 0;
    }

    return Math.round((this.completedRecipesCount / total) * 100);
  }

  get totalRemainingCookMinutes(): number {
    return this.recipes()
      .filter(r => !r.completed)
      .reduce((sum, r) => sum + r.cookTime, 0);
  }

  get uniqueTopics(): string[] {
    const topics = this.tasks()
      .map(t => t.topic.trim())
      .filter(Boolean);

    return [...new Set(topics)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  get recipeTags(): string[] {
    const tags = this.recipes()
      .map(r => r.tag.trim())
      .filter(Boolean);

    return [...new Set(tags)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  get topTopics(): Array<{ name: string; count: number; width: number }> {
    const counter = new Map<string, number>();

    for (const task of this.tasks()) {
      const name = task.topic.trim();
      if (!name) {
        continue;
      }
      counter.set(name, (counter.get(name) ?? 0) + 1);
    }

    const values = Array.from(counter.entries()).map(([name, count]) => ({ name, count }));
    const max = values.reduce((current, item) => Math.max(current, item.count), 0);

    return values
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      .slice(0, 5)
      .map(item => ({
        ...item,
        width: max > 0 ? Math.round((item.count / max) * 100) : 0
      }));
  }

  get topRecipeTags(): Array<{ name: string; count: number; width: number }> {
    const counter = new Map<string, number>();

    for (const recipe of this.recipes()) {
      const name = recipe.tag.trim();
      if (!name) {
        continue;
      }
      counter.set(name, (counter.get(name) ?? 0) + 1);
    }

    const values = Array.from(counter.entries()).map(([name, count]) => ({ name, count }));
    const max = values.reduce((current, item) => Math.max(current, item.count), 0);

    return values
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      .slice(0, 5)
      .map(item => ({
        ...item,
        width: max > 0 ? Math.round((item.count / max) * 100) : 0
      }));
  }

  overdueCount$ = this.clock.time$.pipe(
    map(now =>
      this.tasks().filter(t => !t.done && !!t.dueDate && new Date(t.dueDate) < now).length
    )
  );

}