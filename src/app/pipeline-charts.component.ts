import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  effect,
  viewChild,
  ElementRef,
  PLATFORM_ID,
  inject,
  OnDestroy
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Lead } from './lead.service';
import {
  Chart,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  LineController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  Title,
  Tooltip
} from 'chart.js';

Chart.register(
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  LineController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  Title,
  Tooltip
);

@Component({
  selector: 'app-pipeline-charts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Top Metric Control Row -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
            <h2 class="text-sm sm:text-base font-display font-bold text-white tracking-wide">Dynamic Pipeline Intelligence</h2>
          </div>
          <p class="text-xs text-zinc-400 mt-0.5">Real-time conversion velocity, risk-adjusted value distribution, and acquisition channel yield.</p>
        </div>

        <div class="flex items-center gap-2 self-start sm:self-auto">
          <!-- Metric Mode Toggle: Value ($) vs Volume (#) -->
          <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-1 flex items-center gap-1">
            <button
              type="button"
              (click)="metricMode.set('value')"
              [class]="metricMode() === 'value' ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'text-zinc-400 hover:text-white'"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <mat-icon class="text-[14px]">attach_money</mat-icon>
              <span>ARR Value</span>
            </button>
            <button
              type="button"
              (click)="metricMode.set('count')"
              [class]="metricMode() === 'count' ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30' : 'text-zinc-400 hover:text-white'"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <mat-icon class="text-[14px]">numbers</mat-icon>
              <span>Lead Volume</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Visual Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Chart 1: Funnel & Conversion Velocity (2 Cols) -->
        <div class="lg:col-span-2 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-widest text-zinc-400 font-display">
                Stage Conversion & Velocity Funnel
              </h3>
              <p class="text-xs text-zinc-500 mt-0.5">Progression through pipeline stages with drop-off diagnostics</p>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-teal-400">
                Avg Velocity: {{ averageVelocityDays() }} Days
              </span>
            </div>
          </div>

          <!-- Chart Canvas Container -->
          <div class="relative w-full h-[260px] sm:h-[300px]">
            <canvas #funnelCanvas class="w-full h-full"></canvas>
          </div>

          <!-- Stage Conversion Summary Bar -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-2 border-t border-zinc-800/60 text-xs">
            @for (stage of stageSummaries(); track stage.name) {
              <div class="bg-zinc-950/60 border border-zinc-800/40 rounded-xl p-2.5">
                <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">{{ stage.name }}</span>
                <span class="font-mono font-bold text-white text-sm block mt-0.5">
                  {{ metricMode() === 'value' ? (stage.value | currency:'USD':'symbol':'1.0-0') : stage.count + ' leads' }}
                </span>
                <span class="text-[10px] text-teal-400 font-semibold block mt-0.5">
                  {{ stage.conversionRate }}% Conv.
                </span>
              </div>
            }
          </div>
        </div>

        <!-- Chart 2: Channel Acquisition Yield (1 Col) -->
        <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-widest text-zinc-400 font-display">
                Acquisition Yield by Source
              </h3>
              <p class="text-xs text-zinc-500 mt-0.5">Top revenue contributing lead channels</p>
            </div>
          </div>

          <!-- Doughnut Canvas -->
          <div class="relative w-full h-[240px] sm:h-[260px] flex items-center justify-center">
            <canvas #sourceCanvas class="w-full h-full"></canvas>
          </div>

          <!-- Top Source Highlight -->
          <div class="bg-zinc-950/60 border border-zinc-800/50 rounded-xl p-3 mt-4 text-xs flex items-center justify-between">
            <span class="text-zinc-400">Primary Channel:</span>
            <span class="font-bold text-emerald-400">{{ topPerformingSource() }}</span>
          </div>
        </div>

      </div>

      <!-- Secondary Chart Row: Risk-Adjusted Pipeline Expected ARR vs Nominal -->
      <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 class="text-xs font-bold uppercase tracking-widest text-zinc-400 font-display">
              Nominal vs. AI Risk-Weighted Expected Value
            </h3>
            <p class="text-xs text-zinc-500 mt-0.5">Comparison of total face value vs probability-adjusted closing forecast</p>
          </div>
          <div class="flex items-center gap-4 text-xs font-mono">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-purple-500"></span>
              <span class="text-zinc-400">Nominal: {{ totalNominalValue() | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-teal-400"></span>
              <span class="text-teal-300 font-bold">Expected: {{ totalExpectedValue() | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
          </div>
        </div>

        <div class="relative w-full h-[220px] sm:h-[250px]">
          <canvas #valueComparisonCanvas class="w-full h-full"></canvas>
        </div>
      </div>

    </div>
  `
})
export class PipelineChartsComponent implements OnDestroy {
  leads = input.required<Lead[]>();
  
  metricMode = signal<'value' | 'count'>('value');

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Canvas elements
  funnelCanvas = viewChild<ElementRef<HTMLCanvasElement>>('funnelCanvas');
  sourceCanvas = viewChild<ElementRef<HTMLCanvasElement>>('sourceCanvas');
  valueComparisonCanvas = viewChild<ElementRef<HTMLCanvasElement>>('valueComparisonCanvas');

  // Chart instances
  private funnelChartInstance: Chart | null = null;
  private sourceChartInstance: Chart | null = null;
  private valueComparisonChartInstance: Chart | null = null;

  // Stages
  readonly stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed'];

  // Stage Probabilities for AI-weighting
  private stageWeights: Record<string, number> = {
    'New': 0.15,
    'Contacted': 0.30,
    'Qualified': 0.60,
    'Proposal': 0.75,
    'Negotiation': 0.90,
    'Closed': 1.00
  };

  // Stage summaries
  stageSummaries = computed(() => {
    const list = this.leads();
    let previousCount = list.length || 1;

    return this.stages.map(stage => {
      const stageLeads = list.filter(l => l.status === stage);
      const count = stageLeads.length;
      const value = stageLeads.reduce((acc, l) => acc + (l.value || 0), 0);
      const conversionRate = Math.round((count / (previousCount || 1)) * 100);
      if (count > 0) previousCount = count;

      return {
        name: stage,
        count,
        value,
        conversionRate: Math.min(100, Math.max(0, conversionRate))
      };
    });
  });

  averageVelocityDays = computed(() => {
    const list = this.leads();
    if (!list.length) return 18;
    const avgScore = list.reduce((acc, l) => acc + (l.score || 50), 0) / list.length;
    // Higher score implies faster cycle
    return Math.max(7, Math.round(35 - (avgScore / 100) * 20));
  });

  totalNominalValue = computed(() => {
    return this.leads().reduce((acc, l) => acc + (l.value || 0), 0);
  });

  totalExpectedValue = computed(() => {
    return this.leads().reduce((acc, l) => {
      const weight = this.stageWeights[l.status] || 0.25;
      const scoreModifier = ((l.score || 50) / 100) * 0.2;
      const finalWeight = Math.min(1, Math.max(0.1, weight + scoreModifier - 0.1));
      return acc + (l.value || 0) * finalWeight;
    }, 0);
  });

  topPerformingSource = computed(() => {
    const list = this.leads();
    if (!list.length) return 'Inbound Website';
    const bySource: Record<string, number> = {};
    list.forEach(l => {
      const s = l.source || 'Direct';
      bySource[s] = (bySource[s] || 0) + (l.value || 0);
    });
    const sorted = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? `${sorted[0][0]} ($${Math.round(sorted[0][1] / 1000)}k)` : 'Website';
  });

  constructor() {
    // Re-render charts when leads or metric mode changes
    effect(() => {
      const data = this.leads();
      const mode = this.metricMode();
      if (!this.isBrowser || !data) return;

      // Small delay to allow Angular DOM painting
      setTimeout(() => {
        this.renderFunnelChart(data, mode);
        this.renderSourceChart(data);
        this.renderValueComparisonChart(data);
      }, 50);
    });
  }

  private renderFunnelChart(leads: Lead[], mode: 'value' | 'count') {
    const canvas = this.funnelCanvas()?.nativeElement;
    if (!canvas) return;

    if (this.funnelChartInstance) {
      this.funnelChartInstance.destroy();
      this.funnelChartInstance = null;
    }

    const labels = this.stages;
    const values = labels.map(stage => {
      const stageLeads = leads.filter(l => l.status === stage);
      return mode === 'value'
        ? stageLeads.reduce((acc, l) => acc + (l.value || 0), 0)
        : stageLeads.length;
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gradient styling for Verdigris Theme (Aqua & Purple)
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(32, 178, 170, 0.85)');
    gradient.addColorStop(1, 'rgba(106, 13, 173, 0.45)');

    this.funnelChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: mode === 'value' ? 'Stage ARR ($)' : 'Leads Count',
          data: values,
          backgroundColor: gradient,
          borderColor: '#20B2AA',
          borderWidth: 1.5,
          borderRadius: 8,
          barThickness: 28,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            borderColor: 'rgba(32, 178, 170, 0.4)',
            borderWidth: 1,
            titleFont: { family: 'Lexend', size: 12, weight: 'bold' },
            bodyFont: { family: 'Lexend', size: 12 },
            padding: 10,
            callbacks: {
              label: (context) => {
                const val = context.parsed.y ?? 0;
                return mode === 'value'
                  ? ` Value: $${val.toLocaleString()}`
                  : ` Leads: ${val} accounts`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#8C94A8', font: { family: 'Lexend', size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#8C94A8',
              font: { family: 'Lexend', size: 10 },
              callback: (value) => mode === 'value' ? `$${Number(value) / 1000}k` : value
            }
          }
        }
      }
    });
  }

  private renderSourceChart(leads: Lead[]) {
    const canvas = this.sourceCanvas()?.nativeElement;
    if (!canvas) return;

    if (this.sourceChartInstance) {
      this.sourceChartInstance.destroy();
      this.sourceChartInstance = null;
    }

    const bySource: Record<string, number> = {};
    leads.forEach(l => {
      const s = l.source || 'Other';
      bySource[s] = (bySource[s] || 0) + (l.value || 0);
    });

    const labels = Object.keys(bySource);
    const data = Object.values(bySource);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = [
      '#20B2AA', // Roman Aqua
      '#3EB991', // Patina Green
      '#6A0DAD', // Imperial Purple
      '#FFD700', // Gilded Accent
      '#F59E0B', // Amber
      '#3B82F6', // Blue
      '#EC4899'  // Pink
    ];

    this.sourceChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: '#18181b',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#8C94A8',
              font: { family: 'Lexend', size: 10 },
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            borderColor: 'rgba(62, 185, 145, 0.4)',
            borderWidth: 1,
            titleFont: { family: 'Lexend', size: 12, weight: 'bold' },
            bodyFont: { family: 'Lexend', size: 12 },
            padding: 10,
            callbacks: {
              label: (context) => {
                const val = Number(context.parsed) || 0;
                return ` $${val.toLocaleString()}`;
              }
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  private renderValueComparisonChart(leads: Lead[]) {
    const canvas = this.valueComparisonCanvas()?.nativeElement;
    if (!canvas) return;

    if (this.valueComparisonChartInstance) {
      this.valueComparisonChartInstance.destroy();
      this.valueComparisonChartInstance = null;
    }

    const labels = this.stages;
    const nominalValues = labels.map(stage => {
      return leads.filter(l => l.status === stage).reduce((acc, l) => acc + (l.value || 0), 0);
    });

    const expectedValues = labels.map(stage => {
      const weight = this.stageWeights[stage] || 0.25;
      return leads.filter(l => l.status === stage).reduce((acc, l) => {
        const scoreMod = ((l.score || 50) / 100) * 0.2;
        const adjustedWeight = Math.min(1, Math.max(0.1, weight + scoreMod - 0.1));
        return acc + (l.value || 0) * adjustedWeight;
      }, 0);
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.valueComparisonChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Nominal Face ARR',
            data: nominalValues,
            backgroundColor: 'rgba(106, 13, 173, 0.65)',
            borderColor: '#6A0DAD',
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.6,
          },
          {
            label: 'AI Probability-Adjusted ARR',
            data: expectedValues,
            backgroundColor: 'rgba(32, 178, 170, 0.85)',
            borderColor: '#20B2AA',
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#8C94A8',
              font: { family: 'Lexend', size: 11 },
              usePointStyle: true,
              pointStyle: 'rectRounded'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(24, 24, 27, 0.95)',
            borderColor: 'rgba(32, 178, 170, 0.4)',
            borderWidth: 1,
            titleFont: { family: 'Lexend', size: 12, weight: 'bold' },
            bodyFont: { family: 'Lexend', size: 12 },
            padding: 10,
            callbacks: {
              label: (context) => {
                const val = context.parsed.y ?? 0;
                return ` ${context.dataset.label}: $${val.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#8C94A8', font: { family: 'Lexend', size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#8C94A8',
              font: { family: 'Lexend', size: 10 },
              callback: (value) => `$${Number(value) / 1000}k`
            }
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.funnelChartInstance) this.funnelChartInstance.destroy();
    if (this.sourceChartInstance) this.sourceChartInstance.destroy();
    if (this.valueComparisonChartInstance) this.valueComparisonChartInstance.destroy();
  }
}
