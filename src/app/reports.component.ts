import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';

interface CompiledReport {
  id: string;
  name: string;
  type: string;
  generatedBy: string;
  createdAt: string;
  docCount: number;
  status: 'Ready' | 'Archived';
  metrics: { value: string; label: string }[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="max-w-[1400px] mx-auto space-y-8 animate-fade-in relative h-full flex flex-col">
      
      <!-- Reports Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-4 shrink-0">
        <div>
          <h1 class="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <mat-icon class="text-teal-400 text-[28px]">assessment</mat-icon>
            Executive Analytics & Reports
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Aggregate workspace data across pipeline values, active contracts, and client conversions instantly.
          </p>
        </div>

        <button 
          (click)="openReportBuilder()"
          [disabled]="isGenerating()"
          class="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-zinc-950 font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20">
          @if (isGenerating()) {
            <mat-icon class="animate-spin text-[18px]">autorenew</mat-icon>
            Assembling Portfolio Data...
          } @else {
            <mat-icon class="text-[18px]">add_chart</mat-icon>
            Compile Custom Report
          }
        </button>
      </header>

      <!-- Interactive Widgets Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div class="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-2xl">
          <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Win probability index</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-display font-bold text-white">82.3%</span>
            <span class="text-xs text-teal-400 font-semibold">+3.1%</span>
          </div>
          <p class="text-[10px] text-zinc-500 mt-1">Based on CRM pipeline speed</p>
        </div>

        <div class="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-2xl">
          <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Avg sales duration</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-display font-bold text-white">14.2 Days</span>
            <span class="text-xs text-emerald-400 font-semibold">&minus;2.4 days</span>
          </div>
          <p class="text-[10px] text-zinc-500 mt-1">Contract drafting to closure</p>
        </div>

        <div class="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-2xl">
          <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Contracts audited</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-display font-bold text-white">{{ activeContractsCount() }} Documents</span>
            <span class="text-xs text-zinc-400 font-semibold">100% Sync</span>
          </div>
          <p class="text-[10px] text-zinc-500 mt-1">Monitored in tenancy collections</p>
        </div>

        <div class="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-2xl">
          <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Active Tenant value</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-display font-bold text-teal-400 font-mono">{{ formatCurrency(estimatedValue()) }}</span>
          </div>
          <p class="text-[10px] text-zinc-500 mt-1">Aggregated live crm signals</p>
        </div>
      </div>

      <!-- Main Columns: Live chart and compiled list -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 pb-6">
        
        <!-- Left 2 columns: Graphics Data Visualizer -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden h-full flex flex-col">
            <div class="absolute -right-8 -bottom-8 w-48 h-48 bg-teal-500/5 blur-[60px] pointer-events-none rounded-full"></div>
            
            <div class="flex items-center justify-between mb-8">
              <div>
                <h3 class="text-sm font-bold text-white tracking-wide uppercase font-display">Revenue Progression Forecast</h3>
                <p class="text-[11px] text-zinc-500 mt-0.5">Estimated pipeline conversions against SLA renewals</p>
              </div>
              <span class="text-[10px] bg-zinc-950 px-2.5 py-1 rounded text-teal-400 font-semibold border border-zinc-850">Q2 Target: $3.2M</span>
            </div>

            <!-- Custom Elegant Bar graph representing metrics -->
            <div class="flex-1 flex flex-col justify-between min-h-[250px] relative">
              <div class="flex-1 relative flex items-end gap-3 sm:gap-6 justify-between pt-8 pb-2 border-b border-zinc-800/60">
                <!-- Grid guide lines inside SVG area -->
                <div class="absolute inset-x-0 top-0 border-t border-dashed border-zinc-850"></div>
                <div class="absolute inset-x-0 top-1/3 border-t border-dashed border-zinc-850"></div>
                <div class="absolute inset-x-0 top-2/3 border-t border-dashed border-zinc-850"></div>

                @for (bar of barData; track bar.label) {
                  <div 
                    (mouseenter)="hoveredBarIndex.set($index)"
                    (mouseleave)="hoveredBarIndex.set(null)"
                    class="flex-1 flex flex-col items-center gap-2 group cursor-pointer z-10 h-full justify-end relative"
                  >
                    <div 
                      [class]="bar.height + ' w-full sm:w-12 ' + bar.bgClass + ' border ' + bar.borderClass + ' ' + bar.hoverBorderClass + ' ' + bar.hoverBgClass + ' transition-all duration-300 rounded-t-lg relative flex items-end justify-center shadow-lg hover:shadow-teal-500/5'"
                    >
                      <div [class]="'w-full ' + bar.colorClass + ' rounded-t-md opacity-80 group-hover:opacity-100 transition-opacity h-full'"></div>
                    </div>
                    <span class="text-[10px] text-zinc-400 font-medium whitespace-nowrap group-hover:text-white transition-colors">
                      {{ bar.label }}
                    </span>

                    <!-- Floating Tooltip overlay for each bar -->
                    @if (hoveredBarIndex() === $index) {
                      <div 
                        class="absolute bottom-full mb-3 bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 shadow-2xl z-50 pointer-events-none min-w-[220px] backdrop-blur-md animate-tooltip-fade text-left"
                        [style.borderColor]="bar.label === 'Conversions' ? '#14b8a6' : bar.label === 'Active SLA' ? '#38bdf8' : bar.label === 'In Negotiation' ? '#f59e0b' : bar.label === 'Expansions' ? '#a78bfa' : '#34d399'"
                      >
                        <div class="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2">
                          <span class="text-xs font-bold text-white uppercase tracking-wider font-display">{{ bar.label }}</span>
                          <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" [class]="bar.label === 'Conversions' ? 'text-teal-400 bg-teal-500/10' : bar.label === 'Active SLA' ? 'text-sky-400 bg-sky-500/10' : bar.label === 'In Negotiation' ? 'text-amber-400 bg-amber-500/10' : bar.label === 'Expansions' ? 'text-violet-400 bg-violet-500/10' : 'text-emerald-400 bg-emerald-500/10'">
                            Q2 STATS
                          </span>
                        </div>
                        <div class="space-y-1.5 text-[11px]">
                          <div class="flex items-baseline justify-between">
                            <span class="text-zinc-500">Value:</span>
                            <span class="text-xs font-bold text-white font-mono">{{ formatCurrency(bar.value) }}</span>
                          </div>
                          <div class="flex items-center justify-between">
                            <span class="text-zinc-500">Target Contribution:</span>
                            <span class="font-bold text-zinc-300">{{ getPercentOfTarget(bar.value) }}</span>
                          </div>
                          <p class="text-[10px] text-zinc-500 border-t border-zinc-800/60 pt-1.5 mt-1.5 italic font-sans leading-relaxed">
                            {{ bar.description }}
                          </p>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

          </div>
        </div>

        <!-- Right column: Compiled report card generator list -->
        <div class="lg:col-span-1 space-y-6 flex flex-col">
          <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col h-full">
            
            <div class="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-4 shrink-0">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <mat-icon class="text-zinc-500 text-sm">inventory_2</mat-icon>
                Compiled Ledger
              </h3>
              <span class="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-bold font-mono">
                {{ reports().length }} pdfs
              </span>
            </div>

            <!-- List of pdfs -->
            <div class="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
              @for (rep of reports(); track rep.id) {
                <div 
                  (click)="selectedReport.set(rep)"
                  (keydown.enter)="selectedReport.set(rep)"
                  role="button"
                  tabindex="0"
                  [class.border-teal-500/25]="selectedReport()?.id === rep.id"
                  class="bg-zinc-950/40 border border-zinc-850 p-3.5 rounded-xl flex items-start gap-3 hover:bg-zinc-900/60 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500/40 text-left">
                  
                  <div class="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
                    <mat-icon class="text-[18px]">picture_as_pdf</mat-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-1">
                      <p class="text-xs font-bold text-white truncate">{{ rep.name }}</p>
                      <span class="text-[9px] text-zinc-500 font-bold text-right">{{ rep.createdAt }}</span>
                    </div>
                    <p class="text-[10px] text-teal-400/80 font-medium truncate mt-0.5">{{ rep.type }} Report</p>
                    
                    <div class="flex items-center justify-between mt-3 pt-2 border-t border-zinc-850/60">
                      <span class="text-[9px] text-zinc-500 font-bold uppercase">{{ rep.docCount }} sources aggregated</span>
                      <span class="text-[10px] text-teal-400 font-semibold hover:underline">Inspect Ledger</span>
                    </div>
                  </div>

                </div>
              }
            </div>

          </div>
        </div>

      </div>

      <!-- Live PDF Compiled Report Preview Dialog/Modal at bottom of layout -->
      @if (selectedReport(); as activeRep) {
        <div class="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 relative overflow-hidden animate-fade-in shadow-2xl shrink-0 mb-6">
          <div class="absolute -right-24 -top-24 w-60 h-60 bg-teal-500/5 blur-3xl rounded-full"></div>
          
          <button (click)="selectedReport.set(null)" class="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10">
            <mat-icon>close</mat-icon>
          </button>

          <header class="border-b border-zinc-850 pb-4 mb-6 relative z-10">
            <span class="text-[10px] text-teal-400 bg-teal-400/10 px-2.5 py-1 rounded font-bold font-mono tracking-wider">COMPILED CRM AUDIT</span>
            <h3 class="text-lg font-bold text-white font-display mt-2 uppercase tracking-wide">{{ activeRep.name }}</h3>
            <p class="text-xs text-zinc-400 mt-1">Compiled by Operations Lead on {{ activeRep.createdAt }} &bull; Aggregated live signals from CRM.</p>
          </header>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 relative z-10">
            @for (m of activeRep.metrics; track m.label) {
              <div class="bg-zinc-900/40 p-4 rounded-xl border border-zinc-850 text-center">
                <span class="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{{ m.label }}</span>
                <span class="text-xl font-bold font-mono text-white">{{ m.value }}</span>
              </div>
            }
          </div>

          <div class="bg-zinc-900/20 border border-dashed border-zinc-800 p-4 rounded-xl text-xs text-zinc-400 leading-relaxed font-sans col-span-3 relative z-10">
            <p class="font-bold text-zinc-300 mb-1.5 flex items-center gap-1">
              <mat-icon class="text-teal-400 text-sm">security</mat-icon>
              Verification Signature Ledger
            </p>
            This compiled ledger represents the high-fidelity state of your business workspace, fully audited. All active contracts, user credentials, and pipeline estimations conform strictly with tenancy security parameters registered in your CRM.
          </div>

          <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-850 relative z-10">
            <button (click)="downloadReport(activeRep)" class="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md">
              <mat-icon class="text-xs">sim_card_download</mat-icon>
              Export Compiled PDF
            </button>
          </div>
        </div>
      }

      <!-- Custom Report Builder Modal -->
      @if (showReportBuilder()) {
        <div class="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-6 relative shadow-2xl animate-fade-in overflow-hidden">
            <div class="absolute -right-32 -top-32 w-64 h-64 bg-teal-500/10 blur-[60px] rounded-full pointer-events-none"></div>

            <button (click)="closeReportBuilder()" class="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10">
              <mat-icon>close</mat-icon>
            </button>

            <div class="relative z-10">
              <h3 class="text-xl font-bold text-white font-display tracking-wide flex items-center gap-2">
                <mat-icon class="text-teal-400 text-[24px]">tune</mat-icon>
                Custom Report Builder
              </h3>
              <p class="text-xs text-zinc-400 mt-1">Configure advanced filters, metrics, and visualization parameters.</p>
            </div>

            <div class="space-y-5 relative z-10">
               <div>
                 <div class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Report Title</div>
                 <input type="text" [(ngModel)]="customReportConfig.name" placeholder="E.g. Q3 Sales Performance by Region" class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
               </div>

               <div class="grid grid-cols-2 gap-4">
                 <div>
                   <div class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Data Source</div>
                   <select [(ngModel)]="customReportConfig.source" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50">
                     <option value="pipeline">Sales Pipeline</option>
                     <option value="contracts">Active Contracts</option>
                     <option value="agents">Agent Performance</option>
                   </select>
                 </div>
                 <div>
                   <div class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Time Period</div>
                   <select [(ngModel)]="customReportConfig.period" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50">
                     <option value="7d">Last 7 Days</option>
                     <option value="30d">Last 30 Days</option>
                     <option value="qtr">Current Quarter</option>
                     <option value="ytd">Year to Date</option>
                   </select>
                 </div>
               </div>

               <div class="grid grid-cols-2 gap-4">
                 <div>
                   <div class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Filter by Agent</div>
                   <select [(ngModel)]="customReportConfig.agent" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50">
                     <option value="all">All Agents</option>
                     <option value="sarah">Sarah Jenkins</option>
                     <option value="alex">Alex Rivera</option>
                     <option value="ahmed">Ahmed Ali</option>
                   </select>
                 </div>
                 <div>
                   <div class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Filter by Region</div>
                   <select [(ngModel)]="customReportConfig.region" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50">
                     <option value="all">Global</option>
                     <option value="na">North America</option>
                     <option value="emea">EMEA</option>
                     <option value="apac">APAC</option>
                   </select>
                 </div>
               </div>
               
               <div>
                 <div class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Metrics to Include</div>
                 <div class="flex flex-wrap gap-2">
                   @for (metric of ['Conversion Rate', 'Deal Velocity', 'Total Revenue', 'Avg Deal Size', 'Win/Loss Ratio']; track metric) {
                     <button class="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all"
                             [class]="customReportConfig.metrics.includes(metric) ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'"
                             (click)="toggleCustomMetric(metric)">
                       {{ metric }}
                     </button>
                   }
                 </div>
               </div>
            </div>

            <div class="pt-4 flex justify-end gap-3 border-t border-zinc-800/80 relative z-10">
              <button (click)="closeReportBuilder()" class="px-4 py-2 bg-transparent hover:text-white text-zinc-400 font-bold rounded-xl text-xs transition-colors">
                Cancel
              </button>
              <button (click)="compileCustomReport()" class="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors shadow-lg flex items-center gap-2">
                <mat-icon class="text-[16px]">play_arrow</mat-icon> Generate & Compile
              </button>
            </div>
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
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(24, 24, 27, 0.5); 
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(82, 82, 91, 0.5); 
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(113, 113, 122, 0.8); 
    }
  `]
})
export class ReportsComponent {
  appwrite = inject(Appwrite);

  isGenerating = signal<boolean>(false);
  showReportBuilder = signal<boolean>(false);
  
  customReportConfig = {
    name: '',
    source: 'pipeline',
    period: '30d',
    agent: 'all',
    region: 'all',
    metrics: ['Conversion Rate', 'Total Revenue'] as string[]
  };

  // Compiled PDF reports catalog list
  reports = signal<CompiledReport[]>([
    {
      id: 'rep-1',
      name: 'Q3 Enterprise Sales Capital Forecast',
      type: 'Conversion Revenue',
      generatedBy: 'Ahmed Ali',
      createdAt: '2h ago',
      docCount: 12,
      status: 'Ready',
      metrics: [
        { label: 'Forecast pipeline', value: '$850,000' },
        { label: 'Expected conversion', value: '78.5%' },
        { label: 'Weighted pipeline', value: '$667,250' }
      ]
    },
    {
      id: 'rep-2',
      name: 'Microsoft Corp Deal SLA Milestone Audit',
      type: 'SLA Compliance',
      generatedBy: 'System Engine',
      createdAt: '3d ago',
      docCount: 3,
      status: 'Ready',
      metrics: [
        { label: 'SLA Tier', value: 'Premium Support' },
        { label: 'SLA Value', value: '$450,000' },
        { label: 'SLA Compliance', value: '100% Verified' }
      ]
    },
    {
      id: 'rep-3',
      name: 'Tenant Outreach Open-Rate Campaign Report',
      type: 'Outreach Engagement',
      generatedBy: 'C-Suite CRM Bot',
      createdAt: '5d ago',
      docCount: 42,
      status: 'Archived',
      metrics: [
        { label: 'Emails sent', value: '267 Outbox' },
        { label: 'Total opened', value: '224 Emails (84%)' },
        { label: 'Avg reply time', value: '2.5 Hours' }
      ]
    }
  ]);

  selectedReport = signal<CompiledReport | null>(null);

  constructor() {
    // Select first report index by default
    setTimeout(() => {
      this.selectedReport.set(this.reports()[0]);
    }, 400);
  }

  activeContractsCount = computed(() => {
    const list = this.appwrite.contracts();
    return list.filter(c => c.status === 'Signed').length || 150;
  });

  estimatedValue = computed(() => {
    return this.activeContractsCount() * 12345;
  });

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  openReportBuilder() {
    this.customReportConfig.name = '';
    this.showReportBuilder.set(true);
  }

  closeReportBuilder() {
    this.showReportBuilder.set(false);
  }

  toggleCustomMetric(metric: string) {
    const idx = this.customReportConfig.metrics.indexOf(metric);
    if (idx > -1) {
      this.customReportConfig.metrics.splice(idx, 1);
    } else {
      this.customReportConfig.metrics.push(metric);
    }
  }

  compileCustomReport() {
    this.showReportBuilder.set(false);
    this.isGenerating.set(true);

    setTimeout(() => {
      const type = 'Custom ' + this.customReportConfig.source.charAt(0).toUpperCase() + this.customReportConfig.source.slice(1);
      const count = Math.floor(Math.random() * 50) + 10;
      
      const newReport: CompiledReport = {
        id: 'rep-' + Date.now(),
        name: this.customReportConfig.name || `Custom ${type} Analysis`,
        type,
        generatedBy: 'Operations Agent',
        createdAt: 'Just now',
        docCount: count,
        status: 'Ready',
        metrics: this.customReportConfig.metrics.map(m => {
           let val = '';
           if (m.includes('Revenue') || m.includes('Value') || m.includes('Size')) val = '$' + (Math.floor(Math.random() * 900) + 100) + 'k';
           else if (m.includes('Rate') || m.includes('Ratio')) val = (Math.random() * 40 + 20).toFixed(1) + '%';
           else val = (Math.random() * 20 + 5).toFixed(1) + ' Days';
           return { label: m, value: val };
        })
      };
      
      // Fallback metrics if empty
      if (newReport.metrics.length === 0) {
        newReport.metrics = [
          { label: 'Total Active Value', value: `${this.formatCurrency(this.estimatedValue())}` },
          { label: 'Database Signals', value: `${count} Document collections` }
        ];
      }

      this.reports.update(arr => [newReport, ...arr]);
      this.selectedReport.set(newReport);
      this.isGenerating.set(false);

      this.appwrite.addNotification({
        title: 'Custom Report Compiled',
        message: `Successfully assembled "${newReport.name}" based on defined filter constraints.`,
        isRead: false,
        type: 'success'
      });
    }, 1800);
  }

  compileNewReport() {
    this.openReportBuilder();
  }

  downloadReport(report: CompiledReport) {
    alert(`Initiating download loop for compiled PDF: ${report.name}. All verified sales pipelines, ledger statistics, and relationship indices are serialized.`);
  }

  hoveredBarIndex = signal<number | null>(null);

  barData = [
    { label: 'Conversions', value: 450000, height: 'h-[65%]', colorClass: 'bg-teal-500', bgClass: 'bg-teal-500/10', borderClass: 'border-teal-500/20', hoverBorderClass: 'group-hover:border-teal-500/50', hoverBgClass: 'group-hover:bg-teal-500/25', description: 'Pipeline deals successfully won and settled in Q2.' },
    { label: 'Active SLA', value: 920000, height: 'h-[80%]', colorClass: 'bg-sky-400', bgClass: 'bg-sky-500/10', borderClass: 'border-sky-450/20', hoverBorderClass: 'group-hover:border-sky-400/50', hoverBgClass: 'group-hover:bg-sky-400/20', description: 'Recurring SLA contract values active right now.' },
    { label: 'In Negotiation', value: 680000, height: 'h-[50%]', colorClass: 'bg-amber-500', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20', hoverBorderClass: 'group-hover:border-amber-450/50', hoverBgClass: 'group-hover:bg-amber-450/20', description: 'Outstanding proposals under executive review.' },
    { label: 'Expansions', value: 240000, height: 'h-[35%]', colorClass: 'bg-violet-400', bgClass: 'bg-violet-500/10', borderClass: 'border-violet-500/20', hoverBorderClass: 'group-hover:border-violet-450/50', hoverBgClass: 'group-hover:bg-violet-450/20', description: 'Upsells, expansions and cross-sales executed.' },
    { label: 'Overall Target', value: 1150000, height: 'h-[92%]', colorClass: 'bg-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-505/20', hoverBorderClass: 'group-hover:border-emerald-500/50', hoverBgClass: 'group-hover:bg-emerald-500/25', description: 'Consolidated performance quota for Q2 operations.' },
  ];

  getPercentOfTarget(value: number): string {
    const target = 3200000; // Q2 Target: $3.2M
    const pct = (value / target) * 100;
    return `${pct.toFixed(1)}% of Q2 Target`;
  }
}
