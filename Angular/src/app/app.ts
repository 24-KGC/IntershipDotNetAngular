import { Component, NgModule, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HelloComponent } from './hello.component';
import { StructuredirectiveComponent } from './structuredirective.component';
import { StructuredirectiveNgForOfComponent } from './structuredirectiveNgForOf.component';
import { FormsModule, NgModel } from '@angular/forms';
import { ProgressBarComponent } from './progress-bar/progress-bar';
import { AuthorDetailComponent } from './author-detail/author-detail';
import { AuthorListComponent } from './author-list/author-list';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HelloComponent, FormsModule, StructuredirectiveComponent, StructuredirectiveNgForOfComponent, ProgressBarComponent, AuthorDetailComponent, AuthorListComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})

export class App {
  protected readonly title = signal('InternAngular');
}
