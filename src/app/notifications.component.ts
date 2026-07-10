import { Component } from '@angular/core';

@Component({
  selector: 'app-notifications',
  standalone: true,
  template: `
    <div class="max-w-[1400px] mx-auto animate-fade-in">
      <h1 class="text-2xl font-bold text-white font-display tracking-tight mb-6">Notifications</h1>
      <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div class="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-4 border border-zinc-700/50">
          <span class="material-icons text-3xl text-zinc-500">notifications_none</span>
        </div>
        <h3 class="text-lg font-medium text-white mb-2">You're all caught up!</h3>
        <p class="text-zinc-500 text-sm max-w-sm">No new notifications to show right now. We'll alert you when something needs your attention.</p>
      </div>
    </div>
  `
})
export class NotificationsComponent {}
