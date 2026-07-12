import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Appwrite } from './appwrite';

export interface TaskItem {
  $id: string;
  title: string;
  category: string;
  status: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="max-w-[1600px] mx-auto animate-fade-in px-2 md:px-0 h-full flex flex-col relative">
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-6 flex-shrink-0">
        <div>
          <h1 class="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <mat-icon class="text-purple-400 text-[24px]">task_alt</mat-icon>
            </div>
            Action Items & Workflow
          </h1>
          <p class="text-sm text-zinc-400 mt-2">
            Centralized task tracking and operational pipeline for high-value strategic objectives.
          </p>
        </div>
        <button (click)="openCreateModal()" class="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-purple-950 font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20">
          <mat-icon class="text-[18px]">add_task</mat-icon>
          New Objective
        </button>
      </header>

      <div class="flex-1 flex gap-6 overflow-x-auto custom-scrollbar pb-6 min-h-0 items-stretch">
        
        <!-- TODO Column -->
        <div class="flex-shrink-0 w-80 lg:w-96 flex flex-col bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
          <div class="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/50">
            <h3 class="font-bold text-white flex items-center gap-2">
               <mat-icon class="text-rose-400 text-[18px]">fiber_manual_record</mat-icon>
               Backlog
            </h3>
            <span class="text-xs font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">{{ getTasksBy('todo').length }}</span>
          </div>
          <div class="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
             @for (task of getTasksBy('todo'); track task.$id) {
               <ng-container *ngTemplateOutlet="taskCard; context: { task: task }"></ng-container>
             }
          </div>
        </div>

        <!-- DOING Column -->
        <div class="flex-shrink-0 w-80 lg:w-96 flex flex-col bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
          <div class="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/50">
            <h3 class="font-bold text-white flex items-center gap-2">
               <mat-icon class="text-amber-400 text-[18px] animate-pulse">incomplete_circle</mat-icon>
               Active Cycles
            </h3>
            <span class="text-xs font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">{{ getTasksBy('in-progress').length }}</span>
          </div>
          <div class="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
             @for (task of getTasksBy('in-progress'); track task.$id) {
               <ng-container *ngTemplateOutlet="taskCard; context: { task: task }"></ng-container>
             }
          </div>
        </div>

        <!-- DONE Column -->
        <div class="flex-shrink-0 w-80 lg:w-96 flex flex-col bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
          <div class="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/50">
            <h3 class="font-bold text-white flex items-center gap-2">
               <mat-icon class="text-teal-400 text-[18px]">check_circle</mat-icon>
               Resolved
            </h3>
            <span class="text-xs font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">{{ getTasksBy('done').length }}</span>
          </div>
          <div class="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
             @for (task of getTasksBy('done'); track task.$id) {
               <ng-container *ngTemplateOutlet="taskCard; context: { task: task }"></ng-container>
             }
          </div>
        </div>

      </div>

      <!-- Add/Edit Modal -->
      @if (isModalOpen()) {
        <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 class="text-xl font-bold text-white mb-4">{{ editingTask() ? 'Edit Objective' : 'New Objective' }}</h2>
            <div class="space-y-4">
              <div>
                <label for="task-title-input" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Title</label>
                <input id="task-title-input" type="text" #titleInput [value]="editingTask()?.title || ''" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50">
              </div>
              <div>
                <label for="task-category-select" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Category</label>
                <select id="task-category-select" #catInput [value]="editingTask()?.category || 'Routine'" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50">
                  <option value="Strategic">Strategic</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Client">Client</option>
                  <option value="Routine">Routine</option>
                </select>
              </div>
              <div>
                <label for="task-status-select" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Status</label>
                <select id="task-status-select" #statusInput [value]="editingTask()?.status || 'todo'" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50">
                  <option value="todo">Backlog</option>
                  <option value="in-progress">Active</option>
                  <option value="done">Resolved</option>
                </select>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
              <button (click)="closeModal()" class="px-4 py-2 rounded-lg font-bold text-zinc-400 hover:text-white transition-colors text-sm">Cancel</button>
              <button (click)="saveTask(titleInput.value, catInput.value, statusInput.value)" class="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-purple-950 font-bold rounded-lg transition-colors text-sm">
                {{ editingTask() ? 'Save Changes' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      }

    </div>

    <!-- Reusable Task Card Template -->
    <ng-template #taskCard let-task="task">
      <div 
        class="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 cursor-grab hover:border-zinc-700 hover:shadow-lg transition-all group relative overflow-hidden"
        [class.opacity-60]="task.status === 'done'">
        <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" [ngClass]="getCategoryColor(task.category || 'Routine')"></div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
            [ngClass]="getCategoryBadgeClass(task.category || 'Routine')">
            {{ task.category || 'Routine' }}
          </span>
          @if (task.dueDate) {
            <span class="text-[10px] font-semibold text-zinc-500 flex items-center gap-1">
              <mat-icon class="text-[12px]">schedule</mat-icon> {{ task.dueDate }}
            </span>
          }
        </div>
        <h4 class="text-sm font-bold text-zinc-200 leading-snug group-hover:text-white transition-colors" [class.line-through]="task.status === 'done'">
          {{ task.title }}
        </h4>
        <div class="mt-4 flex items-center justify-between border-t border-zinc-800/60 mt-3 pt-3">
          <div class="flex items-center gap-[-4px]">
             <!-- Avatars -->
             <div class="w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-bold text-zinc-400">AJ</div>
          </div>
          <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button (click)="openEditModal(task)" class="text-zinc-500 hover:text-purple-400"><mat-icon class="text-[16px]">edit</mat-icon></button>
            <button (click)="deleteTask(task.$id)" class="text-zinc-500 hover:text-rose-400"><mat-icon class="text-[16px]">delete</mat-icon></button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(24,24,27,0.5); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(82,82,91,0.5); border-radius: 4px; }
  `]
})
export class TasksComponent {
  appwrite = inject(Appwrite);
  
  isModalOpen = signal(false);
  editingTask = signal<TaskItem | null>(null);

  getTasksBy(status: string) {
    const arr = this.appwrite.tasks();
    return arr.filter(t => (t.status || 'todo') === status);
  }

  getCategoryColor(category: string) {
    switch (category) {
      case 'Urgent': return 'bg-rose-500';
      case 'Strategic': return 'bg-purple-500';
      case 'Client': return 'bg-teal-500';
      case 'Routine': default: return 'bg-zinc-500';
    }
  }

  getCategoryBadgeClass(category: string) {
    switch (category) {
      case 'Urgent': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Strategic': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Client': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'Routine': default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  }

  openCreateModal() {
    this.editingTask.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(task: TaskItem) {
    this.editingTask.set(task);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingTask.set(null);
  }

  async saveTask(title: string, category: string, status: string) {
    if (!title.trim()) return;
    
    const task = this.editingTask();
    if (task) {
      await this.appwrite.updateTask(task.$id, { title, category, status });
    } else {
      await this.appwrite.addTask({ title, category, status });
    }
    this.closeModal();
  }

  async deleteTask(id: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      await this.appwrite.deleteTask(id);
    }
  }
}

