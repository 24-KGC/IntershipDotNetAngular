import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, AsyncPipe, TitleCasePipe } from '@angular/common';
import { ClockService } from '../services/clock.service';
import { TaskStoreService } from '../services/task-store.service';
import { RecipeStoreService } from '../services/recipe-store.service';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { map } from 'rxjs';

type DashboardView = 'today' | 'week' | 'month' | 'year' | 'all';

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [DatePipe, AsyncPipe, DecimalPipe, TitleCasePipe, NgxEchartsDirective],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
})
export class DashboardComponent implements OnInit {
  Math = Math;
  clock = inject(ClockService);          
  time$ = this.clock.time$;     

  private store = inject(TaskStoreService);
  private recipeStore = inject(RecipeStoreService);
  
  readonly tasks = this.store.tasks;
  readonly recipes = this.recipeStore.recipes;
  
  dashboardView = signal<DashboardView>('month');

  ngOnInit(): void {
    this.store.loadTasks().subscribe();
    this.recipeStore.loadRecipes().subscribe();
  }

  setView(view: DashboardView) {
    this.dashboardView.set(view);
  }

  private isDateInView(dateString: string | undefined | null, view: DashboardView): boolean {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    
    if (view === 'all') return true;
    if (view === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (view === 'year') {
      return d.getFullYear() === now.getFullYear();
    }
    if (view === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (view === 'week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      // Adjust so Monday is 1 and Sunday is 7
      const diff = startOfWeek.getDate() - (day === 0 ? 6 : day - 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return d >= startOfWeek && d <= endOfWeek;
    }
    return true;
  }

  filteredTasks = computed(() => {
    const view = this.dashboardView();
    return this.tasks().filter(t => this.isDateInView(t.dueDate || t.createdAt, view));
  });

  filteredRecipes = computed(() => {
    const view = this.dashboardView();
    return this.recipes().filter(r => this.isDateInView(r.createdAt, view));
  });

  // Separate metrics
  get remainingTasksCount(): number {
    return this.filteredTasks().filter(t => !t.done).length;
  }

  get remainingRecipesCount(): number {
    return this.filteredRecipes().filter(r => !r.completed).length;
  }

  get estimatedTasksMinutes(): number {
    return this.filteredTasks().filter(t => !t.done).reduce((acc, t) => acc + t.estimatedMinutes, 0);
  }

  get estimatedRecipesMinutes(): number {
    return this.filteredRecipes().filter(r => !r.completed).reduce((acc, r) => acc + r.cookTime, 0);
  }

  get tasksCompletionPercent(): number {
    const total = this.filteredTasks().length;
    if (total === 0) return 0;
    const done = this.filteredTasks().filter(t => t.done).length;
    return Math.round((done / total) * 100);
  }

  get recipesCompletionPercent(): number {
    const total = this.filteredRecipes().length;
    if (total === 0) return 0;
    const done = this.filteredRecipes().filter(r => r.completed).length;
    return Math.round((done / total) * 100);
  }

  // Calendar Heatmap (For Year View)
  calendarOptions = computed<EChartsOption>(() => {
    const dataMap = new Map<string, number>();
    for (const t of this.tasks()) {
        const d = new Date(t.dueDate || t.createdAt);
        const dateStr = d.toISOString().split('T')[0];
        dataMap.set(dateStr, (dataMap.get(dateStr) || 0) + 1);
    }
    const data = Array.from(dataMap.entries());
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    return {
        tooltip: { 
            position: 'top',
            formatter: function (p: any) {
                const date = p.data[0];
                const count = p.data[1];
                return `<span style="font-weight:bold">${date}</span><br/>Tasks: ${count}`;
            }
        },
        visualMap: {
            min: 0,
            max: 5,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: 0,
            inRange: { color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'] },
            textStyle: { color: '#ccc' }
        },
        calendar: {
            top: 20,
            left: 30,
            right: 30,
            bottom: 60,
            range: now.getFullYear().toString(),
            cellSize: ['auto', 16],
            itemStyle: { borderWidth: 0.5, borderColor: '#333' },
            splitLine: {
                show: true,
                lineStyle: {
                    color: '#888',
                    width: 2,
                    type: 'solid'
                }
            },
            yearLabel: { show: false },
            dayLabel: { color: '#ccc' },
            monthLabel: { color: '#ccc' }
        },
        series: [
            {
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: data
            },
            {
                type: 'effectScatter',
                coordinateSystem: 'calendar',
                symbolSize: 14,
                rippleEffect: {
                    brushType: 'stroke',
                    scale: 3
                },
                itemStyle: { 
                    color: '#ff0000ff', // Bright amber/gold
                    shadowBlur: 10,
                    shadowColor: '#ff0000ff'
                },
                data: [[todayStr, dataMap.get(todayStr) || 0]],
                tooltip: {
                    formatter: function() {
                        return `<span style="font-weight:bold">${todayStr} (Today)</span>`;
                    }
                }
            }
        ]
    };
  });

  // Bar Chart (For All Time View)
  allTimeChartOptions = computed<EChartsOption>(() => {
    const dataMap = new Map<string, number>();
    for (const t of this.tasks()) {
        const d = new Date(t.dueDate || t.createdAt);
        const year = d.getFullYear().toString();
        dataMap.set(year, (dataMap.get(year) || 0) + 1);
    }
    const years = Array.from(dataMap.keys()).sort();
    const data = years.map(y => dataMap.get(y) || 0);

    return {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: years, axisLabel: { color: '#ccc' } },
        yAxis: { type: 'value', axisLabel: { color: '#ccc' } },
        series: [{
            name: 'Tasks Added',
            type: 'bar',
            data: data,
            itemStyle: { color: '#7bc96f', borderRadius: [4, 4, 0, 0] }
        }]
    };
  });

  // Chart 1: Completed vs Overdue
  completedVsOverdueOptions = computed<EChartsOption>(() => {
      const dates = new Set<string>();
      const completedMap = new Map<string, number>();
      const overdueMap = new Map<string, number>();
      const now = new Date();

      const tasks = this.dashboardView() === 'all' ? this.tasks() : this.filteredTasks();

      for (const t of tasks) {
          const dStr = new Date(t.dueDate || t.createdAt).toISOString().split('T')[0];
          dates.add(dStr);
          if (t.done) {
              completedMap.set(dStr, (completedMap.get(dStr) || 0) + 1);
          } else if (t.dueDate && new Date(t.dueDate) < now) {
              overdueMap.set(dStr, (overdueMap.get(dStr) || 0) + 1);
          }
      }

      const sortedDates = Array.from(dates).sort();
      const completedData = sortedDates.map(d => completedMap.get(d) || 0);
      const overdueData = sortedDates.map(d => overdueMap.get(d) || 0);

      return {
          tooltip: { trigger: 'axis' },
          legend: { data: ['Completed', 'Overdue'], textStyle: { color: '#ccc' } },
          xAxis: { type: 'category', data: sortedDates, axisLabel: { color: '#ccc' } },
          yAxis: { type: 'value', axisLabel: { color: '#ccc' } },
          series: [
              { name: 'Completed', type: 'line', data: completedData, smooth: true, itemStyle: { color: '#7bc96f' } },
              { name: 'Overdue', type: 'line', data: overdueData, smooth: true, itemStyle: { color: '#e55353' } }
          ]
      };
  });

  // Chart 2: Estimated vs Actual
  estimatedVsActualOptions = computed<EChartsOption>(() => {
      const dates = new Set<string>();
      const estimatedMap = new Map<string, number>();
      const actualMap = new Map<string, number>();

      const tasks = this.dashboardView() === 'all' ? this.tasks() : this.filteredTasks();

      for (const t of tasks) {
          const dStr = new Date(t.dueDate || t.createdAt).toISOString().split('T')[0];
          dates.add(dStr);
          estimatedMap.set(dStr, (estimatedMap.get(dStr) || 0) + t.estimatedMinutes);
          actualMap.set(dStr, (actualMap.get(dStr) || 0) + (t.actualMinutes || 0));
      }

      const sortedDates = Array.from(dates).sort();
      const estData = sortedDates.map(d => estimatedMap.get(d) || 0);
      const actData = sortedDates.map(d => actualMap.get(d) || 0);

      return {
          tooltip: { trigger: 'axis' },
          legend: { data: ['Estimated (min)', 'Actual (min)'], textStyle: { color: '#ccc' } },
          xAxis: { type: 'category', data: sortedDates, axisLabel: { color: '#ccc' } },
          yAxis: { type: 'value', axisLabel: { color: '#ccc' } },
          series: [
              { name: 'Estimated (min)', type: 'line', data: estData, smooth: true, itemStyle: { color: '#45b6fe' } },
              { name: 'Actual (min)', type: 'line', data: actData, smooth: true, itemStyle: { color: '#f9ca24' } }
          ]
      };
  });
}