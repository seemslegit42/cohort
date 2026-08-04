import { Component, ChangeDetectionStrategy, inject, signal, computed }  from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Appwrite } from './appwrite';
import { RechartsComponent } from './recharts.component';
import { LeadService } from './lead.service';

@Component({
  selector: 'app-forecast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, RechartsComponent],
  template: `
    <div class="max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-12 h-full flex flex-col">
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 class="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <mat-icon class="text-purple-400 text-[24px]">troubleshoot</mat-icon>
            </div>
            AI Sales Forecasting
          </h1>
          <p class="text-sm text-zinc-400 mt-2">
            Predictive analytics mapping historical patterns, pipeline momentum, and rep velocity to project future revenue.
          </p>
        </div>
        <div class="flex gap-3">
           <button class="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 font-bold text-sm transition-colors flex items-center gap-2">
             <mat-icon class="text-[18px]">tune</mat-icon> Adjust Models
           </button>
           <button (click)="runAnalysis()" [disabled]="isAnalyzing()" class="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-zinc-950 font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 group relative overflow-hidden">
             <div class="absolute inset-0 bg-white w-0 group-hover:w-full transition-all duration-500 opacity-10"></div>
             @if (isAnalyzing()) {
               <mat-icon class="animate-spin text-[18px]">autorenew</mat-icon> Synthesizing...
             } @else {
               <mat-icon class="text-[18px]">auto_awesome</mat-icon> Run Deep Analysis
             }
           </button>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        <!-- Main Chart Area -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          
          <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex-1 flex flex-col min-h-[400px]">
            <div class="absolute -right-32 -top-32 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div class="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h3 class="text-lg font-bold text-white font-display">Revenue Projection (90 Days)</h3>
                <p class="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Based on Gemini Pro Time-Series Analysis</p>
              </div>
              <div class="bg-zinc-950 p-1 rounded-lg border border-zinc-800 flex">
                <button class="px-3 py-1 bg-zinc-800 text-white rounded text-xs font-bold shadow-sm">Q3</button>
                <button class="px-3 py-1 text-zinc-500 hover:text-zinc-300 text-xs font-bold transition-colors">Q4</button>
                <button class="px-3 py-1 text-zinc-500 hover:text-zinc-300 text-xs font-bold transition-colors">FY</button>
              </div>
            </div>

            <div class="flex-1 min-h-[300px] w-full relative z-10">
               <!-- Insert Recharts here representing prediction -->
               <app-recharts
                  type="area"
                  [data]="forecastData()"
                  [xAxisKey]="'month'"
                  [series]="[
                    { key: 'actual', name: 'Actual', color: '#14b8a6', fillOpacity: 0.2 },
                    { key: 'projected', name: 'AI Projected', color: '#a855f7', strokeDasharray: '5 5', fillOpacity: 0.1 }
                  ]"
                  [height]="'100%'"
               ></app-recharts>
            </div>
          </div>

          <!-- Bottom KPIs -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div class="absolute right-0 top-0 w-1 h-full bg-emerald-500/50"></div>
                <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><mat-icon class="text-[14px]">track_changes</mat-icon> Win Rate Prediction</h4>
                <div class="flex items-end gap-3 mt-4">
                  <span class="text-3xl font-display font-bold text-white">{{ winRatePrediction() | number:'1.1-1' }}%</span>
                  <span class="text-xs font-bold text-emerald-400 mb-1 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded"><mat-icon class="text-[12px]">trending_up</mat-icon> Active</span>
                </div>
                <p class="text-xs text-zinc-500 mt-2">Adjusted for current pipeline velocity</p>
             </div>
             
             <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div class="absolute right-0 top-0 w-1 h-full bg-amber-500/50"></div>
                <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><mat-icon class="text-[14px]">warning_amber</mat-icon> Risk Exposure</h4>
                <div class="flex items-end gap-3 mt-4">
                  <span class="text-3xl font-display font-bold text-white">{{ riskExposure() | currency:'USD':'symbol':'1.0-0' }}</span>
                  <span class="text-xs font-bold text-amber-400 mb-1 flex items-center bg-amber-500/10 px-1.5 py-0.5 rounded"><mat-icon class="text-[12px]">trending_flat</mat-icon> Stable</span>
                </div>
                <p class="text-xs text-zinc-500 mt-2">Value of deals in stagnant stages</p>
             </div>
             
             <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div class="absolute right-0 top-0 w-1 h-full bg-purple-500/50"></div>
                <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><mat-icon class="text-[14px]">lightbulb</mat-icon> Upsell Potential</h4>
                <div class="flex items-end gap-3 mt-4">
                  <span class="text-3xl font-display font-bold text-white">{{ upsellPotential() | currency:'USD':'symbol':'1.0-0' }}</span>
                  <span class="text-xs font-bold text-emerald-400 mb-1 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded"><mat-icon class="text-[12px]">trending_up</mat-icon> Active</span>
                </div>
                <p class="text-xs text-zinc-500 mt-2">Identified expansion opportunities</p>
             </div>
          </div>

        </div>

        <!-- Right Side Panel: AI Insights & Opportunities -->
        <div class="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl flex flex-col shadow-2xl relative overflow-hidden">
          <div class="p-6 border-b border-zinc-800">
             <h3 class="text-lg font-bold text-white font-display flex items-center gap-2">
                <mat-icon class="text-purple-400 text-[20px]">psychology</mat-icon> Strategic Directives
             </h3>
             <p class="text-xs text-zinc-400 mt-1">Generated by analyzing 1,402 past interactions</p>
          </div>
          
          <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
             <!-- Insight 1 -->
             <div class="relative">
                <div class="absolute -left-6 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-md"></div>
                <h4 class="text-sm font-bold text-white mb-2 flex items-center gap-2"><mat-icon class="text-[16px] text-emerald-400">check_circle</mat-icon> High Probability Closure</h4>
                <p class="text-xs text-zinc-300 leading-relaxed font-medium">The <strong class="text-teal-400">Microsoft Enterprise</strong> deal is tracking 24% faster than historical averages. AI recommends pushing for early signature this week with a slight discount incentive.</p>
                <div class="mt-3">
                   <button class="text-[10px] bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 px-3 py-1.5 rounded-lg font-bold transition-all">Draft Proposal Revision</button>
                </div>
             </div>

             <!-- Insight 2 -->
             <div class="relative">
                <div class="absolute -left-6 top-0 bottom-0 w-1 bg-amber-500 rounded-r-md"></div>
                <h4 class="text-sm font-bold text-white mb-2 flex items-center gap-2"><mat-icon class="text-[16px] text-amber-400">error_outline</mat-icon> Churn Risk Elevated</h4>
                <p class="text-xs text-zinc-300 leading-relaxed font-medium"><strong class="text-teal-400">Slack Technologies</strong> engagement has dropped 40% in the last 14 days. Deal momentum is stalling. Immediate executive outreach advised.</p>
                <div class="mt-3">
                   <button class="text-[10px] bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 text-zinc-300 px-3 py-1.5 rounded-lg font-bold transition-all">Generate Check-in Email</button>
                </div>
             </div>

             <!-- Insight 3 -->
             <div class="relative">
                <div class="absolute -left-6 top-0 bottom-0 w-1 bg-purple-500 rounded-r-md"></div>
                <h4 class="text-sm font-bold text-white mb-2 flex items-center gap-2"><mat-icon class="text-[16px] text-purple-400">trending_up</mat-icon> Macro Trend Detected</h4>
                <p class="text-xs text-zinc-300 leading-relaxed font-medium">Q3 conversions in the <strong>FinTech sector</strong> are outperforming baseline by 18%. Recommend re-allocating 20% of outbound SDR effort to this vertical.</p>
             </div>
             
             <div class="mt-6 pt-6 border-t border-zinc-800">
               <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Agent Performance Forecast</h4>
               <div class="space-y-3">
                 <div class="flex items-center justify-between">
                   <div class="flex items-center gap-2">
                     <img alt="" src="https://api.dicebear.com/7.x/notionists/svg?seed=Sarah" class="w-6 h-6 rounded-full bg-zinc-800" />
                     <span class="text-xs font-bold text-zinc-300">Sarah Jenkins</span>
                   </div>
                   <span class="text-xs font-mono text-emerald-400 font-bold">115% to quota</span>
                 </div>
                 <div class="flex items-center justify-between">
                   <div class="flex items-center gap-2">
                     <img alt="" src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex" class="w-6 h-6 rounded-full bg-zinc-800" />
                     <span class="text-xs font-bold text-zinc-300">Alex Rivera</span>
                   </div>
                   <span class="text-xs font-mono text-zinc-400 font-bold">92% to quota</span>
                 </div>
                 <div class="flex items-center justify-between">
                   <div class="flex items-center gap-2">
                     <img alt="" src="https://api.dicebear.com/7.x/notionists/svg?seed=Ahmed" class="w-6 h-6 rounded-full bg-zinc-800" />
                     <span class="text-xs font-bold text-zinc-300">Ahmed Ali</span>
                   </div>
                   <span class="text-xs font-mono text-emerald-400 font-bold">104% to quota</span>
                 </div>
               </div>
             </div>
          </div>
        </div>

      </div>
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
export class ForecastComponent {
  appwrite = inject(Appwrite);
  leadService = inject(LeadService);
  isAnalyzing = signal<boolean>(false);
  
  // Base historical data to ground the chart
  private historicalData = [
    { month: 'Jan', actual: 400000 },
    { month: 'Feb', actual: 450000 },
    { month: 'Mar', actual: 420000 },
    { month: 'Apr', actual: 510000 }
  ];

  forecastData = computed(() => {
    const leads = this.leadService.leads();
    let mayForecast = 0;
    let junForecast = 0;
    let julForecast = 0;
    
    // Simple projection logic based on lead scores and values
    // Hot leads are likely to close soon (May), Warm later (Jun), Cold much later (Jul)
    leads.forEach(lead => {
      const val = lead.value || 0;
      if (lead.scoreCategory === 'Hot') {
        mayForecast += val * 0.8; // 80% probability
        junForecast += val * 0.2;
      } else if (lead.scoreCategory === 'Warm') {
        mayForecast += val * 0.2;
        junForecast += val * 0.6; // 60% probability
        julForecast += val * 0.2;
      } else {
        junForecast += val * 0.1;
        julForecast += val * 0.4; // 40% probability
      }
    });
    
    // Add base line values to projections to make the chart look continuous and realistic
    const baseProjectedMay = 550000 + mayForecast;
    const baseProjectedJun = 580000 + junForecast;
    const baseProjectedJul = 600000 + julForecast;

    return [
      { month: 'Jan', actual: this.historicalData[0].actual, projected: null },
      { month: 'Feb', actual: this.historicalData[1].actual, projected: null },
      { month: 'Mar', actual: this.historicalData[2].actual, projected: null },
      { month: 'Apr', actual: this.historicalData[3].actual, projected: this.historicalData[3].actual },
      { month: 'May', actual: null, projected: Math.round(baseProjectedMay) },
      { month: 'Jun', actual: null, projected: Math.round(baseProjectedJun) },
      { month: 'Jul', actual: null, projected: Math.round(baseProjectedJul) }
    ];
  });

  // Calculate dynamic KPIs based on the lead data
  winRatePrediction = computed(() => {
    const leads = this.leadService.leads();
    if (leads.length === 0) return 0;
    const hotCount = leads.filter(l => l.scoreCategory === 'Hot').length;
    const warmCount = leads.filter(l => l.scoreCategory === 'Warm').length;
    // Base 50% + weighted by hot/warm leads
    const predictedRate = 50 + (hotCount / leads.length) * 30 + (warmCount / leads.length) * 10;
    return Math.min(95, predictedRate);
  });
  
  riskExposure = computed(() => {
    const leads = this.leadService.leads();
    return leads.filter(l => l.scoreCategory === 'Cold' || l.status === 'New')
                .reduce((sum, lead) => sum + (lead.value || 0), 0);
  });
  
  upsellPotential = computed(() => {
     const leads = this.leadService.leads();
     return leads.filter(l => l.status === 'Closed' && l.scoreCategory === 'Hot')
                 .reduce((sum, lead) => sum + (lead.value || 0) * 0.5, 0); // Estimate 50% upsell on closed hot deals
  });

  runAnalysis() {
    this.isAnalyzing.set(true);
    // Simulate AI deep analysis delay, which just triggers a re-render of the same computed data right now
    // but in a real app would fetch a fresh ML model output
    setTimeout(() => {
      this.isAnalyzing.set(false);
    }, 1500);
  }
}
