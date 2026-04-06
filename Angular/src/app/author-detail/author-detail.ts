import { Component, OnInit, Input } from '@angular/core';
import { Author } from '../authors.component';
import { Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';
@Component({
  selector: 'app-author-detail',
  imports: [NgIf],
  template: `
    <div *ngIf="author">
      <strong>{{ author.firstName }} {{ author.lastName }}</strong>
      <button (click)="handleDelete()">x</button>
    </div>
  `,
  styles: [``],
})
export class AuthorDetailComponent implements OnInit {
  @Input() author!: Author;
  @Output() deleteAuthor = new EventEmitter<Author>();
  constructor() {}
  ngOnInit() {}
  handleDelete() {
    this.deleteAuthor.emit(this.author);
  }
}