import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';

export interface SimulationResult {
  p10: number;
  p50: number;
  p90: number;
  attainmentProbability: number;
  mean: number;
  iterations: number[];
}

@Component({
  selector: 'app-revops-simulator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="h-full flex flex-col p-3 sm:p-5 md:p-6 animate-fade-in max-w-[1600px] mx-auto space-y-6">
      
      <!-- Header -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-zinc-950 shadow-[0_0_20px_rgba(20,184,166,0.25)] font-bold">
              <mat-icon class="text-[22px]">query_stats</mat-icon>
            </div>
            <div>
              <h1 class="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>RevOps Monte Carlo & Quota Simulator</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-normal">Deterministic v3.1</span>
              </h1>
              <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">Stochastic pipeline probability distributions, rep capacity ramp calculations, and commission accelerator modeling.</p>
            </div>
          </div>
        </div>

        <!-- Mode Tabs -->
        <div class="flex items-center gap-2 flex-wrap">
          <button 
            type="button"
            (click)="activeMode.set('monte-carlo')" 
            [class]="activeMode() === 'monte-carlo' ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs' : 'text-zinc-400 hover:text-white bg-zinc-900/60 border-zinc-800'"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px] text-teal-400">casino</mat-icon>
            <span>Monte Carlo Engine</span>
          </button>

          <button 
            type="button"
            (click)="activeMode.set('capacity')" 
            [class]="activeMode() === 'capacity' ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs' : 'text-zinc-400 hover:text-white bg-zinc-900/60 border-zinc-800'"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px] text-purple-400">group_add</mat-icon>
            <span>AE Ramp & Capacity Planner</span>
          </button>

          <button 
            type="button"
            (click)="activeMode.set('accelerator')" 
            [class]="activeMode() === 'accelerator' ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs' : 'text-zinc-400 hover:text-white bg-zinc-900/60 border-zinc-800'"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px] text-amber-400">calculate</mat-icon>
            <span>Commission Accelerator</span>
          </button>
        </div>
      </header>

      <!-- MODE 1: Monte Carlo Simulation Engine -->
      @if (activeMode() === 'monte-carlo') {
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          <!-- Parameters Input Form (5 cols) -->
          <div class="xl:col-span-5 p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-2xl space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div class="flex items-center gap-2">
                <mat-icon class="text-teal-400 text-[18px]">tune</mat-icon>
                <h2 class="text-sm font-bold text-white font-display">Simulation Variables & Assumptions</h2>
              </div>
              <button (click)="resetMonteCarloDefaults()" class="text-[11px] text-zinc-400 hover:text-zinc-200">Reset Defaults</button>
            </div>

            <!-- Annual ARR Target -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <label for="mc-target-arr" class="text-zinc-300 font-semibold">Annual Revenue Target (ARR)</label>
                <span class="font-mono text-emerald-400 font-bold">\${{ targetArr().toLocaleString() }}</span>
              </div>
              <input id="mc-target-arr" type="range" min="500000" max="10000000" step="100000" [ngModel]="targetArr()" (ngModelChange)="targetArr.set($event)" class="w-full accent-emerald-400" />
            </div>

            <!-- Current Pipeline Value -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <label for="mc-current-pipe" class="text-zinc-300 font-semibold">Current Qualified Pipeline</label>
                <span class="font-mono text-teal-400 font-bold">\${{ currentPipeline().toLocaleString() }}</span>
              </div>
              <input id="mc-current-pipe" type="range" min="200000" max="15000000" step="100000" [ngModel]="currentPipeline()" (ngModelChange)="currentPipeline.set($event)" class="w-full accent-teal-400" />
            </div>

            <!-- Average Deal Size (ACV) -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <label for="mc-acv" class="text-zinc-300 font-semibold">Average Contract Value (ACV)</label>
                <span class="font-mono text-white font-bold">\${{ avgDealSize().toLocaleString() }}</span>
              </div>
              <input id="mc-acv" type="range" min="10000" max="250000" step="5000" [ngModel]="avgDealSize()" (ngModelChange)="avgDealSize.set($event)" class="w-full accent-teal-400" />
            </div>

            <!-- Blended Win Rate -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <label for="mc-win-rate" class="text-zinc-300 font-semibold">Historical Win Rate (%)</label>
                <span class="font-mono text-amber-400 font-bold">{{ winRate() }}%</span>
              </div>
              <input id="mc-win-rate" type="range" min="10" max="65" step="1" [ngModel]="winRate()" (ngModelChange)="winRate.set($event)" class="w-full accent-amber-400" />
            </div>

            <!-- Sales Cycle Length (Days) -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <label for="mc-sales-cycle" class="text-zinc-300 font-semibold">Average Sales Cycle Length</label>
                <span class="font-mono text-purple-400 font-bold">{{ salesCycleDays() }} Days</span>
              </div>
              <input id="mc-sales-cycle" type="range" min="30" max="180" step="5" [ngModel]="salesCycleDays()" (ngModelChange)="salesCycleDays.set($event)" class="w-full accent-purple-400" />
            </div>

            <!-- Pipeline Volatility (Sigma) -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <label for="mc-volatility" class="text-zinc-300 font-semibold">Market Volatility (Entropy)</label>
                <span class="font-mono text-rose-400 font-bold">&plusmn;{{ volatility() }}%</span>
              </div>
              <input id="mc-volatility" type="range" min="5" max="45" step="1" [ngModel]="volatility()" (ngModelChange)="volatility.set($event)" class="w-full accent-rose-400" />
            </div>

            <div class="pt-2">
              <button 
                type="button"
                (click)="runMonteCarloSimulation()" 
                class="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all active:scale-[0.98]">
                <mat-icon class="text-[18px]">play_circle</mat-icon>
                <span>Execute 1,000 Iteration Monte Carlo Run</span>
              </button>
            </div>
          </div>

          <!-- Simulation Outputs & Percentile Distributions (7 cols) -->
          <div class="xl:col-span-7 space-y-6">
            
            <!-- Percentile Metric Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <!-- P10 (Conservative) -->
              <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left">
                <span class="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">P10 (Worst Case / 90% Conf.)</span>
                <div class="text-xl font-bold text-zinc-200 font-mono">\${{ simulationResult().p10.toLocaleString() }}</div>
                <span class="text-[10px] text-zinc-500 mt-1 block">Baseline floor with market headwinds</span>
              </div>

              <!-- P50 (Median Expected) -->
              <div class="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/40 text-left shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                <span class="text-[11px] font-mono text-teal-300 uppercase tracking-wider block mb-1">P50 (Expected Median)</span>
                <div class="text-2xl font-bold text-teal-400 font-mono">\${{ simulationResult().p50.toLocaleString() }}</div>
                <span class="text-[10px] text-teal-300/80 mt-1 block">Most probable mathematical outcome</span>
              </div>

              <!-- P90 (Bull Case) -->
              <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-left">
                <span class="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">P90 (Bull Run / 10% Upside)</span>
                <div class="text-xl font-bold text-emerald-300 font-mono">\${{ simulationResult().p90.toLocaleString() }}</div>
                <span class="text-[10px] text-zinc-500 mt-1 block">Optimal pipeline conversion surge</span>
              </div>

            </div>

            <!-- Target Attainment Probability Banner -->
            <div class="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span class="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">Statistical Quota Attainment Probability</span>
                <h3 class="text-2xl font-bold text-white font-display flex items-center gap-2">
                  <span>{{ simulationResult().attainmentProbability }}% Chance</span>
                  <span [class]="simulationResult().attainmentProbability >= 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'" class="text-xs px-2 py-0.5 rounded-full border font-mono">
                    {{ simulationResult().attainmentProbability >= 70 ? 'Healthy Pipeline Coverage' : 'Pipeline Gap Risk' }}
                  </span>
                </h3>
                <p class="text-xs text-zinc-400 mt-1">To achieve 95% confidence on \${{ targetArr().toLocaleString() }}, your pipeline requires \${{ requiredPipelineCoverage().toLocaleString() }} in active opportunities.</p>
              </div>

              <div class="text-right sm:border-l sm:border-zinc-800 sm:pl-5">
                <span class="text-[10px] text-zinc-500 block">Required Coverage Ratio</span>
                <span class="text-lg font-bold font-mono text-white">{{ (requiredPipelineCoverage() / targetArr()).toFixed(1) }}x Coverage</span>
              </div>
            </div>

            <!-- Simulated Distribution Visualizer (Histogram Simulation) -->
            <div class="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-purple-400 text-[18px]">bar_chart</mat-icon>
                  <h3 class="text-xs font-bold text-white font-display uppercase tracking-wider">Simulated 1,000 Trial Revenue Frequency Curve</h3>
                </div>
                <span class="text-[11px] font-mono text-zinc-500">Normal (Gaussian) Kernel</span>
              </div>

              <!-- Bar Distribution Chart -->
              <div class="h-36 flex items-end gap-1.5 pt-4 pb-2 px-1 border-b border-zinc-800/80">
                @for (bucket of distributionBuckets(); track bucket.label) {
                  <div class="flex-1 flex flex-col items-center gap-1 group relative">
                    <div 
                      class="w-full rounded-t-md transition-all duration-500" 
                      [class]="bucket.isTarget ? 'bg-gradient-to-t from-teal-600 to-emerald-400' : 'bg-zinc-800 group-hover:bg-zinc-700'"
                      [style.height.%]="bucket.heightPercent">
                    </div>
                    <!-- Tooltip -->
                    <div class="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 border border-zinc-700 px-2 py-1 rounded text-[9px] font-mono text-white whitespace-nowrap z-20 pointer-events-none">
                      \${{ bucket.label }} &bull; {{ bucket.count }} runs
                    </div>
                  </div>
                }
              </div>

              <div class="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-2">
                <span>$0.5M</span>
                <span>Target: \${{ (targetArr() / 1000000).toFixed(1) }}M</span>
                <span>$8.0M+</span>
              </div>
            </div>

          </div>

        </div>
      }

      <!-- MODE 2: AE Capacity & Ramp Planner -->
      @if (activeMode() === 'capacity') {
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          <!-- Capacity Inputs (5 cols) -->
          <div class="xl:col-span-5 p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 class="text-sm font-bold text-white font-display">Rep Capacity & Hiring Inputs</h2>
              <span class="text-xs text-purple-400 font-mono font-bold">Quota Capacity Model</span>
            </div>

            <div class="space-y-1">
              <label for="cap-headcount" class="text-xs text-zinc-300 font-semibold flex justify-between">
                <span>Fully Ramped AE Headcount</span>
                <span class="font-mono text-purple-400 font-bold">{{ aeHeadcount() }} Reps</span>
              </label>
              <input id="cap-headcount" type="range" min="1" max="50" step="1" [ngModel]="aeHeadcount()" (ngModelChange)="aeHeadcount.set($event)" class="w-full accent-purple-400" />
            </div>

            <div class="space-y-1">
              <label for="cap-quota" class="text-xs text-zinc-300 font-semibold flex justify-between">
                <span>Annual Individual Rep Quota (OTE Quota)</span>
                <span class="font-mono text-white font-bold">\${{ individualQuota().toLocaleString() }}</span>
              </label>
              <input id="cap-quota" type="range" min="400000" max="2500000" step="50000" [ngModel]="individualQuota()" (ngModelChange)="individualQuota.set($event)" class="w-full accent-purple-400" />
            </div>

            <div class="space-y-1">
              <label for="cap-ramping" class="text-xs text-zinc-300 font-semibold flex justify-between">
                <span>New Reps In-Ramp (3-Month Ramp-up)</span>
                <span class="font-mono text-amber-400 font-bold">{{ rampingReps() }} Reps</span>
              </label>
              <input id="cap-ramping" type="range" min="0" max="20" step="1" [ngModel]="rampingReps()" (ngModelChange)="rampingReps.set($event)" class="w-full accent-amber-400" />
            </div>

            <div class="space-y-1">
              <label for="cap-attainment" class="text-xs text-zinc-300 font-semibold flex justify-between">
                <span>Average Team Quota Attainment %</span>
                <span class="font-mono text-teal-400 font-bold">{{ teamAttainmentPct() }}%</span>
              </label>
              <input id="cap-attainment" type="range" min="40" max="120" step="5" [ngModel]="teamAttainmentPct()" (ngModelChange)="teamAttainmentPct.set($event)" class="w-full accent-teal-400" />
            </div>

            <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-1">
              <div class="flex justify-between text-zinc-300">
                <span>Total On-Paper Team Capacity:</span>
                <span class="font-mono font-bold text-white">\${{ totalOnPaperCapacity().toLocaleString() }}</span>
              </div>
              <div class="flex justify-between text-zinc-300">
                <span>Risk-Adjusted Expected Output:</span>
                <span class="font-mono font-bold text-emerald-400">\${{ riskAdjustedCapacity().toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <!-- Capacity Outputs & Quota Gap Analysis (7 cols) -->
          <div class="xl:col-span-7 space-y-5">
            
            <div class="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <h3 class="text-sm font-bold text-white font-display">Hiring Cadence vs Quota Requirements</h3>
              
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span class="text-[10px] text-zinc-500 block">Total Active Sales Headcount</span>
                  <span class="text-lg font-bold font-mono text-white">{{ aeHeadcount() + rampingReps() }}</span>
                </div>
                <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span class="text-[10px] text-zinc-500 block">Effective Ramped Capacity</span>
                  <span class="text-lg font-bold font-mono text-purple-400">{{ (aeHeadcount() + rampingReps() * 0.45).toFixed(1) }} FTE</span>
                </div>
                <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span class="text-[10px] text-zinc-500 block">Hiring Deficit to hit \${{ (targetArr() / 1000000).toFixed(1) }}M</span>
                  <span [class]="hiringDeficit() > 0 ? 'text-rose-400' : 'text-emerald-400'" class="text-lg font-bold font-mono">
                    {{ hiringDeficit() > 0 ? '+' + hiringDeficit() + ' Reps' : 'Fully Staffed' }}
                  </span>
                </div>
                <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span class="text-[10px] text-zinc-500 block">Target Coverage Multiple</span>
                  <span class="text-lg font-bold font-mono text-teal-400">{{ (totalOnPaperCapacity() / targetArr()).toFixed(2) }}x</span>
                </div>
              </div>
            </div>

            <!-- Month by Month Ramp Forecast Visualizer -->
            <div class="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <h3 class="text-xs font-bold text-white font-display uppercase tracking-wider mb-3">12-Month Rolling Rep Output Projection</h3>
              <div class="space-y-2">
                @for (q of quarterlyRamp(); track q.quarter) {
                  <div class="space-y-1">
                    <div class="flex justify-between text-xs">
                      <span class="text-zinc-300 font-semibold">{{ q.quarter }} Projected Revenue</span>
                      <span class="font-mono text-emerald-400 font-bold">\${{ q.projectedRevenue.toLocaleString() }} ({{ q.rampedFte }} Ramped FTEs)</span>
                    </div>
                    <div class="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                      <div class="bg-gradient-to-r from-purple-500 to-teal-400 h-full rounded-full" [style.width.%]="q.quotaPct"></div>
                    </div>
                  </div>
                }
              </div>
            </div>

          </div>

        </div>
      }

      <!-- MODE 3: Commission Accelerator Calculator -->
      @if (activeMode() === 'accelerator') {
        <div class="max-w-4xl mx-auto space-y-6">
          <div class="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-2xl space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div class="flex items-center gap-2">
                <mat-icon class="text-amber-400 text-[20px]">workspace_premium</mat-icon>
                <h2 class="text-base font-bold text-white font-display">Individual Rep Commission & Tier Accelerator Engine</h2>
              </div>
              <span class="text-xs text-amber-400 font-mono">OTE Tier Modeling</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-1">
                <label for="acc-base-ote" class="text-xs text-zinc-400 font-semibold">Rep Base Salary ($)</label>
                <input id="acc-base-ote" type="number" [ngModel]="repBaseSalary()" (ngModelChange)="repBaseSalary.set($event)" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div class="space-y-1">
                <label for="acc-variable-ote" class="text-xs text-zinc-400 font-semibold">Target Variable at 100% Quota ($)</label>
                <input id="acc-variable-ote" type="number" [ngModel]="repTargetVariable()" (ngModelChange)="repTargetVariable.set($event)" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div class="space-y-1">
                <label for="acc-rep-quota" class="text-xs text-zinc-400 font-semibold">Annual Quota Baseline ($)</label>
                <input id="acc-rep-quota" type="number" [ngModel]="repAnnualQuota()" (ngModelChange)="repAnnualQuota.set($event)" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>
            </div>

            <!-- Simulated Closed Won Slider -->
            <div class="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-zinc-300 font-semibold">Simulated Closed Bookings for Year</span>
                <span class="text-base font-bold font-mono text-amber-400">\${{ simRepBookings().toLocaleString() }} ({{ ((simRepBookings() / repAnnualQuota()) * 100).toFixed(0) }}% of Quota)</span>
              </div>
              <input type="range" min="100000" max="3000000" step="25000" [ngModel]="simRepBookings()" (ngModelChange)="simRepBookings.set($event)" class="w-full accent-amber-400" />
            </div>

            <!-- Earnings Breakdown -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div class="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <span class="text-[10px] text-zinc-500 block uppercase">Base Salary</span>
                <span class="text-xl font-bold font-mono text-white">\${{ repBaseSalary().toLocaleString() }}</span>
              </div>
              <div class="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <span class="text-[10px] text-zinc-500 block uppercase">Calculated Commission + Accelerators</span>
                <span class="text-xl font-bold font-mono text-amber-400">\${{ calculatedCommission().toLocaleString() }}</span>
              </div>
              <div class="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 shadow-md">
                <span class="text-[10px] text-emerald-300 block uppercase">Total Take-Home Compensation</span>
                <span class="text-2xl font-bold font-mono text-emerald-400">\${{ (repBaseSalary() + calculatedCommission()).toLocaleString() }}</span>
              </div>
            </div>

          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class RevopsSimulatorComponent {
  appwrite = inject(Appwrite);

  activeMode = signal<'monte-carlo' | 'capacity' | 'accelerator'>('monte-carlo');

  // Monte Carlo Signals
  targetArr = signal<number>(2500000);
  currentPipeline = signal<number>(6200000);
  avgDealSize = signal<number>(65000);
  winRate = signal<number>(28);
  salesCycleDays = signal<number>(75);
  volatility = signal<number>(18);

  // Capacity Signals
  aeHeadcount = signal<number>(6);
  individualQuota = signal<number>(850000);
  rampingReps = signal<number>(2);
  teamAttainmentPct = signal<number>(78);

  // Accelerator Signals
  repBaseSalary = signal<number>(110000);
  repTargetVariable = signal<number>(110000);
  repAnnualQuota = signal<number>(850000);
  simRepBookings = signal<number>(1150000);

  simulationResult = signal<SimulationResult>({
    p10: 1850000,
    p50: 2420000,
    p90: 3100000,
    attainmentProbability: 76,
    mean: 2450000,
    iterations: []
  });

  constructor() {
    this.runMonteCarloSimulation();
  }

  resetMonteCarloDefaults() {
    this.targetArr.set(2500000);
    this.currentPipeline.set(6200000);
    this.avgDealSize.set(65000);
    this.winRate.set(28);
    this.salesCycleDays.set(75);
    this.volatility.set(18);
    this.runMonteCarloSimulation();
  }

  runMonteCarloSimulation() {
    const pipe = this.currentPipeline();
    const rate = this.winRate() / 100;
    const vol = this.volatility() / 100;
    const target = this.targetArr();

    const runs: number[] = [];
    let hits = 0;
    const totalRuns = 1000;

    for (let i = 0; i < totalRuns; i++) {
      // Gaussian perturbation
      const u1 = Math.random();
      const u2 = Math.random();
      const randStdNormal = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
      const simulatedRate = Math.max(0.05, Math.min(0.85, rate + randStdNormal * vol * 0.5));
      const simulatedPipeline = pipe * (1 + (Math.random() - 0.5) * vol);
      const outcome = simulatedPipeline * simulatedRate;
      runs.push(outcome);

      if (outcome >= target) {
        hits++;
      }
    }

    runs.sort((a, b) => a - b);

    const p10 = Math.round(runs[Math.floor(totalRuns * 0.1)]);
    const p50 = Math.round(runs[Math.floor(totalRuns * 0.5)]);
    const p90 = Math.round(runs[Math.floor(totalRuns * 0.9)]);
    const attainmentProbability = Math.round((hits / totalRuns) * 100);
    const mean = Math.round(runs.reduce((a, b) => a + b, 0) / totalRuns);

    this.simulationResult.set({
      p10,
      p50,
      p90,
      attainmentProbability,
      mean,
      iterations: runs
    });

    this.appwrite.addNotification({
      title: 'Monte Carlo Executed',
      message: `Completed 1,000 stochastic runs. Median expected revenue: $${p50.toLocaleString()}.`,
      type: 'info'
    });
  }

  requiredPipelineCoverage = computed(() => {
    const rate = this.winRate() / 100 || 0.25;
    return Math.round(this.targetArr() / rate);
  });

  distributionBuckets = computed(() => {
    const runs = this.simulationResult().iterations;
    if (!runs.length) {
      return Array.from({ length: 12 }, (_, i) => ({
        label: `${(0.5 + i * 0.6).toFixed(1)}M`,
        count: Math.round(Math.sin((i / 12) * Math.PI) * 90) + 10,
        heightPercent: Math.round(Math.sin((i / 12) * Math.PI) * 85) + 15,
        isTarget: i === 4
      }));
    }

    const min = runs[0];
    const max = runs[runs.length - 1];
    const bucketCount = 14;
    const step = (max - min) / bucketCount;

    const buckets = Array.from({ length: bucketCount }, (_, i) => {
      const bMin = min + i * step;
      const bMax = bMin + step;
      const count = runs.filter(r => r >= bMin && (i === bucketCount - 1 ? r <= bMax : r < bMax)).length;
      return {
        label: `${(bMin / 1000000).toFixed(1)}M`,
        count,
        heightPercent: Math.min(100, Math.round((count / (runs.length * 0.2)) * 100)),
        isTarget: bMin <= this.targetArr() && this.targetArr() <= bMax
      };
    });

    return buckets;
  });

  // Capacity calculations
  totalOnPaperCapacity = computed(() => {
    return this.aeHeadcount() * this.individualQuota() + this.rampingReps() * (this.individualQuota() * 0.5);
  });

  riskAdjustedCapacity = computed(() => {
    return Math.round(this.totalOnPaperCapacity() * (this.teamAttainmentPct() / 100));
  });

  hiringDeficit = computed(() => {
    const needed = Math.ceil(this.targetArr() / (this.individualQuota() * (this.teamAttainmentPct() / 100)));
    const currentFte = this.aeHeadcount() + this.rampingReps() * 0.5;
    return Math.max(0, Math.ceil(needed - currentFte));
  });

  quarterlyRamp = computed(() => {
    const baseRev = this.riskAdjustedCapacity() / 4;
    return [
      { quarter: 'Q1', projectedRevenue: Math.round(baseRev * 0.85), rampedFte: this.aeHeadcount(), quotaPct: 75 },
      { quarter: 'Q2', projectedRevenue: Math.round(baseRev * 0.95), rampedFte: this.aeHeadcount() + 1, quotaPct: 84 },
      { quarter: 'Q3', projectedRevenue: Math.round(baseRev * 1.08), rampedFte: this.aeHeadcount() + this.rampingReps(), quotaPct: 92 },
      { quarter: 'Q4', projectedRevenue: Math.round(baseRev * 1.25), rampedFte: this.aeHeadcount() + this.rampingReps() + 1, quotaPct: 105 }
    ];
  });

  // Accelerator calculation
  calculatedCommission = computed(() => {
    const quota = this.repAnnualQuota();
    const bookings = this.simRepBookings();
    const variable = this.repTargetVariable();

    if (quota <= 0) return 0;
    const attainment = bookings / quota;

    let commission = 0;
    if (attainment <= 1.0) {
      // Linear up to 100%
      commission = variable * attainment;
    } else if (attainment <= 1.25) {
      // 100% to 125% -> 1.5x accelerator
      const baseTier = variable;
      const extraBookings = bookings - quota;
      const extraVariable = extraBookings * (variable / quota) * 1.5;
      commission = baseTier + extraVariable;
    } else {
      // >125% -> 2.0x super accelerator
      const baseTier = variable;
      const tier2 = (quota * 0.25) * (variable / quota) * 1.5;
      const superBookings = bookings - quota * 1.25;
      const superVariable = superBookings * (variable / quota) * 2.0;
      commission = baseTier + tier2 + superVariable;
    }

    return Math.round(commission);
  });
}
