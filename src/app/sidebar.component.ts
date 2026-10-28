import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Appwrite } from './appwrite';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="flex flex-col h-full bg-zinc-950">
      <!-- Header -->
      <div class="p-6 flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/20">
          <mat-icon class="text-zinc-950 text-base font-bold">waves</mat-icon>
        </div>
        <div class="font-logo text-3xl tracking-tighter text-white flex items-center leading-none mt-1">
          <span class="font-light">ΛΞV</span>
          <span class="font-bold opacity-90 text-teal-400">OS</span>
        </div>
      </div>

      <!-- Search -->
      <div class="px-4 mb-6">
        <div class="relative group">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[20px] group-focus-within:text-teal-400 transition-colors">search</mat-icon>
          <input type="text" placeholder="Search anything" class="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium" />
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-3 space-y-1 pb-6 custom-scrollbar" (click)="onNavClick()" (keydown.enter)="onNavClick()" tabindex="0" role="navigation">
        <div class="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3 px-3 mt-4">Main</div>
        <a routerLink="/" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" [routerLinkActiveOptions]="{exact: true}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 text-teal-400">space_dashboard</mat-icon>
          <span class="font-medium text-sm">Dashboard</span>
        </a>
        <a routerLink="/notifications" class="flex items-center justify-between px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <div class="flex items-center gap-3">
            <mat-icon class="text-[20px] w-5 h-5">notifications</mat-icon>
            <span class="font-medium text-sm">Notifications</span>
          </div>
          <span class="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-semibold px-2 py-0.5 rounded-md">{{ appwrite.notifications().length || 12 }}</span>
        </a>
        <a routerLink="/tasks" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5">check_circle</mat-icon>
          <span class="font-medium text-sm">Tasks</span>
        </a>
        <a routerLink="/notes" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5">description</mat-icon>
          <span class="font-medium text-sm">Notes</span>
        </a>
        <a routerLink="/emails" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5">email</mat-icon>
          <span class="font-medium text-sm">Emails</span>
        </a>
        <a routerLink="/campaigns" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 text-indigo-400">campaign</mat-icon>
          <span class="font-medium text-sm">Campaigns</span>
        </a>
        <a routerLink="/calendar" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5">event</mat-icon>
          <span class="font-medium text-sm">Calendar</span>
        </a>
        <a routerLink="/deployment-checklist" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5">fact_check</mat-icon>
          <span class="font-medium text-sm">Deployment</span>
        </a>

        <div class="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3 px-3 mt-8">Revenue & Strategy</div>
        <a routerLink="/reverse-gauntlet" routerLinkActive="bg-purple-950/40 text-purple-200 shadow-sm border border-purple-500/40" class="flex items-center justify-between px-3 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all group">
          <div class="flex items-center gap-3">
            <mat-icon class="text-[20px] w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform">bolt</mat-icon>
            <span class="font-medium text-sm">Reverse Gauntlet (ADHD)</span>
          </div>
          <span class="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md animate-pulse">DO NOT CLICK</span>
        </a>
        <a routerLink="/sales-personality" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 text-teal-400">psychology_alt</mat-icon>
          <span class="font-medium text-sm">Sales Personality (BEEP)</span>
        </a>
        <a routerLink="/deal-rooms" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 text-purple-400">meeting_room</mat-icon>
          <span class="font-medium text-sm">Deal Rooms</span>
        </a>
        <a routerLink="/cadences" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 text-cyan-400">alt_route</mat-icon>
          <span class="font-medium text-sm">Email Sequences</span>
        </a>
        <a routerLink="/revops-simulator" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 text-emerald-400">query_stats</mat-icon>
          <span class="font-medium text-sm">RevOps Monte Carlo</span>
        </a>
        <a routerLink="/contracts" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 text-amber-400">gavel</mat-icon>
          <span class="font-medium text-sm">Legal & Contracts Vault</span>
        </a>

        <div class="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3 px-3 mt-8">Analytics & Performance</div>
        <a routerLink="/sales-performance" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 text-purple-400">insights</mat-icon>
          <span class="font-medium text-sm">Sales Performance</span>
        </a>
        <a routerLink="/reports" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5">bar_chart</mat-icon>
          <span class="font-medium text-sm">Reports</span>
        </a>
        <a routerLink="/lead-scoring" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 text-purple-400">psychology</mat-icon>
          <span class="font-medium text-sm">AI Lead Scoring</span>
        </a>
        <a routerLink="/forecast" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 text-purple-400">troubleshoot</mat-icon>
          <span class="font-medium text-sm">AI Forecast</span>
        </a>
        <a routerLink="/pipeline-signals" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 text-purple-400">satellite_alt</mat-icon>
          <span class="font-medium text-sm">Pipeline Signals</span>
        </a>
        <a routerLink="/automations" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5">auto_awesome</mat-icon>
          <span class="font-medium text-sm">Automations</span>
        </a>
        <a routerLink="/workflows" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5">account_tree</mat-icon>
          <span class="font-medium text-sm">Workflows</span>
        </a>
        <a routerLink="/email-workflows" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 text-teal-400">mark_email_unread</mat-icon>
          <span class="font-medium text-sm">Email Workflows</span>
        </a>
        <a routerLink="/newsletter" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 text-purple-400">mark_email_read</mat-icon>
          <span class="font-medium text-sm">Newsletter</span>
        </a>

        <div class="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3 px-3 mt-8">Records</div>
        <a routerLink="/clients" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 flex items-center justify-center bg-blue-500/20 text-blue-400 p-0.5 rounded">business</mat-icon>
          <span class="font-medium text-sm">Clients</span>
        </a>
        <a routerLink="/leads" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 flex items-center justify-center bg-amber-500/20 text-amber-400 p-0.5 rounded">group_add</mat-icon>
          <span class="font-medium text-sm">Leads Pipeline</span>
        </a>
        <a routerLink="/territory-map" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 flex items-center justify-center bg-emerald-500/20 text-emerald-400 p-0.5 rounded">map</mat-icon>
          <span class="font-medium text-sm">Territory Map</span>
        </a>
        <a routerLink="/contacts" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 flex items-center justify-center bg-teal-500/20 text-teal-400 p-0.5 rounded">people</mat-icon>
          <span class="font-medium text-sm">Contacts</span>
        </a>

        <div class="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3 px-3 mt-8">Systems & Integrations</div>
        <a routerLink="/mcp-server" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center justify-between px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <div class="flex items-center gap-3">
            <mat-icon class="text-[20px] w-5 h-5 flex items-center justify-center bg-teal-500/20 text-teal-300 p-0.5 rounded">hub</mat-icon>
            <span class="font-medium text-sm">MCP Server</span>
          </div>
          <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">v1.0</span>
        </a>
        <a routerLink="/systems" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 flex items-center justify-center bg-teal-500/20 text-teal-400 p-0.5 rounded">dns</mat-icon>
          <span class="font-medium text-sm">Systems Hub</span>
        </a>
        <a routerLink="/settings" routerLinkActive="bg-zinc-900/60 text-white shadow-sm border border-zinc-800" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
          <mat-icon class="text-[20px] w-5 h-5 flex items-center justify-center bg-zinc-600/20 text-zinc-400 p-0.5 rounded">settings</mat-icon>
          <span class="font-medium text-sm">Appwrite Config</span>
        </a>
      </nav>
      
      <!-- User Profile / Settings -->
      <div class="p-4 mt-auto border-t border-zinc-900 flex flex-col gap-3">
        <!-- Brand Signature (Mandatory Instrument) -->
        <div class="px-2 select-none pointer-events-none opacity-40" style="mix-blend-mode: overlay;">
          <div class="font-logo font-bold text-[10px] text-[#F5FFFA] tracking-normal leading-tight">ΛΞV Inc</div>
          <div class="font-sans font-light text-[8px] text-zinc-400 tracking-[0.2em] uppercase leading-none mt-1">The Future Needs Context</div>
          <div class="font-sans font-light text-[7px] text-zinc-500 tracking-[0.1em] mt-0.5">Innovate, Automate, Dominate</div>
        </div>

        <a routerLink="/settings" class="flex items-center gap-3 px-2 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group">
          <img src="https://api.dicebear.com/7.x/notionists/svg?seed={{ appwrite.currentUser()?.name || 'Admin' }}" alt="User" class="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 group-hover:border-teal-500/50 transition-colors" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ appwrite.currentUser()?.name || 'Ahmed Ali' }}</p>
            <p class="text-xs text-zinc-500 truncate">{{ appwrite.currentUser()?.email || 'ahmed@laevos.io' }}</p>
          </div>
          <mat-icon class="text-zinc-600 group-hover:text-zinc-400">unfold_more</mat-icon>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #3f3f46; }
  `]
})
export class SidebarComponent {
  appwrite = inject(Appwrite);
  menuClick = output<void>();

  onNavClick() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Safe fallback
      }
    }
    this.menuClick.emit();
  }
}
