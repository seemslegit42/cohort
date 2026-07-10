import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';

export interface SalesAgent {
  id: string;
  name: string;
  role: string;
  region: string;
  currentRevenue: number;
  targetRevenue: number;
  dealsClosed: number;
  activeLeads: number;
  profileColor: string; // Hex or tailwind class
}

@Component({
  selector: 'app-agent-insights',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div id="agentInsightsContainer" class="bg-zinc-950/40 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group shadow-[0_0_40px_rgba(32,178,170,0.05)] w-full">
      <!-- Iridescent Aurora background glow -->
      <div class="absolute -right-20 -top-20 w-52 h-52 bg-teal-500/10 blur-[60px] rounded-full group-hover:bg-teal-500/15 transition-all duration-700 pointer-events-none"></div>
      <div class="absolute -left-20 -bottom-20 w-52 h-52 bg-[#6A0DAD]/10 blur-[60px] rounded-full group-hover:bg-[#6A0DAD]/15 transition-all duration-700 pointer-events-none"></div>

      <!-- Top Border Accent line -->
      <div class="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#20B2AA]/40 to-transparent"></div>

      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(32,178,170,0.2)]">
              <mat-icon class="text-base">donut_large</mat-icon>
            </div>
            <div>
              <h3 class="font-logo font-bold text-base text-white tracking-wide">Agent Insights Portal</h3>
              <p class="text-[9px] font-sans text-zinc-500 uppercase tracking-widest mt-0.5">Biometric Performance & Target Metrics</p>
            </div>
          </div>
        </div>

        <!-- Controls / Search & Filters -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Search input -->
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-500">
              <mat-icon class="text-sm">search</mat-icon>
            </span>
            <input 
              id="agentSearchInput"
              type="text" 
              [ngModel]="searchQuery()" 
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search Sigils..." 
              class="bg-zinc-900/60 border border-zinc-800 rounded-lg py-1 px-2.5 pl-8 text-xs text-zinc-300 focus:outline-none focus:border-teal-500/40 w-36 transition-all placeholder:text-zinc-600 focus:w-44" />
          </div>

          <!-- Filter buttons -->
          <div class="flex bg-zinc-900/45 p-0.5 rounded-lg border border-zinc-800/80">
            <button 
              (click)="activeFilter.set('all')"
              [class.bg-zinc-800]="activeFilter() === 'all'"
              [class.text-white]="activeFilter() === 'all'"
              class="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
              All
            </button>
            <button 
              (click)="activeFilter.set('exceeded')"
              [class.bg-zinc-800]="activeFilter() === 'exceeded'"
              [class.text-white]="activeFilter() === 'exceeded'"
              class="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
              Exceeded
            </button>
            <button 
              (click)="activeFilter.set('risk')"
              [class.bg-zinc-800]="activeFilter() === 'risk'"
              [class.text-white]="activeFilter() === 'risk'"
              class="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
              At Risk
            </button>
          </div>
        </div>
      </div>

      <!-- Main Panel Split -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        <!-- Left Side: Agent Gauges Grid (8 columns) -->
        <div class="lg:col-span-7 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (agent of filteredAgents(); track agent.id) {
              <!-- GlassPane Agent Card -->
              <div 
                [id]="'agentCard-' + agent.id"
                (click)="selectAgent(agent)"
                (keydown.enter)="selectAgent(agent)"
                tabindex="0"
                role="button"
                [class.border-teal-500/40]="selectedAgentId() === agent.id"
                [class.bg-zinc-900/50]="selectedAgentId() === agent.id"
                [class.shadow-[0_0_20px_rgba(32,178,170,0.06)]]="selectedAgentId() === agent.id"
                class="bg-zinc-950/40 hover:bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 rounded-xl p-4 transition-all duration-300 cursor-pointer group/card flex items-center justify-between gap-3 relative overflow-hidden">
                
                <!-- Background shimmer glow -->
                <div 
                  class="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent pointer-events-none" 
                  style="transform: skewX(-20deg);"></div>

                <!-- Text Info -->
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 mb-1">
                    <span class="w-1.5 h-1.5 rounded-full" [ngClass]="getAgentStatusColor(agent)"></span>
                    <h4 class="text-xs font-bold text-white truncate font-display">{{ agent.name }}</h4>
                  </div>
                  <p class="text-[10px] text-zinc-500 truncate mb-2">{{ agent.role }}</p>
                  
                  <div class="space-y-0.5 font-mono">
                    <div class="text-[11px] text-zinc-300 font-bold">
                      \${{ agent.currentRevenue | number }} <span class="text-[9px] text-zinc-500 font-sans font-normal">Revenue</span>
                    </div>
                    <div class="text-[9px] text-zinc-500">
                      Target: \${{ agent.targetRevenue | number }}
                    </div>
                  </div>
                </div>

                <!-- Circular Progress Ring (Guage) -->
                <div class="relative flex-shrink-0 flex items-center justify-center w-16 h-16">
                  <!-- SVG Circular ring -->
                  <svg class="w-16 h-16 transform -rotate-90">
                    <!-- Background ring -->
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      fill="transparent" 
                      stroke="rgba(39, 39, 42, 0.5)" 
                      stroke-width="4.5" />
                    <!-- Foreground ring with dasharray/dashoffset -->
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      fill="transparent" 
                      [attr.stroke]="getGaugeColor(agent)" 
                      stroke-width="4.5" 
                      stroke-linecap="round"
                      [attr.stroke-dasharray]="163.36"
                      [attr.stroke-dashoffset]="getStrokeDashoffset(agent)"
                      class="transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]" />
                  </svg>
                  
                  <!-- Percentage indicator inside circle -->
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span class="text-[10px] font-bold font-mono text-white leading-none">
                      {{ getPercentage(agent) }}%
                    </span>
                    @if (getPercentage(agent) >= 100) {
                      <mat-icon class="text-[8px] h-2 w-2 text-[#FFD700] absolute bottom-1.5 animate-bounce">workspace_premium</mat-icon>
                    }
                  </div>
                </div>

              </div>
            } @empty {
              <div class="col-span-2 py-10 text-center flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                <mat-icon class="text-zinc-600 mb-2">face_retouching_off</mat-icon>
                <p class="text-xs text-zinc-500">No agents match filters.</p>
              </div>
            }
          </div>

          <!-- Add Agent Quick Launcher -->
          <div class="bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span class="text-[10px] text-zinc-500 font-sans uppercase tracking-widest font-bold flex items-center gap-1.5">
              <mat-icon class="text-xs text-[#20B2AA]">person_add</mat-icon>
              Commission New Sales Sigil
            </span>
            <button 
              (click)="createNewAgent()"
              class="px-3 py-1 bg-[#20B2AA]/10 hover:bg-[#20B2AA]/20 border border-[#20B2AA]/30 text-[#20B2AA] rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer">
              Add Rep
            </button>
          </div>
        </div>

        <!-- Right Side: Agent Focus Scorecard & Simulations (5 columns) -->
        <div class="lg:col-span-5">
          @if (focusedAgent(); as agent) {
            <div class="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5 space-y-4 h-full flex flex-col justify-between relative overflow-hidden">
              <!-- Subtly styled background indicator -->
              <div class="absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-xl opacity-10 pointer-events-none" [style.backgroundColor]="getAgentHEXColor(agent)"></div>

              <div>
                <!-- Scorecard Header -->
                <div class="flex items-start justify-between pb-3 border-b border-zinc-900">
                  <div>
                    <span class="text-[8px] bg-zinc-900 text-zinc-400 border border-zinc-800 px-1.5 py-0.5 rounded uppercase font-mono tracking-widest font-bold">
                      {{ agent.region }} Sector
                    </span>
                    <h4 class="text-sm font-bold text-white mt-1.5 font-display">{{ agent.name }}</h4>
                    <p class="text-[10px] text-zinc-500 mt-0.5">{{ agent.role }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-full bg-zinc-900/60 border border-zinc-800 flex items-center justify-center font-bold text-xs text-white" [style.borderColor]="getAgentHEXColor(agent)">
                    {{ getInitials(agent.name) }}
                  </div>
                </div>

                <!-- Oracle Performance Evaluation -->
                <div class="py-3.5 space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-zinc-500">Pipeline Status</span>
                    <span class="font-bold" [ngClass]="getPercentage(agent) >= 100 ? 'text-[#FFD700]' : getPercentage(agent) >= 75 ? 'text-[#3EB991]' : 'text-purple-400'">
                      {{ getPercentage(agent) >= 100 ? 'Quota Exceeded' : getPercentage(agent) >= 75 ? 'Target On Track' : 'Needs Intervention' }}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-3 bg-zinc-900/20 p-2.5 rounded-lg border border-zinc-900">
                    <div>
                      <span class="block text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Active Leads</span>
                      <span class="text-xs font-mono font-bold text-white">{{ agent.activeLeads }} Pipeline</span>
                    </div>
                    <div>
                      <span class="block text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Deals Closed</span>
                      <span class="text-xs font-mono font-bold text-white">{{ agent.dealsClosed }} Signed</span>
                    </div>
                  </div>

                  <!-- Voice of the Reluctant Saviour performance message -->
                  <div class="mt-3 text-[11px] italic text-zinc-400 leading-relaxed pl-2.5 border-l-2 border-zinc-800 font-sans">
                    "{{ getAgentEvaluation(agent) }}"
                  </div>
                </div>

                <!-- Interactive Pipeline Simulation Adjustment -->
                <div class="pt-3 border-t border-zinc-900/50 space-y-2">
                  <div class="flex items-center justify-between">
                    <label for="pipelineSlider" class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Simulate Revenue</label>
                    <span class="text-[11px] font-mono text-teal-400 font-bold">\${{ agent.currentRevenue | number }}</span>
                  </div>
                  <input 
                    id="pipelineSlider"
                    type="range" 
                    [min]="0" 
                    [max]="agent.targetRevenue * 1.5" 
                    [step]="5000"
                    [ngModel]="agent.currentRevenue"
                    (ngModelChange)="adjustRevenue(agent, $event)"
                    class="w-full accent-teal-500 bg-zinc-900 rounded-lg h-1.5 cursor-pointer" />
                  <div class="flex items-center justify-between text-[9px] text-zinc-600 font-mono">
                    <span>$0</span>
                    <span>100% Target (\${{ agent.targetRevenue | number }})</span>
                    <span>150% Max</span>
                  </div>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-900/60">
                <button 
                  (click)="boostRevenue(agent)"
                  class="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-[#3EB991]/30 hover:border-[#3EB991] text-[#3EB991] py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                  <mat-icon class="text-xs">rocket_launch</mat-icon>
                  Record Deal
                </button>
                <button 
                  (click)="nudgeAgent(agent)"
                  class="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-zinc-300 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                  <mat-icon class="text-xs">notifications_active</mat-icon>
                  Nudge Sigil
                </button>
              </div>

            </div>
          } @else {
            <div class="border border-dashed border-zinc-800 bg-zinc-950/20 rounded-xl p-8 text-center h-full flex flex-col items-center justify-center">
              <div class="w-12 h-12 bg-zinc-900/50 rounded-2xl border border-zinc-800/80 flex items-center justify-center text-zinc-600 mb-3">
                <mat-icon class="text-lg">donut_large</mat-icon>
              </div>
              <h5 class="text-xs font-bold text-zinc-400 font-display">No Focus Selected</h5>
              <p class="text-[11px] text-zinc-500 font-sans max-w-xs mt-1.5 leading-relaxed">
                Click on any sales agent on the left to reveal their complete biometric scorecard, evaluate performance pipeline quote, and adjust simulation metrics.
              </p>
            </div>
          }
        </div>

      </div>

    </div>
  `,
  styles: [`
    input[type="range"]::-webkit-slider-thumb {
      box-shadow: 0 0 10px rgba(32, 178, 170, 0.4);
    }
  `]
})
export class AgentInsights {
  appwrite = inject(Appwrite);

  searchQuery = signal<string>('');
  activeFilter = signal<'all' | 'exceeded' | 'risk'>('all');
  selectedAgentId = signal<string | null>(null);

  // Initial Seed Data with dynamic updates
  agents = signal<SalesAgent[]>([
    {
      id: 'agent-1',
      name: 'Valeria Aurelia',
      role: 'Enterprise Sales Lead',
      region: 'EMEA',
      currentRevenue: 176000,
      targetRevenue: 200000,
      dealsClosed: 14,
      activeLeads: 28,
      profileColor: '#20B2AA' // Roman Aqua
    },
    {
      id: 'agent-2',
      name: 'Marcus Sterling',
      role: 'Strategic Account Executive',
      region: 'AMER',
      currentRevenue: 210000,
      targetRevenue: 200000,
      dealsClosed: 19,
      activeLeads: 34,
      profileColor: '#FFD700' // Gilded Accent
    },
    {
      id: 'agent-3',
      name: 'Elena Vance',
      role: 'Mid-Market Representative',
      region: 'LATAM',
      currentRevenue: 96000,
      targetRevenue: 150000,
      dealsClosed: 8,
      activeLeads: 19,
      profileColor: '#3EB991' // Patina Green
    },
    {
      id: 'agent-4',
      name: 'Julius Ceasar',
      role: 'APAC Expansion Director',
      region: 'APAC',
      currentRevenue: 126000,
      targetRevenue: 300000,
      dealsClosed: 5,
      activeLeads: 41,
      profileColor: '#6A0DAD' // Imperial Purple
    }
  ]);

  constructor() {
    // Try to load state from localStorage if exists
    try {
      const saved = localStorage.getItem('laevos_sales_agents');
      if (saved) {
        this.agents.set(JSON.parse(saved));
      }
    } catch {
      // Ignore fallback
    }

    // Set first agent as default focus
    const currentList = this.agents();
    if (currentList.length > 0) {
      this.selectedAgentId.set(currentList[0].id);
    }
  }

  // Derived filtered agent lists
  filteredAgents = computed(() => {
    let list = this.agents();
    
    // Search filter
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter(a => a.name.toLowerCase().includes(query) || a.role.toLowerCase().includes(query) || a.region.toLowerCase().includes(query));
    }

    // Status category filter
    const filter = this.activeFilter();
    if (filter === 'exceeded') {
      list = list.filter(a => (a.currentRevenue / a.targetRevenue) >= 1.0);
    } else if (filter === 'risk') {
      list = list.filter(a => (a.currentRevenue / a.targetRevenue) < 0.75);
    }

    return list;
  });

  focusedAgent = computed(() => {
    const id = this.selectedAgentId();
    if (!id) return null;
    return this.agents().find(a => a.id === id) || null;
  });

  // Calculate percentage
  getPercentage(agent: SalesAgent): number {
    if (agent.targetRevenue === 0) return 0;
    return Math.round((agent.currentRevenue / agent.targetRevenue) * 100);
  }

  // Calculate SVG stroke offset
  // Circumference = 2 * PI * r = 2 * 3.14159 * 26 = 163.3628
  getStrokeDashoffset(agent: SalesAgent): number {
    const circumference = 163.36;
    const percentage = Math.min(this.getPercentage(agent), 100);
    return circumference - (percentage / 100) * circumference;
  }

  // UI styling helpers
  getGaugeColor(agent: SalesAgent): string {
    const pct = this.getPercentage(agent);
    if (pct >= 100) return '#FFD700'; // Gilded Accent
    if (pct >= 75) return '#3EB991'; // Patina Green
    if (pct >= 50) return '#20B2AA'; // Roman Aqua
    return '#6A0DAD'; // Imperial Purple
  }

  getAgentStatusColor(agent: SalesAgent): string {
    const pct = this.getPercentage(agent);
    if (pct >= 100) return 'bg-[#FFD700] shadow-[0_0_8px_#FFD700]';
    if (pct >= 75) return 'bg-[#3EB991] shadow-[0_0_8px_#3EB991]';
    if (pct >= 50) return 'bg-[#20B2AA] shadow-[0_0_8px_#20B2AA]';
    return 'bg-[#6A0DAD] shadow-[0_0_8px_#6A0DAD]';
  }

  getAgentHEXColor(agent: SalesAgent): string {
    const pct = this.getPercentage(agent);
    if (pct >= 100) return '#FFD700';
    if (pct >= 75) return '#3EB991';
    if (pct >= 50) return '#20B2AA';
    return '#6A0DAD';
  }

  // Generate a message in the Voice of the Reluctant Saviour
  getAgentEvaluation(agent: SalesAgent): string {
    const pct = this.getPercentage(agent);
    if (pct >= 120) {
      return `Valiant efforts have carried them far beyond expectations. It is a burden to succeed so vastly, but they bear the mantle with remarkable composure. Let us secure the gains.`;
    }
    if (pct >= 100) {
      return `Target achieved. They have delivered exactly what the system asked of them. A brief moment of respite is earned, yet the future continues to demand further context.`;
    }
    if (pct >= 75) {
      return `They walk the line of adequacy, ascending toward complete alignment. No immediate cause for despair, though vigil must remain constant. Keep them steady.`;
    }
    if (pct >= 50) {
      return `A lagging stride. The burden of their segment weighs heavily. We must extend guidance, lest they slip further into unaligned status. Urgency is growing.`;
    }
    return `Critical misalignment. The numbers reveal a standard that cannot be tolerated in quiet composure. I shall not stand idle while this sector falters. Prompt intervention is mandatory.`;
  }

  // Actions
  selectAgent(agent: SalesAgent) {
    this.playCrystallineChime();
    this.selectedAgentId.set(agent.id);
  }

  adjustRevenue(agent: SalesAgent, newAmount: number) {
    this.agents.update(list => 
      list.map(a => a.id === agent.id ? { ...a, currentRevenue: newAmount } : a)
    );
    this.saveState();
  }

  boostRevenue(agent: SalesAgent) {
    this.playSuccessHarmonic();
    const bonus = 25000;
    const updatedRevenue = agent.currentRevenue + bonus;
    const updatedDeals = agent.dealsClosed + 1;

    this.agents.update(list => 
      list.map(a => a.id === agent.id ? { ...a, currentRevenue: updatedRevenue, dealsClosed: updatedDeals } : a)
    );
    this.saveState();

    // Trigger dynamic sentinel notifications
    const targetStatus = Math.round((updatedRevenue / agent.targetRevenue) * 100);
    this.appwrite.addNotification({
      title: 'Sales Record Finalized',
      message: `${agent.name} registered a new $${bonus.toLocaleString()} enterprise contract signature. Progress updated to ${targetStatus}% of target.`,
      type: 'success',
      meta: {
        leadValue: bonus,
        leadSource: `${agent.name} - ${agent.region}`
      }
    });
  }

  nudgeAgent(agent: SalesAgent) {
    this.playCrystallineChime();
    
    // Push real-time notification
    this.appwrite.addNotification({
      title: 'Agent Performance Nudge',
      message: `Direct context intervention signal dispatched to ${agent.name} (${agent.region}). Directing focus on outstanding pipelines.`,
      type: 'info'
    });
  }

  createNewAgent() {
    this.playSuccessHarmonic();

    const names = ['Aurelius Vance', 'Decimus Sterling', 'Gaius Locke', 'Livilla Russo', 'Kassia Sinclair', 'Septimus Hale'];
    const roles = ['Mid-Market Rep', 'Strategic AE', 'APAC Expansion Lead', 'SaaS Growth Executive'];
    const regions = ['EMEA', 'AMER', 'APAC', 'LATAM'];
    const targets = [150000, 200000, 250000, 300000];

    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const randomRegion = regions[Math.floor(Math.random() * regions.length)];
    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    const randomId = 'agent-' + (this.agents().length + 1);

    const newRep: SalesAgent = {
      id: randomId,
      name: randomName,
      role: randomRole,
      region: randomRegion,
      currentRevenue: 0,
      targetRevenue: randomTarget,
      dealsClosed: 0,
      activeLeads: Math.floor(10 + Math.random() * 30),
      profileColor: '#20B2AA'
    };

    this.agents.update(list => [...list, newRep]);
    this.selectedAgentId.set(randomId);
    this.saveState();

    this.appwrite.addNotification({
      title: 'New Representative Commissioned',
      message: `${randomName} has joined the ${randomRegion} sector as a ${randomRole}. Performance target locked at $${randomTarget.toLocaleString()}.`,
      type: 'info'
    });
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  private saveState() {
    try {
      localStorage.setItem('laevos_sales_agents', JSON.stringify(this.agents()));
    } catch {
      // Ignore
    }
  }

  // Synthesized sounds
  private playCrystallineChime() {
    try {
      const WebContext = (window as unknown as { webkitAudioContext: typeof AudioContext })['webkitAudioContext'];
      const ctx = new (window.AudioContext || WebContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Ignore audio failure
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
      // Ignore
    }
  }
}
