import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'structuredirective',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Hello there!</h2>
    <h3>Your name: {{ user.name }}</h3>
    <p>Your name: {{ user.age }}</p>
    <!--
    <div *ngIf="user.age >= 13">Bạn có thể xem nội dung PG-13</div> 
    <div *ngIf="user.age < 13">Bạn không thể xem nội dung PG-13</div> 
    or use a template -->
    <div *ngIf="user.age >= 13; else noPG13">Bạn có thể xem nội dung PG-13</div>
    <ng-template #noPG13>
        <div>Bạn không thể xem nội dung PG-13</div>
    </ng-template>
  `,
})
export class StructuredirectiveComponent {
  user = {
    name: 'Tiep Phan',
    age: 12,
  };
}