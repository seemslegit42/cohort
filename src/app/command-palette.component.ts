import { Component, ChangeDetectionStrategy, signal, computed, inject, ElementRef, ViewChild, HostListener, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { LeadService } from './lead.service';
import { Appwrite } from './appwrite';

export interface CommandItem {
  id: string;
  category: 'Actions' | 'Navigation' | 'Search Results';
  title: string;
  subtitle?: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  shortcut?: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    @if (isOpen()) {
      <div 
        class="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-start justify-center pt-[8vh] sm:pt-[12vh] p-4 animate-fade-in select-none"
        (click)="close()"
        (keydown.escape)="close()"
        tabindex="0"
        role="dialog"
        aria-modal="true"
        aria-label="CRM Command Palette">
        
        <div 
          class="bg-zinc-950/95 border border-zinc-800/90 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-zinc-100 flex flex-col max-h-[75vh] relative animate-scale-up"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
          tabindex="-1">
          
          <!-- Subtle top gradient bar -->
          <div class="h-1 w-full bg-gradient-to-r from-teal-500 via-purple-500 to-emerald-500"></div>

          <!-- Input Header -->
          <div class="p-4 border-b border-zinc-800/80 flex items-center gap-3 bg-zinc-900/50">
            <div class="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
              <mat-icon class="text-teal-400 text-lg">terminal</mat-icon>
            </div>
            
            <input 
              #commandInput
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="selectedIndex.set(0)"
              placeholder="Type a command or search leads, tasks, actions..." 
              class="w-full bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none font-medium"
            />

            @if (searchQuery()) {
              <button 
                (click)="searchQuery.set(''); selectedIndex.set(0)" 
                class="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            }

            <span class="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md">
              ESC
            </span>
          </div>

          <!-- List Content -->
          <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
            
            @if (filteredItems().length === 0) {
              <div class="p-12 text-center flex flex-col items-center justify-center">
                <div class="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                  <mat-icon class="text-zinc-600 text-2xl">search_off</mat-icon>
                </div>
                <p class="text-zinc-400 text-sm font-semibold">No commands or records found</p>
                <p class="text-zinc-600 text-xs mt-1">Try searching for "lead", "meeting", "task", or "dashboard"</p>
              </div>
            } @else {
              
              <!-- Render Categories -->
              @for (category of categories(); track category) {
                @let itemsInCategory = getItemsByCategory(category);
                @if (itemsInCategory.length > 0) {
                  <div>
                    <div class="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      @if (category === 'Actions') {
                        <mat-icon class="text-teal-400 text-[14px]">bolt</mat-icon>
                      } @else if (category === 'Navigation') {
                        <mat-icon class="text-purple-400 text-[14px]">explore</mat-icon>
                      } @else {
                        <mat-icon class="text-emerald-400 text-[14px]">search</mat-icon>
                      }
                      {{ category }}
                    </div>

                    <div class="space-y-0.5 mt-1">
                      @for (item of itemsInCategory; track item.id; let idx = $index) {
                        @let globalIndex = getGlobalIndex(item);
                        <button 
                          (click)="executeCommand(item)"
                          (mouseenter)="selectedIndex.set(globalIndex)"
                          [ngClass]="selectedIndex() === globalIndex ? 'bg-teal-500/10 border-teal-500/30 text-white' : 'border-transparent'"
                          class="w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer">
                          
                          <div class="flex items-center gap-3 min-w-0">
                            <div [class]="item.iconBg + ' w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5'">
                              <mat-icon [class]="item.iconColor + ' text-[18px]'">{{ item.icon }}</mat-icon>
                            </div>
                            <div class="min-w-0">
                              <div class="text-xs font-semibold text-zinc-200 group-hover:text-white flex items-center gap-2">
                                <span>{{ item.title }}</span>
                              </div>
                              @if (item.subtitle) {
                                <div class="text-[11px] text-zinc-500 truncate mt-0.5">{{ item.subtitle }}</div>
                              }
                            </div>
                          </div>

                          <div class="flex items-center gap-2 shrink-0">
                            @if (item.shortcut) {
                              <span class="px-2 py-0.5 text-[9px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md">
                                {{ item.shortcut }}
                              </span>
                            }
                            <mat-icon 
                              [class.opacity-100]="selectedIndex() === globalIndex"
                              class="text-teal-400 text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">
                              subdirectory_arrow_left
                            </mat-icon>
                          </div>
                        </button>
                      }
                    </div>
                  </div>
                }
              }
            }

          </div>

          <!-- Footer Shortcut Bar -->
          <div class="p-3 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-bold">↑</kbd>
                <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-bold">↓</kbd>
                <span>Navigate</span>
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-bold">↵</kbd>
                <span>Select</span>
              </span>
              <span class="flex items-center gap-1 hidden sm:inline-flex">
                <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-bold">⌘K</kbd>
                <span>Toggle</span>
              </span>
            </div>
            
            <div class="flex items-center gap-1.5 text-teal-400/80 text-[10px] font-bold">
              <span class="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              <span>ΛΞVOS COMMAND ENGINE</span>
            </div>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 5px; }
    .animate-scale-up {
      animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes scaleUp {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class CommandPaletteComponent {
  isOpen = input<boolean>(false);
  paletteClose = output<void>();
  openCopilot = output<void>();
  openNotifications = output<void>();

  @ViewChild('commandInput') commandInput?: ElementRef<HTMLInputElement>;

  router = inject(Router);
  leadService = inject(LeadService);
  appwrite = inject(Appwrite);

  searchQuery = signal<string>('');
  selectedIndex = signal<number>(0);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => {
          this.commandInput?.nativeElement?.focus();
        }, 50);
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Cmd+K or Ctrl+K toggle
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.isOpen()) {
        this.close();
      } else {
        this.paletteClose.emit(); // toggle state in parent
      }
      return;
    }

    // '/' key opens search when not typing in form controls
    if (event.key === '/' && !this.isOpen()) {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isEditable = document.activeElement?.getAttribute('contenteditable') === 'true';
      if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select' && !isEditable) {
        event.preventDefault();
        this.paletteClose.emit();
        return;
      }
    }

    if (!this.isOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    const items = this.filteredItems();
    if (items.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex.update(i => (i + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex.update(i => (i - 1 + items.length) % items.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selectedItem = items[this.selectedIndex()];
      if (selectedItem) {
        this.executeCommand(selectedItem);
      }
    }
  }

  // Pre-defined static actions and navigation options
  private staticActions = computed<CommandItem[]>(() => [
    {
      id: 'act-new-lead',
      category: 'Actions',
      title: 'Create New Lead / Prospect',
      subtitle: 'Initialize a new account in the pipeline',
      icon: 'person_add',
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-400',
      shortcut: 'Shift+L',
      action: () => {
        this.router.navigate(['/leads'], { queryParams: { action: 'create' } });
      }
    },
    {
      id: 'act-schedule-meeting',
      category: 'Actions',
      title: 'Schedule Discovery Call',
      subtitle: 'Open the Nextcloud/CalDAV booking calendar',
      icon: 'calendar_month',
      iconBg: 'bg-teal-500/10',
      iconColor: 'text-teal-400',
      shortcut: 'Shift+M',
      action: () => {
        this.router.navigate(['/scheduler']);
      }
    },
    {
      id: 'act-new-task',
      category: 'Actions',
      title: 'Log New Strategic Objective',
      subtitle: 'Add a task to the action items backlog',
      icon: 'add_task',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      shortcut: 'Shift+T',
      action: () => {
        this.router.navigate(['/tasks'], { queryParams: { action: 'create' } });
      }
    },
    {
      id: 'act-send-email',
      category: 'Actions',
      title: 'Compose & Send Email',
      subtitle: 'Send client follow-ups via email engine',
      icon: 'email',
      iconBg: 'bg-sky-500/10',
      iconColor: 'text-sky-400',
      action: () => {
        this.router.navigate(['/emails']);
      }
    },
    {
      id: 'act-ai-copilot',
      category: 'Actions',
      title: 'Launch AI Sentinel Copilot',
      subtitle: 'Query AI assistant for deal recommendations',
      icon: 'auto_awesome',
      iconBg: 'bg-purple-500/15',
      iconColor: 'text-purple-300',
      shortcut: 'Shift+A',
      action: () => {
        this.openCopilot.emit();
      }
    },
    {
      id: 'act-notifications',
      category: 'Actions',
      title: 'View Sentinel Updates & Activity',
      subtitle: 'Inspect real-time system notifications',
      icon: 'notifications',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      action: () => {
        this.openNotifications.emit();
      }
    },
    // Navigation Items
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      title: 'Go to Executive Dashboard',
      subtitle: 'Overview of total pipeline, ARR, and KPIs',
      icon: 'dashboard',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-zinc-300',
      action: () => { this.router.navigate(['/']); }
    },
    {
      id: 'nav-leads',
      category: 'Navigation',
      title: 'Go to Leads Pipeline',
      subtitle: 'Kanban board, list view, and prospect maps',
      icon: 'filter_alt',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-orange-400',
      action: () => { this.router.navigate(['/leads']); }
    },
    {
      id: 'nav-clients',
      category: 'Navigation',
      title: 'Go to Clients Directory',
      subtitle: 'Active customer accounts and ARR health',
      icon: 'groups',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-emerald-400',
      action: () => { this.router.navigate(['/clients']); }
    },
    {
      id: 'nav-forecast',
      category: 'Navigation',
      title: 'Go to Revenue Forecast',
      subtitle: 'Monte Carlo simulations and scenario projections',
      icon: 'insights',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-purple-400',
      action: () => { this.router.navigate(['/forecast']); }
    },
    {
      id: 'nav-automations',
      category: 'Navigation',
      title: 'Go to System Automations',
      subtitle: 'Trigger rules, webhook weblogs, and integrations',
      icon: 'precision_manufacturing',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-sky-400',
      action: () => { this.router.navigate(['/automations']); }
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      title: 'Go to CRM Settings',
      subtitle: 'Manage team access, API keys, and workspace options',
      icon: 'settings',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-zinc-400',
      action: () => { this.router.navigate(['/settings']); }
    }
  ]);

  // Combined item list with dynamic search query filtering
  filteredItems = computed<CommandItem[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const staticList = this.staticActions();

    if (!query) {
      return staticList;
    }

    // Filter static commands
    const matchedStatic = staticList.filter(item => 
      item.title.toLowerCase().includes(query) || 
      (item.subtitle && item.subtitle.toLowerCase().includes(query)) ||
      item.category.toLowerCase().includes(query)
    );

    // Dynamic Search Results from Leads
    const dynamicSearchResults: CommandItem[] = [];

    this.leadService.leads().forEach(lead => {
      if (lead.name.toLowerCase().includes(query) || lead.email.toLowerCase().includes(query) || (lead.industry && lead.industry.toLowerCase().includes(query))) {
        dynamicSearchResults.push({
          id: `lead-${lead.$id}`,
          category: 'Search Results',
          title: lead.name,
          subtitle: `${lead.email} • ${lead.status} • $${lead.value?.toLocaleString() || 0}`,
          icon: 'person',
          iconBg: 'bg-orange-500/10',
          iconColor: 'text-orange-400',
          action: () => {
            this.router.navigate(['/leads']);
          }
        });
      }
    });

    // Dynamic Search Results from Tasks
    this.appwrite.tasks().forEach(task => {
      if (task.title.toLowerCase().includes(query)) {
        dynamicSearchResults.push({
          id: `task-${task.$id}`,
          category: 'Search Results',
          title: task.title,
          subtitle: `Task Category: ${task.category} • Status: ${task.status}`,
          icon: 'task_alt',
          iconBg: 'bg-purple-500/10',
          iconColor: 'text-purple-400',
          action: () => {
            this.router.navigate(['/tasks']);
          }
        });
      }
    });

    return [...matchedStatic, ...dynamicSearchResults.slice(0, 5)];
  });

  categories = computed<('Actions' | 'Navigation' | 'Search Results')[]>(() => {
    const categoriesPresent = new Set(this.filteredItems().map(i => i.category));
    const order: ('Actions' | 'Navigation' | 'Search Results')[] = ['Actions', 'Navigation', 'Search Results'];
    return order.filter(c => categoriesPresent.has(c));
  });

  getItemsByCategory(category: 'Actions' | 'Navigation' | 'Search Results'): CommandItem[] {
    return this.filteredItems().filter(i => i.category === category);
  }

  getGlobalIndex(targetItem: CommandItem): number {
    return this.filteredItems().findIndex(i => i.id === targetItem.id);
  }

  executeCommand(item: CommandItem) {
    this.close();
    item.action();
  }

  close() {
    this.searchQuery.set('');
    this.selectedIndex.set(0);
    this.paletteClose.emit();
  }
}
