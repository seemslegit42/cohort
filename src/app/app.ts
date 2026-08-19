import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { SidebarComponent } from './sidebar.component';
import { DockComponent } from './dock.component';
import { RouterOutlet, Router } from '@angular/router';
import { Appwrite } from './appwrite';
import { LeadService } from './lead.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationsDrawerComponent } from './notifications-drawer.component';
import { AICopilotDrawerComponent } from './ai-copilot-drawer.component';
import { CommandPaletteComponent } from './command-palette.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SidebarComponent, 
    DockComponent, 
    RouterOutlet, 
    MatIconModule, 
    FormsModule, 
    CommonModule,
    NotificationsDrawerComponent, 
    AICopilotDrawerComponent,
    CommandPaletteComponent
  ],
  template: `
    <div class="flex h-screen w-full bg-[#07070a] text-zinc-100 font-sans overflow-hidden selection:bg-teal-500/30 selection:text-teal-200 relative">
      <!-- The Breathing Canvas: Iridescent Aurora Background (Purple, Green, Aqua Triad) -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#07070a]">
        <!-- Purple Orb -->
        <div class="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full bg-purple-500/10 blur-[130px] animate-aurora-1 mix-blend-screen"></div>
        <!-- Green Orb -->
        <div class="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] rounded-full bg-emerald-500/8 blur-[120px] animate-aurora-2 mix-blend-screen"></div>
        <!-- Aqua/Teal Orb -->
        <div class="absolute top-[30%] left-[20%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full bg-cyan-500/8 blur-[140px] animate-aurora-3 mix-blend-screen"></div>
        
        <!-- Subtle pulsing center ambient overlay -->
        <div class="absolute top-[20%] left-[40%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-indigo-600/5 blur-[160px] animate-pulse-pulse mix-blend-screen"></div>
      </div>

      <!-- Mobile Sidebar Overlay -->
      @if (isSidebarOpen()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" (click)="isSidebarOpen.set(false)" (keydown.enter)="isSidebarOpen.set(false)" tabindex="0" role="button"></div>
      }

      <!-- Main Layout Elements -->
      <app-sidebar class="w-[260px] flex-shrink-0 border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-2xl z-40 lg:z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)] absolute lg:relative h-full transition-transform duration-300 left-0 top-0"
                   [class.-translate-x-full]="!isSidebarOpen()"
                   [class.translate-x-0]="isSidebarOpen()"
                   [class.lg:translate-x-0]="true"
                   (menuClick)="isSidebarOpen.set(false)" />
      
      <main class="flex-1 flex flex-col overflow-hidden relative bg-transparent z-10 w-full">
        <!-- Top Persistent Header Bar with Brand Identity, Omnisearch & Sentinel Telemetry -->
        <header class="h-14 sm:h-16 border-b border-zinc-800/70 bg-zinc-950/75 backdrop-blur-2xl flex items-center justify-between px-3 sm:px-4 lg:px-6 z-30 select-none shrink-0 transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          
          <!-- Left Zone: Mobile Sidebar Trigger & Brand Identifier -->
          <div class="flex items-center gap-2 sm:gap-3 shrink-0">
            <button 
              type="button"
              class="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800/90 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400" 
              (click)="isSidebarOpen.set(true)"
              aria-label="Open Navigation Drawer">
              <mat-icon class="text-[20px] sm:text-[22px]">menu</mat-icon>
            </button>

            <!-- Brand Wordmark (Mobile & Desktop) -->
            <div class="flex items-center gap-2">
              <div class="font-logo text-base sm:text-lg tracking-tighter text-white flex items-center leading-none">
                <span class="font-light tracking-wide text-zinc-300">ΛΞV</span>
                <span class="font-bold text-teal-400">OS</span>
              </div>

              <!-- Desktop Environment / Tenant Indicator -->
              <div class="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[10px] font-mono text-teal-300 font-semibold tracking-wider uppercase">
                <span class="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                <span>CRM Sentinel</span>
              </div>
            </div>
          </div>

          <!-- Middle Zone: Global Omnisearch / Command Palette Trigger -->
          <div class="flex-1 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl mx-2 sm:mx-4">
            <button 
              type="button"
              (click)="isCommandPaletteOpen.set(true)"
              class="w-full bg-zinc-900/70 hover:bg-zinc-900/95 border border-zinc-800/90 hover:border-teal-500/50 rounded-xl py-1.5 sm:py-2 px-2.5 sm:px-3.5 text-left text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 transition-all backdrop-blur-md flex items-center justify-between group cursor-pointer shadow-inner">
              <span class="flex items-center gap-2 sm:gap-2.5 text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">
                <mat-icon class="text-zinc-500 text-[17px] sm:text-[19px] group-hover:text-teal-400 transition-colors shrink-0">search</mat-icon>
                <span class="text-xs font-medium truncate">
                  <span class="hidden md:inline">Quick search or command...</span>
                  <span class="hidden sm:inline md:hidden">Search leads, tasks...</span>
                  <span class="inline sm:hidden">Search...</span>
                </span>
              </span>
              <div class="flex items-center gap-1 shrink-0 ml-1.5">
                <kbd class="hidden sm:inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold text-zinc-400 bg-zinc-800/90 border border-zinc-700/70 rounded-md group-hover:border-teal-500/40 group-hover:text-teal-300 transition-colors">
                  <span class="text-[10px]">⌘</span>K
                </kbd>
                <span class="sm:hidden text-zinc-600 group-hover:text-teal-400">
                  <mat-icon class="text-[15px]">keyboard_return</mat-icon>
                </span>
              </div>
            </button>
          </div>
          
          <!-- Right Zone: Realtime Sentinel Telemetry & Action Controls -->
          <div class="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
            
            <!-- Realtime Telemetry Status Pill (Responsive) -->
            <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 rounded-full text-[10px] font-mono text-emerald-400">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="hidden lg:inline font-semibold">CORE ONLINE</span>
              <span class="lg:hidden font-semibold">SYNC</span>
            </div>

            <!-- AI Copilot Trigger Button -->
            <button 
              type="button"
              (click)="isAICopilotOpen.set(true)"
              class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/40 hover:border-purple-400 flex items-center justify-center transition-all text-purple-300 hover:text-white cursor-pointer group shadow-[0_0_12px_rgba(168,85,247,0.2)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              title="Open AI Sentinel Copilot"
              aria-label="Open AI Copilot Drawer">
              <mat-icon class="text-[18px] sm:text-[20px] group-hover:scale-110 transition-transform text-purple-400">auto_awesome</mat-icon>
              <span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
            </button>

            <!-- Notifications Drawer Trigger Button -->
            <button 
              type="button"
              (click)="isNotificationDrawerOpen.set(true)"
              class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800/90 hover:border-zinc-700 flex items-center justify-center transition-all text-zinc-300 hover:text-white cursor-pointer group active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              title="View Sentinel Updates"
              aria-label="View notifications">
              <mat-icon class="text-[19px] sm:text-[21px] group-hover:rotate-12 transition-transform text-zinc-400 group-hover:text-zinc-200">notifications</mat-icon>
              @if (unreadCount() > 0) {
                <span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border-2 border-zinc-950 text-[9px] font-bold text-white flex items-center justify-center shadow-lg shadow-purple-500/40 animate-pulse">
                  {{ unreadCount() > 9 ? '9+' : unreadCount() }}
                </span>
              }
            </button>

          </div>
        </header>

        <!-- Main Scrollable Route-outlet container -->
        <div class="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <div class="p-3 sm:p-6 md:p-8 lg:p-10 relative z-10 w-full min-h-full pb-24 sm:pb-28 md:pb-32">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>
      
      <app-dock class="z-20" />

      <!-- Slide-out Sentinel Overlay Drawer Component -->
      <app-notifications-drawer 
        [isOpen]="isNotificationDrawerOpen()" 
        (drawerClose)="isNotificationDrawerOpen.set(false)" />

      <!-- AI Sentinel Copilot Drawer Component -->
      <app-ai-copilot-drawer 
        [isOpen]="isAICopilotOpen()" 
        (drawerClose)="isAICopilotOpen.set(false)" />

      <!-- Global Command Palette Component -->
      <app-command-palette 
        [isOpen]="isCommandPaletteOpen()" 
        (paletteClose)="isCommandPaletteOpen.set(!isCommandPaletteOpen())"
        (openCopilot)="isAICopilotOpen.set(true); isCommandPaletteOpen.set(false)"
        (openNotifications)="isNotificationDrawerOpen.set(true); isCommandPaletteOpen.set(false)" />
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 6px; }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #3f3f46; }
  `]
})
export class App implements OnInit {
  appwrite = inject(Appwrite);
  leadService = inject(LeadService);
  router = inject(Router);

  isSidebarOpen = signal<boolean>(false);
  isNotificationDrawerOpen = signal<boolean>(false);
  isAICopilotOpen = signal<boolean>(false);
  isCommandPaletteOpen = signal<boolean>(false);
  
  searchTerm = signal<string>('');
  isSearchFocused = signal<boolean>(false);

  unreadCount = computed(() => {
    return this.appwrite.notifications().filter(n => !n.isRead).length;
  });

  searchResults = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (term.length < 2) return [];

    interface SearchResult {
      id: string;
      type: string;
      title: string;
      description: string;
      icon: string;
      iconBg: string;
      iconColor: string;
      route: string | null;
      meta: string;
    }

    const results: SearchResult[] = [];

    // Search Leads
    this.leadService.leads().forEach(lead => {
      if (lead.name.toLowerCase().includes(term) || lead.email.toLowerCase().includes(term)) {
        results.push({
          id: lead.$id || '',
          type: 'Lead',
          title: lead.name,
          description: lead.email,
          icon: 'person',
          iconBg: 'bg-teal-500/10',
          iconColor: 'text-teal-400',
          route: '/leads',
          meta: lead.status
        });
      }
    });

    // Search Tasks
    this.appwrite.tasks().forEach(task => {
      if (task.title.toLowerCase().includes(term)) {
        results.push({
          id: task.$id,
          type: 'Task',
          title: task.title,
          description: task.category,
          icon: 'task_alt',
          iconBg: 'bg-purple-500/10',
          iconColor: 'text-purple-400',
          route: '/tasks',
          meta: task.status
        });
      }
    });

    // Search Notifications (Activity)
    this.appwrite.notifications().forEach(n => {
      if (n.title.toLowerCase().includes(term) || n.message.toLowerCase().includes(term)) {
        results.push({
          id: n.$id,
          type: 'Activity',
          title: n.title,
          description: n.message,
          icon: 'notifications',
          iconBg: 'bg-zinc-500/10',
          iconColor: 'text-zinc-400',
          route: null,
          meta: 'Update'
        });
      }
    });

    return results.slice(0, 10);
  });

  navigateToResult(result: { id: string; type: string; route: string | null }) {
    this.searchTerm.set('');
    this.isSearchFocused.set(false);
    if (result.route) {
      this.router.navigate([result.route]);
    } else if (result.type === 'Activity') {
      this.isNotificationDrawerOpen.set(true);
    }
  }

  ngOnInit() {
    this.leadService.loadLeads();
  }
}
