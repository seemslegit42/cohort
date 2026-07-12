import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="max-w-[1400px] mx-auto space-y-6 animate-fade-in p-6">
      
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-4">
        <div>
          <h1 class="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <mat-icon class="text-teal-400 text-[28px]">event</mat-icon>
            Sales Calendar
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Manage your sales meetings, demos, and follow-ups. CalDAV integration supports ownCloud and Nextcloud.
          </p>
        </div>

        <div class="flex gap-3">
          <button (click)="openSettings()" class="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
            <mat-icon class="text-sm">cloud_sync</mat-icon>
            CalDAV Settings
          </button>
          <button (click)="openAddEvent()" class="bg-teal-500 hover:bg-teal-400 text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-teal-500/10 flex items-center gap-2">
            <mat-icon class="text-sm">add</mat-icon>
            Add Event
          </button>
        </div>
      </header>

      <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 overflow-hidden">
        
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-display font-bold text-white">Upcoming Activities</h2>
          <div class="flex gap-2">
            <button class="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <mat-icon class="text-sm">chevron_left</mat-icon>
            </button>
            <button class="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <mat-icon class="text-sm">chevron_right</mat-icon>
            </button>
          </div>
        </div>

        <div class="space-y-4">
          @for (event of events(); track event.id) {
            <div class="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl flex items-start sm:items-center gap-4 flex-col sm:flex-row hover:bg-zinc-900/60 transition-colors cursor-pointer">
              <div class="w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/20 flex flex-col items-center justify-center flex-shrink-0">
                <span class="text-[10px] text-teal-400 font-bold uppercase">{{ event.month }}</span>
                <span class="text-sm font-display font-bold text-white">{{ event.day }}</span>
              </div>
              
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-bold text-white truncate">{{ event.title }}</h3>
                <p class="text-xs text-zinc-400 truncate mt-1 flex items-center gap-1.5">
                  <mat-icon class="text-[14px]">schedule</mat-icon> {{ event.time }}
                  <span class="mx-1">&bull;</span>
                  <mat-icon class="text-[14px]">group</mat-icon> {{ event.contact }}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border"
                      [ngClass]="getTypeClasses(event.type)">
                  {{ event.type }}
                </span>
              </div>
            </div>
          } @empty {
            <div class="text-center py-12">
              <mat-icon class="text-zinc-600 text-4xl mb-3">event_busy</mat-icon>
              <h3 class="text-sm font-bold text-zinc-400">No upcoming events</h3>
              <p class="text-xs text-zinc-500 mt-1">Add an event or connect your CalDAV server.</p>
            </div>
          }
        </div>
      </div>

      <!-- Settings Modal (Overlay) -->
      @if (showSettings()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-fade-in shadow-2xl shadow-black">
            <div class="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <mat-icon class="text-teal-400 text-sm">cloud_sync</mat-icon>
                CalDAV Integration (Nextcloud/ownCloud)
              </h3>
              <button (click)="closeSettings()" class="text-zinc-500 hover:text-white transition-colors">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            
            <div class="p-5 space-y-4">
              <div class="space-y-1">
                <label for="settings-server-url" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Server URL</label>
                <input id="settings-server-url" type="text" [(ngModel)]="serverUrl" placeholder="https://cloud.example.com/remote.php/dav/" 
                       class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/40" />
              </div>
              <div class="space-y-1">
                <label for="settings-username" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Username</label>
                <input id="settings-username" type="text" [(ngModel)]="username" placeholder="user@example.com" 
                       class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/40" />
              </div>
              <div class="space-y-1">
                <label for="settings-password" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">App Password</label>
                <input id="settings-password" type="password" [(ngModel)]="password" placeholder="••••••••••••" 
                       class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/40" />
              </div>
            </div>

            <div class="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3">
              <button (click)="closeSettings()" class="px-4 py-2 bg-transparent text-zinc-400 hover:text-white text-xs font-bold transition-colors">
                Cancel
              </button>
              <button (click)="saveSettings()" class="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-md">
                Connect Server
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Add Event Modal (Overlay) -->
      @if (showAddEvent()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-fade-in shadow-2xl shadow-black">
            <div class="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <mat-icon class="text-teal-400 text-sm">event_note</mat-icon>
                Schedule New Event
              </h3>
              <button (click)="closeAddEvent()" class="text-zinc-500 hover:text-white transition-colors">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            
            <div class="p-5 space-y-4">
              <div class="space-y-1">
                <label for="add-event-title" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Event Title</label>
                <input id="add-event-title" type="text" [(ngModel)]="newEventTitle" placeholder="Discovery Call" 
                       class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/40" />
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label for="add-event-date" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date</label>
                  <input id="add-event-date" type="date" [(ngModel)]="newEventDate" 
                         class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/40 [color-scheme:dark]" />
                </div>
                <div class="space-y-1">
                  <label for="add-event-time" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Time</label>
                  <input id="add-event-time" type="time" [(ngModel)]="newEventTime" 
                         class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/40 [color-scheme:dark]" />
                </div>
              </div>

              <div class="space-y-1">
                <label for="add-event-contact" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Related Contact</label>
                <input id="add-event-contact" type="text" [(ngModel)]="newEventContact" placeholder="Client Name or Company" 
                       class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/40" />
              </div>

              <div class="space-y-1">
                <label for="add-event-type" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Event Type</label>
                <select id="add-event-type" [(ngModel)]="newEventType" 
                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-teal-500/40">
                  <option value="Demo">Product Demo</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Follow-Up">Follow-Up</option>
                </select>
              </div>
            </div>

            <div class="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3">
              <button (click)="closeAddEvent()" class="px-4 py-2 bg-transparent text-zinc-400 hover:text-white text-xs font-bold transition-colors">
                Cancel
              </button>
              <button (click)="saveEvent()" class="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-md">
                Schedule Event
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CalendarComponent {
  events = signal([
    { id: '1', title: 'Enterprise SLA Negotiation', month: 'Jul', day: '15', time: '10:00 AM', contact: 'Microsoft Corp', type: 'Meeting' },
    { id: '2', title: 'Q3 Product Demo', month: 'Jul', day: '18', time: '2:30 PM', contact: 'Salesforce Inc', type: 'Demo' },
    { id: '3', title: 'Contract Renewal Sync', month: 'Jul', day: '21', time: '11:15 AM', contact: 'Acme Corp', type: 'Follow-Up' }
  ]);

  showSettings = signal(false);
  serverUrl = '';
  username = '';
  password = '';

  showAddEvent = signal(false);
  newEventTitle = '';
  newEventDate = '';
  newEventTime = '';
  newEventContact = '';
  newEventType = 'Meeting';

  getTypeClasses(type: string): string {
    switch (type) {
      case 'Demo': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Follow-Up': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Meeting':
      default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  }

  openSettings() {
    this.showSettings.set(true);
  }

  closeSettings() {
    this.showSettings.set(false);
  }

  saveSettings() {
    // Mock CalDAV sync
    setTimeout(() => {
      alert('Successfully connected to CalDAV server. Events are syncing.');
      this.closeSettings();
    }, 800);
  }

  openAddEvent() {
    const today = new Date();
    this.newEventDate = today.toISOString().split('T')[0];
    this.newEventTime = '12:00';
    this.newEventTitle = '';
    this.newEventContact = '';
    this.newEventType = 'Meeting';
    this.showAddEvent.set(true);
  }

  closeAddEvent() {
    this.showAddEvent.set(false);
  }

  saveEvent() {
    if (!this.newEventTitle || !this.newEventDate) {
      alert('Please fill out the event title and date.');
      return;
    }

    const dateObj = new Date(this.newEventDate);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Convert 24h to 12h AM/PM if provided
    let timeFormatted = this.newEventTime;
    if (this.newEventTime) {
      const [hours, minutes] = this.newEventTime.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      timeFormatted = `${h12}:${minutes} ${ampm}`;
    }

    const newEvent = {
      id: Date.now().toString(),
      title: this.newEventTitle,
      month: months[dateObj.getMonth()],
      day: (dateObj.getDate() + 1).toString(), // naive timezone fix for demo
      time: timeFormatted || 'All Day',
      contact: this.newEventContact || 'No contact',
      type: this.newEventType
    };

    this.events.update(list => [...list, newEvent].sort((a, b) => parseInt(a.day) - parseInt(b.day)));
    this.closeAddEvent();
  }
}
