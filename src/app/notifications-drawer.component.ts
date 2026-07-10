import { Component, ChangeDetectionStrategy, inject, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Appwrite } from './appwrite';
import { LeadService, Lead } from './lead.service';

interface CRMNotification {
  $id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'success' | 'warning' | 'info' | 'danger';
  timestamp: string;
  meta?: {
    leadValue?: number;
    leadSource?: string;
  };
}

@Component({
  selector: 'app-notifications-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <!-- Back-shading Backdrop Overlay -->
    @if (isOpen()) {
      <div 
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        (click)="closeDrawer()"
        role="button"
        tabindex="0"
        (keydown.escape)="closeDrawer()">
      </div>
    }

    <!-- Glassmorphic Overlay Drawer -->
    <div 
      class="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-zinc-950/95 backdrop-blur-2xl border-l border-zinc-800/80 shadow-[0_0_50px_rgba(32,178,170,0.15)] flex flex-col z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] transform"
      [class.translate-x-0]="isOpen()"
      [class.translate-x-full]="!isOpen()">
      
      <!-- Top Glowing Accent Line -->
      <div class="h-[2px] w-full bg-gradient-to-r from-teal-500 via-[#6A0DAD] to-emerald-400"></div>

      <!-- Drawer Header -->
      <div class="p-6 border-b border-zinc-800/60 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(32,178,170,0.2)] animate-pulse">
            <mat-icon class="text-lg">notifications_active</mat-icon>
          </div>
          <div>
            <h2 class="font-logo font-bold text-lg text-white leading-tight">CRM Sentinel</h2>
            <p class="text-[10px] font-sans text-zinc-500 uppercase tracking-widest mt-0.5">Real-Time Core Updates</p>
          </div>
        </div>
        
        <button 
          (click)="closeDrawer()"
          class="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer">
          <mat-icon class="text-sm">close</mat-icon>
        </button>
      </div>

      <!-- Live Simulation Command Strip -->
      <div class="px-6 py-4 bg-zinc-900/40 border-b border-zinc-800/60">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
            Sentinel Stream Simulation
          </span>
          <span class="text-[9px] text-teal-400/80 font-mono">Status: Synthesized</span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button 
            (click)="simulateNewLead()"
            class="px-2 py-1.5 bg-teal-950/30 border border-teal-500/30 hover:bg-teal-500/10 rounded-lg text-[10px] font-medium text-teal-400 flex flex-col items-center justify-center gap-1 transition-all group">
            <mat-icon class="text-sm group-hover:scale-110 transition-transform">group_add</mat-icon>
            <span>+ Lead</span>
          </button>
          <button 
            (click)="simulateTaskDeadline()"
            class="px-2 py-1.5 bg-purple-950/30 border border-purple-500/30 hover:bg-purple-500/10 rounded-lg text-[10px] font-medium text-purple-400 flex flex-col items-center justify-center gap-1 transition-all group">
            <mat-icon class="text-sm group-hover:scale-110 transition-transform">alarm</mat-icon>
            <span>+ Deadline</span>
          </button>
          <button 
            (click)="simulateSignedDeal()"
            class="px-2 py-1.5 bg-emerald-950/30 border border-emerald-500/30 hover:bg-emerald-500/10 rounded-lg text-[10px] font-medium text-emerald-400 flex flex-col items-center justify-center gap-1 transition-all group">
            <mat-icon class="text-sm group-hover:scale-110 transition-transform">workspace_premium</mat-icon>
            <span>+ Deal Win</span>
          </button>
        </div>
      </div>

      <!-- Tab Selection -->
      <div class="flex border-b border-zinc-800/60 p-2 gap-1 bg-zinc-950">
        <button 
          (click)="setActiveTab('all')"
          [class.bg-zinc-900]="activeTab() === 'all'"
          [class.text-white]="activeTab() === 'all'"
          [class.border-teal-500/30]="activeTab() === 'all'"
          class="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-1.5 border border-transparent">
          <mat-icon class="text-sm">dashboard</mat-icon>
          <span>All Updates</span>
          @if (unreadCount() > 0) {
            <span class="w-2 h-2 rounded-full bg-[#6A0DAD]"></span>
          }
        </button>
        <button 
          (click)="setActiveTab('leads')"
          [class.bg-zinc-900]="activeTab() === 'leads'"
          [class.text-white]="activeTab() === 'leads'"
          [class.border-teal-500/30]="activeTab() === 'leads'"
          class="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-1.5 border border-transparent">
          <mat-icon class="text-sm text-teal-400">group</mat-icon>
          <span>Leads</span>
          @if (newLeadsCount() > 0) {
            <span class="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
              {{ newLeadsCount() }}
            </span>
          }
        </button>
        <button 
          (click)="setActiveTab('tasks')"
          [class.bg-zinc-900]="activeTab() === 'tasks'"
          [class.text-white]="activeTab() === 'tasks'"
          [class.border-teal-500/30]="activeTab() === 'tasks'"
          class="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-1.5 border border-transparent">
          <mat-icon class="text-sm text-purple-400">check_circle</mat-icon>
          <span>Deadlines</span>
          @if (pendingTasksCount() > 0) {
            <span class="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
              {{ pendingTasksCount() }}
            </span>
          }
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-zinc-950">
        
        <!-- Header Actions inside Area -->
        @if (hasItems()) {
          <div class="flex items-center justify-between pb-2 border-b border-zinc-900">
            <span class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Showing Updates</span>
            <button 
              (click)="acknowledgeAll()"
              class="text-[10px] text-teal-400 hover:text-teal-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all">
              <mat-icon class="text-xs">done_all</mat-icon>
              Acknowledge All
            </button>
          </div>
        }

        <!-- 1. All Tab Content -->
        @if (activeTab() === 'all') {
          <div class="space-y-3">
            @for (item of notifications(); track item.$id) {
              <!-- Custom GlassPane Card -->
              <div 
                [class.opacity-60]="item.isRead"
                class="group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 flex gap-3"
                [ngClass]="getCardClasses(item)">
                
                <!-- Status Orb Left Indicator -->
                <div class="mt-1 flex-shrink-0">
                  <div class="w-2.5 h-2.5 rounded-full" [ngClass]="getBadgeColor(item.type)"></div>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="text-xs font-semibold text-white truncate group-hover:text-teal-300 transition-colors">
                      {{ item.title }}
                    </h4>
                    <span class="text-[9px] font-mono text-zinc-500 shrink-0">
                      {{ formatTime(item.timestamp) }}
                    </span>
                  </div>
                  <p class="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {{ item.message }}
                  </p>

                  <!-- Dynamic Lead Preview Details -->
                  @if (item.meta && item.meta.leadValue) {
                    <div class="mt-2.5 pt-2 border-t border-zinc-900 flex items-center justify-between">
                      <span class="text-[10px] font-mono text-zinc-500">Value: <span class="text-emerald-400 font-bold">\${{ item.meta.leadValue | number }}</span></span>
                      <span class="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-[#3EB991] px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">
                        Source: {{ item.meta.leadSource }}
                      </span>
                    </div>
                  }

                  <!-- Actions inside Card -->
                  <div class="flex items-center gap-2.5 mt-3 pt-2 border-t border-zinc-900/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    @if (!item.isRead) {
                      <button 
                        (click)="markAsRead(item.$id)"
                        class="text-[10px] text-teal-400 hover:text-teal-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                        <mat-icon class="text-xs">check</mat-icon>
                        Acknowledge
                      </button>
                    }
                    <button 
                      (click)="deleteNotification(item.$id)"
                      class="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer ml-auto">
                      <mat-icon class="text-xs">delete</mat-icon>
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="py-12 text-center flex flex-col items-center justify-center">
                <div class="w-16 h-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-600">
                  <mat-icon class="text-2xl">notifications_paused</mat-icon>
                </div>
                <h4 class="text-sm font-semibold text-zinc-300">The Sentinel is Quiet</h4>
                <p class="text-xs text-zinc-500 max-w-xs mt-1.5 leading-relaxed font-sans">
                  The ether is silent. No warnings have breached the threshold of context. Generate simulations above to test the streams.
                </p>
              </div>
            }
          </div>
        }

        <!-- 2. Leads Tab Content -->
        @if (activeTab() === 'leads') {
          <div class="space-y-3">
            @for (lead of newLeads(); track lead.$id) {
              <div class="border border-teal-500/15 bg-teal-950/10 rounded-xl p-4 flex flex-col relative overflow-hidden group">
                <!-- Decorative background pulse -->
                <div class="absolute -right-10 -bottom-10 w-24 h-24 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 transition-all duration-300"></div>

                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-[#3EB991] animate-pulse"></span>
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider">{{ lead.name }}</h4>
                  </div>
                  <span class="text-xs text-[#FFD700] font-bold font-mono">
                    \${{ lead.value | number }}
                  </span>
                </div>
                
                <div class="mt-2 space-y-1 text-xs text-zinc-400">
                  <p class="flex items-center gap-1.5">
                    <mat-icon class="text-[14px] w-3.5 h-3.5 text-zinc-600">mail</mat-icon>
                    <span class="truncate">{{ lead.email }}</span>
                  </p>
                  <p class="flex items-center gap-1.5">
                    <mat-icon class="text-[14px] w-3.5 h-3.5 text-zinc-600">sensors</mat-icon>
                    <span>Source: <span class="text-teal-400 font-semibold">{{ lead.source }}</span></span>
                  </p>
                </div>

                <div class="mt-3.5 pt-2.5 border-t border-zinc-900/60 flex items-center justify-between">
                  <span class="text-[9px] font-mono text-zinc-500">Status: <span class="text-teal-400 font-bold uppercase tracking-wider">{{ lead.status }}</span></span>
                  <button 
                    (click)="contactLead(lead)"
                    class="px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500 text-[10px] font-bold rounded-lg uppercase tracking-wider hover:text-zinc-950 transition-all flex items-center gap-1">
                    <mat-icon class="text-[12px] w-3 h-3">outgoing_mail</mat-icon>
                    Contact
                  </button>
                </div>
              </div>
            } @empty {
              <div class="py-12 text-center flex flex-col items-center justify-center">
                <div class="w-16 h-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-600">
                  <mat-icon class="text-2xl text-teal-500/20">contacts</mat-icon>
                </div>
                <h4 class="text-sm font-semibold text-zinc-300">No New Leads Registered</h4>
                <p class="text-xs text-zinc-500 max-w-xs mt-1.5 leading-relaxed font-sans">
                  No active prospects are awaiting contact in the buffer. Click "+ Lead" above to simulate a new lead register.
                </p>
              </div>
            }
          </div>
        }

        <!-- 3. Tasks Tab Content -->
        @if (activeTab() === 'tasks') {
          <div class="space-y-3">
            @for (task of pendingTasks(); track task.$id) {
              <div class="border border-purple-500/15 bg-purple-950/10 rounded-xl p-4 flex flex-col relative overflow-hidden group">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-[8px] font-bold text-purple-400 uppercase tracking-widest rounded">
                        {{ task.priority || 'High' }} Priority
                      </span>
                      <span class="text-[9px] text-zinc-500 font-mono">DEADLINE</span>
                    </div>
                    <h4 class="text-xs font-semibold text-white mt-1.5 leading-relaxed">
                      {{ task.title }}
                    </h4>
                  </div>
                  
                  <button 
                    (click)="completeTask(task.$id)"
                    class="w-7 h-7 rounded-lg border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                    title="Mark Task Completed">
                    <mat-icon class="text-sm">done</mat-icon>
                  </button>
                </div>
                
                <div class="mt-3 pt-2.5 border-t border-zinc-900/60 flex items-center justify-between">
                  <span class="text-[9px] text-rose-400 font-mono flex items-center gap-1">
                    <mat-icon class="text-[12px] w-3 h-3">schedule</mat-icon>
                    Action Required Immediately
                  </span>
                </div>
              </div>
            } @empty {
              <div class="py-12 text-center flex flex-col items-center justify-center">
                <div class="w-16 h-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-600">
                  <mat-icon class="text-2xl text-purple-500/20">task_alt</mat-icon>
                </div>
                <h4 class="text-sm font-semibold text-zinc-300">No Critical Deadlines</h4>
                <p class="text-xs text-zinc-500 max-w-xs mt-1.5 leading-relaxed font-sans">
                  All critical milestones are locked and verified. Click "+ Deadline" above to inject an urgent milestone alert.
                </p>
              </div>
            }
          </div>
        }

      </div>

      <!-- Drawer Footer Brand Imprint -->
      <div class="p-6 border-t border-zinc-900 flex flex-col gap-1 items-center bg-zinc-950/98 text-center">
        <!-- Brand Signature (Mandatory Instrument) -->
        <div class="select-none pointer-events-none opacity-40" style="mix-blend-mode: overlay;">
          <div class="font-logo font-bold text-[10px] text-[#F5FFFA] tracking-normal leading-tight">ΛΞV Inc</div>
          <div class="font-sans font-light text-[8px] text-zinc-400 tracking-[0.2em] uppercase leading-none mt-1">The Future Needs Context</div>
          <div class="font-sans font-light text-[7px] text-zinc-500 tracking-[0.1em] mt-0.5">Innovate, Automate, Dominate</div>
        </div>
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
export class NotificationsDrawerComponent {
  appwrite = inject(Appwrite);
  leadService = inject(LeadService);

  isOpen = input<boolean>(false);
  drawerClose = output<void>();

  activeTab = signal<'all' | 'leads' | 'tasks'>('all');

  // Load leads if empty to get beautiful updates
  constructor() {
    this.leadService.loadLeads();
  }

  // Reactive Data
  notifications = computed(() => this.appwrite.notifications() as CRMNotification[]);
  
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  newLeads = computed(() => {
    return this.leadService.leads().filter(l => l.status === 'New');
  });

  newLeadsCount = computed(() => this.newLeads().length);

  pendingTasks = computed(() => {
    return this.appwrite.tasks().filter(t => !t.completed);
  });

  pendingTasksCount = computed(() => this.pendingTasks().length);

  hasItems = computed(() => {
    if (this.activeTab() === 'all') return this.notifications().length > 0;
    if (this.activeTab() === 'leads') return this.newLeads().length > 0;
    return this.pendingTasks().length > 0;
  });

  // Actions
  closeDrawer() {
    this.playCrystallineChime();
    this.drawerClose.emit();
  }

  setActiveTab(tab: 'all' | 'leads' | 'tasks') {
    this.playCrystallineChime();
    this.activeTab.set(tab);
  }

  markAsRead(id: string) {
    this.playCrystallineChime();
    this.appwrite.notifications.update(arr => 
      arr.map(n => n.$id === id ? { ...n, isRead: true } : n)
    );
  }

  deleteNotification(id: string) {
    this.playCrystallineChime();
    this.appwrite.notifications.update(arr => arr.filter(n => n.$id !== id));
  }

  acknowledgeAll() {
    this.playSuccessHarmonic();
    this.appwrite.notifications.update(arr => 
      arr.map(n => ({ ...n, isRead: true }))
    );
  }

  completeTask(id: string) {
    this.playSuccessHarmonic();
    this.appwrite.toggleTaskCompleted(id, true);
  }

  contactLead(lead: Lead) {
    this.playSuccessHarmonic();
    // Simulate updating contact status
    if (lead.$id) {
      this.leadService.updateLead(lead.$id, { status: 'Contacted' });
      this.appwrite.addNotification({
        title: 'Lead Outreach Initiated',
        message: `Outreach system launched for ${lead.name} (${lead.email}).`,
        type: 'info'
      });
    }
  }

  // Real-time Event Simulators
  simulateNewLead() {
    this.playSuccessHarmonic();
    
    const firstNames = ['Alexander', 'Isabella', 'Marcus', 'Sophia', 'Julius', 'Octavia', 'Evelyn', 'Damian'];
    const lastNames = ['Vance', 'Sterling', 'Russo', 'Kemp', 'Sinclair', 'Locke', 'Hale', 'Gable'];
    const sources = ['SaaS Landing', 'Enterprise Refer', 'Cold Outreach', 'Partner Hub'];
    const values = [4500, 8500, 15000, 32000, 50000];

    const randomName = firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomEmail = randomName.toLowerCase().replace(' ', '.') + '@company.io';
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    const randomValue = values[Math.floor(Math.random() * values.length)];

    const mockLead: Lead = {
      name: randomName,
      email: randomEmail,
      phone: '+1 555 ' + Math.floor(100 + Math.random() * 900) + ' ' + Math.floor(1000 + Math.random() * 9000),
      source: randomSource,
      status: 'New',
      value: randomValue
    };

    // Add to LeadService
    this.leadService.leads.update(leads => [mockLead, ...leads]);

    // Push live Sentinel notification
    this.appwrite.addNotification({
      title: 'Incoming Hot Lead Registered',
      message: `${randomName} has registered via ${randomSource} pipeline. Estimated Deal Value: $${randomValue.toLocaleString()}.`,
      type: 'success',
      meta: {
        leadValue: randomValue,
        leadSource: randomSource
      }
    });
  }

  simulateTaskDeadline() {
    this.playCrystallineChime();

    const tasks = [
      'Submit compliance audit for MSFT master contract',
      'Renew enterprise server SSL keys',
      'Deliver proposal response to Oracle regional director',
      'Execute SLA warranty signature for Slack deal'
    ];
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)];

    const mockTask = {
      $id: 'mock-sim-t-' + Date.now(),
      title: randomTask,
      completed: false,
      priority: 'High',
      teamId: 'laevos-crm',
      createdAt: new Date().toISOString()
    };

    // Add to task lists
    this.appwrite.tasks.update(arr => [mockTask, ...arr]);

    // Sentinel Notification
    this.appwrite.addNotification({
      title: 'Critical CRM Milestone Deadline',
      message: `Urgent attention required: "${randomTask}". Due within 2 hours.`,
      type: 'warning'
    });
  }

  simulateSignedDeal() {
    this.playSuccessHarmonic();

    const enterpriseNames = ['NVIDIA Systems', 'Uber Technologies', 'Stripe Payments', 'Databricks'];
    const val = [120000, 180000, 250000, 480000];
    const idx = Math.floor(Math.random() * enterpriseNames.length);

    const randomCompany = enterpriseNames[idx];
    const randomVal = val[idx];

    // Push premium Sentinel win notification
    this.appwrite.addNotification({
      title: 'GILDED UPDATE: Deal Signed!',
      message: `${randomCompany} signed the SLA contract. Global revenue stream upgraded by $${randomVal.toLocaleString()}.`,
      type: 'success',
      meta: {
        leadValue: randomVal,
        leadSource: 'Enterprise Upgrade'
      }
    });
  }

  // Style helpers
  getCardClasses(item: CRMNotification): string {
    const isSelected = !item.isRead;
    const baseBorder = isSelected ? 'border-[#20B2AA]/30' : 'border-zinc-900 bg-zinc-950/40';
    
    switch (item.type) {
      case 'success':
        return `${baseBorder} bg-teal-950/5 hover:bg-teal-950/15`;
      case 'warning':
        return `${baseBorder} bg-purple-950/5 hover:bg-purple-950/15`;
      case 'danger':
        return `${baseBorder} bg-rose-950/5 hover:bg-rose-950/15`;
      default:
        return `${baseBorder} bg-zinc-900/10 hover:bg-zinc-900/20`;
    }
  }

  getBadgeColor(type: 'success' | 'warning' | 'info' | 'danger'): string {
    switch (type) {
      case 'success':
        return 'bg-[#3EB991] shadow-[0_0_8px_#3EB991]';
      case 'warning':
        return 'bg-[#6A0DAD] shadow-[0_0_8px_#6A0DAD]';
      case 'danger':
        return 'bg-rose-500 shadow-[0_0_8px_#ef4444]';
      default:
        return 'bg-[#20B2AA] shadow-[0_0_8px_#20B2AA]';
    }
  }

  formatTime(isoStr: string): string {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  // Audio synths
  private playCrystallineChime() {
    try {
      const WebContext = (window as unknown as { webkitAudioContext: typeof AudioContext })['webkitAudioContext'];
      const ctx = new (window.AudioContext || WebContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // ignore
    }
  }

  private playSuccessHarmonic() {
    try {
      const WebContext = (window as unknown as { webkitAudioContext: typeof AudioContext })['webkitAudioContext'];
      const ctx = new (window.AudioContext || WebContext)();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.03, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain2.gain.setValueAtTime(0.03, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(now + 0.35);
    } catch {
      // ignore
    }
  }
}
