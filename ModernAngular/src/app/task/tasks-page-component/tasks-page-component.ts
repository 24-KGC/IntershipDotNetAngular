import { Component, inject } from '@angular/core';
import { DatePipe, AsyncPipe } from '@angular/common';
import { ClockService } from '../../services/clock.service';
import { TaskItemComponent } from '../task-item-component/task-item-component';
@Component({
  selector: 'app-tasks-page-component',
  imports: [DatePipe, AsyncPipe, TaskItemComponent],
  templateUrl: './tasks-page-component.html',
  styleUrl: './tasks-page-component.css',
})
export class TasksPageComponent {
  clock = inject(ClockService);          // then use clock.time$
  time$ = this.clock.time$;              // convenience
}
