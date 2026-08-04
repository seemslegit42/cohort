import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Appwrite } from './appwrite';
import { Router } from '@angular/router';

@Component({
  selector: 'app-scheduler',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-zinc-950 flex flex-col items-center py-10 px-4 md:py-20 font-sans">
      <div class="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-fade-in relative">
        <div class="absolute -left-40 -top-40 w-96 h-96 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <!-- Left Side: Agent Info -->
        <div class="w-full md:w-[35%] bg-zinc-950/50 p-8 border-r border-zinc-800/50 flex flex-col z-10 relative">
          <div class="flex-1">
            <div class="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6 overflow-hidden">
              <mat-icon class="text-3xl text-teal-400">account_circle</mat-icon>
            </div>
            
            <h4 class="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2">Discovery Call</h4>
            <h1 class="text-2xl font-display font-bold text-white mb-4">Book a Meeting</h1>
            
            <div class="space-y-4 text-sm text-zinc-400 mb-8">
              <div class="flex items-center gap-3">
                <mat-icon class="text-zinc-500 text-[20px]">schedule</mat-icon>
                <span>30 min</span>
              </div>
              <div class="flex items-center gap-3">
                <mat-icon class="text-zinc-500 text-[20px]">videocam</mat-icon>
                <span>Web conferencing details provided upon confirmation.</span>
              </div>
            </div>

            <p class="text-sm text-zinc-500 leading-relaxed">
              Let's discuss how our CRM can help streamline your sales pipeline and accelerate growth.
            </p>
          </div>
          <div class="pt-8 border-t border-zinc-800/50 flex items-center gap-2 text-xs text-zinc-600 font-bold">
            <mat-icon class="text-[14px]">lock</mat-icon> Powered by ΛΞVOS Scheduling
          </div>
        </div>

        <!-- Right Side: Booking Flow -->
        <div class="w-full md:w-[65%] bg-zinc-900 p-6 md:p-8 flex flex-col z-10 relative">
          
          @if (step() === 'calendar') {
            <h2 class="text-lg font-bold text-white mb-6">Select a Date & Time</h2>
            
            <div class="flex gap-6 h-full">
              <!-- Calendar View -->
              <div class="flex-1 flex flex-col">
                <div class="flex items-center justify-between mb-4">
                  <span class="text-sm font-bold text-white">{{ currentMonthName() }} {{ currentYear() }}</span>
                  <div class="flex gap-2">
                    <button (click)="prevMonth()" class="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors">
                      <mat-icon class="text-[18px]">chevron_left</mat-icon>
                    </button>
                    <button (click)="nextMonth()" class="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors">
                      <mat-icon class="text-[18px]">chevron_right</mat-icon>
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-7 gap-1 mb-2 text-center">
                  @for (day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; track day) {
                    <div class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{{ day }}</div>
                  }
                </div>

                <div class="grid grid-cols-7 gap-1">
                  @for (d of calendarDays(); track $index) {
                    <button 
                      [disabled]="!d.isCurrentMonth || d.isPast"
                      (click)="selectDate(d.date)"
                      [class.bg-teal-500]="selectedDate() === d.date"
                      [class.text-zinc-950]="selectedDate() === d.date"
                      [class.bg-zinc-800]="selectedDate() !== d.date && d.isCurrentMonth && !d.isPast"
                      [class.hover:bg-zinc-700]="selectedDate() !== d.date && d.isCurrentMonth && !d.isPast"
                      [class.text-white]="selectedDate() !== d.date && d.isCurrentMonth && !d.isPast"
                      [class.opacity-30]="!d.isCurrentMonth || d.isPast"
                      [class.cursor-not-allowed]="!d.isCurrentMonth || d.isPast"
                      class="aspect-square rounded-full flex items-center justify-center text-sm font-bold transition-colors">
                      {{ d.day }}
                    </button>
                  }
                </div>
              </div>

              <!-- Time Slots View -->
              @if (selectedDate()) {
                <div class="w-40 border-l border-zinc-800 pl-6 flex flex-col h-full animate-fade-in overflow-y-auto custom-scrollbar">
                  <div class="text-sm font-bold text-white mb-4">{{ selectedDateFormatted() }}</div>
                  <div class="space-y-2 flex-1">
                    @for (time of availableTimes; track time) {
                      <div class="flex gap-2">
                        @if (selectedTime() === time) {
                          <button class="flex-1 bg-zinc-800 text-white font-bold text-sm py-3 rounded-xl">
                            {{ time }}
                          </button>
                          <button (click)="confirmTime()" class="flex-1 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-sm py-3 rounded-xl transition-colors">
                            Next
                          </button>
                        } @else {
                          <button (click)="selectedTime.set(time)" class="w-full bg-zinc-950 border border-teal-500/20 hover:border-teal-500 text-teal-400 hover:bg-teal-500/10 font-bold text-sm py-3 rounded-xl transition-all">
                            {{ time }}
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          @if (step() === 'details') {
            <div class="animate-fade-in flex flex-col h-full">
              <button (click)="step.set('calendar')" class="w-fit text-sm text-zinc-400 hover:text-white flex items-center gap-2 mb-6 transition-colors">
                <mat-icon class="text-[18px]">arrow_back</mat-icon> Back
              </button>
              
              <h2 class="text-xl font-bold text-white mb-6">Enter Details</h2>
              
              <div class="space-y-4 flex-1">
                <div class="space-y-1">
                  <label for="leadName" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Name *</label>
                  <input id="leadName" type="text" [(ngModel)]="leadName" 
                         class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-teal-500/40" />
                </div>
                
                <div class="space-y-1">
                  <label for="leadEmail" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email *</label>
                  <input id="leadEmail" type="email" [(ngModel)]="leadEmail" 
                         class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-teal-500/40" />
                </div>

                <div class="space-y-1">
                  <label for="leadNotes" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Additional Notes</label>
                  <textarea id="leadNotes" [(ngModel)]="leadNotes" rows="3"
                            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-teal-500/40 resize-none"></textarea>
                </div>
              </div>
              
              <div class="pt-6">
                <button (click)="bookMeeting()" [disabled]="!leadName || !leadEmail || isBooking()"
                        class="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                  @if (isBooking()) {
                    <mat-icon class="animate-spin">refresh</mat-icon> Scheduling...
                  } @else {
                    Schedule Event
                  }
                </button>
              </div>
            </div>
          }

          @if (step() === 'success') {
            <div class="animate-fade-in flex flex-col items-center justify-center h-full text-center space-y-4">
              <div class="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
                <mat-icon class="text-3xl text-emerald-400">check_circle</mat-icon>
              </div>
              <h2 class="text-2xl font-bold text-white">You are scheduled</h2>
              <p class="text-zinc-400 text-sm max-w-sm">
                A calendar invitation has been sent to your email address.
              </p>
              
              <div class="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm mt-6 space-y-3 text-left">
                <h3 class="text-white font-bold border-b border-zinc-800 pb-3 mb-3">Discovery Call</h3>
                <div class="flex items-center gap-3 text-sm text-zinc-300">
                  <mat-icon class="text-zinc-500 text-[18px]">event</mat-icon>
                  {{ selectedDateFormatted() }}
                </div>
                <div class="flex items-center gap-3 text-sm text-zinc-300">
                  <mat-icon class="text-zinc-500 text-[18px]">schedule</mat-icon>
                  {{ selectedTime() }}
                </div>
                <div class="flex items-center gap-3 text-sm text-zinc-300">
                  <mat-icon class="text-zinc-500 text-[18px]">videocam</mat-icon>
                  Web conferencing details to follow
                </div>
              </div>

              <button (click)="goHome()" class="mt-8 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors">
                Return to home
              </button>
            </div>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
  `]
})
export class SchedulerComponent {
  appwrite = inject(Appwrite);
  router = inject(Router);

  step = signal<'calendar' | 'details' | 'success'>('calendar');
  
  currentDate = new Date();
  displayMonth = signal(this.currentDate.getMonth());
  displayYear = signal(this.currentDate.getFullYear());
  
  selectedDate = signal<Date | null>(null);
  selectedTime = signal<string | null>(null);

  leadName = '';
  leadEmail = '';
  leadNotes = '';
  isBooking = signal(false);

  availableTimes = ['09:00 AM', '09:30 AM', '10:00 AM', '11:00 AM', '01:00 PM', '01:30 PM', '02:00 PM', '03:30 PM'];

  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  currentMonthName = computed(() => this.monthNames[this.displayMonth()]);
  currentYear = computed(() => this.displayYear());

  calendarDays = computed(() => {
    const year = this.displayYear();
    const month = this.displayMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    
    // Prev month days
    for (let i = 0; i < firstDay; i++) {
      days.unshift({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isPast: true,
        date: new Date(year, month - 1, daysInPrevMonth - i)
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        day: i,
        isCurrentMonth: true,
        isPast: date < today,
        date: date
      });
    }
    
    // Next month days to fill 42 slots (6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        isPast: false,
        date: new Date(year, month + 1, i)
      });
    }
    
    return days;
  });

  selectedDateFormatted = computed(() => {
    const d = this.selectedDate();
    if (!d) return '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[d.getDay()]}, ${this.monthNames[d.getMonth()]} ${d.getDate()}`;
  });

  prevMonth() {
    let m = this.displayMonth() - 1;
    let y = this.displayYear();
    if (m < 0) { m = 11; y--; }
    this.displayMonth.set(m);
    this.displayYear.set(y);
    this.selectedDate.set(null);
    this.selectedTime.set(null);
  }

  nextMonth() {
    let m = this.displayMonth() + 1;
    let y = this.displayYear();
    if (m > 11) { m = 0; y++; }
    this.displayMonth.set(m);
    this.displayYear.set(y);
    this.selectedDate.set(null);
    this.selectedTime.set(null);
  }

  selectDate(date: Date) {
    this.selectedDate.set(date);
    this.selectedTime.set(null);
  }

  confirmTime() {
    this.step.set('details');
  }

  async bookMeeting() {
    if (!this.selectedDate() || !this.selectedTime() || !this.leadName || !this.leadEmail) return;
    
    this.isBooking.set(true);
    
    const d = this.selectedDate()!;
    const newEvent = {
      title: `Discovery Call - ${this.leadName}`,
      month: this.shortMonthNames[d.getMonth()],
      day: d.getDate().toString(),
      time: this.selectedTime()!,
      contact: this.leadName,
      type: 'Demo'
    };

    // Simulate Nextcloud / CalDAV sync
    setTimeout(async () => {
      await this.appwrite.addEvent(newEvent);
      this.appwrite.addNotification({
        title: 'New Booking',
        message: `${this.leadName} booked a Discovery Call on ${newEvent.month} ${newEvent.day}.`,
        isRead: false,
        type: 'info'
      });
      this.isBooking.set(false);
      this.step.set('success');
    }, 1500);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
