import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RecipeRecord, RecipeStoreService } from '../../services/recipe-store.service';

@Component({
  selector: 'app-recipe-item-component',
  standalone: true,
  templateUrl: './recipe-item-component.html',
  styleUrl: './recipe-item-component.css',
})
export class RecipeItemComponent {
  private readonly store = inject(RecipeStoreService);

  @Input({ required: true }) recipe!: RecipeRecord;
  @Input() index = 0;
  @Input() collapsed = false;
  @Input() error: string | null = null;
  @Input() loading = false;
  @Output() edit = new EventEmitter<RecipeRecord>();
  @Output() remove = new EventEmitter<RecipeRecord>();

  toggleCompleted(recipe: RecipeRecord): void {
    this.store.updateRecipe({ ...recipe, completed: !recipe.completed }).subscribe();
  }

  editRecipe(recipe: RecipeRecord): void {
    this.edit.emit(recipe);
  }

  removeRecipe(recipe: RecipeRecord): void {
    this.remove.emit(recipe);
  }

  getIngredientList(): string[] {
    return this.recipe.ingredients
      .split(/[;,\n]/)
      .map((ingredient) => ingredient.trim())
      .filter(Boolean);
  }

  getIngredientPreview(limit = 50): string {
    const ingredients = this.getIngredientList();
    const preview = ingredients.slice(0, limit).join(', ');

    if (ingredients.length <= limit) {
      return preview;
    }

    return `${preview}, ...`;
  }
}