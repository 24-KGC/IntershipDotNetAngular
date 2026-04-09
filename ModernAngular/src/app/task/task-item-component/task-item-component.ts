import { Component, inject, Input, input } from '@angular/core';
import { TaskNote, TaskStoreService } from '../../services/task-store.service';
import { OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
@Component({
  selector: 'app-task-item-component',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './task-item-component.html',
  styleUrl: './task-item-component.css',
})
export class TaskItemComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(TaskStoreService);

  tasks: TaskNote[] = [];

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    topic: [''],
    dueDate: [''], 
    priority: [1, [Validators.min(1), Validators.max(5)]],
    estimatedMinutes: [1, [Validators.min(1)]],
    done: [false],
  });

  ngOnInit(): void {
    this.tasks = this.store.getTasks();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    const task: TaskNote = {
      id: crypto.randomUUID(),
      title: v.title.trim(),
      topic: v.topic.trim(),
      dueDate: v.dueDate ? new Date(v.dueDate).toISOString() : '',
      priority: v.priority,
      estimatedMinutes: v.estimatedMinutes,
      done: v.done,
      createdAt: new Date().toISOString(),
    };

    this.tasks = this.store.addTask(task);

    this.form.reset({
      title: '',
      topic: '',
      dueDate: '',
      priority: 1,
      estimatedMinutes: 1,
      done: false,
    });
  }

  toggleDone(t: TaskNote): void {
    this.tasks = this.store.updateTask({ ...t, done: !t.done });
  }

  remove(t: TaskNote): void {
    this.tasks = this.store.deleteTask(t.id);
  }

  trackById = (_: number, t: TaskNote) => t.id;
  @Input() collapsed = false;
}