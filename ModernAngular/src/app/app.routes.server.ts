import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Client
  },
  {
    path: '',
    renderMode: RenderMode.Client
  },
  {
    path: 'recipes',
    renderMode: RenderMode.Client
  },
  {
    path: 'tasks',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
