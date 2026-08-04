import { Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RechartsComponent } from './recharts.component';

export interface ChartPoint {
  month: string;
  fullName: string;
  value: number;
  y: number;
}

export interface LivePoint {
  time: string;
  value: number;
}

export interface LiveEvent {
  time: string;
  text: string;
  amount: number;
  type: 'success' | 'info' | 'purple';
}

@Component({
  selector: 'app-chart-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, RechartsComponent],
  template: `
    <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 h-full flex flex-col relative overflow-hidden group hover:border-zinc-700/80 transition-colors duration-300">
      
      <!-- Luminous Imperfection Glow Effect (Roman Aqua/Patina Green/Imperial Purple) -->
      <div class="absolute right-10 bottom-10 w-72 h-32 bg-teal-500/15 blur-[90px] pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100"></div>
      <div class="absolute left-10 top-1/2 w-48 h-32 bg-purple-500/5 blur-[80px] pointer-events-none transition-opacity duration-700 opacity-30"></div>

      <!-- Top Section -->
      <div class="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4 z-10 relative">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-widest font-display">
              {{ activeMode() === '30d' ? '30-Day Daily Sales Performance' : 'Revenue Velocity Engine' }}
            </h3>
            @if (activeMode() === '30d') {
              <span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-[9px] font-bold uppercase border border-teal-500/20">
                <mat-icon class="text-[11px] w-3 h-3">show_chart</mat-icon> Recharts Line Chart
              </span>
            } @else if (activeMode() === 'live') {
              <span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase border border-emerald-500/20 animate-pulse">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Live Stream
              </span>
            } @else {
              <span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[9px] font-bold uppercase border border-zinc-700">
                Static Portfolio
              </span>
            }
          </div>
          
          <div class="flex items-center gap-3">
            @if (activeMode() === '30d') {
              <span class="text-4xl font-display font-bold text-white tracking-tight drop-shadow-md">$773,200</span>
            } @else if (activeMode() === '12m') {
              <span class="text-4xl font-display font-bold text-white tracking-tight drop-shadow-md">$1,856,231</span>
            } @else {
              <span 
                [class.text-emerald-400]="highlightRevenue()" 
                [class.scale-[1.02]]="highlightRevenue()"
                class="text-4xl font-display font-bold text-white tracking-tight drop-shadow-md transition-all duration-300 inline-block">
                {{ formatCurrency(liveTotalRevenue()) }}
              </span>
            }
          </div>
          
          <div class="flex items-center gap-2 mt-2 text-xs">
            @if (activeMode() === '30d') {
              <span class="text-teal-400 font-semibold flex items-center gap-0.5">
                <mat-icon class="text-[14px] w-3.5 h-3.5">trending_up</mat-icon> +18.4%
              </span>
              <span class="text-zinc-500 font-medium">vs prior 30 days &bull; Avg: $25,773/day</span>
            } @else if (activeMode() === '12m') {
              <span class="text-teal-400 font-semibold flex items-center gap-0.5">
                <mat-icon class="text-[14px] w-3.5 h-3.5">arrow_upward</mat-icon> +12.2%
              </span>
              <span class="text-zinc-500 font-medium">vs last 12 months</span>
            } @else {
              <span class="text-emerald-400 font-semibold flex items-center gap-0.5 animate-pulse">
                <mat-icon class="text-[14px] w-3.5 h-3.5">sensors</mat-icon> Real-time Flow
              </span>
              <span class="text-zinc-500 font-medium">Monitoring active B.E.E.P. triggers</span>
            }
          </div>
        </div>
        
        <!-- Controls -->
        <div class="flex gap-1.5 bg-zinc-950/50 p-1 rounded-xl border border-zinc-800/60 shadow-inner z-20">
          <button 
            (click)="setMode('30d')"
            [ngClass]="activeMode() === '30d' ? 'bg-zinc-800 text-teal-400 border border-teal-500/30 shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-200'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1">
            <mat-icon class="text-[14px] w-3.5 h-3.5">timeline</mat-icon> 30 Days
          </button>
          <button 
            (click)="setMode('12m')"
            [ngClass]="activeMode() === '12m' ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm font-bold' : 'text-zinc-400 hover:text-zinc-200'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
            12 Months
          </button>
          <button 
            (click)="setMode('live')"
            [ngClass]="activeMode() === 'live' ? 'bg-zinc-800 text-teal-400 border border-teal-500/20 shadow-sm font-bold' : 'text-zinc-400 hover:text-teal-400'"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5">
            @if (activeMode() === 'live') {
              <span class="relative flex h-1.5 w-1.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
              </span>
            }
            Live Feed
          </button>
        </div>
      </div>

      <!-- Chart Content Box -->
      <div class="flex-1 relative w-full h-[220px] sm:h-[260px] z-10 overflow-hidden mt-2 select-none">
        
        <!-- 30 Days Recharts Line Chart View -->
        @if (activeMode() === '30d') {
          <div class="w-full h-full animate-fade-in">
            <app-recharts 
              type="line" 
              [data]="thirtyDaySalesData" 
              xAxisKey="day" 
              [series]="thirtyDaySeries" 
              height="100%">
            </app-recharts>
          </div>
        }
        
        <!-- SVG Chart Representation (For 12m & Live modes) -->
        @if (activeMode() !== '30d') {
          <svg viewBox="0 0 800 220" preserveAspectRatio="none" class="w-full h-full overflow-visible">
          <!-- Grid Lines -->
          <g class="text-zinc-800/40" stroke="currentColor" stroke-width="1" stroke-dasharray="4,6">
            <line x1="0" y1="20" x2="800" y2="20" />
            <line x1="0" y1="80" x2="800" y2="80" />
            <line x1="0" y1="140" x2="800" y2="140" />
            <line x1="0" y1="200" x2="800" y2="200" />
          </g>
          
          <!-- Defs with Gradients & Filters -->
          <defs>
            <linearGradient id="chartGradientAqua" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="rgba(32, 178, 170, 0.3)" />
              <stop offset="100%" stop-color="rgba(32, 178, 170, 0.0)" />
            </linearGradient>

            <linearGradient id="chartGradientEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="rgba(62, 185, 145, 0.3)" />
              <stop offset="100%" stop-color="rgba(62, 185, 145, 0.0)" />
            </linearGradient>
            
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- Standard 12 Months Rendering -->
          @if (activeMode() === '12m') {
            <!-- Area -->
            <path 
              [attr.d]="getAreaPath()" 
              fill="url(#chartGradientAqua)" 
              class="animate-fade-in"
            />

            <!-- Line -->
            <path 
              [attr.d]="getLinePath()" 
              fill="none" 
              stroke="#20B2AA" 
              stroke-width="3.5"
              filter="url(#glowEffect)"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="dash-anim"
            />

            <!-- Hover Node Details -->
            @if (hoveredIndex() !== null) {
              <!-- Vertical dashed guideline -->
              <line 
                [attr.x1]="getX(hoveredIndex()!)" 
                y1="15" 
                [attr.x2]="getX(hoveredIndex()!)" 
                y2="205" 
                stroke="rgba(32, 178, 170, 0.4)" 
                stroke-width="1.5" 
                stroke-dasharray="4,4" 
              />

              <!-- Glowing Node Circle -->
              <g [attr.transform]="'translate(' + getX(hoveredIndex()!) + ', ' + chartData[hoveredIndex()!].y + ')'">
                <circle cx="0" cy="0" r="14" fill="rgba(32, 178, 170, 0.25)" class="animate-pulse" />
                <circle cx="0" cy="0" r="6" fill="#0d0c18" stroke="#20B2AA" stroke-width="3" />
              </g>
            }

            <!-- Invisible triggers for mouse hover columns -->
            @for (pt of chartData; track pt.month) {
              <rect
                [attr.x]="getX($index) - getStepWidth() / 2"
                y="10"
                [attr.width]="getStepWidth()"
                height="190"
                fill="transparent"
                class="cursor-pointer"
                (mouseenter)="hoveredIndex.set($index)"
              />
            }
          }

          <!-- Live Streaming Rendering -->
          @if (activeMode() === 'live') {
            <!-- Area -->
            <path 
              [attr.d]="getLiveAreaPath()" 
              fill="url(#chartGradientEmerald)" 
              class="animate-fade-in"
            />

            <!-- Line -->
            <path 
              [attr.d]="getLiveLinePath()" 
              fill="none" 
              stroke="#3EB991" 
              stroke-width="3.5"
              filter="url(#glowEffect)"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="transition-all duration-300"
            />

            <!-- Hover Node Details -->
            @if (liveHoveredIndex() !== null) {
              <!-- Vertical dashed guideline -->
              <line 
                [attr.x1]="getLiveX(liveHoveredIndex()!)" 
                y1="15" 
                [attr.x2]="getLiveX(liveHoveredIndex()!)" 
                y2="205" 
                stroke="rgba(62, 185, 145, 0.4)" 
                stroke-width="1.5" 
                stroke-dasharray="4,4" 
              />

              <!-- Glowing Node Circle -->
              <g [attr.transform]="'translate(' + getLiveX(liveHoveredIndex()!) + ', ' + getLiveY(liveHoveredIndex()!) + ')'">
                <circle cx="0" cy="0" r="14" fill="rgba(62, 185, 145, 0.25)" class="animate-pulse" />
                <circle cx="0" cy="0" r="6" fill="#0d0c18" stroke="#3EB991" stroke-width="3" />
              </g>
            }

            <!-- Invisible triggers for mouse hover columns -->
            @for (pt of liveChartData(); track pt.time) {
              <rect
                [attr.x]="getLiveX($index) - getLiveStepWidth() / 2"
                y="10"
                [attr.width]="getLiveStepWidth()"
                height="190"
                fill="transparent"
                class="cursor-pointer"
                (mouseenter)="liveHoveredIndex.set($index)"
                (mouseleave)="liveHoveredIndex.set(null)"
              />
            }
          }
        </svg>

        <!-- Dynamic Floating GlassPane Tooltip overlay (12m Mode) -->
        @if (activeMode() === '12m' && hoveredIndex() !== null) {
          <div
            [style.left.%]="(getX(hoveredIndex()!) / 800) * 100"
            [style.top.px]="chartData[hoveredIndex()!].y"
            class="absolute -translate-x-1/2 -translate-y-full mb-6 bg-[#0d0c18]/95 border border-white/20 rounded-xl p-3.5 shadow-2xl z-50 pointer-events-none min-w-[210px] backdrop-filter backdrop-blur-[20px] animate-tooltip-fade text-left text-zinc-100"
          >
            <div class="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
              <span class="text-xs font-bold text-white tracking-wider font-display text-[#20B2AA]">
                {{ chartData[hoveredIndex()!].fullName }}
              </span>
              <span class="text-[8px] font-mono font-bold text-[#20B2AA] bg-[#20B2AA]/10 px-2 py-0.5 rounded-md uppercase border border-[#20B2AA]/20">
                PORTFOLIO
              </span>
            </div>

            <div class="space-y-1.5 text-xs font-medium">
              <div class="flex items-baseline justify-between">
                <span class="text-[10px] text-zinc-400">Total:</span>
                <span class="text-sm font-bold text-[#F5FFFA] font-mono">
                  {{ formatCurrency(chartData[hoveredIndex()!].value) }}
                </span>
              </div>

              <div class="flex items-center justify-between text-[10px]">
                <span class="text-zinc-400">Delta MoM:</span>
                <span [class]="getGrowth(hoveredIndex()!).startsWith('+') ? 'text-[#3EB991] font-bold' : 'text-rose-400 font-bold'">
                  {{ getGrowth(hoveredIndex()!) }}
                </span>
              </div>

              <div class="flex items-center justify-between text-[10px] border-t border-white/10 pt-1.5 mt-1.5">
                <span class="text-zinc-400">Total Share:</span>
                <span class="text-zinc-300 font-bold">
                  {{ getContribution(hoveredIndex()!) }}
                </span>
              </div>
            </div>
          </div>
        }

        <!-- Dynamic Floating GlassPane Tooltip overlay (Live Mode) -->
        @if (activeMode() === 'live' && liveHoveredIndex() !== null && liveChartData()[liveHoveredIndex()!]) {
          <div
            [style.left.%]="(getLiveX(liveHoveredIndex()!) / 800) * 100"
            [style.top.px]="getLiveY(liveHoveredIndex()!)"
            class="absolute -translate-x-1/2 -translate-y-full mb-6 bg-[#0d0c18]/95 border border-white/20 rounded-xl p-3.5 shadow-2xl z-50 pointer-events-none min-w-[210px] backdrop-filter backdrop-blur-[20px] animate-tooltip-fade text-left text-zinc-100"
          >
            <div class="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
              <span class="text-xs font-bold text-white tracking-wider font-display text-[#3EB991]">
                Time: {{ liveChartData()[liveHoveredIndex()!].time }}
              </span>
              <span class="text-[8px] font-mono font-bold text-[#3EB991] bg-[#3EB991]/10 px-2 py-0.5 rounded-md uppercase border border-[#3EB991]/20 animate-pulse">
                B.E.E.P. LIVE
              </span>
            </div>

            <div class="space-y-1.5 text-xs font-medium">
              <div class="flex items-baseline justify-between">
                <span class="text-[10px] text-zinc-400">Live Value:</span>
                <span class="text-sm font-bold text-[#F5FFFA] font-mono text-[#3EB991]">
                  {{ formatCurrency(liveChartData()[liveHoveredIndex()!].value) }}
                </span>
              </div>

              <div class="flex items-center justify-between text-[10px]">
                <span class="text-zinc-400">Increment:</span>
                <span class="text-[#3EB991] font-bold">
                  {{ getLiveIncrementPercent(liveHoveredIndex()!) }}
                </span>
              </div>
            </div>
          </div>
        }

        <!-- X Axis Labels (12m Mode) -->
        @if (activeMode() === '12m') {
          <div class="absolute bottom-[-10px] left-0 right-0 flex justify-between text-[10px] text-zinc-500 px-1 uppercase tracking-wider font-semibold">
            @for (pt of chartData; track pt.month) {
              <span [class.text-[#20B2AA]]="hoveredIndex() === $index" class="transition-colors duration-200">
                {{ pt.month }}
              </span>
            }
          </div>
        }

        <!-- X Axis Labels (Live Mode) -->
        @if (activeMode() === 'live') {
          <div class="absolute bottom-[-10px] left-0 right-0 flex justify-between text-[10px] text-zinc-500 px-1 font-mono font-semibold">
            @for (pt of liveChartData(); track pt.time) {
              <span [class.text-[#3EB991]]="liveHoveredIndex() === $index" class="transition-colors duration-200">
                {{ pt.time }}
              </span>
            }
          </div>
        }
        }
      </div>

      <!-- Real-time B.E.E.P. Activity Terminal/Logger Log scrolling container -->
      @if (activeMode() === 'live') {
        <div class="mt-8 border-t border-zinc-800/80 pt-4 flex flex-col gap-2 z-20 animate-fade-in select-none">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <mat-icon class="text-[12px] text-emerald-400 w-3.5 h-3.5">query_stats</mat-icon> B.E.E.P. Event Stream & Execution logs
            </span>
            <span class="text-[9px] font-mono text-zinc-600">Speed: 3000ms / Tick</span>
          </div>

          <div class="bg-zinc-950/80 rounded-xl p-3 border border-zinc-850 h-[100px] overflow-y-auto font-mono text-[11px] space-y-1.5 custom-scrollbar relative">
            @for (ev of liveEvents(); track $index) {
              <div class="flex items-start gap-2.5 leading-relaxed text-zinc-400 transition-all">
                <span class="text-zinc-600 font-semibold select-none flex-shrink-0">[{{ ev.time }}]</span>
                <span class="flex-shrink-0" [ngClass]="{
                  'text-emerald-400': ev.type === 'success',
                  'text-sky-400': ev.type === 'info',
                  'text-purple-400': ev.type === 'purple'
                }">[SYS-EXEC]</span>
                <span class="flex-1 text-zinc-300 truncate">{{ ev.text }}</span>
                @if (ev.amount > 0) {
                  <span class="text-emerald-400 font-bold font-mono text-right flex-shrink-0">
                    +{{ formatCurrency(ev.amount) }}
                  </span>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dash-anim {
      stroke-dasharray: 2500;
      stroke-dashoffset: 2500;
      animation: draw 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }
    @keyframes draw {
      to { stroke-dashoffset: 0; }
    }
    .animate-fade-in {
      animation: fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-tooltip-fade {
      animation: tooltipFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes tooltipFade {
      from { opacity: 0; transform: translate(-50%, -90%); }
      to { opacity: 1; transform: translate(-50%, -100%); }
    }
    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
  `]
})
export class ChartCardComponent implements OnInit, OnDestroy {
  activeMode = signal<'30d' | '12m' | 'live'>('30d');
  hoveredIndex = signal<number | null>(8);
  liveHoveredIndex = signal<number | null>(null);

  // 30-Day Daily Sales Performance Trend (Recharts Line Chart)
  thirtyDaySalesData = [
    { day: 'Jul 01', sales: 14200, target: 18000 },
    { day: 'Jul 02', sales: 18500, target: 18000 },
    { day: 'Jul 03', sales: 12100, target: 18000 },
    { day: 'Jul 04', sales: 19400, target: 18000 },
    { day: 'Jul 05', sales: 21300, target: 18000 },
    { day: 'Jul 06', sales: 16800, target: 18000 },
    { day: 'Jul 07', sales: 24500, target: 18000 },
    { day: 'Jul 08', sales: 19200, target: 18000 },
    { day: 'Jul 09', sales: 22800, target: 18000 },
    { day: 'Jul 10', sales: 15400, target: 18000 },
    { day: 'Jul 11', sales: 27900, target: 18000 },
    { day: 'Jul 12', sales: 31200, target: 18000 },
    { day: 'Jul 13', sales: 18600, target: 18000 },
    { day: 'Jul 14', sales: 20400, target: 18000 },
    { day: 'Jul 15', sales: 26100, target: 18000 },
    { day: 'Jul 16', sales: 23800, target: 18000 },
    { day: 'Jul 17', sales: 29500, target: 18000 },
    { day: 'Jul 18', sales: 17300, target: 18000 },
    { day: 'Jul 19', sales: 32800, target: 18000 },
    { day: 'Jul 20', sales: 28400, target: 18000 },
    { day: 'Jul 21', sales: 34100, target: 18000 },
    { day: 'Jul 22', sales: 22500, target: 18000 },
    { day: 'Jul 23', sales: 27200, target: 18000 },
    { day: 'Jul 24', sales: 35600, target: 18000 },
    { day: 'Jul 25', sales: 31000, target: 18000 },
    { day: 'Jul 26', sales: 29800, target: 18000 },
    { day: 'Jul 27', sales: 38200, target: 18000 },
    { day: 'Jul 28', sales: 33500, target: 18000 },
    { day: 'Jul 29', sales: 41200, target: 18000 },
    { day: 'Jul 30', sales: 39800, target: 18000 }
  ];

  thirtyDaySeries = [
    { key: 'sales', name: 'Daily Sales Revenue ($)', color: '#20B2AA' },
    { key: 'target', name: 'Daily Target ($18k)', color: '#A855F7', strokeDasharray: '4,4' }
  ];

  // Live state
  liveTotalRevenue = signal<number>(1856231);
  highlightRevenue = signal<boolean>(false);
  liveChartData = signal<LivePoint[]>([]);
  liveEvents = signal<LiveEvent[]>([]);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  chartData: ChartPoint[] = [
    { month: 'Jan', fullName: 'January', value: 105000, y: 180 },
    { month: 'Feb', fullName: 'February', value: 125000, y: 150 },
    { month: 'Mar', fullName: 'March', value: 115000, y: 165 },
    { month: 'Apr', fullName: 'April', value: 155000, y: 110 },
    { month: 'May', fullName: 'May', value: 148000, y: 120 },
    { month: 'Jun', fullName: 'June', value: 185000, y: 70 },
    { month: 'Jul', fullName: 'July', value: 195000, y: 60 },
    { month: 'Aug', fullName: 'August', value: 155000, y: 110 },
    { month: 'Sep', fullName: 'September', value: 215000, y: 30 },
    { month: 'Oct', fullName: 'October', value: 195000, y: 60 },
    { month: 'Nov', fullName: 'November', value: 165000, y: 100 },
    { month: 'Dec', fullName: 'December', value: 202231, y: 50 },
  ];

  // List of possible live actions to stream
  private eventPool = [
    { text: 'SDR Agent finalized conversion of Lead #4921', amount: 5200, type: 'success' as const },
    { text: 'B.E.E.P. Engine auto-renewed corporate SLA on Client #1092', amount: 2400, type: 'info' as const },
    { text: 'Oracle Upsell recommendation executed on Account: Acme Corp', amount: 12500, type: 'purple' as const },
    { text: 'SDR Outreach scheduled Demo & initialized pricing plan for Lead #1938', amount: 3500, type: 'info' as const },
    { text: 'Agent Ops-4 matched checkout logic on issue queue, releasing locked contract', amount: 14200, type: 'success' as const },
    { text: 'Pipeline Signal detected positive intent from Lead #3928: upsell processed', amount: 6200, type: 'purple' as const },
    { text: 'Verified recurring transaction balance on Enterprise Tier client #1920', amount: 8400, type: 'success' as const }
  ];

  ngOnInit() {
    this.prepopulateLiveBuffer();
  }

  ngOnDestroy() {
    this.clearLiveStream();
  }

  setMode(mode: '30d' | '12m' | 'live') {
    this.activeMode.set(mode);
    if (mode === 'live') {
      this.startLiveStream();
    } else {
      this.clearLiveStream();
    }
  }

  private prepopulateLiveBuffer() {
    // Fill the live data list with some realistic starting points (10 points spanning back)
    const baseValue = 1856231;
    const initialPoints: LivePoint[] = [];
    const initialEventsList: LiveEvent[] = [];

    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const pastTime = new Date(now.getTime() - i * 5000);
      const timeStr = this.formatTime(pastTime);
      const randOffset = Math.sin(i * 1.5) * 20000 + (i * 5000);
      initialPoints.push({
        time: timeStr,
        value: baseValue - (10 - i) * 6000 + randOffset
      });
    }

    initialEventsList.push(
      { time: this.formatTime(new Date(now.getTime() - 25000)), text: 'B.E.E.P. dynamic client connection initialized', amount: 0, type: 'info' },
      { time: this.formatTime(new Date(now.getTime() - 15000)), text: 'System-wide context loaded: ΛΞV Inc active workspaces sync\'d', amount: 0, type: 'purple' },
      { time: this.formatTime(new Date(now.getTime() - 5000)), text: 'Agent SDR-2 checked out Task #4928 and locked record', amount: 0, type: 'success' }
    );

    this.liveChartData.set(initialPoints);
    this.liveEvents.set(initialEventsList);
    this.liveTotalRevenue.set(baseValue);
  }

  private startLiveStream() {
    this.clearLiveStream();
    this.intervalId = setInterval(() => {
      this.tickLiveStream();
    }, 3000);
  }

  private clearLiveStream() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tickLiveStream() {
    // Generate a beautiful live transaction
    const now = new Date();
    const timeStr = this.formatTime(now);
    
    // Pick a random event from the pool
    const randEvent = this.eventPool[Math.floor(Math.random() * this.eventPool.length)];
    
    // Increment the total revenue
    const nextRevenue = this.liveTotalRevenue() + randEvent.amount;
    this.liveTotalRevenue.set(nextRevenue);

    // Trigger visual flash
    this.highlightRevenue.set(true);
    setTimeout(() => {
      this.highlightRevenue.set(false);
    }, 600);

    // Update live chart buffer (keep last 10 points)
    const currentChart = [...this.liveChartData()];
    currentChart.push({
      time: timeStr,
      value: nextRevenue
    });
    if (currentChart.length > 10) {
      currentChart.shift();
    }
    this.liveChartData.set(currentChart);

    // Update live event log (keep last 8 entries)
    const currentEvents = [...this.liveEvents()];
    currentEvents.unshift({
      time: timeStr,
      text: randEvent.text,
      amount: randEvent.amount,
      type: randEvent.type
    });
    if (currentEvents.length > 8) {
      currentEvents.pop();
    }
    this.liveEvents.set(currentEvents);
  }

  // --- Dynamic SVG Calculation Helpers (12m Mode) ---

  getX(index: number): number {
    return (index / 11) * 800;
  }

  getStepWidth(): number {
    return 800 / 11;
  }

  getLinePath(): string {
    return this.chartData.map((d, i) => `${i === 0 ? 'M' : 'L'}${this.getX(i)},${d.y}`).join(' ');
  }

  getAreaPath(): string {
    const linePath = this.getLinePath();
    return `${linePath} L800,200 L0,200 Z`;
  }

  // --- Dynamic SVG Calculation Helpers (Live Mode) ---

  getLiveX(index: number): number {
    const len = this.liveChartData().length;
    if (len <= 1) return 400;
    return (index / (len - 1)) * 800;
  }

  getLiveStepWidth(): number {
    const len = this.liveChartData().length;
    if (len <= 1) return 800;
    return 800 / (len - 1);
  }

  getLiveY(index: number): number {
    const data = this.liveChartData();
    if (data.length === 0) return 110;
    
    const values = data.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1000;

    const value = data[index].value;
    
    // Scale value between y = 30 and y = 180 (giving 150px range of motion on our 220px high canvas)
    return 180 - ((value - min) / range) * 150;
  }

  getLiveLinePath(): string {
    return this.liveChartData().map((d, i) => `${i === 0 ? 'M' : 'L'}${this.getLiveX(i)},${this.getLiveY(i)}`).join(' ');
  }

  getLiveAreaPath(): string {
    const linePath = this.getLiveLinePath();
    if (!linePath) return '';
    return `${linePath} L800,200 L0,200 Z`;
  }

  getLiveIncrementPercent(index: number): string {
    const data = this.liveChartData();
    if (index === 0 || !data || !data[index]) return '+0.0%';
    const curr = data[index].value;
    const prev = data[index - 1].value;
    const diff = curr - prev;
    if (diff <= 0) return '+0.0%';
    const pct = (diff / prev) * 100;
    return `+$${diff.toLocaleString()} (+${pct.toFixed(3)}%)`;
  }

  // --- General Helpers ---

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  }

  private formatTime(date: Date): string {
    const hrs = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const secs = String(date.getSeconds()).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  }

  getGrowth(index: number): string {
    if (index === 0) return '+5.2% vs Dec';
    const current = this.chartData[index].value;
    const prev = this.chartData[index - 1].value;
    const pct = ((current - prev) / prev) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}% vs ${this.chartData[index - 1].month}`;
  }

  getContribution(index: number): string {
    const current = this.chartData[index].value;
    const total = 1856231;
    const pct = (current / total) * 100;
    return `${pct.toFixed(1)}%`;
  }
}
