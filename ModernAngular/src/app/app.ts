import { Component, signal } from '@angular/core';
import { RouterOutlet , RouterLink } from '@angular/router';
import { NavBarComponent } from './nav-bar-component/nav-bar-component';
import { DashboardComponent } from './dashboard-component/dashboard-component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, NavBarComponent, DashboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ModernAngular');
}
