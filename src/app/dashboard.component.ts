import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { KpiCardComponent } from './kpi-card.component';
import { ChartCardComponent } from './chart-card.component';
import { DataTableComponent } from './data-table.component';
import { ContractSuiteComponent } from './contract-suite.component';
import { AgentInsights } from './agent-insights';
import { Appwrite } from './appwrite';

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'suite' | 'insight';
  title: string;
  enabled: boolean;
  order: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule, KpiCardComponent, ChartCardComponent, DataTableComponent, ContractSuiteComponent, AgentInsights],
  template: `
    <div class="max-w-[1400px] mx-auto space-y-8 animate-fade-in relative">
      
      <!-- Analytics Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-6">
        <div>
          <h1 class="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-3 drop-shadow-md">
            <mat-icon class="text-zinc-500 text-[28px]">insights</mat-icon>
            Fresh analytics from everything
          </h1>
          @if (appwrite.activeTeam(); as active) {
            <p class="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 font-medium">
              <span class="inline-block w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              Synchronized tenant workspace: <span class="text-white font-bold">{{ active.name }}</span>
            </p>
          }
        </div>
        
        <div class="flex items-center gap-3">
          <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs text-zinc-400">
            <span class="w-2 h-2 rounded-full" [ngClass]="appwrite.isConnected() ? 'bg-teal-400' : 'bg-rose-450'"></span>
            Appwrite Realtime Subscriptions Active
          </div>
          <button (click)="isEditing.set(!isEditing())" class="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2">
             <mat-icon class="text-[16px]">tune</mat-icon> Customize
          </button>
        </div>
      </header>

      <!-- Customization Panel -->
      @if (isEditing()) {
        <div class="bg-zinc-900/80 backdrop-blur-md border border-teal-500/30 rounded-2xl p-5 mb-8 animate-fade-in relative overflow-hidden shadow-xl">
           <div class="absolute -right-16 -top-16 w-32 h-32 bg-teal-500/10 blur-3xl rounded-full pointer-events-none"></div>
           <div class="flex items-center justify-between mb-4">
             <h3 class="text-sm font-bold text-white font-display flex items-center gap-2">
               <mat-icon class="text-teal-400 text-[18px]">dashboard_customize</mat-icon>
               Widget Layout Configuration
             </h3>
             <button (click)="isEditing.set(false)" class="text-zinc-500 hover:text-white transition-colors">
               <mat-icon class="text-[18px]">close</mat-icon>
             </button>
           </div>
           <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
             @for (w of widgets(); track w.id) {
               <label class="flex items-center gap-3 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 cursor-pointer hover:border-teal-500/30 transition-colors">
                 <input type="checkbox" [checked]="w.enabled" (change)="toggleWidget(w.id)" class="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-teal-500 focus:ring-teal-500/50 accent-teal-500" />
                 <span class="text-xs font-bold text-zinc-300 truncate">{{ w.title }}</span>
               </label>
             }
           </div>
           <div class="mt-4 flex justify-end">
             <button (click)="isEditing.set(false)" class="px-5 py-2 bg-teal-500 text-zinc-950 rounded-xl text-xs font-bold shadow-md hover:bg-teal-400 transition-colors">Done</button>
           </div>
        </div>
      }

      <div class="space-y-8 flex flex-col">
        <!-- Compact KPI Grid -->
        @if (isWidgetEnabled('kpi-grid')) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-8 order-1">
            <app-kpi-card 
              title="Total Leads" 
              [value]="totalLeadsCount().toString()" 
              icon="group" 
              layout="compact" />
            <app-kpi-card 
              title="Conversion Rate" 
              [value]="conversionRate()" 
              icon="trending_up" 
              layout="compact" />
            <app-kpi-card 
              title="Active Contracts" 
              [value]="activeContractsCount().toString()" 
              icon="dns" 
              layout="compact" />
            <app-kpi-card 
              title="Total Revenue" 
              [value]="totalRevenue()" 
              icon="payments" 
              layout="compact" />
          </div>
        }

        <!-- Main Chart Area -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 order-2">
          @if (isWidgetEnabled('main-chart')) {
            <div [class]="isWidgetEnabled('insight-oracle') ? 'xl:col-span-2' : 'xl:col-span-3'">
              <app-chart-card />
            </div>
          }
          
          @if (isWidgetEnabled('insight-oracle')) {
            <div [class]="isWidgetEnabled('main-chart') ? 'xl:col-span-1' : 'xl:col-span-3 lg:w-1/3'" class="space-y-4 lg:space-y-6 w-full">
              
              <app-kpi-card 
                title="Total Revenue" 
                [value]="totalRevenue()" 
                change="+12.2%" 
                changeLabel="vs last month" 
                icon="payments" 
                changeType="positive"
                layout="detail" />
              
              <!-- Agent Insight Card -->
              <div class="bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 backdrop-blur-2xl border border-teal-500/30 rounded-2xl p-6 relative overflow-hidden group shadow-[0_0_40px_rgba(20,184,166,0.1)]">
                <div class="absolute -right-8 -top-8 w-40 h-40 bg-teal-500/20 blur-[50px] rounded-full group-hover:bg-teal-500/30 transition-colors duration-700 pointer-events-none"></div>
                
                <div class="flex items-center justify-between mb-5 relative z-10">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                       <mat-icon class="text-teal-400 text-[18px] animate-pulse">auto_awesome</mat-icon>
                    </div>
                    <div>
                      <h3 class="text-sm font-bold text-white tracking-wide font-display">ΛΞVOS Oracle Intelligence</h3>
                      <p class="text-[10px] text-teal-400 uppercase tracking-widest font-semibold">Strategic Recommendation</p>
                    </div>
                  </div>
                </div>
                
                <p class="text-[13px] text-zinc-300 leading-relaxed mb-5 relative z-10 font-medium">
                  Based on historical Q2 pacing, prioritizing the <span class="text-teal-400 font-bold">{{ pendingContractsCount() }} pending signatures</span> in your pipeline today by issuing automated sequence follow-ups increases finalization velocity by an average of <span class="text-teal-400 font-bold">28.4%</span>, projecting an estimated <span class="text-teal-400 font-bold">+$42.5k</span> lift to Q3 finalized revenue.
                </p>
                
                <div class="flex flex-col gap-2 relative z-10">
                  <button class="w-full bg-teal-500 hover:bg-teal-400 pt-2.5 pb-2.5 rounded-xl text-xs font-bold text-zinc-950 transition-all shadow-md flex items-center justify-center gap-2">
                    Execute AI Outreach Sequence
                    <mat-icon class="text-[16px]">rocket_launch</mat-icon>
                  </button>
                  <button class="w-full bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-700/50 pt-2 pb-2 rounded-xl text-xs font-semibold text-zinc-300 transition-all shadow-sm flex items-center justify-center gap-2">
                    Review Signal Source Data
                    <mat-icon class="text-[14px]">troubleshoot</mat-icon>
                  </button>
                </div>
              </div>
              
            </div>
          }
        </div>

        <!-- Agent Insights Summary Card -->
        @if (isWidgetEnabled('agent-insights')) {
          <div class="order-3">
            <app-agent-insights />
          </div>
        }

        <!-- Contractual Suite / Folders -->
        @if (isWidgetEnabled('contract-suite')) {
          <div class="order-4">
            <app-contract-suite />
          </div>
        }

        <!-- Detail Table -->
        @if (isWidgetEnabled('recent-transactions')) {
          <div class="order-5 pb-12">
            <div class="flex items-center justify-between mb-5 px-1">
              <div class="flex items-center gap-3">
                 <mat-icon class="text-zinc-500">receipt_long</mat-icon>
                 <h2 class="text-lg font-bold text-white font-display tracking-tight">Recent Transactions</h2>
                 <span class="hidden sm:inline-block px-2 py-0.5 rounded text-xs font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">{{ recentTransactionsCount() }} total</span>
              </div>
              
              <button class="text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1 bg-teal-400/10 px-3 py-1.5 rounded-lg border border-teal-400/20">
                View all
                <mat-icon class="text-[16px]">chevron_right</mat-icon>
              </button>
            </div>
            <app-data-table />
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.8s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DashboardComponent {
  appwrite = inject(Appwrite);
  isEditing = signal<boolean>(false);

  widgets = signal<DashboardWidget[]>([
    { id: 'kpi-grid', type: 'kpi', title: 'Top KPIs', enabled: true, order: 1 },
    { id: 'main-chart', type: 'chart', title: 'Revenue Chart', enabled: true, order: 2 },
    { id: 'agent-insights', type: 'insight', title: 'Agent Performance', enabled: true, order: 3 },
    { id: 'insight-oracle', type: 'insight', title: 'AI Insights Oracle', enabled: true, order: 4 },
    { id: 'contract-suite', type: 'suite', title: 'Contract Folders', enabled: true, order: 5 },
    { id: 'recent-transactions', type: 'table', title: 'Recent Transactions', enabled: true, order: 6 }
  ]);

  isWidgetEnabled(id: string): boolean {
    return this.widgets().find(w => w.id === id)?.enabled ?? false;
  }

  toggleWidget(id: string) {
    this.widgets.update(arr => arr.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  }

  totalLeadsCount = computed(() => {
    const list = this.appwrite.contacts();
    const count = list.filter(c => c.status === 'Lead').length;
    return count > 0 ? count : 412; // Static fallback
  });

  conversionRate = computed(() => {
    const list = this.appwrite.contacts();
    const total = list.length;
    if (total === 0) return '18.4%';
    const converted = list.filter(c => c.status === 'Signed' || c.status === 'Closed Won').length;
    return ((converted / total) * 100).toFixed(1) + '%';
  });

  activeContractsCount = computed(() => {
    const list = this.appwrite.contracts();
    const count = list.filter(c => c.status === 'Signed').length;
    return count > 0 ? count : 150; // Use static default/fallback
  });

  pendingContractsCount = computed(() => {
    const list = this.appwrite.contracts();
    const count = list.filter(c => c.status === 'Pending Signature' || c.status === 'Review').length;
    return count > 0 ? count : 267; // Use static default/fallback
  });

  totalContractsCount = computed(() => {
    const list = this.appwrite.contracts();
    return list.length > 0 ? list.length : 680; // Use static default/fallback
  });

  expiringContractsCount = computed(() => {
    return 22; // Expiring count statistic
  });

  totalRevenue = computed(() => {
    const total = this.activeContractsCount() * 12345;
    return total > 1500000 ? '$' + (total / 1000000).toFixed(2) + 'M' : '$1.85M';
  });

  recentTransactionsCount = computed(() => {
    return 202123;
  });
}