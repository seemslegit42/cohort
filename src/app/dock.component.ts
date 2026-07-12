import { Component, ChangeDetectionStrategy, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div class="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-50 items-center gap-2 p-2 bg-zinc-900/80 backdrop-blur-3xl border border-zinc-800/80 rounded-2xl shadow-2xl shadow-black/80 transition-all duration-300 hover:bg-zinc-900/90">
      
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
        <span class="absolute -top-12 scale-0 group-hover:scale-100 transition-transform origin-bottom font-medium bg-zinc-800 border border-zinc-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl shrink-0 whitespace-nowrap">Search</span>
      </button>

      <div class="w-px h-8 bg-zinc-800 mx-1"></div>
      
      <a routerLink="/" routerLinkActive="bg-zinc-800 text-teal-400" [routerLinkActiveOptions]="{exact: true}" class="group relative w-12 h-12 rounded-xl flex items-center justify-center hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white">
        <mat-icon>space_dashboard</mat-icon>
        <span class="absolute -top-12 scale-0 group-hover:scale-100 transition-transform origin-bottom font-medium bg-zinc-800 border border-zinc-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl shrink-0 whitespace-nowrap pointer-events-none">Dashboard</span>
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
  `
})
export class DockComponent {
  isSearchOpen = signal(false);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  toggleSearch() {
    this.isSearchOpen.set(!this.isSearchOpen());
    if (this.isSearchOpen()) {
      setTimeout(() => this.searchInput.nativeElement.focus(), 50);
    }
  }

  closeSearch() {
    // slight delay to allow typing
    setTimeout(() => {
        this.isSearchOpen.set(false);
    }, 200);
  }
}
