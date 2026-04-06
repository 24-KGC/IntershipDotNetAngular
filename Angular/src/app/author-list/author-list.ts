import { Component, OnInit } from '@angular/core';
import { Author } from '../authors.component';
import { AuthorDetailComponent } from '../author-detail/author-detail';
import { NgFor } from '@angular/common';
const authors: Author[] = [     
    {
        id: 1,
        firstName: 'Flora',
        lastName: 'Twell',
        email: 'ftwell0@phoca.cz',
        gender: 'Female',
        ipAddress: '99.180.237.33',
    },
    {
        id: 2,
        firstName: 'Priscella',
        lastName: 'Signe',
        email: 'psigne1@berkeley.edu',
        gender: 'Female',
        ipAddress: '183.243.228.65',
    },
];

@Component({
  selector: 'app-author-list',
  imports: [NgFor, AuthorDetailComponent],
  template: `<app-author-detail
    *ngFor="let author of authors"
    [author]="author"
    (deleteAuthor)="handleDelete($event)"
  >
  </app-author-detail>`,
  styles: [``],
})
export class AuthorListComponent implements OnInit {
  authors = authors;
  constructor() {}
  ngOnInit() {}
  handleDelete(author: Author) {
    this.authors = this.authors.filter((item) => item.id !== author.id);
  }
}