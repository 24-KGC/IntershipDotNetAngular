# StudyBites

This project is created for the purpose of practice implementing Angular's basic features.
Here are the ideas and goals

## Version

- 0.03: Complete the task function, without sorting.
- 0.02: Added task component and form, working but need polishing.
- 0.01: Complete nav bar.

## 1.Component

- `AppComponent` (shell)
- `NavbarComponent`
- `DashboardComponent`
- `TasksPageComponent`
- `TaskItemComponent`
- `RecipesPageComponent`
- `RecipeItemComponent`
- `RecipeCardComponent`
- `NotFoundComponent`

## 2.Routing

- `/dashboard`
- `/tasks`
- `/recipes`
- `/recipes/:id`
- `**` → `NotFoundComponent`

## 3.Forms

**Reactive Forms** for `TaskFormComponent`:

- fields: `title`, `topic`, `dueDate`, `priority`, `estimatedMinutes`, `notes`
- validators: required, minLength, min/max
- show validation messages in the template

## 4.Input, Output properties

- `TaskListComponent` receives tasks via `@Input() tasks`
- `TaskItemComponent` receives a `@Input() task`
- `TaskItemComponent` emits events:
    - `@Output() toggleDone = new EventEmitter<string>()`
    - `@Output() delete = new EventEmitter<string>()`
- Parent handles those and calls a service.

## 5. Injectable services

Create services for state + persistence:

- `TasksService` (CRUD tasks, localStorage persistence)
- `RecipesService` (read-only mock data is fine)
- Optional: `ToastService` (simple “Saved!” messages)

Keep all data logic out of components.

## 6. Pipes

Add at least 2 custom pipes + some built-ins:

- `priorityLabel` pipe (1/2/3 → “Low/Medium/High”)
- `dueStatus` pipe (“Overdue”, “Due soon”, “Later”)
- built-ins: `date`, `percent`, `uppercase`, etc.

## 7. Property binding 

- `[disabled]="taskForm.invalid"`
- `[class.done]="task.done"`
- `[routerLink]="['/recipes', recipe.id]"`

## 8. Template & Event handling

- `@for` (or `*ngFor`) for lists
- `@if` (or `*ngIf`) for empty states / validation messages
- click handlers:
    - `(click)="onToggleDone(task.id)"`
    - `(click)="onAddTask()"`

## 9. Signals

Use signals in at least one “slice” of state (tasks is ideal):

- In `TasksService`:
    - `tasks = signal<Task[]>(...)`
    - `filter = signal<'all'|'open'|'done'>('all')`
    - `filteredTasks = computed(() => ...)`
- Components read state directly from the service.

## 10. Deferrable views

Use `@defer` to lazy-render heavier UI:

- On `/recipes`, defer rendering the recipe list:
    - `@defer { <app-recipe-list .../> } @placeholder { loading skeleton }`
- Or defer `RecipeDetailComponent` content (image + notes) while showing a placeholder.

## 11. Image optimization

In recipes:

- store `imageUrl` for each recipe
- use `NgOptimizedImage`:
    - provide `width`/`height`
    - use `priority` for above-the-fold image on details page
    - optionally `fill` for card thumbnails

## Data models

- `Task`: `id`, `title`, `topic`, `dueDate`, `priority`, `estimatedMinutes`, `done`
- `Recipe`: `id`, `name`, `minutes`, `tags`, `imageUrl`, `ingredients[]`, `steps[]`

## Objectives

1. Can add/edit/delete tasks via a reactive form (with validation).
2. Task items communicate to parent via `@Input/@Output`.
3. Tasks are stored in localStorage via an injectable service.
4. Dashboard shows computed stats (total, done %, overdue count).
5. Recipes page uses `@defer` and images use `NgOptimizedImage`.
6. At least 2 custom pipes are used in templates.
7. App has working routing including a `NotFound` route.