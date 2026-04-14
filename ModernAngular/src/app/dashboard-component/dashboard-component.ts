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

  get remainingRecipesCount(): number {
    return this.recipes().filter(r => !r.completed).length;
  }

  get totalRemainingCookMinutes(): number {
    return this.recipes()
      .filter(r => !r.completed)
      .reduce((sum, r) => sum + r.cookTime, 0);
  }

  get recipeTags(): string[] {
    const tags = this.recipes()
      .map(r => r.tag.trim())
      .filter(Boolean);

    return [...new Set(tags)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  overdueCount$ = this.clock.time$.pipe(
  map(now =>
      this.tasks().filter(t => !t.done && !!t.dueDate && new Date(t.dueDate) < now).length
  )
);

}