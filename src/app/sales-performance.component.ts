import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { LeadService } from './lead.service';
import { Appwrite } from './appwrite';
import { RouterModule } from '@angular/router';

export interface SalesRepPerformance {
  id: string;
  name: string;
  avatar: string;
  role: string;
  quota: number;
  revenue: number;
  dealsWon: number;
  dealsTotal: number;
  winRate: number;
  avgCycleDays: number;
  superpowerTitle: string;
  superpowerBadge: string;
  superpowerDesc: string;
  recentWinStory: string;
  favoriteOpener: string;
  status: 'Online' | 'In Call' | 'Crushing Quota' | 'Coffee Break';
}

export type TimeRangePreset = 'today' | 'week' | 'month' | 'quarter' | 'ytd' | 'all' | 'custom';

@Component({
  selector: 'app-sales-performance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule, RouterModule],
  template: `
    <div class="h-full flex flex-col p-3 sm:p-5 md:p-6 animate-fade-in max-w-[1650px] mx-auto space-y-6">
      
      <!-- Top Header -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(106,13,173,0.35)] font-bold">
              <mat-icon class="text-[22px]">insights</mat-icon>
            </div>
            <div>
              <h1 class="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Sales Performance & Rep Intel</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono font-normal">Real-Time Revenue Telemetry</span>
              </h1>
              <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Executive revenue pacing, sales velocity curves, conversion funnels, and human-augmented agent leaderboards.
              </p>
            </div>
          </div>
        </div>

        <!-- Date Range Presets & Action Bar -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Time Range Tabs -->
          <div class="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shadow-inner">
            <button 
              type="button"
              (click)="setTimeRange('today')" 
              [class]="timeRange() === 'today' ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' : 'text-zinc-400 hover:text-white'"
              class="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer">
              Today
            </button>
            <button 
              type="button"
              (click)="setTimeRange('week')" 
              [class]="timeRange() === 'week' ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' : 'text-zinc-400 hover:text-white'"
              class="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer">
              This Week
            </button>
            <button 
              type="button"
              (click)="setTimeRange('month')" 
              [class]="timeRange() === 'month' ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' : 'text-zinc-400 hover:text-white'"
              class="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer">
              Month
            </button>
            <button 
              type="button"
              (click)="setTimeRange('quarter')" 
              [class]="timeRange() === 'quarter' ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' : 'text-zinc-400 hover:text-white'"
              class="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer">
              Q3 QTD
            </button>
            <button 
              type="button"
              (click)="setTimeRange('ytd')" 
              [class]="timeRange() === 'ytd' ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' : 'text-zinc-400 hover:text-white'"
              class="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer">
              YTD
            </button>
            <button 
              type="button"
              (click)="setTimeRange('custom')" 
              [class]="timeRange() === 'custom' ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30' : 'text-zinc-400 hover:text-white'"
              class="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1">
              <mat-icon class="text-[14px]">date_range</mat-icon>
              <span>Custom</span>
            </button>
          </div>

          <button 
            type="button"
            (click)="showFiltersModal.set(!showFiltersModal())"
            [class.border-purple-500]="activeFilterCount() > 0"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px] text-purple-400">tune</mat-icon>
            <span>Filters</span>
            @if (activeFilterCount() > 0) {
              <span class="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">{{ activeFilterCount() }}</span>
            }
          </button>

          <button 
            type="button"
            (click)="exportExecutiveSummary()"
            class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/25 cursor-pointer active:scale-95 transition-all">
            <mat-icon class="text-[16px]">file_download</mat-icon>
            <span>Export Briefing</span>
          </button>
        </div>
      </header>

      <!-- Custom Date Picker Tray (when 'custom' range is active) -->
      @if (timeRange() === 'custom') {
        <div class="bg-zinc-900/80 border border-purple-500/30 backdrop-blur-xl p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-fade-in shadow-xl">
          <div class="flex items-center gap-3 text-xs text-zinc-300">
            <span class="font-bold text-purple-400 flex items-center gap-1">
              <mat-icon class="text-[16px]">calendar_today</mat-icon> Custom Date Window:
            </span>
            <div class="flex items-center gap-2">
              <label for="custom-start-date" class="text-zinc-500 text-[11px]">From:</label>
              <input id="custom-start-date" type="date" [(ngModel)]="customStartDate" class="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-purple-500/60" />
            </div>
            <div class="flex items-center gap-2">
              <label for="custom-end-date" class="text-zinc-500 text-[11px]">To:</label>
              <input id="custom-end-date" type="date" [(ngModel)]="customEndDate" class="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-purple-500/60" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="applyCustomDate()" class="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer">
              Apply Range
            </button>
          </div>
        </div>
      }

      <!-- Interactive Filters Drawer / Banner -->
      @if (showFiltersModal()) {
        <div class="bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          <div>
            <label for="filter-rep" class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Filter by Sales Rep</label>
            <select id="filter-rep" [(ngModel)]="selectedRepFilter" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50">
              <option value="ALL">All Sales Representatives</option>
              @for (rep of reps(); track rep.id) {
                <option [value]="rep.id">{{ rep.name }} ({{ rep.role }})</option>
              }
            </select>
          </div>
          <div>
            <label for="filter-tier" class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Deal Size Tier</label>
            <select id="filter-tier" [(ngModel)]="selectedTierFilter" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50">
              <option value="ALL">All Deal Values</option>
              <option value="ENTERPRISE">Enterprise ($100k+ ARR)</option>
              <option value="MID_MARKET">Mid-Market ($50k - $100k)</option>
              <option value="GROWTH">Growth ($10k - $50k)</option>
            </select>
          </div>
          <div>
            <label for="filter-stage" class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Pipeline Stage</label>
            <select id="filter-stage" [(ngModel)]="selectedStageFilter" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50">
              <option value="ALL">All Stages</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal Delivered</option>
              <option value="Negotiation">Negotiation & Security</option>
              <option value="Closed">Closed Won</option>
            </select>
          </div>
          <div class="flex items-end gap-2">
            <button (click)="resetFilters()" class="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-all cursor-pointer">
              Reset Filters
            </button>
            <button (click)="showFiltersModal.set(false)" class="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer">
              Done
            </button>
          </div>
        </div>
      }

      <!-- Top KPI Row (4 High-Impact Metrics) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <!-- Total Revenue Card -->
        <div class="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-purple-600/15 rounded-full blur-2xl pointer-events-none"></div>
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Total Closed Revenue</span>
            <div class="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <mat-icon class="text-purple-400 text-[16px]">payments</mat-icon>
            </div>
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">{{ formatCurrency(totalRevenue()) }}</div>
            <div class="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-400">
              <mat-icon class="text-[14px]">trending_up</mat-icon>
              <span>+{{ revenueGrowthPct() }}% vs prior period</span>
            </div>
          </div>
          <div class="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Quota Target: {{ formatCurrency(teamQuotaTarget()) }}</span>
            <span class="text-purple-400 font-bold font-mono">{{ quotaAttainmentPct() }}% Attained</span>
          </div>
        </div>

        <!-- Deals Closed Card -->
        <div class="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-emerald-600/15 rounded-full blur-2xl pointer-events-none"></div>
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Deals Closed Won</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <mat-icon class="text-emerald-400 text-[16px]">check_circle</mat-icon>
            </div>
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">{{ dealsWonCount() }} <span class="text-xs text-zinc-500 font-sans font-normal">Won</span></div>
            <div class="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-400">
              <mat-icon class="text-[14px]">verified</mat-icon>
              <span>{{ dealsWonCount() + dealsInFlightCount() }} active opportunities</span>
            </div>
          </div>
          <div class="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Average Deal Size:</span>
            <span class="text-emerald-400 font-bold font-mono">{{ formatCurrency(avgDealSize()) }}</span>
          </div>
        </div>

        <!-- Win & Conversion Rate Card -->
        <div class="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-cyan-600/15 rounded-full blur-2xl pointer-events-none"></div>
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Conversion & Win Rate</span>
            <div class="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <mat-icon class="text-cyan-400 text-[16px]">query_stats</mat-icon>
            </div>
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">{{ winRatePct() }}%</div>
            <div class="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-cyan-400">
              <mat-icon class="text-[14px]">auto_awesome</mat-icon>
              <span>+6.4% lift with AI Icebreaker Reachouts</span>
            </div>
          </div>
          <div class="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Proposal-to-Close:</span>
            <span class="text-cyan-400 font-bold font-mono">68.2%</span>
          </div>
        </div>

        <!-- Sales Cycle Length Card -->
        <div class="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-amber-600/15 rounded-full blur-2xl pointer-events-none"></div>
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Avg Sales Cycle Length</span>
            <div class="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <mat-icon class="text-amber-400 text-[16px]">timelapse</mat-icon>
            </div>
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-bold text-white font-mono tracking-tight">{{ avgSalesCycleDays() }} <span class="text-xs text-zinc-500 font-sans font-normal">Days</span></div>
            <div class="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-400">
              <mat-icon class="text-[14px]">speed</mat-icon>
              <span>&minus;3.2 days faster than industry benchmark</span>
            </div>
          </div>
          <div class="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Fast-track Deals:</span>
            <span class="text-amber-400 font-bold font-mono">< 9 Days</span>
          </div>
        </div>
      </div>

      <!-- Main Visualizations Grid (Revenue Pacing + Conversion Funnel + Cycle Distribution) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Revenue Trajectory & Quota Pacing Chart (8 cols) -->
        <div class="lg:col-span-8 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 backdrop-blur-xl space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-white font-display flex items-center gap-2">
                <mat-icon class="text-purple-400 text-[20px]">show_chart</mat-icon>
                <span>Revenue Pacing & Deal Flow Trajectory</span>
              </h2>
              <p class="text-xs text-zinc-400">Cumulative ARR booked vs target pace over selected period.</p>
            </div>
            <div class="flex items-center gap-4 text-xs font-semibold">
              <div class="flex items-center gap-1.5 text-purple-400">
                <span class="w-3 h-1 bg-purple-500 rounded-full"></span>
                <span>Actual ARR Booked</span>
              </div>
              <div class="flex items-center gap-1.5 text-zinc-400">
                <span class="w-3 h-1 bg-zinc-600 rounded-full border-dashed border-zinc-400"></span>
                <span>Quota Target</span>
              </div>
            </div>
          </div>

          <!-- SVG Visual Revenue Trajectory Graph -->
          <div class="relative h-[240px] w-full pt-4">
            <svg class="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#6A0DAD" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#20B2AA" stop-opacity="0.0"/>
                </linearGradient>
                <linearGradient id="revLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#6A0DAD"/>
                  <stop offset="50%" stop-color="#3EB991"/>
                  <stop offset="100%" stop-color="#20B2AA"/>
                </linearGradient>
              </defs>

              <!-- Grid Horizontal Lines -->
              <line x1="0" y1="40" x2="700" y2="40" stroke="#27272a" stroke-dasharray="4 4" />
              <line x1="0" y1="90" x2="700" y2="90" stroke="#27272a" stroke-dasharray="4 4" />
              <line x1="0" y1="140" x2="700" y2="140" stroke="#27272a" stroke-dasharray="4 4" />
              <line x1="0" y1="190" x2="700" y2="190" stroke="#3f3f46" />

              <!-- Quota Target Line (Dashed) -->
              <line x1="0" y1="180" x2="700" y2="50" stroke="#71717a" stroke-width="2" stroke-dasharray="6 6" />

              <!-- Actual Revenue Area Fill -->
              <path d="M 0 190 L 0 175 C 100 160, 180 145, 250 130 C 340 115, 420 80, 520 60 C 600 45, 650 35, 700 28 L 700 190 Z" fill="url(#revAreaGrad)" />

              <!-- Actual Revenue Line -->
              <path d="M 0 175 C 100 160, 180 145, 250 130 C 340 115, 420 80, 520 60 C 600 45, 650 35, 700 28" fill="none" stroke="url(#revLineGrad)" stroke-width="3.5" stroke-linecap="round" />

              <!-- Data Points with pulsing glow -->
              <circle cx="250" cy="130" r="5" fill="#3EB991" class="shadow-lg" />
              <circle cx="520" cy="60" r="5" fill="#20B2AA" class="shadow-lg" />
              <circle cx="700" cy="28" r="6" fill="#F5FFFA" stroke="#6A0DAD" stroke-width="2" />
            </svg>

            <!-- Bottom X-Axis Labels -->
            <div class="flex justify-between text-[10px] text-zinc-500 font-mono mt-2">
              <span>Week 1 (Kickoff)</span>
              <span>Week 2 (Outreach Peak)</span>
              <span>Week 3 (Mid-Sprint Review)</span>
              <span>Week 4 (Closing Wave)</span>
              <span class="text-purple-400 font-bold">Today ($1.28M)</span>
            </div>
          </div>

          <!-- Highlight Telemetry Metrics Bar -->
          <div class="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-800/60 text-center">
            <div class="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span class="text-[10px] text-zinc-500 uppercase font-semibold">Deal Velocity Index</span>
              <div class="text-sm sm:text-base font-bold text-white font-mono">$45.8k / day</div>
            </div>
            <div class="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span class="text-[10px] text-zinc-500 uppercase font-semibold">Top Performing Sector</span>
              <div class="text-sm sm:text-base font-bold text-teal-400">Cyber Security ($490k)</div>
            </div>
            <div class="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <span class="text-[10px] text-zinc-500 uppercase font-semibold">Stage Acceleration</span>
              <div class="text-sm sm:text-base font-bold text-purple-400">+22.4% with Sequences</div>
            </div>
          </div>
        </div>

        <!-- Right: Deal Conversion Funnel & Stage Drop-off (4 cols) -->
        <div class="lg:col-span-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div>
                <h2 class="text-base font-bold text-white font-display flex items-center gap-2">
                  <mat-icon class="text-teal-400 text-[20px]">filter_alt</mat-icon>
                  <span>Pipeline Conversion Funnel</span>
                </h2>
                <p class="text-xs text-zinc-400">Drop-off & progression through stages.</p>
              </div>
            </div>

            <!-- Funnel Stages List with Progression Bars -->
            <div class="space-y-3.5 mt-4">
              <!-- Stage 1: Inbound / Enrolled -->
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-zinc-300 font-semibold flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-blue-400"></span> 1. Inbound Leads & Sequences
                  </span>
                  <span class="font-mono text-white font-bold">148 Leads (100%)</span>
                </div>
                <div class="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full w-full"></div>
                </div>
              </div>

              <!-- Stage 2: AI Scored Hot / Qualified -->
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-zinc-300 font-semibold flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-teal-400"></span> 2. AI Scored Hot (Fit ≥ 75)
                  </span>
                  <span class="font-mono text-teal-300 font-bold">84 Leads (56.8%)</span>
                </div>
                <div class="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div class="h-full bg-teal-500 rounded-full" style="width: 56.8%"></div>
                </div>
              </div>

              <!-- Stage 3: Demo Walkthrough Held -->
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-zinc-300 font-semibold flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-indigo-400"></span> 3. Discovery & Demo Held
                  </span>
                  <span class="font-mono text-indigo-300 font-bold">52 Deals (35.1%)</span>
                </div>
                <div class="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div class="h-full bg-indigo-500 rounded-full" style="width: 35.1%"></div>
                </div>
              </div>

              <!-- Stage 4: Proposal / Contract Suite -->
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-zinc-300 font-semibold flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-amber-400"></span> 4. Executive Proposal & Legal
                  </span>
                  <span class="font-mono text-amber-300 font-bold">34 Deals (23.0%)</span>
                </div>
                <div class="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-500 rounded-full" style="width: 23.0%"></div>
                </div>
              </div>

              <!-- Stage 5: Closed Won -->
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-emerald-300 font-bold flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span> 5. Finalized Closed Won
                  </span>
                  <span class="font-mono text-emerald-400 font-bold">22 Deals (14.9% Net)</span>
                </div>
                <div class="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden border border-emerald-500/30">
                  <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style="width: 14.9%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Entertaining Human Coaching Nugget -->
          <div class="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
            <div class="flex items-center gap-1.5 font-bold text-purple-300 mb-1">
              <mat-icon class="text-[16px]">psychology</mat-icon>
              <span>Vibe Check: Stage 3 to 4 Leap</span>
            </div>
            <p class="leading-relaxed text-zinc-300 text-[11px]">
              Deals that receive a personalized <strong>"Objection Deflector" voice note</strong> after the demo move to Proposal <strong>38% faster</strong> than standard PDF email attachments.
            </p>
          </div>
        </div>
      </div>

      <!-- Agent Leaderboard & Human Superpowers Section (Entertaining & Engaging) -->
      <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 backdrop-blur-xl space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div>
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                <mat-icon class="text-[18px]">emoji_events</mat-icon>
              </div>
              <div>
                <h2 class="text-lg font-bold text-white font-display">Sales Agent Arena & Leaderboard</h2>
                <p class="text-xs text-zinc-400">Honoring human personality, hustle badges, and deal velocity mastery.</p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs text-zinc-400">Sort by:</span>
            <select [(ngModel)]="leaderboardSort" class="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50">
              <option value="revenue">Highest Closed Revenue</option>
              <option value="winRate">Best Win Rate %</option>
              <option value="cycle">Fastest Sales Cycle</option>
              <option value="deals">Most Deals Won</option>
            </select>
          </div>
        </div>

        <!-- Leaderboard Table & Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (rep of sortedReps(); track rep.id; let i = $index) {
            <div class="bg-zinc-950/70 border border-zinc-800/90 hover:border-purple-500/40 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group flex flex-col justify-between shadow-lg">
              
              <!-- Rank Crown / Trophy Badge -->
              <div class="absolute top-4 right-4 flex items-center gap-1.5">
                @if (i === 0) {
                  <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[11px] flex items-center gap-1">
                    👑 #1 Champion
                  </span>
                } @else if (i === 1) {
                  <span class="px-2.5 py-0.5 rounded-full bg-slate-400/20 text-slate-200 border border-slate-400/40 font-bold text-[11px] flex items-center gap-1">
                    🥈 #2 Runner-Up
                  </span>
                } @else if (i === 2) {
                  <span class="px-2.5 py-0.5 rounded-full bg-amber-700/20 text-amber-400 border border-amber-700/40 font-bold text-[11px] flex items-center gap-1">
                    🥉 #3 Podium
                  </span>
                } @else {
                  <span class="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono text-[10px]">
                    #{{ i + 1 }}
                  </span>
                }
              </div>

              <!-- Rep Identity & Superpower -->
              <div>
                <div class="flex items-center gap-3.5 mb-3">
                  <div class="relative">
                    <img [src]="rep.avatar" [alt]="rep.name" class="w-12 h-12 rounded-xl object-cover border border-zinc-700 group-hover:border-purple-500 transition-colors" referrerpolicy="no-referrer" />
                    <span [class]="rep.status === 'Crushing Quota' ? 'bg-emerald-400 ring-2 ring-emerald-950' : 'bg-teal-400 ring-2 ring-zinc-950'" class="w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5"></span>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-white group-hover:text-purple-300 transition-colors font-display">{{ rep.name }}</h3>
                    <p class="text-[11px] text-zinc-400">{{ rep.role }}</p>
                    <div class="flex items-center gap-1 mt-0.5">
                      <span class="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                        {{ rep.superpowerBadge }} {{ rep.superpowerTitle }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Superpower Wit Description -->
                <p class="text-xs text-zinc-300 italic bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 mb-4 leading-relaxed">
                  "{{ rep.superpowerDesc }}"
                </p>

                <!-- Quota Attainment Bar -->
                <div class="space-y-1 mb-4">
                  <div class="flex justify-between text-xs">
                    <span class="text-zinc-400 text-[11px]">Quota Progress ({{ formatCurrency(rep.revenue) }} / {{ formatCurrency(rep.quota) }})</span>
                    <span class="font-mono font-bold text-purple-300">{{ getAttainment(rep) }}%</span>
                  </div>
                  <div class="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      class="h-full bg-gradient-to-r from-purple-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500" 
                      [style.width.%]="Math.min(100, getAttainment(rep))">
                    </div>
                  </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-3 gap-2 text-center text-xs py-2 border-y border-zinc-800/60 mb-4">
                  <div>
                    <span class="block text-[10px] text-zinc-500 uppercase">Deals Won</span>
                    <span class="font-bold text-white font-mono">{{ rep.dealsWon }} / {{ rep.dealsTotal }}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] text-zinc-500 uppercase">Win Rate</span>
                    <span class="font-bold text-teal-400 font-mono">{{ rep.winRate }}%</span>
                  </div>
                  <div>
                    <span class="block text-[10px] text-zinc-500 uppercase">Cycle Speed</span>
                    <span class="font-bold text-amber-400 font-mono">{{ rep.avgCycleDays }}d</span>
                  </div>
                </div>
              </div>

              <!-- Bottom: Rep's Secret Battle Story / Favorite Opener -->
              <div class="pt-2">
                <button 
                  type="button"
                  (click)="openRepModal(rep)"
                  class="w-full py-2 bg-zinc-900 hover:bg-purple-950/60 border border-zinc-800 hover:border-purple-500/40 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                  <mat-icon class="text-[14px] text-purple-400">record_voice_over</mat-icon>
                  <span>View Rep Playbook & Opener</span>
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Rep Playbook Detail Modal -->
      @if (selectedRepModal(); as activeRep) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-zinc-950 border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <img [src]="activeRep.avatar" [alt]="activeRep.name" class="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500" referrerpolicy="no-referrer" />
                <div>
                  <h3 class="text-lg font-bold text-white font-display">{{ activeRep.name }}</h3>
                  <p class="text-xs text-purple-400">{{ activeRep.role }} &bull; {{ activeRep.superpowerBadge }} {{ activeRep.superpowerTitle }}</p>
                </div>
              </div>
              <button (click)="selectedRepModal.set(null)" class="text-zinc-500 hover:text-white p-1">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div class="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span class="block font-bold text-amber-400 uppercase tracking-wider text-[10px] mb-1">Win of the Week Story</span>
                <p class="text-zinc-200 leading-relaxed">{{ activeRep.recentWinStory }}</p>
              </div>

              <div class="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30">
                <span class="block font-bold text-purple-300 uppercase tracking-wider text-[10px] mb-1">Favorite Human Icebreaker Hook</span>
                <p class="text-purple-100 italic leading-relaxed">"{{ activeRep.favoriteOpener }}"</p>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button (click)="selectedRepModal.set(null)" class="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                Close Playbook
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class SalesPerformanceComponent {
  leadService = inject(LeadService);
  appwrite = inject(Appwrite);
  Math = Math;

  timeRange = signal<TimeRangePreset>('month');
  showFiltersModal = signal<boolean>(false);
  selectedRepFilter = signal<string>('ALL');
  selectedTierFilter = signal<string>('ALL');
  selectedStageFilter = signal<string>('ALL');
  leaderboardSort = signal<'revenue' | 'winRate' | 'cycle' | 'deals'>('revenue');
  selectedRepModal = signal<SalesRepPerformance | null>(null);

  customStartDate = '2026-08-01';
  customEndDate = '2026-08-31';

  // Sales team performance dataset with personality & humor
  reps = signal<SalesRepPerformance[]>([
    {
      id: 'rep-1',
      name: 'Alexandra Vance',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      role: 'Principal Enterprise AE',
      quota: 450000,
      revenue: 512000,
      dealsWon: 6,
      dealsTotal: 7,
      winRate: 85.7,
      avgCycleDays: 9.4,
      superpowerTitle: 'The Contract Architect',
      superpowerBadge: '👑',
      superpowerDesc: 'Turns 6-month enterprise security reviews into 48-hour signature parties with custom battlecards.',
      recentWinStory: 'Closed Stark Logistics ($175k) by sending the CIO a diagram showing exactly how much latency their current CRM was adding to daily dispatch.',
      favoriteOpener: 'Saw your engineering team posted about microservice bottlenecks at 2 AM—our latency telemetry might save your weekend.',
      status: 'Crushing Quota'
    },
    {
      id: 'rep-2',
      name: 'Marcus Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Senior Strategic AE',
      quota: 400000,
      revenue: 438000,
      dealsWon: 5,
      dealsTotal: 6,
      winRate: 83.3,
      avgCycleDays: 8.2,
      superpowerTitle: 'Speed Demon',
      superpowerBadge: '⚡',
      superpowerDesc: 'Fastest discovery-to-proposal velocity in company history. Never sends a boring follow-up.',
      recentWinStory: 'Closed NovaFin ($94k) after an 8-minute interactive sandbox demo that proved SOC2 compliance live.',
      favoriteOpener: 'Promise not to show you 45 PowerPoint slides if you give me 5 minutes to show you the real database engine.',
      status: 'In Call'
    },
    {
      id: 'rep-3',
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      role: 'FinTech Specialist AE',
      quota: 350000,
      revenue: 375000,
      dealsWon: 4,
      dealsTotal: 5,
      winRate: 80.0,
      avgCycleDays: 11.5,
      superpowerTitle: 'Ghost Whisperer',
      superpowerBadge: '👻',
      superpowerDesc: 'Revives dormant accounts with hilarious, hyper-targeted sequence touches that executives actually reply to.',
      recentWinStory: 'Revived an 8-month dormant healthcare lead by sending an AI-synthesized audit of their cloud compliance gaps.',
      favoriteOpener: 'Did our last email get lost in your spam filter, or was my joke about legacy databases that bad?',
      status: 'Online'
    },
    {
      id: 'rep-4',
      name: 'David Sterling',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'Cyber Security Lead AE',
      quota: 350000,
      revenue: 320000,
      dealsWon: 4,
      dealsTotal: 6,
      winRate: 66.7,
      avgCycleDays: 13.1,
      superpowerTitle: 'Precision Sniper',
      superpowerBadge: '🎯',
      superpowerDesc: 'Only pitches high-value leads with AI Fit Score > 80. Almost zero wasted discovery calls.',
      recentWinStory: 'Won Vanguard Security ($110k) against two legacy incumbents by benchmarking API response speeds live.',
      favoriteOpener: 'We audited 50 enterprise security stacks this quarter—here is the one blindspot 90% of CISOs missed.',
      status: 'Online'
    },
    {
      id: 'rep-5',
      name: 'Dr. Seraphina Tanaka',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'BioTech & Health AE',
      quota: 300000,
      revenue: 295000,
      dealsWon: 3,
      dealsTotal: 4,
      winRate: 75.0,
      avgCycleDays: 14.8,
      superpowerTitle: 'The Domain Oracle',
      superpowerBadge: '🔮',
      superpowerDesc: 'Deep technical credibility. Speaks fluent genomics and HIPAA compliance without sounding like a salesperson.',
      recentWinStory: 'Drafted custom SLA parameters for Aether BioLab ($150k) that passed legal in one revision.',
      favoriteOpener: 'Rather than selling you software, let me show you how other BioTech teams cut their compliance auditing by 60%.',
      status: 'Coffee Break'
    }
  ]);

  // Computed Leaderboard sorted
  sortedReps = computed(() => {
    const list = [...this.reps()];
    const sort = this.leaderboardSort();
    if (sort === 'revenue') return list.sort((a, b) => b.revenue - a.revenue);
    if (sort === 'winRate') return list.sort((a, b) => b.winRate - a.winRate);
    if (sort === 'cycle') return list.sort((a, b) => a.avgCycleDays - b.avgCycleDays);
    if (sort === 'deals') return list.sort((a, b) => b.dealsWon - a.dealsWon);
    return list;
  });

  // Filter count
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedRepFilter() !== 'ALL') count++;
    if (this.selectedTierFilter() !== 'ALL') count++;
    if (this.selectedStageFilter() !== 'ALL') count++;
    return count;
  });

  // Core Aggregates
  totalRevenue = computed(() => {
    return this.reps().reduce((acc, r) => acc + r.revenue, 0);
  });

  teamQuotaTarget = computed(() => {
    return this.reps().reduce((acc, r) => acc + r.quota, 0);
  });

  quotaAttainmentPct = computed(() => {
    const quota = this.teamQuotaTarget();
    if (quota === 0) return 100;
    return Math.round((this.totalRevenue() / quota) * 100);
  });

  dealsWonCount = computed(() => {
    return this.reps().reduce((acc, r) => acc + r.dealsWon, 0);
  });

  dealsInFlightCount = computed(() => 14);

  winRatePct = computed(() => {
    const totalWon = this.dealsWonCount();
    const totalPitched = this.reps().reduce((acc, r) => acc + r.dealsTotal, 0);
    if (totalPitched === 0) return 78;
    return Math.round((totalWon / totalPitched) * 100);
  });

  avgDealSize = computed(() => {
    const won = this.dealsWonCount();
    if (won === 0) return 85000;
    return Math.round(this.totalRevenue() / won);
  });

  avgSalesCycleDays = computed(() => {
    const totalDays = this.reps().reduce((acc, r) => acc + (r.avgCycleDays * r.dealsWon), 0);
    const won = this.dealsWonCount();
    if (won === 0) return 11.2;
    return (totalDays / won).toFixed(1);
  });

  revenueGrowthPct = computed(() => {
    const range = this.timeRange();
    if (range === 'today') return 18.4;
    if (range === 'week') return 24.1;
    if (range === 'month') return 28.6;
    if (range === 'quarter') return 34.2;
    return 31.5;
  });

  setTimeRange(range: TimeRangePreset) {
    this.timeRange.set(range);
  }

  applyCustomDate() {
    this.timeRange.set('custom');
  }

  resetFilters() {
    this.selectedRepFilter.set('ALL');
    this.selectedTierFilter.set('ALL');
    this.selectedStageFilter.set('ALL');
    this.showFiltersModal.set(false);
  }

  getAttainment(rep: SalesRepPerformance): number {
    if (!rep.quota) return 100;
    return Math.round((rep.revenue / rep.quota) * 100);
  }

  formatCurrency(val: number): string {
    return '$' + val.toLocaleString();
  }

  openRepModal(rep: SalesRepPerformance) {
    this.selectedRepModal.set(rep);
  }

  exportExecutiveSummary() {
    const text = `lxv SALES PERFORMANCE BRIEFING (${this.timeRange().toUpperCase()})\n` +
      `Total Revenue: ${this.formatCurrency(this.totalRevenue())}\n` +
      `Quota Attainment: ${this.quotaAttainmentPct()}%\n` +
      `Deals Won: ${this.dealsWonCount()}\n` +
      `Win Rate: ${this.winRatePct()}%\n` +
      `Average Sales Cycle: ${this.avgSalesCycleDays()} Days\n` +
      `Top Rep: ${this.sortedReps()[0]?.name} (${this.formatCurrency(this.sortedReps()[0]?.revenue)})\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laevos-sales-performance-${this.timeRange()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
