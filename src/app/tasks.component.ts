import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Appwrite } from './appwrite';

export interface TaskItem {
  $id: string;
  title: string;
  category: string;
  status: string;
  priority?: string;
  dueDate?: string;
  description?: string;
  completed: boolean;
  leadId?: string;
  leadName?: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="max-w-[1600px] mx-auto animate-fade-in px-1 sm:px-2 md:px-0 h-full flex flex-col relative">
      <!-- Tasks Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-1 sm:mt-2 mb-4 sm:mb-6 shrink-0">
        <div>
          <h1 class="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5 sm:gap-3 drop-shadow-md">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] shrink-0">
              <i class="ti ti-check text-[20px] sm:text-[22px]"></i>
            </div>
            <span>Action Items & Objectives</span>
          </h1>
          <p class="text-xs sm:text-sm text-zinc-400 mt-1">
            Centralized task tracking and operational pipeline for high-value strategic objectives.
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:gap-3 flex-1 sm:flex-initial w-full sm:w-auto">
          <div class="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-end">
            <!-- Quick search -->
            <div class="relative flex-1 sm:flex-initial">
              <i class="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[17px]"></i>
              <input 
                type="text" 
                [value]="searchQuery()" 
                (input)="updateSearch($event)" 
                placeholder="Search objectives..." 
                class="w-full sm:w-56 bg-zinc-900/80 border border-zinc-800 rounded-xl py-1.5 sm:py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all font-medium shadow-inner" />
            </div>

            <!-- New Objective Button -->
            <button 
              type="button"
              (click)="openCreateModal()" 
              class="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 shrink-0 cursor-pointer active:scale-95">
              <i class="ti ti-plus text-[17px]"></i>
              <span class="hidden sm:inline">New Objective</span>
              <span class="sm:hidden">New</span>
            </button>
          </div>
          
          <!-- One-Tap Logging (Mobile Optimized) -->
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 w-full sm:justify-end">
            <button (click)="quickLog('call')" class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-teal-500/50 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap active:scale-95 shrink-0">
              <i class="ti ti-phone text-teal-400 text-[14px]"></i> Log Call
            </button>
            <button (click)="quickLog('meeting')" class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-purple-500/50 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap active:scale-95 shrink-0">
              <i class="ti ti-calendar text-purple-400 text-[14px]"></i> Log Meeting
            </button>
            <button (click)="quickLog('email')" class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-amber-500/50 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap active:scale-95 shrink-0">
              <i class="ti ti-mail text-amber-400 text-[14px]"></i> Log Email
            </button>
            <button (click)="quickLog('note')" class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-emerald-500/50 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap active:scale-95 shrink-0">
              <i class="ti ti-notebook text-emerald-400 text-[14px]"></i> Add Note
            </button>
          </div>
        </div>
      </header>

      <!-- Category Filter Pills Bar (Mobile Scrollable) -->
      <div class="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6 bg-zinc-900/60 p-2 sm:p-2.5 rounded-2xl border border-zinc-800/80">
        <div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 w-full">
          <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">Category:</span>
          <button 
            type="button"
            (click)="selectedCategory.set('All')" 
            [class]="selectedCategory() === 'All' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold' : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-white'"
            class="px-3 py-1 rounded-xl border text-xs transition-all shrink-0 cursor-pointer">
            All ({{ appwrite.tasks().length }})
          </button>
          @for (cat of categories(); track cat) {
            <button 
              type="button"
              (click)="selectedCategory.set(cat)" 
              [class]="selectedCategory() === cat ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold' : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-white'"
              class="px-3 py-1 rounded-xl border text-xs transition-all shrink-0 cursor-pointer">
              {{ cat }}
            </button>
          }
        </div>

        @if (getTasksBy('done').length > 0) {
          <button (click)="clearResolved()" class="text-[11px] font-bold text-zinc-500 hover:text-rose-400 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-zinc-800 shrink-0 whitespace-nowrap">
            <i class="ti ti-trash text-xs"></i>
            <span class="hidden sm:inline">Clear Resolved ({{ getTasksBy('done').length }})</span>
            <span class="inline sm:hidden">Clear ({{ getTasksBy('done').length }})</span>
          </button>
        }
      </div>

      <!-- Columns Layout -->
      <div class="flex-1 flex gap-6 overflow-x-auto custom-scrollbar pb-6 min-h-0 items-stretch">
        
        <!-- TODO Column -->
        <div class="flex-shrink-0 w-80 lg:w-96 flex flex-col bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
          <div class="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/50">
            <h3 class="font-bold text-white flex items-center gap-2 font-display text-sm">
               <i class="ti ti-circle-dashed text-rose-400 text-[18px]"></i>
               Backlog / Pending
            </h3>
            <span class="text-xs font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md font-mono">{{ getTasksBy('todo').length }}</span>
          </div>
          <div class="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
             @for (task of getTasksBy('todo'); track task.$id) {
               <ng-container *ngTemplateOutlet="taskCard; context: { task: task }"></ng-container>
             } @empty {
               <div class="h-32 border border-dashed border-zinc-800/80 rounded-xl flex items-center justify-center text-xs text-zinc-600 font-medium">
                 No items in backlog
               </div>
             }
          </div>
        </div>

        <!-- DOING Column -->
        <div class="flex-shrink-0 w-80 lg:w-96 flex flex-col bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
          <div class="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/50">
            <h3 class="font-bold text-white flex items-center gap-2 font-display text-sm">
               <i class="ti ti-loader text-amber-400 text-[18px] animate-spin"></i>
               Active Execution Cycles
            </h3>
            <span class="text-xs font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md font-mono">{{ getTasksBy('in-progress').length }}</span>
          </div>
          <div class="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
             @for (task of getTasksBy('in-progress'); track task.$id) {
               <ng-container *ngTemplateOutlet="taskCard; context: { task: task }"></ng-container>
             } @empty {
               <div class="h-32 border border-dashed border-zinc-800/80 rounded-xl flex items-center justify-center text-xs text-zinc-600 font-medium">
                 No active execution cycles
               </div>
             }
          </div>
        </div>

        <!-- DONE Column -->
        <div class="flex-shrink-0 w-80 lg:w-96 flex flex-col bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
          <div class="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/50">
            <h3 class="font-bold text-white flex items-center gap-2 font-display text-sm">
               <i class="ti ti-circle-check text-teal-400 text-[18px]"></i>
               Resolved & Deployed
            </h3>
            <span class="text-xs font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md font-mono">{{ getTasksBy('done').length }}</span>
          </div>
          <div class="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
             @for (task of getTasksBy('done'); track task.$id) {
               <ng-container *ngTemplateOutlet="taskCard; context: { task: task }"></ng-container>
             } @empty {
               <div class="h-32 border border-dashed border-zinc-800/80 rounded-xl flex items-center justify-center text-xs text-zinc-600 font-medium">
                 No resolved objectives
               </div>
             }
          </div>
        </div>

      </div>

      <!-- Add/Edit Modal -->
      @if (isModalOpen()) {
        <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" (click)="closeModal()" (keydown.escape)="closeModal()" tabindex="0" role="dialog" aria-modal="true">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
            <div class="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <h2 class="text-lg font-bold text-white font-display">{{ editingTask() ? 'Edit Objective' : 'New Strategic Objective' }}</h2>
              <button (click)="closeModal()" class="text-zinc-500 hover:text-zinc-300">
                <i class="ti ti-x text-[20px]"></i>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label for="task-title-input" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Objective Title *</label>
                <input id="task-title-input" type="text" #titleInput [value]="editingTask()?.title || ''" placeholder="e.g. Finalize enterprise SLA & security audit" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="task-category-select" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Category</label>
                  <input id="task-category-select" list="categoryList" #catInput [value]="editingTask()?.category || 'Strategic'" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50">
                  <datalist id="categoryList">
                    @for (cat of categories(); track cat) {
                      <option [value]="cat"></option>
                    }
                  </datalist>
                </div>

                <div>
                  <label for="task-status-select" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Status Column</label>
                  <select id="task-status-select" #statusInput [value]="editingTask()?.status || 'todo'" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50">
                    <option value="todo">Backlog</option>
                    <option value="in-progress">Active</option>
                    <option value="done">Resolved</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="task-priority-select" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Priority</label>
                  <select id="task-priority-select" #prioInput [value]="editingTask()?.priority || 'High'" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label for="task-duedate-input" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Due Date</label>
                  <input id="task-duedate-input" type="date" #dateInput [value]="editingTask()?.dueDate || defaultDueDate" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50">
                </div>
              </div>

              <div>
                <label for="task-desc-input" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Notes / Description</label>
                <textarea id="task-desc-input" #descInput rows="2" placeholder="Action item context or requirements..." class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none">{{ editingTask()?.description || '' }}</textarea>
              </div>

            </div>

            <div class="mt-6 flex justify-end gap-3 border-t border-zinc-800/80 pt-4">
              <button (click)="closeModal()" class="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">Cancel</button>
              <button (click)="saveTask(titleInput.value, catInput.value, statusInput.value, prioInput.value, dateInput.value, descInput.value)" class="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-zinc-950 font-bold rounded-xl transition-all text-xs shadow-lg shadow-purple-500/20">
                {{ editingTask() ? 'Save Changes' : 'Create Objective' }}
              </button>
            </div>
          </div>
        </div>
      }

    </div>

    <!-- Reusable Task Card Template -->
    <ng-template #taskCard let-task="task">
      <div 
        class="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700 hover:shadow-lg transition-all group relative overflow-hidden"
        [class.opacity-60]="task.status === 'done'">
        <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" [ngClass]="getCategoryColor(task.category || 'Routine')"></div>
        
        <div class="flex items-center justify-between mb-2">
          <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
            [ngClass]="getCategoryBadgeClass(task.category || 'Routine')">
            {{ task.category || 'Routine' }}
          </span>

          <div class="flex items-center gap-2">
            @if (task.dueDate) {
              <span class="text-[10px] font-semibold text-zinc-500 flex items-center gap-0.5">
                <i class="ti ti-clock text-[12px]"></i> {{ task.dueDate }}
              </span>
            }
          </div>
        </div>

        <h4 class="text-xs font-bold text-zinc-200 leading-snug group-hover:text-white transition-colors" [class.line-through]="task.status === 'done'">
          {{ task.title }}
        </h4>

        @if (task.description) {
          <p class="text-[11px] text-zinc-500 line-clamp-2 mt-1.5">{{ task.description }}</p>
        }

        <div class="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between">
          
          <!-- Column Progression Controls -->
          <div class="flex items-center gap-1">
            @if (task.status !== 'todo') {
              <button (click)="moveStatus(task, -1)" title="Move Back" class="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">
                <i class="ti ti-arrow-left text-[14px]"></i>
              </button>
            }
            @if (task.status !== 'done') {
              <button (click)="moveStatus(task, 1)" title="Advance Status" class="p-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-colors">
                <i class="ti ti-arrow-right text-[14px]"></i>
              </button>
            }
          </div>

          <!-- Edit & Delete Buttons -->
          <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button (click)="openEditModal(task)" title="Edit" class="text-zinc-500 hover:text-purple-400 p-1 rounded hover:bg-zinc-900"><i class="ti ti-pencil text-[16px]"></i></button>
            <button (click)="deleteTask(task.$id)" title="Delete" class="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-zinc-900"><i class="ti ti-trash text-[16px]"></i></button>
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
    .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(24,24,27,0.5); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(82,82,91,0.5); border-radius: 4px; }
  `]
})
export class TasksComponent implements OnInit {
  appwrite = inject(Appwrite);
  route = inject(ActivatedRoute);
  router = inject(Router);
  
  isModalOpen = signal(false);
  editingTask = signal<TaskItem | null>(null);
  searchQuery = signal('');
  selectedCategory = signal('All');

  categories = computed(() => {
    const defaultCats = new Set(['Strategic', 'Urgent', 'Client', 'Routine', 'Legal Review', 'SDR Follow-up']);
    this.appwrite.tasks().forEach(t => {
      if (t.category) defaultCats.add(t.category);
    });
    return Array.from(defaultCats).sort();
  });

  defaultDueDate = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create' || params['action'] === 'new') {
        this.openCreateModal();
        this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
      }
    });
  }

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  getTasksBy(status: string) {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    let arr = this.appwrite.tasks();

    arr = arr.filter(t => (t.status || 'todo') === status);

    if (cat !== 'All') {
      arr = arr.filter(t => (t.category || 'Routine') === cat);
    }

    if (q) {
      arr = arr.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return arr;
  }

  getCategoryColor(category: string) {
    switch (category) {
      case 'Urgent': return 'bg-rose-500';
      case 'Strategic': return 'bg-purple-500';
      case 'Client': return 'bg-teal-500';
      case 'Legal Review': return 'bg-amber-500';
      case 'SDR Follow-up': return 'bg-sky-500';
      case 'Routine': default: return 'bg-zinc-500';
    }
  }

  getCategoryBadgeClass(category: string) {
    switch (category) {
      case 'Urgent': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Strategic': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Client': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'Legal Review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'SDR Follow-up': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
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

  async saveTask(title: string, category: string, status: string, priority?: string, dueDate?: string, description?: string) {
    if (!title.trim()) return;
    
    const task = this.editingTask();
    if (task) {
      await this.appwrite.updateTask(task.$id, { title, category, status, priority, dueDate, description });
      this.appwrite.addNotification({
        title: 'Objective Updated',
        message: `Updated task "${title}".`,
        type: 'info'
      });
    } else {
      await this.appwrite.addTask({ title, category, status, priority, dueDate, description });
      this.appwrite.addNotification({
        title: 'Objective Created',
        message: `Added new task "${title}".`,
        type: 'success'
      });
    }
    this.closeModal();
  }

  async moveStatus(task: TaskItem, direction: number) {
    const statuses = ['todo', 'in-progress', 'done'];
    const currIdx = statuses.indexOf(task.status || 'todo');
    const newIdx = Math.max(0, Math.min(statuses.length - 1, currIdx + direction));
    const nextStatus = statuses[newIdx];

    if (nextStatus !== task.status) {
      await this.appwrite.updateTask(task.$id, { status: nextStatus });
      this.appwrite.addNotification({
        title: 'Task Status Shifted',
        message: `Moved "${task.title}" to ${nextStatus.toUpperCase()}`,
        type: nextStatus === 'done' ? 'success' : 'info'
      });
    }
  }

  async clearResolved() {
    if (confirm('Clear all resolved objectives?')) {
      const resolved = this.getTasksBy('done');
      for (const t of resolved) {
        await this.appwrite.deleteTask(t.$id);
      }
      this.appwrite.addNotification({
        title: 'Resolved Tasks Cleared',
        message: `Removed ${resolved.length} completed tasks.`,
        type: 'warning'
      });
    }
  }

  async deleteTask(id: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      await this.appwrite.deleteTask(id);
      this.appwrite.addNotification({
        title: 'Task Deleted',
        message: 'Task removed from active pipeline.',
        type: 'warning'
      });
    }
  }

  quickLog(type: 'call' | 'meeting' | 'email' | 'note') {
    const titles = {
      call: 'Outbound Dialectic Call Logged',
      meeting: 'Stakeholder Alignment Meeting',
      email: 'Strategic Email Dispatch',
      note: 'Epistemic Note Appended'
    };
    
    this.appwrite.addTask({
      title: titles[type],
      category: 'General',
      status: 'done',
      priority: 'Medium',
      dueDate: new Date().toISOString().slice(0, 10),
      description: `Rapid activity logged via mobile one-tap interface.`
    });
    
    this.appwrite.addNotification({
      title: 'Activity Logged',
      message: `${titles[type]} recorded successfully.`,
      type: 'success'
    });
  }
}
