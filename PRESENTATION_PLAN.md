# StudyBites Presentation Plan

This guide is based on the current codebase and README.

## Recommended Deck Length

- 12 pages (best balance for a 10 to 15 minute presentation)
- Optional: 14 pages if you want a deeper technical walkthrough

## Page-by-Page Outline (12 Pages)

## Page 1: Title + Project Intro

- Title: StudyBites
- Subtitle: Full-stack productivity app (Tasks + Recipes)
- Goal statement: Practice Angular frontend + .NET backend integration
- Your name, date, and course or internship context

What to say:
- This is a learning-focused but production-style full-stack app.
- It supports authentication and user-scoped data.

## Page 2: Problem and Motivation

- Problem: Students need one place to track study tasks and quick recipes.
- Why this project: Build practical full-stack skills, not only UI demos.
- Success criteria:
  - Secure login
  - CRUD for tasks and recipes
  - Dashboard with useful statistics

What to say:
- The main objective was to connect real frontend workflows to a secured API and database.

## Page 3: Tech Stack

- Frontend: Angular 21, standalone components, Signals, Reactive Forms, Tailwind CSS
- Backend: ASP.NET Core Minimal API (.NET 10), EF Core, SQL Server
- Security: ASP.NET Identity + JWT bearer tokens
- Communication: REST API over HTTPS

What to say:
- Stack choices were made to practice modern Angular patterns plus robust backend architecture.

## Page 4: High-Level Architecture

- Browser UI (Angular)
- Frontend services (auth, task store, recipe store)
- Backend endpoint groups (auth, tasks, recipes)
- Data layer (EF Core + SQL Server)

Suggested visual:
- Simple 4-box diagram with request flow arrows.

What to say:
- Frontend state is signal-based; backend enforces authorization and user isolation.

## Page 5: Routing and Navigation

- Routes:
  - /login
  - /
  - /tasks
  - /recipes
  - wildcard route redirect
- Guard behavior:
  - Unauthenticated users are redirected to login
  - Redirect-back after login is supported

What to say:
- Routing is not only navigation; it is also part of access control.

## Page 6: Authentication Flow

- Register and login endpoints
- JWT issuance on successful auth
- Token storage in browser session/local storage strategy
- Auth interceptor adds bearer token to API requests

What to say:
- This turns the app from local-only state into a secure multi-user app.

## Page 7: Task Feature Deep Dive

- Task CRUD
- Search and sorting
- Sectioned view: In Progress, Completed, Overdued
- Form-driven create/update flow
- Auto-scroll to edit form when Edit is clicked

Demo idea:
- Create one task, edit it, toggle done, then delete it.

## Page 8: Recipe Feature Deep Dive

- Recipe CRUD
- Search and sorting by multiple fields
- Sectioned view: In Progress and Completed
- Image upload support and live image preview
- Ingredient preview in list item
- Auto-scroll to edit form when Edit is clicked

Demo idea:
- Add a recipe with image, edit title/tag, toggle completed.

## Page 9: Dashboard and Insights

- Time and date widgets
- Task metrics:
  - Remaining tasks
  - Total estimated time
  - Completion percent
  - Overdue count
- Recipe metrics:
  - Remaining recipes
  - Estimated cooking time
  - Tag list

What to say:
- Dashboard proves that computed UI state can combine multiple data domains.

## Page 10: Backend Evolution and Refactor

- Earlier: large Program file with mixed setup and endpoint logic
- Now:
  - Service registration extension
  - Endpoint registration extension
  - Endpoint files split by domain (Auth, Task, Recipe)
- Result: cleaner structure, easier maintenance and onboarding

What to say:
- This was a key maintainability improvement in version 0.11.

## Page 11: Challenges and Solutions

- Challenge: syncing FE and BE contract shapes
  - Solution: explicit contract files and mapping functions
- Challenge: authenticated routing and redirect UX
  - Solution: guards + redirect-after-login logic
- Challenge: long pages when editing items
  - Solution: smooth auto-scroll back to edit forms

What to say:
- Show one bug or UX pain point and how you resolved it.

## Page 12: Conclusion and Next Steps

- What is complete:
  - Full auth + user-scoped CRUD for tasks and recipes
  - Dashboard insights
  - Refactored backend organization
- What can be next:
  - Unit and integration tests
  - Better validation/error UI
  - Deploy to cloud
  - Role-based permissions

End with:
- Short live demo recap or Q and A.

## Suggested Timing (for 12 pages)

- Pages 1 to 3: 2 minutes
- Pages 4 to 6: 3 minutes
- Pages 7 to 9: 4 minutes
- Pages 10 to 11: 3 minutes
- Page 12: 1 minute

Total: about 13 minutes

## Optional 14-Page Version

If you need a longer presentation, split these into separate pages:

- Separate page for database schema and migrations
- Separate page for API contract examples (request and response)
