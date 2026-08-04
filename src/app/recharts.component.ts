/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-recharts',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div [style.height]="height" class="w-full h-full flex flex-col items-center justify-center bg-zinc-950/20 border border-zinc-800/50 rounded-xl p-4 relative select-none">
      
      <!-- SVG Chart Area -->
      <div class="relative w-full h-full flex items-end justify-between px-6 pb-8 pt-4">
        <svg class="w-full h-full overflow-visible" viewBox="0 0 1000 300" preserveAspectRatio="none">
          <!-- Grid lines -->
          <g class="stroke-zinc-800/30" stroke-width="1" stroke-dasharray="4,6">
            <line x1="50" y1="50" x2="950" y2="50" />
            <line x1="50" y1="105" x2="950" y2="105" />
            <line x1="50" y1="160" x2="950" y2="160" />
            <line x1="50" y1="215" x2="950" y2="215" />
            <line x1="50" y1="270" x2="950" y2="270" />
          </g>

          <!-- Dynamic Series Areas & Lines -->
          @for (s of series; track s.key) {
            <!-- Area (only if type is area) -->
            @if (type === 'area' && getAreaPath(s.key); as areaPath) {
              <path
                [attr.d]="areaPath"
                [attr.fill]="s.color"
                [attr.fill-opacity]="s.fillOpacity || 0.15"
                class="transition-all duration-500 ease-out"
              />
            }

            <!-- Line Path -->
            @if (getLinePath(s.key); as linePath) {
              <path
                [attr.d]="linePath"
                fill="none"
                [attr.stroke]="s.color"
                stroke-width="3"
                [attr.stroke-dasharray]="s.strokeDasharray || ''"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="transition-all duration-500 ease-out"
              />
            }

            <!-- Static Dots for points -->
            @for (p of getPoints(s.key); track p.index) {
              <circle
                [attr.cx]="p.x"
                [attr.cy]="p.y"
                r="4"
                [attr.fill]="s.color"
                stroke="#09090b"
                stroke-width="1.5"
                class="transition-all duration-300"
              />
            }
          }

          <!-- Hover Guide Line and Highlight Circles -->
          @if (hoveredIndex !== null) {
            <!-- Vertical Guide Line -->
            <line
              [attr.x1]="getX(hoveredIndex)"
              y1="40"
              [attr.x2]="getX(hoveredIndex)"
              y2="270"
              stroke="rgba(168, 85, 247, 0.4)"
              stroke-width="1.5"
              stroke-dasharray="4,4"
            />

            <!-- Interactive Pulse Rings on series points -->
            @for (s of series; track s.key) {
              @if (getHoveredSeriesValue(hoveredIndex, s.key); as val) {
                <g [attr.transform]="'translate(' + getX(hoveredIndex) + ', ' + getY(val) + ')'">
                  <circle cx="0" cy="0" r="12" [attr.fill]="s.color" class="opacity-25 animate-pulse" />
                  <circle cx="0" cy="0" r="6" [attr.fill]="s.color" stroke="#09090b" stroke-width="2" />
                </g>
              }
            }
          }

          <!-- Invisible Interactive Hover Rects covering columns -->
          @for (point of data; track $index) {
            <rect
              [attr.x]="getX($index) - getStepWidth() / 2"
              y="10"
              [attr.width]="getStepWidth()"
              height="270"
              fill="transparent"
              class="cursor-pointer"
              (mouseenter)="hoveredIndex = $index"
              (mouseleave)="hoveredIndex = null"
            />
          }
        </svg>

        <!-- Dynamic Floating HTML Tooltip overlay -->
        @if (hoveredIndex !== null && data[hoveredIndex]) {
          <div
            [style.left.%]="getX(hoveredIndex) / 10"
            [style.top.px]="getHighestY(hoveredIndex) * (268 / 300) + 12"
            class="absolute -translate-x-1/2 -translate-y-full mb-5 bg-zinc-900/95 border border-zinc-800 rounded-xl p-3 shadow-2xl z-50 pointer-events-none min-w-[220px] backdrop-blur-md animate-fade-in text-left border-purple-500/20"
          >
            <!-- Tooltip Header -->
            <div class="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2">
              <span class="text-xs font-bold text-white uppercase tracking-wider font-display">
                Forecast: {{ data[hoveredIndex][xAxisKey] }}
              </span>
              <span class="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                Index {{ hoveredIndex + 1 }}
              </span>
            </div>

            <!-- Tooltip Content for each active series -->
            <div class="space-y-2">
              @for (s of series; track s.key) {
                @if (data[hoveredIndex][s.key] !== null && data[hoveredIndex][s.key] !== undefined) {
                  <div class="flex flex-col gap-0.5">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5">
                        <div class="w-1.5 h-1.5 rounded-full" [style.backgroundColor]="s.color"></div>
                        <span class="text-[10px] font-semibold text-zinc-400">{{ s.name }}</span>
                      </div>
                      <span class="text-xs font-bold text-white font-mono">
                        {{ formatCurrency(data[hoveredIndex][s.key]) }}
                      </span>
                    </div>

                    <!-- Percentages (Growth and contribution) -->
                    <div class="flex items-center justify-between text-[9px] pl-3 text-zinc-500">
                      <span>Contribution:</span>
                      <span class="font-semibold text-zinc-300">
                        {{ getContributionPercent(hoveredIndex, s.key) }}
                      </span>
                    </div>

                    @if (getGrowthPercent(hoveredIndex, s.key); as growth) {
                      <div class="flex items-center justify-between text-[9px] pl-3 text-zinc-500">
                        <span>Growth (MoM):</span>
                        <span [class]="growth.startsWith('+') ? 'text-emerald-400 font-bold' : (growth.startsWith('-') ? 'text-rose-400 font-bold' : 'text-zinc-400')">
                          {{ growth }}
                        </span>
                      </div>
                    }
                  </div>
                }
              }

              <!-- Variance between Actual and Projected if both exist -->
              @if (data[hoveredIndex]['actual'] && data[hoveredIndex]['projected']) {
                <div class="pt-1.5 mt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[9px]">
                  <span class="text-purple-400 font-semibold flex items-center gap-1">
                    <mat-icon class="text-[11px] h-3 w-3">query_stats</mat-icon> AI Variance
                  </span>
                  <span class="text-zinc-300 font-bold font-mono">
                    {{ getVariancePercent(hoveredIndex) }}
                  </span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- X-Axis Labels -->
      <div class="absolute bottom-2 inset-x-6 flex justify-between text-[10px] font-bold text-zinc-500 font-mono">
        @for (point of data; track point[xAxisKey]) {
          @if (data.length <= 15 || $index % 5 === 0 || $index === data.length - 1) {
            <span [class.text-teal-400]="hoveredIndex === $index" class="transition-colors duration-200">
              {{ point[xAxisKey] }}
            </span>
          }
        }
      </div>

      <!-- Legend -->
      <div class="absolute top-2 right-4 flex gap-4">
        @for (s of series; track s.key) {
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full border border-zinc-950" [style.backgroundColor]="s.color"></div>
            <span class="text-[10px] font-bold text-zinc-400">{{ s.name }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -90%); }
      to { opacity: 1; transform: translate(-50%, -100%); }
    }
  `]
})
export class RechartsComponent {
  @Input() type = 'area';
  @Input() data: any[] = [];
  @Input() xAxisKey = '';
  @Input() series: any[] = [];
  @Input() height = '100%';

  hoveredIndex: number | null = null;

  get maxVal(): number {
    if (!this.data || this.data.length === 0) return 100;
    const values = this.data.flatMap(d => this.series.map(s => d[s.key] || 0));
    return Math.max(...values, 1) * 1.15; // 15% head room
  }

  getX(index: number): number {
    if (!this.data || this.data.length <= 1) return 50;
    const effectiveWidth = 900;
    const step = effectiveWidth / (this.data.length - 1);
    return 50 + index * step;
  }

  getY(value: number): number {
    if (value === null || value === undefined || isNaN(value)) return 270;
    const max = this.maxVal;
    const effectiveHeight = 220;
    return 270 - (value / max) * effectiveHeight;
  }

  getStepWidth(): number {
    if (!this.data || this.data.length <= 1) return 150;
    return 900 / (this.data.length - 1);
  }

  getPoints(seriesKey: string): { x: number; y: number; value: number; index: number }[] {
    if (!this.data) return [];
    return this.data
      .map((d, i) => ({
        x: this.getX(i),
        y: this.getY(d[seriesKey]),
        value: d[seriesKey],
        index: i
      }))
      .filter(p => p.value !== null && p.value !== undefined && !isNaN(p.value));
  }

  getLinePath(seriesKey: string): string {
    const points = this.getPoints(seriesKey);
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  }

  getAreaPath(seriesKey: string): string {
    const points = this.getPoints(seriesKey);
    if (points.length === 0) return '';
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const baselineY = 270;
    return `${linePath} L${lastX},${baselineY} L${firstX},${baselineY} Z`;
  }

  getHoveredSeriesValue(index: number, seriesKey: string): number | null {
    if (!this.data || !this.data[index]) return null;
    const val = this.data[index][seriesKey];
    return (val !== null && val !== undefined) ? val : null;
  }

  getHighestY(index: number): number {
    if (index === null || !this.data || !this.data[index]) return 150;
    const ys = this.series
      .map(s => this.getY(this.data[index][s.key]))
      .filter(y => y !== null && y !== undefined && !isNaN(y) && y < 270);
    return ys.length > 0 ? Math.min(...ys) : 150;
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  getGrowthPercent(index: number, seriesKey: string): string | null {
    if (index <= 0 || !this.data) return null;
    const current = this.data[index][seriesKey];
    const prev = this.data[index - 1][seriesKey];
    if (current === null || current === undefined || prev === null || prev === undefined || prev === 0) {
      return null;
    }
    const pct = ((current - prev) / prev) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  }

  getContributionPercent(index: number, seriesKey: string): string {
    if (!this.data || !this.data[index]) return '0.0%';
    const current = this.data[index][seriesKey];
    if (current === null || current === undefined) return '0.0%';
    const total = this.data.reduce((acc, d) => acc + (d[seriesKey] || 0), 0);
    if (total === 0) return '0.0%';
    return `${((current / total) * 100).toFixed(1)}%`;
  }

  getVariancePercent(index: number): string {
    if (!this.data || !this.data[index]) return '0.0%';
    const actual = this.data[index]['actual'];
    const projected = this.data[index]['projected'];
    if (!actual || !projected) return '0.0%';
    const diff = actual - projected;
    const pct = (diff / projected) * 100;
    const sign = pct >= 0 ? '+' : '';
    const desc = diff === 0 ? ' (On Target)' : (diff > 0 ? ' (Outperforming)' : ' (Underperforming)');
    return `${sign}${pct.toFixed(1)}%${desc}`;
  }
}
