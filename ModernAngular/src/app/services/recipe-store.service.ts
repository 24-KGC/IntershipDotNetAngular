import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RecipeRecord {
  id: string;
  title: string;
  ingredients: string;
  numIngredients: number;
  tag: string;
  priority: number;
  cookTime: number;
  numSteps: number;
  completed: boolean;
  imageUrl: string;
  createdAt?: string;
}

export interface CreateRecipeRequest {
  title: string;
  ingredients: string;
  tag: string;
  priority: number;
  cookTime: number;
  numSteps: number;
  completed: boolean;
  imageUrl: string;
}

@Injectable({ providedIn: 'root' })
export class RecipeStoreService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/recipes`;

  readonly recipes = signal<RecipeRecord[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadRecipes() {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<RecipeRecord[]>(this.baseUrl).pipe(
      tap((recipes) => {
        this.recipes.set(recipes);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('Failed to load recipes.');
        return throwError(() => error);
      })
    );
  }

  addRecipe(recipe: CreateRecipeRequest) {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<RecipeRecord>(this.baseUrl, recipe).pipe(
      tap((created) => {
        this.recipes.update((recipes) => [created, ...recipes]);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('Failed to create recipe.');
        return throwError(() => error);
      })
    );
  }

  updateRecipe(updatedRecipe: RecipeRecord) {
    this.loading.set(true);
    this.error.set(null);

    const body = {
      title: updatedRecipe.title,
      ingredients: updatedRecipe.ingredients,
      tag: updatedRecipe.tag,
      priority: updatedRecipe.priority,
      cookTime: updatedRecipe.cookTime,
      numSteps: updatedRecipe.numSteps,
      completed: updatedRecipe.completed,
      imageUrl: updatedRecipe.imageUrl
    };

    return this.http.put<RecipeRecord>(`${this.baseUrl}/${updatedRecipe.id}`, body).pipe(
      tap((saved) => {
        this.recipes.update((recipes) => recipes.map((recipe) => (recipe.id === saved.id ? saved : recipe)));
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('Failed to update recipe.');
        return throwError(() => error);
      })
    );
  }

  deleteRecipe(id: string) {
    this.loading.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.recipes.update((recipes) => recipes.filter((recipe) => recipe.id !== id));
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('Failed to delete recipe.');
        return throwError(() => error);
      })
    );
  }
}