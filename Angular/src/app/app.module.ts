import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AuthorListComponent } from './author-list/author-list';
import { AuthorDetailComponent } from './author-detail/author-detail';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [

  ],
  imports: [
    BrowserModule,
    CommonModule,
    AuthorDetailComponent,
    AuthorListComponent
  ],
  providers: [],
  bootstrap: [AuthorListComponent]
})
export class AppModule {}
