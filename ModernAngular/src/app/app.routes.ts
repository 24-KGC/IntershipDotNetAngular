import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard-component/dashboard-component';
import { RecipesPageComponent } from './recipe/recipes-page-component/recipes-page-component';
import { TasksPageComponent } from './task/tasks-page-component/tasks-page-component';
import { LoginComponent } from './auth/login-component/login-component';
import { authGuard } from './auth/auth.guard';
export const routes: Routes = [
    {
        path: 'login',
        title: 'Login',
        component: LoginComponent
    },
    {
        path: '',
        title: 'Dashboard',
        component: DashboardComponent,
        canActivate: [authGuard]
    },
    {
        path: 'recipes',
        title: 'Recipes',
        component: RecipesPageComponent,
        canActivate: [authGuard]
    },
    { 
        path: 'tasks', 
        title: 'Tasks',
        component: TasksPageComponent,
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
