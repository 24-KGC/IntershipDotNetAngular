import { Component, ElementRef, ViewChild, inject, Input, signal } from '@angular/core';
import { TaskNote, TaskStoreService } from '../../services/task-store.service';
import { AsyncPipe, DatePipe, CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropList, CdkDrag, CdkDropListGroup, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ClockService } from '../../services/clock.service';

export type TaskViewMode = 'default' | 'priority' | 'days' | 'weeks' | 'months' | 'years' | 'progress';

@Component({
  selector: 'app-task-item-component',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, AsyncPipe, DragDropModule],
  templateUrl: './task-item-component.html',
  styleUrl: './task-item-component.css',
})
export class TaskItemComponent {
  private fb = inject(FormBuilder);
  private store = inject(TaskStoreService);
  private clock = inject(ClockService);

  @Input() tasks: TaskNote[] = [];
  @Input() collapsed = false;
  @Input() viewMode: TaskViewMode = 'default';

  readonly sectionOrder = signal<string[]>([]);
  readonly taskOrder = signal<Record<string, number>>({});

  // Timer signals
  readonly activeTimerTaskId = signal<string | null>(null);
  readonly elapsedSeconds = signal<number>(0);
  private timerInterval: any = null;

  ngOnInit() {
    try {
      const savedSection = localStorage.getItem('sectionOrder');
      if (savedSection) this.sectionOrder.set(JSON.parse(savedSection));
      
      const savedTasks = localStorage.getItem('taskOrder');
      if (savedTasks) this.taskOrder.set(JSON.parse(savedTasks));
    } catch {}
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly time$ = this.clock.time$;

  readonly editingId = signal<string | null>(null);
  @ViewChild('taskEditFormAnchor') private taskEditFormAnchor?: ElementRef<HTMLElement>;

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    topic: [''],
    dueDate: [''], 
    dueTime: [''], 
    priority: [1, [Validators.min(1), Validators.max(5)]],
    estimatedMinutes: [1, [Validators.min(1)]],
    actualMinutes: [0, [Validators.min(0)]],
    done: [false],
  });

  editTask(task: TaskNote): void {
    this.editingId.set(task.id);
    let dueDate = '';
    let dueTime = '';
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      dueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dueTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    }
    this.form.patchValue({
      title: task.title,
      topic: task.topic,
      dueDate: dueDate,
      dueTime: dueTime,
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes,
      actualMinutes: task.actualMinutes || 0,
      done: task.done,
    });
    this.scrollEditFormIntoView();
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({
      title: '',
      topic: '',
      dueDate: '',
      dueTime: '',
      priority: 1,
      estimatedMinutes: 1,
      actualMinutes: 0,
      done: false,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const editingId = this.editingId();

    if (editingId) {
      // Update existing task
      const task = this.tasks.find(t => t.id === editingId);
      if (task) {
        const fullDueDate = v.dueDate && v.dueTime ? new Date(`${v.dueDate}T${v.dueTime}`).toISOString() : (v.dueDate ? new Date(v.dueDate).toISOString() : '');
        const updatedTask: TaskNote = {
          ...task,
          title: v.title.trim(),
          topic: v.topic.trim(),
          dueDate: fullDueDate,
          priority: v.priority,
          estimatedMinutes: v.estimatedMinutes,
          actualMinutes: v.actualMinutes,
          done: v.done,
        };

        this.store.updateTask(updatedTask).subscribe({
          next: () => {
            this.cancelEdit();
          }
        });
      }
    } else {
      // Create new task
      const fullDueDate = v.dueDate && v.dueTime ? new Date(`${v.dueDate}T${v.dueTime}`).toISOString() : (v.dueDate ? new Date(v.dueDate).toISOString() : '');
      const task: TaskNote = {
        id: crypto.randomUUID(),
        title: v.title.trim(),
        topic: v.topic.trim(),
        dueDate: fullDueDate,
        priority: v.priority,
        estimatedMinutes: v.estimatedMinutes,
        actualMinutes: v.actualMinutes,
        done: v.done,
        createdAt: new Date().toISOString(),
      };

      this.store.addTask(task).subscribe({
        next: () => {
          this.form.reset({
            title: '',
            topic: '',
            dueDate: '',
            dueTime: '',
            priority: 1,
            estimatedMinutes: 1,
            done: false,
          });
        }
      });
    }
  }

  toggleDone(t: TaskNote): void {
    this.store.updateTask({ ...t, done: !t.done }).subscribe();
  }

  updateActualTime(t: TaskNote, minutes: string | number): void {
    const actualMinutes = typeof minutes === 'string' ? parseInt(minutes, 10) : minutes;
    if (!isNaN(actualMinutes) && actualMinutes >= 0) {
      this.store.updateTask({ ...t, actualMinutes }).subscribe();
    }
  }

  startTimer(t: TaskNote): void {
    // If a timer is already running for a different task, stop it first
    const currentActiveId = this.activeTimerTaskId();
    if (currentActiveId && currentActiveId !== t.id) {
      const activeTask = this.tasks.find(task => task.id === currentActiveId);
      if (activeTask) {
        this.stopTimer(activeTask);
      }
    }

    this.activeTimerTaskId.set(t.id);
    this.elapsedSeconds.set(0);
    
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds.update(s => s + 1);
    }, 1000);
  }

  stopTimer(t: TaskNote): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const elapsed = this.elapsedSeconds();
    const addedMinutes = Math.ceil(elapsed / 60);
    
    if (addedMinutes > 0) {
      this.updateActualTime(t, t.actualMinutes + addedMinutes);
    }

    this.activeTimerTaskId.set(null);
    this.elapsedSeconds.set(0);
  }

  formatElapsed(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  isCompleted(task: TaskNote): boolean {
    return task.done;
  }

  isOverdue(task: TaskNote): boolean {
    return !task.done && !!task.dueDate && new Date(task.dueDate) < new Date();
  }

  getTimeRemaining(task: TaskNote, now: Date | null | undefined): string {
    if (!task.dueDate) {
      return 'No due date';
    }

    const dueTime = new Date(task.dueDate).getTime();
    if (Number.isNaN(dueTime)) {
      return 'No due date';
    }

    const currentTime = now?.getTime() ?? Date.now();
    const diffInSeconds = Math.floor(Math.abs(dueTime - currentTime) / 1000);
    const days = Math.floor(diffInSeconds / 86400);
    const hours = Math.floor((diffInSeconds % 86400) / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;
    const countdown = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    return dueTime >= currentTime ? `${countdown} left` : `overdue by ${countdown}`;
  }

  getCompletionEarlyBy(task: TaskNote): string {
    if (!task.dueDate || !task.completedAt) {
      return '';
    }

    const dueTime = new Date(task.dueDate).getTime();
    const completedTime = new Date(task.completedAt).getTime();
    
    if (Number.isNaN(dueTime) || Number.isNaN(completedTime)) {
      return '';
    }

    const diffInSeconds = Math.floor(Math.abs(dueTime - completedTime) / 1000);
    const days = Math.floor(diffInSeconds / 86400);
    const hours = Math.floor((diffInSeconds % 86400) / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    result += `${minutes}m`;

    return completedTime <= dueTime ? `Completed early by ${result}` : `Completed late by ${result}`;
  }

  get existingTopics(): string[] {
    const topics = new Set<string>();
    this.tasks.forEach(t => {
      if (t.topic && t.topic.trim()) topics.add(t.topic.trim());
    });
    return Array.from(topics).sort();
  }

  get inProgressTasks(): TaskNote[] {
    return this.tasks.filter((task) => !this.isCompleted(task) && !this.isOverdue(task));
  }

  get completedTasks(): TaskNote[] {
    return this.tasks.filter((task) => this.isCompleted(task));
  }

  get overduedTasks(): TaskNote[] {
    return this.tasks.filter((task) => this.isOverdue(task));
  }

  get connectedLists(): string[] {
    return this.groupedTasks.map(g => g.title);
  }

  get groupedTasks(): { title: string, tasks: TaskNote[] }[] {
    let result: { title: string, tasks: TaskNote[], timestamp?: number }[] = [];

    if (this.viewMode === 'progress') {
      result = [
        { title: 'In Progress', tasks: this.inProgressTasks },
        { title: 'Completed', tasks: this.completedTasks },
        { title: 'Overdue', tasks: this.overduedTasks }
      ];
    } else if (this.viewMode === 'default') {
      const groups = new Map<string, TaskNote[]>();
      this.tasks.forEach(t => {
        const key = t.topic ? t.topic.trim() : 'No Topic';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(t);
      });
      result = Array.from(groups.entries())
        .map(([title, tasks]) => ({ title, tasks }))
        .sort((a, b) => a.title.localeCompare(b.title));
    } else if (this.viewMode === 'priority') {
      result = [5, 4, 3, 2, 1].map(p => ({
        title: `Priority ${p}`,
        tasks: this.tasks.filter(t => t.priority === p)
      })).filter(g => g.tasks.length > 0); 
    } else {
      const groups = new Map<string, TaskNote[]>();
      const noDateTasks: TaskNote[] = [];

      this.tasks.forEach(task => {
        if (!task.dueDate) {
          noDateTasks.push(task);
          return;
        }

        const date = new Date(task.dueDate);
        let key = '';

        if (this.viewMode === 'days') {
          key = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } else if (this.viewMode === 'weeks') {
          const d = new Date(date);
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(d.setDate(diff));
          key = `Week of ${monday.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`;
        } else if (this.viewMode === 'months') {
          key = `${date.toLocaleString(undefined, { month: 'long' })} ${date.getFullYear()}`;
        } else if (this.viewMode === 'years') {
          key = `${date.getFullYear()}`;
        }

        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(task);
      });

      groups.forEach((tasks, title) => {
        result.push({ title, tasks, timestamp: new Date(tasks[0].dueDate!).getTime() });
      });

      result.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      if (noDateTasks.length > 0) {
        result.push({ title: 'No Due Date', tasks: noDateTasks });
      }
    }

    // Sort the tasks within each section by local storage order for drag and drop views
    if (this.viewMode === 'default' || this.viewMode === 'progress') {
        const orderDict = this.taskOrder();
        result.forEach(group => {
            group.tasks.sort((a, b) => (orderDict[a.id] || 0) - (orderDict[b.id] || 0));
        });
    }

    // Reorder sections based on saved sectionOrder
    if (this.viewMode === 'default' || this.viewMode === 'progress') {
        const order = this.sectionOrder();
        if (order && order.length > 0) {
            result.sort((a, b) => {
                const iA = order.indexOf(a.title);
                const iB = order.indexOf(b.title);
                if (iA !== -1 && iB !== -1) return iA - iB;
                if (iA !== -1) return -1;
                if (iB !== -1) return 1;
                return 0;
            });
        }
    }

    return result.map(r => ({ title: r.title, tasks: r.tasks }));
  }

  dropSection(event: CdkDragDrop<any[]>) {
    const currentGroups = this.groupedTasks.map(g => g.title);
    moveItemInArray(currentGroups, event.previousIndex, event.currentIndex);
    this.sectionOrder.set(currentGroups);
    localStorage.setItem('sectionOrder', JSON.stringify(currentGroups));
  }

  dropTask(event: CdkDragDrop<TaskNote[]>, groupTitle: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    const currentOrder = { ...this.taskOrder() };

    event.container.data.forEach((task, index) => {
      currentOrder[task.id] = index;
    });

    if (event.previousContainer !== event.container) {
      event.previousContainer.data.forEach((task, index) => {
        currentOrder[task.id] = index;
      });
    }

    this.taskOrder.set(currentOrder);
    localStorage.setItem('taskOrder', JSON.stringify(currentOrder));
  }

  remove(t: TaskNote): void {
    this.store.deleteTask(t.id).subscribe();
  }

  trackById = (_: number, t: TaskNote) => t.id;

  private scrollEditFormIntoView(): void {
    this.taskEditFormAnchor?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}