import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'structuredirectiveNgForOf',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!--
    <div *ngFor="let author of authors">
    {{author.id}} - {{author.firstName}} {{author.lastName}}
    </div>
    using ngtemplate
    -->
    <ng-template
    ngFor
    [ngForOf]="authors"
    let-author
    let-idx="index"
    let-total="count"
    >
    <div>
        ({{idx}})/({{total}}): {{author.id}} - {{author.firstName}}
        {{author.lastName}}
    </div>
    </ng-template>

  `,
})
export class StructuredirectiveNgForOfComponent {
    authors = [
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
    // more data
    ];
}