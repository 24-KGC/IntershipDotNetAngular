# StudyBites

StudyBites is a full-stack practice project with an Angular frontend and an ASP.NET Core backend.
The app supports user authentication and user-scoped CRUD for tasks and recipes.
## Diagram

```mermaid
flowchart LR
  U[User Browser] -->|HTTP :4200| SPA[Angular 21 Frontend<br/>Standalone components + Signals<br/>Reactive Forms + Tailwind]

  subgraph FE["Frontend (ModernAngular)"]
    SPA --> GUARDS[Route Guards<br/>(protect /, /tasks, /recipes)]
    SPA --> INTERCEPTOR[Auth Interceptor<br/>(adds Authorization: Bearer JWT)]
    SPA --> STORES[Client State/Stores<br/>(TaskStoreService, RecipeStoreService)]
    SPA --> ROUTES[Routes<br/>/login, /, /tasks, /recipes]
  end

  SPA -->|HTTPS /api/* :7076| API[ASP.NET Core Minimal API (.NET 10)<br/>dotnetBE]

  subgraph BE["Backend (dotnetBE)"]
    API --> AUTHMW[AuthN/AuthZ Middleware<br/>JWT Bearer + Authorization]
    API --> EP[Endpoint Groups<br/>/api/auth<br/>/api/tasks (authorized)<br/>/api/recipes (authorized)]
    EP --> SVC[Services<br/>JwtTokenService]
    EP --> EF[EF Core DbContext<br/>AppDbContext]
    EF --> DB[(SQL Server / LocalDB)]
    AUTHMW --> ID[ASP.NET Core Identity<br/>IdentityUser + stores]
    ID --> DB
  end

  API -->|Dev only| SWAGGER[OpenAPI/Swagger UI<br/>/swagger]
```

## Current Stack

- Frontend: Angular 21 (standalone components), Signals, Reactive Forms, Tailwind CSS
- Backend: ASP.NET Core Minimal API (.NET 10), EF Core, SQL Server, Identity, JWT
- Auth: Register/Login with bearer tokens, route guards, auth interceptor

## Version

- 0.12: Polish UI 
- 0.11: Refractor to split program.cs into multi files handing logic.
- 0.10: Added recipe page and completed most of the original features, minor changes.
- 0.06: Added search bar and divided tasks into section.
- 0.05: Added sorting function and minor changes.
- 0.04: Added user auth (with FE components), added task api
- 0.03: Complete the task function, without sorting.
- 0.02: Added task component and form, working but need polishing.
- 0.01: Complete nav bar.

## Current Features

### Authentication

- Register and login flow on `/login`
- JWT session persistence in browser storage
- Protected routes for dashboard, tasks, and recipes
- Redirect back to originally requested route after successful login

### Tasks

- Create, edit, delete, and toggle completion
- Search by title/topic
- Sort by created time, topic, due date, priority, estimated minutes
- Grouped sections: In Progress, Completed, Overdued
- Edit action scrolls back to the task form automatically

### Recipes

- Create, edit, delete, and toggle completion
- Search by title, tag, id, and ingredients
- Sort by id, title, tag, priority, cook time, ingredient count, step count
- Grouped sections: In Progress and Completed
- Image upload support (base64 imageUrl)
- Image preview in form while creating/editing
- Ingredient preview text in recipe items
- Edit action scrolls back to the recipe form automatically

### Dashboard

- Live clock, date, week info
- Task stats: remaining count, estimated time, done percent, overdue count, topic list
- Recipe stats: remaining count, estimated cooking time, tag list

## Frontend Routes

- `/login`
- `/` (Dashboard)
- `/tasks`
- `/recipes`
- `**` redirects to `/`

## Backend API (Current)

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Tasks (authorized)

- `GET /api/tasks/`
- `GET /api/tasks/{id}`
- `POST /api/tasks/`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`

### Recipes (authorized)

- `GET /api/recipes/`
- `GET /api/recipes/{id}`
- `POST /api/recipes/`
- `PUT /api/recipes/{id}`
- `DELETE /api/recipes/{id}`

## Data Models (Current)

### TaskNote

- `id`
- `title`
- `topic`
- `dueDate`
- `priority`
- `estimatedMinutes`
- `done`
- `createdAt`

### RecipeRecord

- `id`
- `title`
- `ingredients`
- `numIngredients`
- `tag`
- `priority`
- `cookTime`
- `numSteps`
- `completed`
- `imageUrl`

## Run Locally

### Prerequisites

- Node.js + npm
- .NET 10 SDK
- SQL Server (or LocalDB)

### 1) Run backend

From `dotnetBE`:

```bash
dotnet restore
dotnet ef database update
dotnet run
```

Backend runs on HTTPS (configured for `https://localhost:7076`).

### 2) Run frontend

From `ModernAngular`:

```bash
npm install
npm start
```

Frontend runs on `http://localhost:4200` and uses API base URL `https://localhost:7076/api`.

## Notes

- CORS policy currently allows `http://localhost:4200`.
- Task and recipe data are scoped per authenticated user.
- Some original learning goals in the first README draft were planning targets; this file now reflects the implemented state.
