import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { SidebarComponent } from './sidebar.component';
import { DockComponent } from './dock.component';
import { RouterOutlet } from '@angular/router';
import { client } from '../lib/appwrite';
import { Appwrite } from './appwrite';
import { MatIconModule } from '@angular/material/icon';
import { NotificationsDrawerComponent } from './notifications-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SidebarComponent, DockComponent, RouterOutlet, MatIconModule, NotificationsDrawerComponent],
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

      <!-- Main Layout Elements -->
      <app-sidebar class="w-[260px] flex-shrink-0 border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-2xl z-20 hidden lg:block shadow-[4px_0_24px_rgba(0,0,0,0.5)] relative" />
      
      <main class="flex-1 flex flex-col overflow-hidden relative bg-transparent z-10">
        <!-- Top Persistent Header Bar with Brand Identity and Notification Bell -->
        <header class="h-16 border-b border-zinc-800/60 bg-zinc-950/40 backdrop-blur-md flex items-center justify-between px-6 z-30 select-none flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="font-logo text-lg tracking-tighter text-white flex items-center leading-none lg:hidden">
              <span class="font-light">ΛΞV</span>
              <span class="font-bold text-teal-400">OS</span>
            </div>
            <div class="font-display font-medium text-[10px] tracking-widest text-[#20B2AA]/80 uppercase hidden lg:block">
              Laevos Intelligent CRM Sentinel
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <!-- Connection Indicator -->
            <div class="flex items-center gap-1.5 px-3 py-1 bg-teal-500/5 border border-teal-500/10 rounded-full text-[9px] font-mono text-[#3EB991]">
              <span class="w-1.5 h-1.5 rounded-full bg-[#3EB991] animate-pulse"></span>
              <span>SENTINEL CORE ONLINE</span>
            </div>

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
          <div class="p-4 sm:p-6 md:p-8 lg:p-10 relative z-10 w-full min-h-full pb-32">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>
      
      <app-dock class="z-20" />

      <!-- Slide-out Sentinel Overlay Drawer Component -->
      <app-notifications-drawer 
        [isOpen]="isNotificationDrawerOpen()" 
        (drawerClose)="isNotificationDrawerOpen.set(false)" />
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

  isNotificationDrawerOpen = signal<boolean>(false);

  unreadCount = computed(() => {
    return this.appwrite.notifications().filter(n => !n.isRead).length;
  });

  ngOnInit() {
    try {
      console.log("[ΛΞVOS App] Verifying Appwrite backend communication...");
      const clientObj = client as unknown as Record<string, unknown>;
      if (typeof clientObj['ping'] === 'function') {
        (clientObj['ping'] as () => void)();
      }
    } catch (e) {
      console.log("Auto-ping triggered asynchronously:", e);
    }
  }
}
