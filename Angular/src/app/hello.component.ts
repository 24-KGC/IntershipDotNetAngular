import { Component } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
@Component({
  selector: 'app-hello',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2>Hello there!</h2>
    <h3>Your name: {{ user.name }}</h3>
    <p>Your name: {{ user.age }}</p>
    <input type="text" [(ngModel)]="user.name" />
    <input type="text" [value]="user.name" />
    <button (click)="showInfo()">Click me!</button>
  `,
})
export class HelloComponent {
  user = {
    name: 'Tiep Phan',
    age: 30,
  };    
  obj = {
    type: 'text',
    value: 'something',
    attributes: [], 
  };
  showInfo() {
    alert('Inside Angular Component method');
  };
}