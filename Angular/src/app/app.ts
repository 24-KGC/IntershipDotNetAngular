import { Component, NgModule, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HelloComponent } from './hello.component';
import { FormsModule, NgModel } from '@angular/forms';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HelloComponent, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})

export class App {
  protected readonly title = signal('InternAngular');
}
