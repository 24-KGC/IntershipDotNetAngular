import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard-component/dashboard-component';
import { RecipesPageComponent } from './recipe/recipes-page-component/recipes-page-component';
import { TasksPageComponent } from './task/tasks-page-component/tasks-page-component';
export const routes: Routes = [
    {
        path: '',
        title: 'Dashboard',
        component: DashboardComponent
    },
    {
        path: 'recipes',
        title: 'Recipes',
        component: RecipesPageComponent
    },
    { 
        path: 'tasks', 
        title: 'Tasks',
        component: TasksPageComponent 
    },
];
