import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, CommonModule],
  template: `
    <div [ngClass]="layout === 'compact' ? 'p-5' : 'p-6'" class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl transition-all duration-300 hover:bg-zinc-900/70 hover:border-zinc-700/80 hover:shadow-lg hover:shadow-black/40 group relative overflow-hidden">
      <!-- Subtle internal glow on hover -->
      <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      <!-- Detail Layout (Original) -->
      @if (layout === 'detail') {
        <div class="flex items-center justify-between mb-5 relative z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-zinc-800/80 flex items-center justify-center border border-zinc-700/50 group-hover:border-zinc-600 transition-colors shadow-inner">
              <i class="ti {{ icon }} text-zinc-400 group-hover:text-white transition-colors text-[20px]"></i>
            </div>
            <span class="text-sm font-medium text-zinc-400">{{ title }}</span>
          </div>
          <button class="text-zinc-600 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-800">
            <i class="ti ti-dots text-[20px]"></i>
          </button>
        </div>
        
        <div class="flex items-baseline gap-2 mb-3 relative z-10">
          <span class="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">{{ value }}</span>
        </div>
        
        @if (change) {
          <div class="flex items-center gap-2 text-xs relative z-10">
            <span [ngClass]="changeType === 'positive' ? 'text-teal-400 bg-teal-500/10 border-teal-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'" 
                  class="px-2 py-0.5 rounded-md flex items-center font-medium border">
              {{ change }}
            </span>
            <span class="text-zinc-500 font-medium tracking-wide">{{ changeLabel }}</span>
          </div>
        }
      }

      <!-- Compact Layout (For Contract Analytics) -->
      @if (layout === 'compact') {
        <div class="flex justify-between items-center relative z-10 w-full">
          <div>
            <h3 class="text-zinc-400 text-xs font-medium mb-2">{{ title }}</h3>
            <div class="text-white text-3xl font-display font-bold tracking-tight">{{ value }}</div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-zinc-950/50 border border-zinc-800 flex items-center justify-center shadow-inner group-hover:border-zinc-700 transition-colors">
            <i class="ti {{ icon }} text-zinc-500 group-hover:text-zinc-300 transition-colors text-[24px]"></i>
          </div>
        </div>
      }
    </div>
  `
})
export class KpiCardComponent {
  @Input() title = '';
  @Input() value = '';
  @Input() change?: string;
  @Input() changeLabel?: string;
  @Input() icon = '';
  @Input() changeType: 'positive' | 'negative' = 'positive';
  @Input() layout: 'detail' | 'compact' = 'detail';
}
