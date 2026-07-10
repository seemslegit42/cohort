import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Appwrite } from './appwrite';

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: 'Lead' | 'Contacted' | 'Proposal' | 'Negotiation' | 'Won';
  owner: string;
}

@Component({
  selector: 'app-clients',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      
      <!-- Clients Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-4">
        <div>
          <h1 class="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <mat-icon class="text-teal-400 text-[28px]">business</mat-icon>
            Enterprise Portfolio Accounts
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Monitor client account status, execute pipeline progression, and analyze deal values in real time.
          </p>
        </div>

        <!-- View Switcher Tabs -->
        <div class="bg-zinc-950/60 p-1 rounded-xl border border-zinc-800/80 flex gap-1 shadow-inner self-start sm:self-auto">
          <button 
            (click)="activeTab.set('pipeline')"
            [class]="activeTab() === 'pipeline' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold' : 'text-zinc-400 hover:text-zinc-200'"
            class="px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2">
            <mat-icon class="text-sm">view_week</mat-icon>
            Interactive Deal Kanban
          </button>
          <button 
            (click)="activeTab.set('accounts')"
            [class]="activeTab() === 'accounts' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold' : 'text-zinc-400 hover:text-zinc-200'"
            class="px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2">
            <mat-icon class="text-sm">list_alt</mat-icon>
            Account Directory
          </button>
        </div>
      </header>

      <!-- TAB 1: DEAL KANBAN PIPELINE -->
      @if (activeTab() === 'pipeline') {
        <div class="space-y-6">
          <!-- Pipeline stats summary -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-900/20 backdrop-blur-md p-4 rounded-2xl border border-zinc-800/80">
            <div>
              <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Pipeline Value</span>
              <span class="text-lg font-bold text-teal-400 font-mono">{{ formatCurrency(totalPipelineValue()) }}</span>
            </div>
            <div>
              <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Average Deal Size</span>
              <span class="text-lg font-bold text-white font-mono">{{ formatCurrency(avgDealSize()) }}</span>
            </div>
            <div>
              <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Deals</span>
              <span class="text-lg font-bold text-white font-display">{{ pipelineDeals().length }} Deals</span>
            </div>
            <div>
              <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Conversion Rate</span>
              <span class="text-lg font-bold text-emerald-400 font-mono">74.2%</span>
            </div>
          </div>

          <!-- Board layout -->
          <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto min-h-[500px] pb-6">
            
            <!-- Column Stage Loop -->
            @for (stage of stages; track stage) {
              <div class="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex flex-col space-y-4 min-w-[240px]">
                <!-- Column Header -->
                <div class="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                  <div class="flex items-center gap-2">
                    <span [class]="getStageColorClass(stage)" class="w-2.5 h-2.5 rounded-full"></span>
                    <h3 class="text-xs font-bold text-white tracking-wider uppercase font-display">{{ stage }}</h3>
                  </div>
                  <span class="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full font-bold text-zinc-400 font-mono">
                    {{ getDealsByStage(stage).length }}
                  </span>
                </div>

                <!-- Column Items list -->
                <div class="flex-1 space-y-3">
                  @for (deal of getDealsByStage(stage); track deal.id) {
                    <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 hover:border-zinc-750 hover:bg-zinc-850/60 transition-all cursor-pointer relative group">
                      
                      <!-- Absolute decorative flare on hover -->
                      <div class="absolute inset-y-0 left-0 w-1 bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl"></div>
                      
                      <div class="space-y-1.5">
                        <span class="block text-[9px] font-bold text-teal-400 uppercase tracking-wider">{{ deal.company }}</span>
                        <h4 class="text-xs font-bold text-zinc-100 leading-snug group-hover:text-white transition-colors">{{ deal.title }}</h4>
                        <p class="text-[11px] font-mono text-zinc-400 font-bold mt-1">{{ formatCurrency(deal.value) }}</p>
                      </div>

                      <div class="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/50">
                        <span class="text-[10px] text-zinc-500 flex items-center gap-1">
                          <mat-icon class="text-[12px] text-zinc-500">person</mat-icon>
                          {{ deal.owner }}
                        </span>
                        
                        <!-- Mini advancement buttons -->
                        <div class="flex items-center gap-1">
                          @if (stage !== 'Won') {
                            <button 
                              (click)="advanceDeal(deal.id)"
                              title="Advance Deal Stage"
                              class="p-1 rounded bg-teal-500/10 text-teal-400 hover:bg-teal-550 hover:text-zinc-950 transition-colors">
                              <mat-icon class="text-xs">arrow_forward</mat-icon>
                            </button>
                          }
                          <button 
                            (click)="deleteDeal(deal.id)"
                            title="Delete Deal"
                            class="p-1 rounded bg-zinc-850 text-zinc-50 hover:bg-rose-500/20 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                            <mat-icon class="text-xs">delete</mat-icon>
                          </button>
                        </div>
                      </div>

                    </div>
                  } @empty {
                    <!-- Empty Column placeholder -->
                    <div class="h-32 rounded-xl border border-dashed border-zinc-800/80 flex flex-col items-center justify-center text-center p-4">
                      <p class="text-[10px] text-zinc-650 font-medium">No candidates in stage</p>
                    </div>
                  }
                </div>

                <!-- Add quick deal placeholder button -->
                <button 
                  (click)="quickAddDeal(stage)"
                  class="w-full py-2 bg-zinc-900/20 hover:bg-zinc-800 border border-dashed border-zinc-800/80 rounded-xl text-[11px] text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-1.5 font-medium">
                  <mat-icon class="text-xs">add</mat-icon>
                  Quick Deal
                </button>

              </div>
            }

          </div>
        </div>
      }

      <!-- TAB 2: PORTFOLIO CLIENT ACCOUNTS DIRECTORY -->
      @if (activeTab() === 'accounts') {
        <div class="space-y-6">
          <div class="text-xs text-zinc-400 bg-zinc-950/40 p-4 border border-zinc-850 rounded-2xl">
            Showing key enterprise accounts synchronized with your workspace. Add contacts on the 
            <a href="/contacts" class="text-teal-400 font-bold underline hover:text-teal-300">Contacts Desk</a> 
            to enrich this client intelligence directory automatically.
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (client of clientAccounts(); track client.name) {
              <div class="bg-zinc-900/40 border border-zinc-850 hover:border-teal-500/20 rounded-2xl p-6 transition-all relative overflow-hidden group">
                
                <!-- Glowing corner accent -->
                <div class="absolute -right-12 -top-12 w-28 h-28 bg-teal-500/5 blur-3xl rounded-full group-hover:bg-teal-500/10 transition-all duration-500"></div>

                <div class="flex items-start gap-4 mb-5">
                  <div class="w-12 h-12 bg-zinc-800 rounded-xl border border-zinc-700/80 flex items-center justify-center text-teal-400 shadow-md">
                    <mat-icon class="text-[25px]">business</mat-icon>
                  </div>
                  <div>
                    <h3 class="text-white font-bold text-base font-display tracking-tight">{{ client.name }}</h3>
                    <p class="text-zinc-500 text-xs mt-0.5">{{ client.region || 'Enterprise Account' }} &bull; Portfolio Client</p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3 bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-900 font-sans mb-5">
                  <div>
                    <span class="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Active Deals</span>
                    <span class="text-xs font-bold text-zinc-200">{{ client.activeDealsCount }}</span>
                  </div>
                  <div>
                    <span class="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Account Pipeline</span>
                    <span class="text-xs font-bold text-teal-400 font-mono">{{ formatCurrency(client.totalPipeline) }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full" [class]="client.status === 'Active' ? 'bg-teal-400' : 'bg-zinc-600'"></span>
                    <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{{ client.status }} Account</span>
                  </div>
                  <button 
                    (click)="triggerAccountCampaign(client.name)"
                    class="text-teal-400 text-xs font-bold hover:text-teal-300 transition-colors flex items-center gap-1 bg-teal-400/10 px-2.5 py-1.5 rounded-lg border border-teal-400/20">
                    <mat-icon class="text-xs">bolt</mat-icon>
                    Nurture AI
                  </button>
                </div>

              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ClientsComponent {
  appwrite = inject(Appwrite);

  activeTab = signal<'pipeline' | 'accounts'>('pipeline');
  
  stages: ('Lead' | 'Contacted' | 'Proposal' | 'Negotiation' | 'Won')[] = [
    'Lead', 'Contacted', 'Proposal', 'Negotiation', 'Won'
  ];

  // Pipeline deals state
  pipelineDeals = signal<Deal[]>([
    { id: 'deal-1', title: 'Enterprise Cloud SLA Integration', company: 'Microsoft', value: 450000, stage: 'Won', owner: 'Bill Gates' },
    { id: 'deal-2', title: 'Workspace Expansion Suite v2', company: 'Salesforce', value: 180000, stage: 'Proposal', owner: 'Marc Benioff' },
    { id: 'deal-3', title: 'Productivity Platform Co-Investment', company: 'Slack', value: 65000, stage: 'Lead', owner: 'Stewart Butterfield' },
    { id: 'deal-4', title: 'Corporate Logistics Renewal SLA', company: 'FedEx Corp', value: 125000, stage: 'Negotiation', owner: 'Fred Smith' },
    { id: 'deal-5', title: 'SaaS Platform Analytics Suite', company: 'Acme Corp', value: 35000, stage: 'Contacted', owner: 'Sarah Jenkins' }
  ]);

  // Derived dashboard analytics
  totalPipelineValue = computed(() => {
    return this.pipelineDeals().reduce((acc, current) => acc + current.value, 0);
  });

  avgDealSize = computed(() => {
    const deals = this.pipelineDeals();
    return deals.length > 0 ? (this.totalPipelineValue() / deals.length) : 0;
  });

  // Unique clients derived from contacts database
  clientAccounts = computed(() => {
    interface ClientCompany {
      name: string;
      region: string;
      activeDealsCount: number;
      totalPipeline: number;
      status: string;
    }
    const list = this.appwrite.contacts();
    const map = new Map<string, ClientCompany>();

    // Seed defaults in case contacts list is empty
    const seedCompanies: ClientCompany[] = [
      { name: 'Microsoft', region: 'Seattle, WA', activeDealsCount: 1, totalPipeline: 450000, status: 'Active' },
      { name: 'Salesforce', region: 'San Francisco, CA', activeDealsCount: 1, totalPipeline: 180000, status: 'Active' },
      { name: 'Slack', region: 'Vancouver, BC', activeDealsCount: 1, totalPipeline: 65000, status: 'Active' },
      { name: 'FedEx Corp', region: 'Memphis, TN', activeDealsCount: 1, totalPipeline: 125000, status: 'Active' },
      { name: 'Acme Corp', region: 'Austin, TX', activeDealsCount: 1, totalPipeline: 35000, status: 'Active' }
    ];

    // Read live and append/merge
    seedCompanies.forEach(sc => map.set(sc.name, sc));

    list.forEach(c => {
      if (c.company) {
        if (map.has(c.company)) {
          const current = map.get(c.company);
          if (current) {
            map.set(c.company, {
              ...current,
              activeDealsCount: current.activeDealsCount + 1,
              totalPipeline: current.totalPipeline + (parseFloat(c.dealValue) || 15000)
            });
          }
        } else {
          map.set(c.company, {
            name: c.company,
            region: 'Global Portfolio',
            activeDealsCount: 1,
            totalPipeline: parseFloat(c.dealValue) || 15000,
            status: 'Active'
          });
        }
      }
    });

    return Array.from(map.values());
  });

  getDealsByStage(stage: string): Deal[] {
    return this.pipelineDeals().filter(d => d.stage === stage);
  }

  getStageColorClass(stage: string): string {
    switch (stage) {
      case 'Lead': return 'bg-teal-500';
      case 'Contacted': return 'bg-sky-400';
      case 'Proposal': return 'bg-amber-400';
      case 'Negotiation': return 'bg-violet-400';
      case 'Won': return 'bg-emerald-400';
      default: return 'bg-zinc-500';
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  advanceDeal(id: string) {
    this.pipelineDeals.update(deals => {
      return deals.map(d => {
        if (d.id === id) {
          const targetIndex = this.stages.indexOf(d.stage) + 1;
          const nextStage = this.stages[targetIndex] || d.stage;
          
          // If advanced to 'Won', trigger dynamic success alert
          if (nextStage === 'Won') {
            this.appwrite.addNotification({
              title: 'Deal Pipeline Success',
              message: `Congratulations! ${d.company}'s deal "${d.title}" progressed to CLOSED WON!`,
              isRead: false,
              type: 'success'
            });
          }
          return { ...d, stage: nextStage };
        }
        return d;
      });
    });
  }

  deleteDeal(id: string) {
    if (confirm('Are you sure you want to remove this deal from the interactive pipeline?')) {
      this.pipelineDeals.update(arr => arr.filter(d => d.id !== id));
    }
  }

  quickAddDeal(stage: 'Lead' | 'Contacted' | 'Proposal' | 'Negotiation' | 'Won') {
    const titles = [
      'Strategic API Consultation SLA',
      'Unified Identity SaaS Upgrade',
      'Advanced Marketing Insights Suite',
      'Data Lake Storage Partnership'
    ];
    const companies = ['Google Cloud', 'Netflix Inc', 'Airbnb Corp', 'Stripe Inc'];
    const values = [45000, 95000, 150000, 310000];
    const owners = ['Sundar Pichai', 'Reed Hastings', 'Brian Chesky', 'Patrick Collison'];

    const randomIndex = Math.floor(Math.random() * titles.length);
    
    const newDeal: Deal = {
      id: 'custom-' + Date.now(),
      title: titles[randomIndex],
      company: companies[randomIndex],
      value: values[randomIndex],
      stage,
      owner: owners[randomIndex]
    };

    this.pipelineDeals.update(arr => [...arr, newDeal]);

    // Also trigger feedback
    this.appwrite.addNotification({
      title: 'Deal Registered',
      message: `Registered quick pipeline deal for ${newDeal.company} valued at $${newDeal.value / 1000}k`,
      isRead: false,
      type: 'info'
    });
  }

  triggerAccountCampaign(clientName: string) {
    alert(`Nurturing account intelligence loop active. AI engines at ΛΞVOS are auditing ${clientName}'s social signals, LinkedIn engagements and public newsletters to compile fresh outreach suggestions on your dashboard.`);
  }
}
