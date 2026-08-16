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
        <!-- Top Persistent Header Bar with Brand Identity and Notification Bell -->
        <header class="h-16 border-b border-zinc-800/60 bg-zinc-950/40 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 z-30 select-none flex-shrink-0">
          <div class="flex items-center gap-3 lg:w-[260px]">
            <button class="lg:hidden w-10 h-10 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white" (click)="isSidebarOpen.set(true)">
              <mat-icon>menu</mat-icon>
            </button>
            <div class="font-logo text-lg tracking-tighter text-white flex items-center leading-none lg:hidden">
              <span class="font-light">ΛΞV</span>
              <span class="font-bold text-teal-400">OS</span>
            </div>
            <div class="font-display font-medium text-[10px] tracking-widest text-[#20B2AA]/80 uppercase hidden lg:block">
              Laevos CRM Sentinel
            </div>
          </div>

          <!-- Global Search / Command Palette Trigger Bar -->
          <div class="flex-1 max-w-xl px-2 sm:px-4 relative">
            <button 
              (click)="isCommandPaletteOpen.set(true)"
              class="w-full bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/90 hover:border-teal-500/40 rounded-xl py-2 px-3 text-left text-sm text-zinc-400 focus:outline-none transition-all backdrop-blur-md flex items-center justify-between group cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(45,212,191,0.08)]">
              <span class="flex items-center gap-2.5 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                <mat-icon class="text-zinc-500 text-sm group-hover:text-teal-400 transition-colors">search</mat-icon>
                <span class="text-xs font-medium">Search or type a command...</span>
              </span>
              <div class="flex items-center gap-1">
                <kbd class="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 rounded-md shadow-xs group-hover:border-teal-500/40 group-hover:text-teal-300 transition-colors">
                  <span class="text-[10px]">⌘</span>K
                </kbd>
              </div>
            </button>
          </div>
          
          <div class="flex items-center gap-4 lg:w-[260px] justify-end">
            <!-- Connection Indicator -->
            <div class="flex items-center gap-1.5 px-3 py-1 bg-teal-500/5 border border-teal-500/10 rounded-full text-[9px] font-mono text-[#3EB991] hidden sm:flex">
              <span class="w-1.5 h-1.5 rounded-full bg-[#3EB991] animate-pulse"></span>
              <span>SENTINEL CORE ONLINE</span>
            </div>

            <!-- AI Copilot Button -->
            <button 
              (click)="isAICopilotOpen.set(true)"
              class="relative w-10 h-10 rounded-xl bg-purple-550/10 hover:bg-purple-900/20 border border-purple-500/35 hover:border-purple-400 flex items-center justify-center transition-all text-purple-400 hover:text-white cursor-pointer group shadow-[0_0_12px_rgba(168,85,247,0.15)]"
              title="Open AI Sentinel Copilot">
              <mat-icon class="text-[20px] animate-pulse">auto_awesome</mat-icon>
            </button>

            <!-- Bell Icon Button -->
            <button 
              (click)="isNotificationDrawerOpen.set(true)"
              class="relative w-10 h-10 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center transition-all text-zinc-300 hover:text-white cursor-pointer group"
              title="View Sentinel Updates">
              <mat-icon class="text-[20px] group-hover:rotate-12 transition-transform">notifications</mat-icon>
              @if (unreadCount() > 0) {
                <span class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#6A0DAD] border border-zinc-900 text-[10px] font-bold text-[#F5FFFA] flex items-center justify-center shadow-lg shadow-purple-500/30 animate-bounce">
                  {{ unreadCount() }}
                </span>
              }
            </button>
          </div>
        </header>

        <!-- Main Scrollable Route-outlet container -->
        <div class="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          <div class="p-4 sm:p-6 md:p-8 lg:p-10 relative z-10 w-full min-h-full pb-10 md:pb-32">
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
