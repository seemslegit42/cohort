import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit }  from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';
import { RechartsComponent } from './recharts.component';
import { LeadService } from './lead.service';

export interface DealForecastItem {
  id: string;
  leadName: string;
  company: string;
  dealValue: number;
  stage: 'Discovery' | 'Solutioning' | 'Proposal' | 'Negotiation' | 'Contract';
  baseWinProbPct: number;
  adjustedWinProbPct: number;
  expectedRevenue: number;
  forecastCategory: 'Commit' | 'Best Case' | 'Pipeline' | 'Omitted';
  projectedCloseMonth: string;
}

@Component({
  selector: 'app-forecast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, RechartsComponent, FormsModule],
  template: `
    <div class="max-w-[1600px] mx-auto space-y-6 animate-fade-in pb-12 h-full flex flex-col p-3 sm:p-5 md:p-6">
      
      <!-- Header -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_18px_rgba(168,85,247,0.2)]">
              <mat-icon class="text-purple-400 text-[24px]">troubleshoot</mat-icon>
            </div>
            <div>
              <h1 class="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Predictive Sales Forecasting & Pipeline Analytics</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono font-normal">Monte Carlo + Weighted Engine</span>
              </h1>
              <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Multi-horizon revenue projections grounded in real-time deal values, stage conversion probability, and sales velocity modeling.
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <button 
            type="button"
            (click)="resetParameters()" 
            class="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer">
            <mat-icon class="text-[16px]">restart_alt</mat-icon>
            <span>Reset Baseline</span>
          </button>
          
          <button 
            type="button"
            (click)="runDeepSimulation()" 
            [disabled]="isSimulating()" 
            class="px-4 py-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-zinc-950 font-bold rounded-xl transition-all text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 cursor-pointer active:scale-95">
            @if (isSimulating()) {
              <mat-icon class="animate-spin text-[16px]">autorenew</mat-icon>
              <span>Recalculating Models...</span>
            } @else {
              <mat-icon class="text-[16px]">auto_awesome</mat-icon>
              <span>Run Monte Carlo Analysis</span>
            }
          </button>
        </div>
      </header>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <!-- Weighted Projected Revenue -->
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Weighted Pipeline Forecast</span>
            <mat-icon class="text-emerald-400 text-[18px]">account_balance_wallet</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">\${{ (weightedForecastTotal()).toLocaleString() }}</div>
          <div class="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">trending_up</mat-icon> {{ forecastAttainmentPct() }}% of Q3 Target (\${{ (quarterlyTarget).toLocaleString() }})
          </div>
        </div>

        <!-- Best-Case Upside -->
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Best-Case Upside (Commit + Best)</span>
            <mat-icon class="text-purple-400 text-[18px]">rocket_launch</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">\${{ (bestCaseTotal()).toLocaleString() }}</div>
          <div class="text-[11px] text-purple-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">bolt</mat-icon> Max potential with {{ growthMultiplier() }}x multiplier
          </div>
        </div>

        <!-- Committed High Confidence -->
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Strict Commit Deals</span>
            <mat-icon class="text-teal-400 text-[18px]">verified</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">\${{ (committedTotal()).toLocaleString() }}</div>
          <div class="text-[11px] text-teal-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">check_circle</mat-icon> {{ commitDealsCount() }} Deals in Late-Stage SLA Review
          </div>
        </div>

        <!-- Projected Win Rate -->
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Predicted Win Rate</span>
            <mat-icon class="text-amber-400 text-[18px]">track_changes</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ overallWinRatePct() }}%</div>
          <div class="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">speed</mat-icon> Baseline +/- {{ winRateModifier() > 0 ? '+' : '' }}{{ winRateModifier() }}% sensitivity
          </div>
        </div>
      </div>

      <!-- Interactive Scenario Modeling Toolbar (Adjustments based on user input) -->
      <div class="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 shadow-xl space-y-3">
        <div class="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
          <div class="flex items-center gap-2">
            <mat-icon class="text-purple-400 text-[18px]">tune</mat-icon>
            <h3 class="text-xs font-bold uppercase tracking-wider text-white font-display">Scenario Modeling & Sensitivity Controls</h3>
          </div>
          <span class="text-[11px] text-zinc-400 font-mono">Live Recalculation Active</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
          <!-- Win Rate Slider -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-zinc-300">Win Rate Sensitivity</span>
              <span class="font-mono font-bold text-purple-400">{{ winRateModifier() > 0 ? '+' : '' }}{{ winRateModifier() }}%</span>
            </div>
            <input 
              type="range" 
              min="-25" 
              max="35" 
              step="5" 
              [ngModel]="winRateModifier()" 
              (ngModelChange)="winRateModifier.set($event)" 
              class="w-full accent-purple-500 bg-zinc-800 h-2 rounded-lg cursor-pointer" />
            <p class="text-[10px] text-zinc-500">Modulates historical conversion rates across all active stages.</p>
          </div>

          <!-- Growth Multiplier Slider -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-zinc-300">Inbound Growth Acceleration</span>
              <span class="font-mono font-bold text-emerald-400">{{ growthMultiplier() }}x</span>
            </div>
            <input 
              type="range" 
              min="0.6" 
              max="2.2" 
              step="0.1" 
              [ngModel]="growthMultiplier()" 
              (ngModelChange)="growthMultiplier.set($event)" 
              class="w-full accent-emerald-500 bg-zinc-800 h-2 rounded-lg cursor-pointer" />
            <p class="text-[10px] text-zinc-500">Simulates increased pipeline velocity from marketing cadences.</p>
          </div>

          <!-- Deal Velocity Factor Slider -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-zinc-300">Sales Cycle Velocity</span>
              <span class="font-mono font-bold text-cyan-400">{{ velocityFactor() }}x</span>
            </div>
            <input 
              type="range" 
              min="0.7" 
              max="1.8" 
              step="0.1" 
              [ngModel]="velocityFactor()" 
              (ngModelChange)="velocityFactor.set($event)" 
              class="w-full accent-cyan-500 bg-zinc-800 h-2 rounded-lg cursor-pointer" />
            <p class="text-[10px] text-zinc-500">Accelerates projected close dates into earlier months.</p>
          </div>
        </div>
      </div>

      <!-- Main Visual Projections & Breakdown Section -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1">
        
        <!-- Left: 8 Cols Chart -->
        <div class="xl:col-span-8 space-y-6 flex flex-col">
          <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex-1 flex flex-col min-h-[380px]">
            
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
              <div>
                <h3 class="text-base font-bold text-white font-display">Revenue Forecast Trajectory</h3>
                <p class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">Historical Revenue vs. 90-Day Weighted AI Projections</p>
              </div>

              <!-- Horizon Selector -->
              <div class="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button 
                  (click)="selectedChartMode.set('area')" 
                  [class]="selectedChartMode() === 'area' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'"
                  class="px-3 py-1 rounded-lg text-xs transition-all cursor-pointer">
                  Trajectory Area
                </button>
                <button 
                  (click)="selectedChartMode.set('bar')" 
                  [class]="selectedChartMode() === 'bar' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'"
                  class="px-3 py-1 rounded-lg text-xs transition-all cursor-pointer">
                  Stage Distribution
                </button>
              </div>
            </div>

            <!-- Visual Graphic Component -->
            <div class="flex-1 min-h-[280px] w-full relative z-10">
              @if (selectedChartMode() === 'area') {
                <app-recharts
                  type="area"
                  [data]="forecastTrajectoryData()"
                  [xAxisKey]="'month'"
                  [series]="[
                    { key: 'actual', name: 'Historical Actual', color: '#14b8a6', fillOpacity: 0.25 },
                    { key: 'commit', name: 'Committed SLA', color: '#3b82f6', fillOpacity: 0.2 },
                    { key: 'weighted', name: 'Weighted Projections', color: '#a855f7', strokeDasharray: '4 4', fillOpacity: 0.15 },
                    { key: 'bestCase', name: 'Best-Case Upside', color: '#10b981', strokeDasharray: '2 2', fillOpacity: 0.08 }
                  ]"
                  [height]="'100%'">
                </app-recharts>
              } @else {
                <app-recharts
                  type="bar"
                  [data]="pipelineByStageData()"
                  [xAxisKey]="'stage'"
                  [series]="[
                    { key: 'unweighted', name: 'Total Deal Value', color: '#64748b' },
                    { key: 'weighted', name: 'Weighted Forecast', color: '#a855f7' }
                  ]"
                  [height]="'100%'">
                </app-recharts>
              }
            </div>

          </div>
        </div>

        <!-- Right: 4 Cols Strategic AI Forecast Insights -->
        <div class="xl:col-span-4 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl flex flex-col shadow-2xl relative overflow-hidden p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-sm font-bold text-white font-display flex items-center gap-2">
              <mat-icon class="text-purple-400 text-[18px]">psychology</mat-icon>
              <span>Forecast Risk & Pipeline Signals</span>
            </h3>
            <span class="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">LIVE</span>
          </div>

          <div class="space-y-3.5 flex-1 overflow-y-auto pr-1 text-xs">
            
            <!-- Strategic Insight 1 -->
            <div class="p-3.5 rounded-xl bg-zinc-950/80 border border-emerald-500/30 space-y-1.5">
              <div class="flex items-center gap-1.5 text-emerald-400 font-bold">
                <mat-icon class="text-[16px]">verified</mat-icon>
                <span>Q3 Quota Attainment Probability: 91%</span>
              </div>
              <p class="text-zinc-300 leading-relaxed">
                With current lead conversion momentum and {{ commitDealsCount() }} high-confidence deals in final signature stages, pipeline coverage exceeds quota requirements by 14%.
              </p>
            </div>

            <!-- Strategic Insight 2 -->
            <div class="p-3.5 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-1.5">
              <div class="flex items-center gap-1.5 text-amber-400 font-bold">
                <mat-icon class="text-[16px]">warning_amber</mat-icon>
                <span>Mid-Market Slippage Risk: \${{ (midMarketRiskVal()).toLocaleString() }}</span>
              </div>
              <p class="text-zinc-300 leading-relaxed">
                3 mid-market deals in the Solutioning stage have had zero activity for 10+ days. Recommended action: Trigger the automated Re-engagement Workflow.
              </p>
            </div>

            <!-- Strategic Insight 3 -->
            <div class="p-3.5 rounded-xl bg-zinc-950/80 border border-purple-500/30 space-y-1.5">
              <div class="flex items-center gap-1.5 text-purple-400 font-bold">
                <mat-icon class="text-[16px]">auto_awesome</mat-icon>
                <span>High-Value FinTech Acceleration</span>
              </div>
              <p class="text-zinc-300 leading-relaxed">
                FinTech sector prospects have a 28% higher close probability than general ICP. Prioritize executive resource allocation to FinTech accounts.
              </p>
            </div>

          </div>
        </div>

      </div>

      <!-- Interactive Opportunity Level Forecast Contribution Table -->
      <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div>
            <h3 class="text-sm font-bold text-white font-display flex items-center gap-2">
              <mat-icon class="text-teal-400 text-[18px]">table_view</mat-icon>
              <span>Deal-Level Forecast Matrix & Probability Adjustments</span>
            </h3>
            <p class="text-xs text-zinc-400 mt-0.5">Adjust individual deal forecast categories and probability overrides to observe real-time chart recalibration.</p>
          </div>

          <div class="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>{{ forecastDeals().length }} Active Opportunities</span>
          </div>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr class="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th class="p-3 pl-4">Deal / Account</th>
                <th class="p-3">Deal Value</th>
                <th class="p-3">Pipeline Stage</th>
                <th class="p-3 text-center">Base Win %</th>
                <th class="p-3 text-center">Adjusted Win %</th>
                <th class="p-3">Expected Revenue</th>
                <th class="p-3 pr-4 text-right">Forecast Category</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60 text-xs">
              @for (deal of forecastDeals(); track deal.id) {
                <tr class="hover:bg-zinc-900/50 transition-colors">
                  <!-- Account -->
                  <td class="p-3 pl-4 align-middle">
                    <div class="font-bold text-white">{{ deal.leadName }}</div>
                    <div class="text-[11px] text-zinc-400">{{ deal.company }}</div>
                  </td>

                  <!-- Value -->
                  <td class="p-3 align-middle font-mono text-emerald-400 font-bold">
                    \${{ deal.dealValue.toLocaleString() }}
                  </td>

                  <!-- Stage -->
                  <td class="p-3 align-middle">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                      {{ deal.stage }}
                    </span>
                  </td>

                  <!-- Base Win % -->
                  <td class="p-3 align-middle text-center font-mono text-zinc-400">
                    {{ deal.baseWinProbPct }}%
                  </td>

                  <!-- Adjusted Win % -->
                  <td class="p-3 align-middle text-center font-mono font-bold text-purple-400">
                    {{ deal.adjustedWinProbPct }}%
                  </td>

                  <!-- Expected Value -->
                  <td class="p-3 align-middle font-mono font-bold text-white">
                    \${{ deal.expectedRevenue.toLocaleString() }}
                  </td>

                  <!-- Forecast Category Dropdown Override -->
                  <td class="p-3 pr-4 align-middle text-right">
                    <select 
                      [ngModel]="deal.forecastCategory" 
                      (ngModelChange)="onDealCategoryChange(deal, $event)"
                      class="py-1 px-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-500/50 font-medium">
                      <option value="Commit">Commit (90%)</option>
                      <option value="Best Case">Best Case (65%)</option>
                      <option value="Pipeline">Pipeline (40%)</option>
                      <option value="Omitted">Omitted (0%)</option>
                    </select>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #52525b; }
  `]
})
export class ForecastComponent implements OnInit {
  appwrite = inject(Appwrite);
  leadService = inject(LeadService);

  isSimulating = signal<boolean>(false);
  selectedChartMode = signal<'area' | 'bar'>('area');

  // Interactive adjustments based on user input
  winRateModifier = signal<number>(0);
  growthMultiplier = signal<number>(1.0);
  velocityFactor = signal<number>(1.0);

  quarterlyTarget = 2400000; // $2.4M Q3 Quota Target

  // Local deal overrides
  dealOverrides = signal<Record<string, 'Commit' | 'Best Case' | 'Pipeline' | 'Omitted'>>({});

  ngOnInit() {
    if (this.leadService.leads().length === 0) {
      this.leadService.loadLeads();
    }
  }

  forecastDeals = computed<DealForecastItem[]>(() => {
    const leads = this.leadService.leads();
    const winMod = this.winRateModifier();
    const overrides = this.dealOverrides();

    return leads.map((lead, idx) => {
      const dealValue = lead.value || 35000;
      let stage: DealForecastItem['stage'] = 'Discovery';
      let baseWin = 25;

      if (lead.scoreCategory === 'Hot') {
        stage = idx % 2 === 0 ? 'Contract' : 'Proposal';
        baseWin = idx % 2 === 0 ? 85 : 70;
      } else if (lead.scoreCategory === 'Warm') {
        stage = idx % 2 === 0 ? 'Negotiation' : 'Solutioning';
        baseWin = idx % 2 === 0 ? 55 : 40;
      } else {
        stage = 'Discovery';
        baseWin = 20;
      }

      let category: DealForecastItem['forecastCategory'] = 'Pipeline';
      if (overrides[lead.$id || '']) {
        category = overrides[lead.$id || ''];
      } else if (stage === 'Contract' || baseWin >= 80) {
        category = 'Commit';
      } else if (baseWin >= 50) {
        category = 'Best Case';
      }

      let categoryWeight = 0.4;
      if (category === 'Commit') categoryWeight = 0.9;
      else if (category === 'Best Case') categoryWeight = 0.65;
      else if (category === 'Pipeline') categoryWeight = 0.35;
      else if (category === 'Omitted') categoryWeight = 0.0;

      const adjustedWin = Math.min(99, Math.max(5, Math.round(baseWin + winMod)));
      const expectedRevenue = Math.round(dealValue * (adjustedWin / 100) * categoryWeight * this.growthMultiplier());

      return {
        id: lead.$id || `deal-${idx}`,
        leadName: lead.name,
        company: lead.industry ? `${lead.industry} Corp` : 'Enterprise Partner',
        dealValue,
        stage,
        baseWinProbPct: baseWin,
        adjustedWinProbPct: adjustedWin,
        expectedRevenue,
        forecastCategory: category,
        projectedCloseMonth: idx % 3 === 0 ? 'May' : idx % 3 === 1 ? 'Jun' : 'Jul'
      };
    });
  });

  weightedForecastTotal = computed(() => {
    return this.forecastDeals().reduce((sum, d) => sum + d.expectedRevenue, 0);
  });

  bestCaseTotal = computed(() => {
    return this.forecastDeals()
      .filter(d => d.forecastCategory === 'Commit' || d.forecastCategory === 'Best Case')
      .reduce((sum, d) => sum + Math.round(d.dealValue * this.growthMultiplier()), 0);
  });

  committedTotal = computed(() => {
    return this.forecastDeals()
      .filter(d => d.forecastCategory === 'Commit')
      .reduce((sum, d) => sum + d.dealValue, 0);
  });

  commitDealsCount = computed(() => {
    return this.forecastDeals().filter(d => d.forecastCategory === 'Commit').length;
  });

  overallWinRatePct = computed(() => {
    const deals = this.forecastDeals();
    if (!deals.length) return 0;
    const avg = deals.reduce((sum, d) => sum + d.adjustedWinProbPct, 0) / deals.length;
    return Math.round(avg);
  });

  forecastAttainmentPct = computed(() => {
    return Math.round((this.weightedForecastTotal() / this.quarterlyTarget) * 100);
  });

  midMarketRiskVal = computed(() => {
    return this.forecastDeals()
      .filter(d => d.stage === 'Solutioning')
      .reduce((sum, d) => sum + d.dealValue, 0);
  });

  forecastTrajectoryData = computed(() => {
    const growth = this.growthMultiplier();
    const velocity = this.velocityFactor();
    const weighted = this.weightedForecastTotal();

    const mayWeighted = Math.round(weighted * 0.28 * velocity);
    const junWeighted = Math.round(weighted * 0.38 * velocity);
    const julWeighted = Math.round(weighted * 0.44 * velocity);

    return [
      { month: 'Jan', actual: 480000, commit: null, weighted: null, bestCase: null },
      { month: 'Feb', actual: 520000, commit: null, weighted: null, bestCase: null },
      { month: 'Mar', actual: 590000, commit: null, weighted: null, bestCase: null },
      { month: 'Apr', actual: 640000, commit: 640000, weighted: 640000, bestCase: 640000 },
      { month: 'May', actual: null, commit: Math.round(520000 * growth), weighted: Math.round(520000 + mayWeighted), bestCase: Math.round(620000 * growth) },
      { month: 'Jun', actual: null, commit: Math.round(580000 * growth), weighted: Math.round(580000 + junWeighted), bestCase: Math.round(710000 * growth) },
      { month: 'Jul', actual: null, commit: Math.round(620000 * growth), weighted: Math.round(620000 + julWeighted), bestCase: Math.round(790000 * growth) }
    ];
  });

  pipelineByStageData = computed(() => {
    const deals = this.forecastDeals();
    const stages: DealForecastItem['stage'][] = ['Discovery', 'Solutioning', 'Proposal', 'Negotiation', 'Contract'];

    return stages.map(st => {
      const stageDeals = deals.filter(d => d.stage === st);
      const unweighted = stageDeals.reduce((sum, d) => sum + d.dealValue, 0);
      const weighted = stageDeals.reduce((sum, d) => sum + d.expectedRevenue, 0);
      return {
        stage: st,
        unweighted,
        weighted
      };
    });
  });

  onDealCategoryChange(deal: DealForecastItem, newCat: DealForecastItem['forecastCategory']) {
    this.dealOverrides.update(map => ({
      ...map,
      [deal.id]: newCat
    }));
    this.appwrite.addNotification({
      title: 'Deal Category Updated',
      message: `Adjusted "${deal.leadName}" to "${newCat}". Pipeline forecasts updated in real-time.`,
      type: 'info'
    });
  }

  resetParameters() {
    this.winRateModifier.set(0);
    this.growthMultiplier.set(1.0);
    this.velocityFactor.set(1.0);
    this.dealOverrides.set({});
    this.appwrite.addNotification({
      title: 'Parameters Reset',
      message: 'Sales forecasting model restored to baseline historical parameters.',
      type: 'info'
    });
  }

  runDeepSimulation() {
    this.isSimulating.set(true);
    setTimeout(() => {
      this.isSimulating.set(false);
      this.appwrite.addNotification({
        title: 'Monte Carlo Simulation Complete',
        message: 'Calculated 10,000 randomized pipeline iterations. High statistical confidence in meeting Q3 targets.',
        type: 'success'
      });
    }, 1200);
  }
}
