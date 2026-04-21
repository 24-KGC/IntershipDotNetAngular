import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CreateRecipeRequest, RecipeRecord, RecipeStoreService } from '../../services/recipe-store.service';
import { RecipeItemComponent } from '../recipe-item-component/recipe-item-component';
import { ClockService } from '../../services/clock.service';
import { DatePipe, AsyncPipe } from '@angular/common';

type RecipeSortField = 'tag' | 'priority' | 'cookTime' | 'numIngredients' | 'numSteps';

@Component({
  selector: 'app-recipes-page-component',
  standalone: true,
  imports: [ReactiveFormsModule, RecipeItemComponent, DatePipe, AsyncPipe],
  templateUrl: './recipes-page-component.html',
  styleUrl: './recipes-page-component.css',
})
export class RecipesPageComponent implements OnInit {
  Math = Math;
  clock = inject(ClockService);
  time$ = this.clock.time$;

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(RecipeStoreService);

  readonly recipes = this.store.recipes;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  readonly searchQuery = signal('');
  readonly currentSortField = signal<RecipeSortField | null>(null);
  readonly ascending = signal(true);
  readonly collapsed = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly selectedImageName = signal<string | null>(null);
  readonly showForm = signal(false);
  @ViewChild('recipeEditFormAnchor') private recipeEditFormAnchor?: ElementRef<HTMLElement>;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    ingredients: ['', [Validators.required]],
    tag: ['', [Validators.required]],
    description: [''],
    priority: [1, [Validators.min(1), Validators.max(5)]],
    cookTime: [1, [Validators.min(1)]],
    numSteps: [1, [Validators.min(1)]],
    completed: [false],
    imageUrl: [''],
  });

  readonly filteredRecipes = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const source = this.recipes();
    const filtered = query
      ? source.filter((recipe) => {
          return (
            recipe.title.toLowerCase().includes(query) ||
            recipe.tag.toLowerCase().includes(query) ||
            recipe.ingredients.toLowerCase().includes(query) ||
            recipe.description.toLowerCase().includes(query)
          );
        })
      : source;

    const field = this.currentSortField();
    if (!field) return filtered;

    return [...filtered].sort((left, right) => {
      let result = 0;
      switch (field) {
        case 'tag':
          result = left.tag.localeCompare(right.tag, undefined, { sensitivity: 'base' });
          break;
        case 'priority':
          result = left.priority - right.priority;
          break;
        case 'cookTime':
          result = left.cookTime - right.cookTime;
          break;
        case 'numIngredients':
          result = left.numIngredients - right.numIngredients;
          break;
        case 'numSteps':
          result = left.numSteps - right.numSteps;
          break;
      }
      return this.ascending() ? result : -result;
    });
  });

  /** Returns all unique tags, sorted alphabetically. */
  readonly tags = computed(() => {
    const all = [...new Set(this.filteredRecipes().map(r => r.tag))];
    return all.sort((a, b) => a.localeCompare(b));
  });

  /** Returns the recipes for a specific tag. */
  recipesForTag(tag: string): RecipeRecord[] {
    return this.filteredRecipes().filter(r => r.tag === tag);
  }

  readonly sortFields: Array<{ field: RecipeSortField; label: string }> = [
    { field: 'tag', label: 'Tag' },
    { field: 'priority', label: 'Priority' },
    { field: 'cookTime', label: 'Cook time' },
    { field: 'numIngredients', label: 'Num ingredients' },
    { field: 'numSteps', label: 'Num steps' },
  ];

  ngOnInit(): void {
    this.store.loadRecipes().subscribe({
      error: () => {}
    });
  }

  setSearchQuery(value: string): void {
    this.searchQuery.set(value);
  }

  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  toggleForm(): void {
    this.showForm.update((value) => !value);
  }

  isSortActive(field: RecipeSortField): boolean {
    return this.currentSortField() === field;
  }

  getSortArrow(field: RecipeSortField): string {
    if (this.currentSortField() !== field) return '';
    return this.ascending() ? '↑' : '↓';
  }

  sortBy(field: RecipeSortField): void {
    if (this.currentSortField() === field) {
      this.ascending.update((value) => !value);
      return;
    }
    this.currentSortField.set(field);
    this.ascending.set(true);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const recipeBase: CreateRecipeRequest = {
      title: value.title.trim(),
      ingredients: value.ingredients.trim(),
      tag: value.tag.trim(),
      description: value.description.trim(),
      priority: value.priority,
      cookTime: value.cookTime,
      numSteps: value.numSteps,
      completed: value.completed,
      imageUrl: value.imageUrl.trim()
    };

    const editingId = this.editingId();
    if (editingId) {
      const recipe: RecipeRecord = {
        id: editingId,
        numIngredients: this.getIngredientList({ ingredients: value.ingredients } as RecipeRecord).length,
        createdAt: new Date().toISOString(),
        ...recipeBase
      };

      this.store.updateRecipe(recipe).subscribe({
        next: () => { this.cancelEdit(); }
      });
      return;
    }

    this.store.addRecipe(recipeBase).subscribe({
      next: () => { 
        this.resetForm(); 
        this.showForm.set(false);
      }
    });
  }

  editRecipe(recipe: RecipeRecord): void {
    this.editingId.set(recipe.id);
    this.form.patchValue({
      title: recipe.title,
      ingredients: recipe.ingredients,
      tag: recipe.tag,
      description: recipe.description,
      priority: recipe.priority,
      cookTime: recipe.cookTime,
      numSteps: recipe.numSteps,
      completed: recipe.completed,
      imageUrl: recipe.imageUrl,
    });
    this.selectedImageName.set(recipe.imageUrl ? 'Current image' : null);
    this.scrollEditFormIntoView();
    this.showForm.set(true);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.resetForm();
    this.showForm.set(false);
  }

  removeRecipe(recipe: RecipeRecord): void {
    this.store.deleteRecipe(recipe.id).subscribe();
    if (this.editingId() === recipe.id) {
      this.cancelEdit();
    }
  }

  handleImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.form.patchValue({ imageUrl: String(reader.result ?? '') });
      this.selectedImageName.set(file.name);
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.form.patchValue({ imageUrl: '' });
    this.selectedImageName.set(null);
  }

  private scrollEditFormIntoView(): void {
    this.recipeEditFormAnchor?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      title: '',
      ingredients: '',
      tag: '',
      description: '',
      priority: 1,
      cookTime: 1,
      numSteps: 1,
      completed: false,
      imageUrl: '',
    });
    this.selectedImageName.set(null);
  }

  getIngredientList(recipe: RecipeRecord): string[] {
    return recipe.ingredients
      .split(/[;,\n]/)
      .map((ingredient) => ingredient.trim())
      .filter(Boolean);
  }

  getIngredientPreview(recipe: RecipeRecord, limit = 2): string {
    const ingredients = this.getIngredientList(recipe);
    const preview = ingredients.slice(0, limit).join(', ');
    if (ingredients.length <= limit) return preview;
    return `${preview}, ...`;
  }
}
