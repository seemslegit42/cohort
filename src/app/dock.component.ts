import { Component, ChangeDetectionStrategy, signal, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LeadService } from './lead.service';
import { Appwrite } from './appwrite';

@Component({
  selector: 'app-dock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, RouterModule, ReactiveFormsModule],
  template: `
    <!-- Floating Bottom Dock Bar -->
    <div class="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-50 items-center gap-2 p-2 bg-zinc-900/80 backdrop-blur-3xl border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/80 transition-all duration-300 hover:bg-zinc-900/90">
      
      <!-- Quick Add Highlighted Trigger Button -->
      <button (click)="openQuickAdd('lead')" class="group relative w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all font-bold shrink-0">
        <mat-icon class="text-[22px]">add</mat-icon>
        <span class="absolute -top-12 scale-0 group-hover:scale-100 transition-transform origin-bottom font-bold bg-amber-500 text-zinc-950 text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl shrink-0 whitespace-nowrap pointer-events-none">Quick Add</span>
      </button>

      <div class="w-px h-8 bg-zinc-800 mx-1"></div>

      <!-- Search Input -->
      <div class="relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-center" 
           [ngClass]="isSearchOpen() ? 'w-64 opacity-100 mr-2 visible' : 'w-0 opacity-0 mr-0 invisible'">
        <mat-icon class="absolute left-3 text-zinc-500 text-[18px]">search</mat-icon>
        <input #searchInput type="text" placeholder="Search across app..." 
               class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium"
               (blur)="closeSearch()" />
      </div>

      <!-- Search Trigger -->
      <button (click)="toggleSearch()" class="group relative w-12 h-12 rounded-xl flex items-center justify-center hover:bg-zinc-800 transition-all text-zinc-400 hover:text-teal-400">
        <mat-icon [class.text-teal-400]="isSearchOpen()">search</mat-icon>
        <span class="absolute -top-12 scale-0 group-hover:scale-100 transition-transform origin-bottom font-medium bg-zinc-800 border border-zinc-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl shrink-0 whitespace-nowrap pointer-events-none">Search</span>
      </button>

      <div class="w-px h-8 bg-zinc-800 mx-1"></div>
      
      <a routerLink="/" routerLinkActive="bg-zinc-800 text-teal-400" [routerLinkActiveOptions]="{exact: true}" class="group relative w-12 h-12 rounded-xl flex items-center justify-center hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white">
        <mat-icon>space_dashboard</mat-icon>
        <span class="absolute -top-12 scale-0 group-hover:scale-100 transition-transform origin-bottom font-medium bg-zinc-800 border border-zinc-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl shrink-0 whitespace-nowrap pointer-events-none">Dashboard</span>
      </a>

      <a routerLink="/leads" routerLinkActive="bg-zinc-800 text-teal-400" class="group relative w-12 h-12 rounded-xl flex items-center justify-center hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white">
        <mat-icon>contacts</mat-icon>
        <span class="absolute -top-12 scale-0 group-hover:scale-100 transition-transform origin-bottom font-medium bg-zinc-800 border border-zinc-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl shrink-0 whitespace-nowrap pointer-events-none">Leads</span>
      </a>

      <a routerLink="/tasks" routerLinkActive="bg-zinc-800 text-teal-400" class="group relative w-12 h-12 rounded-xl flex items-center justify-center hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white">
        <mat-icon>check_circle</mat-icon>
        <span class="absolute -top-12 scale-0 group-hover:scale-100 transition-transform origin-bottom font-medium bg-zinc-800 border border-zinc-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl shrink-0 whitespace-nowrap pointer-events-none">Tasks</span>
      </a>

      <a routerLink="/reports" routerLinkActive="bg-zinc-800 text-teal-400" class="group relative w-12 h-12 rounded-xl flex items-center justify-center hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white">
        <mat-icon>bar_chart</mat-icon>
        <span class="absolute -top-12 scale-0 group-hover:scale-100 transition-transform origin-bottom font-medium bg-zinc-800 border border-zinc-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl shrink-0 whitespace-nowrap pointer-events-none">Reports</span>
      </a>

      <a routerLink="/clients" routerLinkActive="bg-zinc-800 text-teal-400" class="group relative w-12 h-12 rounded-xl flex items-center justify-center hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white">
        <mat-icon>business</mat-icon>
        <span class="absolute -top-12 scale-0 group-hover:scale-100 transition-transform origin-bottom font-medium bg-zinc-800 border border-zinc-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl shrink-0 whitespace-nowrap pointer-events-none">Clients</span>
      </a>
    </div>

    <!-- Quick Add Modal Overlay -->
    @if (isQuickAddOpen()) {
      <div class="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" tabindex="0" role="dialog" aria-modal="true" (click)="closeQuickAddOnBackdrop($event)" (keydown.escape)="closeQuickAdd()">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col" tabindex="-1" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
          
          <!-- Modal Header -->
          <div class="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-zinc-950 font-bold">
                <mat-icon class="text-[18px]">add</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-bold text-white font-display">Quick Add Item</h3>
                <p class="text-[11px] text-zinc-400">Rapidly record a new lead or task without switching views</p>
              </div>
            </div>

            <button (click)="closeQuickAdd()" class="text-zinc-500 hover:text-zinc-300 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors">
              <mat-icon class="text-[20px]">close</mat-icon>
            </button>
          </div>

          <!-- Type Switcher Tabs -->
          <div class="px-5 pt-4 flex gap-2">
            <button 
              type="button"
              (click)="quickAddTab.set('lead')"
              [class]="quickAddTab() === 'lead' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:text-zinc-200'"
              class="flex-1 py-2 px-3 rounded-xl border text-xs flex items-center justify-center gap-2 transition-all">
              <mat-icon class="text-[16px]">person_add</mat-icon> New Lead
            </button>
            
            <button 
              type="button"
              (click)="quickAddTab.set('task')"
              [class]="quickAddTab() === 'task' ? 'bg-teal-500/10 text-teal-400 border-teal-500/30 font-bold' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:text-zinc-200'"
              class="flex-1 py-2 px-3 rounded-xl border text-xs flex items-center justify-center gap-2 transition-all">
              <mat-icon class="text-[16px]">add_task</mat-icon> New Task
            </button>
          </div>

          <!-- Lead Form -->
          @if (quickAddTab() === 'lead') {
            <form [formGroup]="leadForm" (ngSubmit)="submitLead()" class="p-5 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div class="space-y-1">
                  <label for="quick-lead-name" class="text-[11px] font-semibold text-zinc-400">Full Name *</label>
                  <input id="quick-lead-name" formControlName="name" type="text" placeholder="e.g. Sarah Jenkins" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>

                <div class="space-y-1">
                  <label for="quick-lead-email" class="text-[11px] font-semibold text-zinc-400">Work Email *</label>
                  <input id="quick-lead-email" formControlName="email" type="email" placeholder="sarah@acmecorp.com" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>

                <div class="space-y-1">
                  <label for="quick-lead-value" class="text-[11px] font-semibold text-zinc-400">Estimated Value ($)</label>
                  <input id="quick-lead-value" formControlName="value" type="number" placeholder="25000" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                </div>

                <div class="space-y-1">
                  <label for="quick-lead-status" class="text-[11px] font-semibold text-zinc-400">Pipeline Stage</label>
                  <select id="quick-lead-status" formControlName="status" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label for="quick-lead-source" class="text-[11px] font-semibold text-zinc-400">Source Channel</label>
                  <select id="quick-lead-source" formControlName="source" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                    <option value="Inbound Website">Inbound Website</option>
                    <option value="Outbound SDR">Outbound SDR</option>
                    <option value="LinkedIn Cold">LinkedIn Cold</option>
                    <option value="Partner Referral">Partner Referral</option>
                    <option value="Event / Conference">Event / Conference</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label for="quick-lead-priority" class="text-[11px] font-semibold text-zinc-400">Priority</label>
                  <select id="quick-lead-priority" formControlName="priority" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

              </div>

              <div class="pt-2 flex justify-end gap-2 border-t border-zinc-800/60">
                <button type="button" (click)="closeQuickAdd()" class="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">Cancel</button>
                <button type="submit" [disabled]="leadForm.invalid || isSubmitting()" class="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-orange-500/20 disabled:opacity-50">
                  <mat-icon class="text-[16px]">check</mat-icon> Save Lead
                </button>
              </div>
            </form>
          }

          <!-- Task Form -->
          @if (quickAddTab() === 'task') {
            <form [formGroup]="taskForm" (ngSubmit)="submitTask()" class="p-5 space-y-4">
              <div class="space-y-3">
                
                <div class="space-y-1">
                  <label for="quick-task-title" class="text-[11px] font-semibold text-zinc-400">Task Title *</label>
                  <input id="quick-task-title" formControlName="title" type="text" placeholder="e.g. Send updated pricing proposal to Sarah" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label for="quick-task-category" class="text-[11px] font-semibold text-zinc-400">Category Tag</label>
                    <select id="quick-task-category" formControlName="category" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
                      <option value="SDR Follow-up">SDR Follow-up</option>
                      <option value="Legal Review">Legal Review</option>
                      <option value="Client Onboarding">Client Onboarding</option>
                      <option value="Deal Close">Deal Close</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div class="space-y-1">
                    <label for="quick-task-priority" class="text-[11px] font-semibold text-zinc-400">Priority Level</label>
                    <select id="quick-task-priority" formControlName="priority" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div class="space-y-1">
                  <label for="quick-task-duedate" class="text-[11px] font-semibold text-zinc-400">Due Date</label>
                  <input id="quick-task-duedate" formControlName="dueDate" type="date" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500" />
                </div>

                <div class="space-y-1">
                  <label for="quick-task-desc" class="text-[11px] font-semibold text-zinc-400">Description / Notes</label>
                  <textarea id="quick-task-desc" formControlName="description" rows="2" placeholder="Action item details..." class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 resize-none"></textarea>
                </div>

              </div>

              <div class="pt-2 flex justify-end gap-2 border-t border-zinc-800/60">
                <button type="button" (click)="closeQuickAdd()" class="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">Cancel</button>
                <button type="submit" [disabled]="taskForm.invalid || isSubmitting()" class="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-teal-500/20 disabled:opacity-50">
                  <mat-icon class="text-[16px]">check</mat-icon> Save Task
                </button>
              </div>
            </form>
          }

        </div>
      </div>
    }
  `
})
export class DockComponent {
  private fb = inject(FormBuilder);
  private leadService = inject(LeadService);
  private appwrite = inject(Appwrite);

  isSearchOpen = signal(false);
  isQuickAddOpen = signal(false);
  quickAddTab = signal<'lead' | 'task'>('lead');
  isSubmitting = signal(false);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  leadForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    value: [25000, [Validators.required, Validators.min(0)]],
    status: ['New', Validators.required],
    source: ['Inbound Website', Validators.required],
    priority: ['High', Validators.required]
  });

  taskForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    category: ['SDR Follow-up', Validators.required],
    priority: ['High', Validators.required],
    dueDate: [new Date(Date.now() + 86400000).toISOString().slice(0, 10)],
    description: ['']
  });

  toggleSearch() {
    this.isSearchOpen.set(!this.isSearchOpen());
    if (this.isSearchOpen()) {
      setTimeout(() => this.searchInput.nativeElement.focus(), 50);
    }
  }

  closeSearch() {
    setTimeout(() => {
      this.isSearchOpen.set(false);
    }, 200);
  }

  openQuickAdd(type: 'lead' | 'task' = 'lead') {
    this.quickAddTab.set(type);
    this.isQuickAddOpen.set(true);
  }

  closeQuickAdd() {
    this.isQuickAddOpen.set(false);
    this.leadForm.reset({
      name: '',
      email: '',
      value: 25000,
      status: 'New',
      source: 'Inbound Website',
      priority: 'High'
    });
    this.taskForm.reset({
      title: '',
      category: 'SDR Follow-up',
      priority: 'High',
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      description: ''
    });
  }

  closeQuickAddOnBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeQuickAdd();
    }
  }

  async submitLead() {
    if (this.leadForm.invalid) return;
    this.isSubmitting.set(true);
    try {
      const val = this.leadForm.value;
      await this.leadService.createLead({
        name: val.name,
        email: val.email,
        value: Number(val.value) || 0,
        status: val.status,
        source: val.source,
        priority: val.priority,
        industry: 'Software / Technology',
        expectedCloseDate: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10)
      });

      this.appwrite.addNotification({
        title: 'Lead Created',
        message: `Successfully created lead record for "${val.name}".`,
        type: 'success'
      });

      this.closeQuickAdd();
    } catch (e: unknown) {
      const err = e as Error;
      this.appwrite.addNotification({
        title: 'Failed to create lead',
        message: err.message || 'Error occurred while saving lead',
        type: 'warning'
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async submitTask() {
    if (this.taskForm.invalid) return;
    this.isSubmitting.set(true);
    try {
      const val = this.taskForm.value;
      await this.appwrite.addTask({
        title: val.title,
        category: val.category,
        priority: val.priority,
        dueDate: val.dueDate,
        description: val.description,
        status: 'Pending'
      });

      this.appwrite.addNotification({
        title: 'Task Created',
        message: `Task "${val.title}" added to active queue.`,
        type: 'success'
      });

      this.closeQuickAdd();
    } catch (e: unknown) {
      const err = e as Error;
      this.appwrite.addNotification({
        title: 'Failed to create task',
        message: err.message || 'Error occurred while creating task',
        type: 'warning'
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
