import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { LeadService, Lead, ScoringWeights, DEFAULT_SCORING_WEIGHTS, LeadActivityEvent } from './lead.service';
import { Appwrite } from './appwrite';

@Component({
  selector: 'app-lead-scoring',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden animate-fade-in max-w-[1600px] mx-auto p-3 sm:p-5 md:p-6 space-y-6">
      
      <!-- Header -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_18px_rgba(168,85,247,0.2)]">
              <mat-icon class="text-purple-400 text-[24px]">psychology</mat-icon>
            </div>
            <div>
              <h1 class="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Predictive Lead Scoring & ICP Intelligence</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono font-normal">Dual-Engine Fit + Intent</span>
              </h1>
              <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Multi-dimensional scoring combining firmographic qualification, behavioral activity stream, and real-time intent triggers.
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <button 
            type="button"
            (click)="showWeightsModal.set(true)" 
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px] text-purple-400">tune</mat-icon>
            <span>Customize Scoring Rules</span>
          </button>
          
          <button 
            type="button"
            (click)="exportScoredLeads()" 
            class="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 cursor-pointer active:scale-95 transition-all">
            <mat-icon class="text-[16px]">file_download</mat-icon>
            <span>Export Priority Prospects</span>
          </button>
        </div>
      </header>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <!-- Hot Leads Card -->
        <div 
          (click)="filterCategory.set(filterCategory() === 'Hot' ? 'All' : 'Hot')"
          (keydown.enter)="filterCategory.set(filterCategory() === 'Hot' ? 'All' : 'Hot')"
          tabindex="0"
          role="button"
          [class.ring-2]="filterCategory() === 'Hot'"
          class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between cursor-pointer hover:border-rose-500/50 transition-all ring-rose-500/50">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Hot Prospects (🔥 ≥ {{ leadService.scoringWeights().hotThreshold }})</span>
            <mat-icon class="text-rose-400 text-[18px]">local_fire_department</mat-icon>
          </div>
          <div class="text-2xl sm:text-3xl font-bold text-white font-mono">{{ stats().hot }} <span class="text-xs text-zinc-500 font-sans font-normal">Prospects</span></div>
          <div class="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">bolt</mat-icon> \${{ stats().hotValue.toLocaleString() }} Immediate Pipeline
          </div>
        </div>

        <!-- Warm Leads Card -->
        <div 
          (click)="filterCategory.set(filterCategory() === 'Warm' ? 'All' : 'Warm')"
          (keydown.enter)="filterCategory.set(filterCategory() === 'Warm' ? 'All' : 'Warm')"
          tabindex="0"
          role="button"
          [class.ring-2]="filterCategory() === 'Warm'"
          class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between cursor-pointer hover:border-amber-500/50 transition-all ring-amber-500/50">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Warm Leads (⚡ {{ leadService.scoringWeights().warmThreshold }}-{{ leadService.scoringWeights().hotThreshold - 1 }})</span>
            <mat-icon class="text-amber-400 text-[18px]">wb_sunny</mat-icon>
          </div>
          <div class="text-2xl sm:text-3xl font-bold text-white font-mono">{{ stats().warm }} <span class="text-xs text-zinc-500 font-sans font-normal">Prospects</span></div>
          <div class="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">trending_up</mat-icon> \${{ stats().warmValue.toLocaleString() }} Developing Pipeline
          </div>
        </div>

        <!-- Cold Leads Card -->
        <div 
          (click)="filterCategory.set(filterCategory() === 'Cold' ? 'All' : 'Cold')"
          (keydown.enter)="filterCategory.set(filterCategory() === 'Cold' ? 'All' : 'Cold')"
          tabindex="0"
          role="button"
          [class.ring-2]="filterCategory() === 'Cold'"
          class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between cursor-pointer hover:border-sky-500/50 transition-all ring-sky-500/50">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Nurture Queue (❄️ &lt; {{ leadService.scoringWeights().warmThreshold }})</span>
            <mat-icon class="text-sky-400 text-[18px]">ac_unit</mat-icon>
          </div>
          <div class="text-2xl sm:text-3xl font-bold text-white font-mono">{{ stats().cold }} <span class="text-xs text-zinc-500 font-sans font-normal">Prospects</span></div>
          <div class="text-[11px] text-sky-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">schedule</mat-icon> Automated Nurture Cadence
          </div>
        </div>

        <!-- Average Score Card -->
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Pipeline Health Quality</span>
            <mat-icon class="text-purple-400 text-[18px]">grade</mat-icon>
          </div>
          <div class="text-2xl sm:text-3xl font-bold text-white font-mono">{{ stats().avgScore }} <span class="text-xs text-zinc-500 font-sans font-normal">/ 100 avg</span></div>
          <div class="text-[11px] text-purple-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">insights</mat-icon> Grade A/B Ratio: {{ stats().gradeABRatio }}%
          </div>
        </div>
      </div>

      <!-- Filter and Search Bar -->
      <div class="p-3.5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-center gap-2 flex-1">
          <div class="relative flex-1 max-w-md">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</mat-icon>
            <input 
              type="text" 
              [ngModel]="searchQuery()" 
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search by lead name, company, job title or industry..."
              class="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/40" />
          </div>

          <select 
            [ngModel]="selectedIndustry()" 
            (ngModelChange)="selectedIndustry.set($event)"
            class="py-1.5 px-3 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-purple-500/40">
            <option value="All">All Industries</option>
            <option value="SaaS">SaaS</option>
            <option value="FinTech">FinTech</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Cyber Security">Cyber Security</option>
            <option value="Logistics">Logistics</option>
            <option value="Bio-Tech">Bio-Tech</option>
            <option value="E-Commerce">E-Commerce</option>
            <option value="Media">Media</option>
          </select>

          <select 
            [ngModel]="selectedSize()" 
            (ngModelChange)="selectedSize.set($event)"
            class="py-1.5 px-3 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-purple-500/40">
            <option value="All">All Sizes</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Mid-Market">Mid-Market</option>
            <option value="Small Business">Small Business</option>
          </select>
        </div>

        <div class="flex items-center gap-1.5 self-end md:self-center">
          <span class="text-[10px] uppercase font-bold text-zinc-500 mr-1">Filter Tier:</span>
          @for (cat of ['All', 'Hot', 'Warm', 'Cold']; track cat) {
            <button 
              (click)="filterCategory.set(cat)"
              [class]="filterCategory() === cat ? 'bg-purple-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400 hover:text-white'"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer">
              {{ cat }}
            </button>
          }
        </div>
      </div>

      <!-- Main Leads Table with Dual Breakdown -->
      <div class="flex-1 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col min-h-[460px]">
        <div class="overflow-x-auto flex-1 custom-scrollbar">
          <table class="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr class="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th class="p-3.5 pl-5">Lead & Title</th>
                <th class="p-3.5">Firmographic Fit</th>
                <th class="p-3.5">Behavioral Signals</th>
                <th class="p-3.5 text-center">Score & Grade</th>
                <th class="p-3.5">Intent Audit & Factors</th>
                <th class="p-3.5 pr-5 text-right">Instant Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60 text-xs">
              @for (lead of filteredLeads(); track lead.$id) {
                <tr class="hover:bg-zinc-900/60 transition-colors group">
                  
                  <!-- Lead & Title -->
                  <td class="p-3.5 pl-5 align-middle">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-750 flex items-center justify-center font-bold text-white uppercase text-xs shrink-0">
                        {{ lead.name.charAt(0) }}
                      </div>
                      <div class="min-w-0">
                        <div class="font-bold text-white group-hover:text-purple-300 transition-colors truncate">{{ lead.name }}</div>
                        <div class="text-[11px] text-zinc-400 truncate">{{ lead.jobTitle || 'Executive Contact' }}</div>
                        <div class="text-[10px] text-zinc-500 font-mono">{{ lead.email }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Firmographics -->
                  <td class="p-3.5 align-middle">
                    <div class="space-y-1">
                      <div class="flex items-center gap-1.5">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                          {{ lead.companySize || 'Mid-Market' }}
                        </span>
                        <span class="text-zinc-400 font-medium">{{ lead.industry || 'General' }}</span>
                      </div>
                      <div class="text-[11px] font-mono text-emerald-400 font-semibold">
                        \${{ ((lead.value || 0)).toLocaleString() }} <span class="text-zinc-500 font-sans text-[10px]">Pipeline</span>
                      </div>
                      <div class="text-[10px] text-zinc-500">
                        Fit Score: <span class="text-purple-300 font-bold font-mono">{{ lead.demographicScore || 0 }}/50 pts</span>
                      </div>
                    </div>
                  </td>

                  <!-- Behavioral Activity -->
                  <td class="p-3.5 align-middle">
                    <div class="space-y-1.5">
                      <div class="flex items-center gap-3 text-[11px]">
                        <span title="Website visits" class="flex items-center gap-1 text-zinc-300 font-mono">
                          <mat-icon class="text-[14px] text-cyan-400">public</mat-icon> {{ lead.websiteVisits || 1 }} visits
                        </span>
                        <span title="Email opens & clicks" class="flex items-center gap-1 text-zinc-300 font-mono">
                          <mat-icon class="text-[14px] text-teal-400">mark_email_read</mat-icon> {{ lead.emailOpens || 0 }}o / {{ lead.emailClicks || 0 }}c
                        </span>
                      </div>
                      <div class="flex items-center gap-2 text-[10px]">
                        @if (lead.downloads && lead.downloads.length > 0) {
                          <span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                            {{ lead.downloads.length }} Downloads
                          </span>
                        }
                        @if (lead.webinarsAttended && lead.webinarsAttended.length > 0) {
                          <span class="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                            {{ lead.webinarsAttended.length }} Webinars
                          </span>
                        }
                      </div>
                      <div class="text-[10px] text-zinc-500">
                        Intent Score: <span class="text-teal-300 font-bold font-mono">{{ lead.activityScore || 0 }}/50 pts</span>
                      </div>
                    </div>
                  </td>

                  <!-- Total Score Circle & Category -->
                  <td class="p-3.5 align-middle text-center">
                    <div class="inline-flex flex-col items-center">
                      <div class="relative w-12 h-12 flex items-center justify-center">
                        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path class="text-zinc-800" stroke-dasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5"></path>
                          <path [class]="getScoreStrokeClass(lead.score || 0)" [attr.stroke-dasharray]="(lead.score || 0) + ', 100'" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"></path>
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                          <span class="text-xs font-bold text-white font-mono">{{ lead.score || 0 }}</span>
                        </div>
                      </div>
                      <span [class]="getCategoryBadgeClass(lead.scoreCategory || 'Cold')" class="mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border">
                        {{ lead.scoreCategory || 'Cold' }} &bull; {{ lead.grade || 'C' }}
                      </span>
                    </div>
                  </td>

                  <!-- Scoring Factors Summary -->
                  <td class="p-3.5 align-middle max-w-[280px]">
                    <div class="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-2.5 text-[11px] space-y-1.5">
                      <div class="flex items-center justify-between text-[10px] text-zinc-400 font-bold border-b border-zinc-800/80 pb-1">
                        <span>Top Intent Factors</span>
                        <button (click)="openLeadAuditModal(lead)" class="text-purple-400 hover:text-purple-300 text-[10px] cursor-pointer">
                          Full Audit &rarr;
                        </button>
                      </div>
                      @if (lead.scoreFactors && lead.scoreFactors.length > 0) {
                        <div class="space-y-1">
                          @for (fac of lead.scoreFactors.slice(0, 2); track fac.factor) {
                            <div class="flex items-center justify-between gap-1 text-[10px]">
                              <span class="text-zinc-300 truncate">{{ fac.factor }}</span>
                              <span class="text-emerald-400 font-mono font-bold shrink-0">+{{ fac.points }}</span>
                            </div>
                          }
                        </div>
                      } @else {
                        <p class="text-zinc-500 text-[10px]">Standard baseline ICP parameters applied.</p>
                      }
                    </div>
                  </td>

                  <!-- Instant Action Buttons -->
                  <td class="p-3.5 pr-5 align-middle text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button 
                        (click)="openLeadAuditModal(lead)"
                        title="View Full Score Audit & Simulate Activity"
                        class="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all cursor-pointer">
                        <mat-icon class="text-[16px]">visibility</mat-icon>
                      </button>

                      <button 
                        (click)="quickSimulateEvent(lead, 'email_click', 'Clicked Master Proposal Link', 12)"
                        title="Simulate Prospect Link Click (+12 pts)"
                        class="p-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30 transition-all cursor-pointer">
                        <mat-icon class="text-[16px]">ads_click</mat-icon>
                      </button>

                      <button 
                        (click)="quickSimulateEvent(lead, 'webinar_attend', 'Attended Live Architecture Demo', 25)"
                        title="Simulate Webinar Attendance (+25 pts)"
                        class="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30 transition-all cursor-pointer">
                        <mat-icon class="text-[16px]">live_tv</mat-icon>
                      </button>
                    </div>
                  </td>

                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="p-12 text-center text-zinc-500">
                    <mat-icon class="text-3xl text-zinc-600 mb-2">search_off</mat-icon>
                    <p class="text-sm font-semibold text-zinc-400">No leads found matching query</p>
                    <p class="text-xs text-zinc-600 mt-1">Try resetting the search terms or filters above.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Lead Score Audit & Real-Time Event Injection Modal -->
      @if (selectedAuditLead(); as lead) {
        <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" (click)="selectedAuditLead.set(null)" (keydown.escape)="selectedAuditLead.set(null)" tabindex="0" role="dialog" aria-modal="true">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
            
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                  {{ lead.name.charAt(0) }}
                </div>
                <div>
                  <h3 class="text-base font-bold text-white font-display">{{ lead.name }} &bull; Score Audit</h3>
                  <p class="text-xs text-zinc-400">{{ lead.jobTitle }} at {{ lead.industry }} ({{ lead.companySize }})</p>
                </div>
              </div>
              <button (click)="selectedAuditLead.set(null)" class="text-zinc-500 hover:text-white" aria-label="Close modal">
                <mat-icon class="text-[20px]">close</mat-icon>
              </button>
            </div>

            <!-- Score Summary Row -->
            <div class="grid grid-cols-3 gap-3 p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-center">
              <div>
                <span class="text-[10px] font-bold uppercase text-zinc-500 block">Total Score</span>
                <span class="text-2xl font-bold font-mono text-white">{{ lead.score }}/100</span>
                <span [class]="getCategoryBadgeClass(lead.scoreCategory || 'Cold')" class="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase border">
                  {{ lead.scoreCategory }} (Grade {{ lead.grade }})
                </span>
              </div>
              <div>
                <span class="text-[10px] font-bold uppercase text-zinc-500 block">Demographic Fit</span>
                <span class="text-2xl font-bold font-mono text-purple-400">{{ lead.demographicScore }}/50</span>
                <span class="text-[10px] text-zinc-400 block mt-1">ICP & Title Alignment</span>
              </div>
              <div>
                <span class="text-[10px] font-bold uppercase text-zinc-500 block">Behavioral Intent</span>
                <span class="text-2xl font-bold font-mono text-teal-400">{{ lead.activityScore }}/50</span>
                <span class="text-[10px] text-zinc-400 block mt-1">Active Digital Footprint</span>
              </div>
            </div>

            <!-- Itemized Point Breakdown -->
            <div class="space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Itemized Point Factor Audit</h4>
              <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                @for (factor of lead.scoreFactors; track factor.factor) {
                  <div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs">
                    <div class="flex items-center gap-2">
                      <mat-icon [class]="factor.type === 'demographic' ? 'text-purple-400' : 'text-teal-400'" class="text-[16px]">
                        {{ factor.type === 'demographic' ? 'domain' : 'touch_app' }}
                      </mat-icon>
                      <span class="text-zinc-200 font-medium">{{ factor.factor }}</span>
                    </div>
                    <span class="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      +{{ factor.points }} pts
                    </span>
                  </div>
                } @empty {
                  <div class="text-center text-zinc-500 text-xs py-4">No specific factors calculated yet.</div>
                }
              </div>
            </div>

            <!-- Instant Activity Simulator for this lead -->
            <div class="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-purple-300 font-display flex items-center gap-1.5">
                  <mat-icon class="text-[16px]">smart_toy</mat-icon> Simulate Real-Time Prospect Engagement Event
                </span>
                <span class="text-[10px] text-zinc-400">Updates CRM live</span>
              </div>
              
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button 
                  (click)="simulateAndRefresh(lead, 'email_open', 'Opened Q3 Master SLA Email', 5)"
                  class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-300 flex items-center justify-center gap-1 cursor-pointer">
                  <mat-icon class="text-[14px] text-teal-400">mail</mat-icon> +5 Email Open
                </button>
                <button 
                  (click)="simulateAndRefresh(lead, 'email_click', 'Clicked Custom Pricing Calculator', 12)"
                  class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-300 flex items-center justify-center gap-1 cursor-pointer">
                  <mat-icon class="text-[14px] text-teal-400">ads_click</mat-icon> +12 Link Click
                </button>
                <button 
                  (click)="simulateAndRefresh(lead, 'resource_download', 'Downloaded Cloud Security Blueprint', 18)"
                  class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-300 flex items-center justify-center gap-1 cursor-pointer">
                  <mat-icon class="text-[14px] text-blue-400">file_download</mat-icon> +18 Download
                </button>
                <button 
                  (click)="simulateAndRefresh(lead, 'webinar_attend', 'Attended Executive Masterclass', 25)"
                  class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-300 flex items-center justify-center gap-1 cursor-pointer">
                  <mat-icon class="text-[14px] text-purple-400">live_tv</mat-icon> +25 Webinar
                </button>
              </div>
            </div>

            <!-- Close Action -->
            <div class="flex justify-end pt-2">
              <button (click)="selectedAuditLead.set(null)" class="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold cursor-pointer">
                Close Audit
              </button>
            </div>

          </div>
        </div>
      }

      <!-- Scoring Weights Configuration Drawer Modal -->
      @if (showWeightsModal()) {
        <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" (click)="showWeightsModal.set(false)" (keydown.escape)="showWeightsModal.set(false)" tabindex="0" role="dialog" aria-modal="true">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
            
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div class="flex items-center gap-2.5">
                <mat-icon class="text-purple-400 text-[22px]">tune</mat-icon>
                <h3 class="text-base font-bold text-white font-display">Configure Scoring Engine Weights</h3>
              </div>
              <button (click)="showWeightsModal.set(false)" class="text-zinc-500 hover:text-white" aria-label="Close modal">
                <mat-icon class="text-[20px]">close</mat-icon>
              </button>
            </div>

            <p class="text-xs text-zinc-400">
              Fine-tune the point allocations for firmographic characteristics and behavioral events. Changes recalculate all lead scores and priorities across the CRM in real-time.
            </p>

            <div class="space-y-5 text-xs">
              <!-- Demographic Weights -->
              <div class="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
                <h4 class="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">1. Demographic & Firmographic Weights</h4>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="weightEnterpriseSize" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Enterprise Size Fit (500+ employees): {{ editWeights.enterpriseSize }} pts</label>
                    <input id="weightEnterpriseSize" type="range" min="5" max="40" step="5" [(ngModel)]="editWeights.enterpriseSize" class="w-full accent-purple-500" />
                  </div>
                  <div>
                    <label for="weightIndustry" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Tier-1 High Value Industry: {{ editWeights.industryHighValue }} pts</label>
                    <input id="weightIndustry" type="range" min="5" max="40" step="5" [(ngModel)]="editWeights.industryHighValue" class="w-full accent-purple-500" />
                  </div>
                  <div>
                    <label for="weightCSuite" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">C-Suite Executive Seniority: {{ editWeights.cSuiteSeniority }} pts</label>
                    <input id="weightCSuite" type="range" min="5" max="35" step="5" [(ngModel)]="editWeights.cSuiteSeniority" class="w-full accent-purple-500" />
                  </div>
                  <div>
                    <label for="weightDealVal" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Deal Pipeline &gt; $100k ARR: {{ editWeights.dealValueOver100k }} pts</label>
                    <input id="weightDealVal" type="range" min="5" max="40" step="5" [(ngModel)]="editWeights.dealValueOver100k" class="w-full accent-purple-500" />
                  </div>
                </div>
              </div>

              <!-- Behavioral Weights -->
              <div class="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
                <h4 class="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono">2. Behavioral Intent Weights</h4>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="weightWebinar" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Live Webinar Attendance: {{ editWeights.webinarAttendPoint }} pts</label>
                    <input id="weightWebinar" type="range" min="10" max="50" step="5" [(ngModel)]="editWeights.webinarAttendPoint" class="w-full accent-teal-500" />
                  </div>
                  <div>
                    <label for="weightResource" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Whitepaper / Resource Download: {{ editWeights.resourceDownloadPoint }} pts</label>
                    <input id="weightResource" type="range" min="5" max="35" step="1" [(ngModel)]="editWeights.resourceDownloadPoint" class="w-full accent-teal-500" />
                  </div>
                  <div>
                    <label for="weightEmailClick" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Marketing Email Click: {{ editWeights.emailClickPoint }} pts</label>
                    <input id="weightEmailClick" type="range" min="5" max="25" step="1" [(ngModel)]="editWeights.emailClickPoint" class="w-full accent-teal-500" />
                  </div>
                  <div>
                    <label for="weightDemoReq" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Inbound Demo Request: {{ editWeights.demoRequestPoint }} pts</label>
                    <input id="weightDemoReq" type="range" min="15" max="50" step="5" [(ngModel)]="editWeights.demoRequestPoint" class="w-full accent-teal-500" />
                  </div>
                </div>
              </div>

              <!-- Thresholds -->
              <div class="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
                <h4 class="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">3. Priority Thresholds</h4>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="weightHotThresh" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Hot Priority Threshold: {{ editWeights.hotThreshold }}+ pts</label>
                    <input id="weightHotThresh" type="range" min="60" max="90" step="5" [(ngModel)]="editWeights.hotThreshold" class="w-full accent-rose-500" />
                  </div>
                  <div>
                    <label for="weightWarmThresh" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Warm Priority Threshold: {{ editWeights.warmThreshold }}+ pts</label>
                    <input id="weightWarmThresh" type="range" min="30" max="55" step="5" [(ngModel)]="editWeights.warmThreshold" class="w-full accent-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button 
                type="button" 
                (click)="resetToDefaults()" 
                class="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer">
                Reset Defaults
              </button>

              <div class="flex gap-2">
                <button 
                  type="button" 
                  (click)="showWeightsModal.set(false)" 
                  class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold cursor-pointer">
                  Cancel
                </button>
                <button 
                  type="button" 
                  (click)="applyWeights()" 
                  class="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 cursor-pointer">
                  <mat-icon class="text-[16px]">save</mat-icon>
                  <span>Save & Recalculate CRM</span>
                </button>
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
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #52525b; }
  `]
})
export class LeadScoringComponent implements OnInit {
  leadService = inject(LeadService);
  appwrite = inject(Appwrite);

  searchQuery = signal<string>('');
  filterCategory = signal<string>('All');
  selectedIndustry = signal<string>('All');
  selectedSize = signal<string>('All');

  selectedAuditLead = signal<Lead | null>(null);
  showWeightsModal = signal<boolean>(false);
  editWeights: ScoringWeights = { ...this.leadService.scoringWeights() };

  stats = computed(() => {
    const leads = this.leadService.leads();
    let hot = 0;
    let warm = 0;
    let cold = 0;
    let hotValue = 0;
    let warmValue = 0;
    let totalScore = 0;
    let gradeABCount = 0;

    leads.forEach(l => {
      const score = l.score || 0;
      totalScore += score;
      if (l.grade === 'A+' || l.grade === 'A' || l.grade === 'B') gradeABCount++;
      
      if (l.scoreCategory === 'Hot') {
        hot++;
        hotValue += (l.value || 0);
      } else if (l.scoreCategory === 'Warm') {
        warm++;
        warmValue += (l.value || 0);
      } else {
        cold++;
      }
    });

    const avgScore = leads.length > 0 ? Math.round(totalScore / leads.length) : 0;
    const gradeABRatio = leads.length > 0 ? Math.round((gradeABCount / leads.length) * 100) : 0;

    return { hot, warm, cold, hotValue, warmValue, avgScore, gradeABRatio };
  });

  filteredLeads = computed(() => {
    let list = [...this.leadService.leads()];
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.filterCategory();
    const ind = this.selectedIndustry();
    const size = this.selectedSize();

    if (q) {
      list = list.filter(l => 
        l.name.toLowerCase().includes(q) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.jobTitle && l.jobTitle.toLowerCase().includes(q)) ||
        (l.industry && l.industry.toLowerCase().includes(q))
      );
    }

    if (cat !== 'All') {
      list = list.filter(l => l.scoreCategory === cat);
    }

    if (ind !== 'All') {
      list = list.filter(l => l.industry === ind);
    }

    if (size !== 'All') {
      list = list.filter(l => l.companySize === size);
    }

    // Sort primarily by score descending
    return list.sort((a, b) => (b.score || 0) - (a.score || 0));
  });

  ngOnInit() {
    if (this.leadService.leads().length === 0) {
      this.leadService.loadLeads();
    }
  }

  getScoreStrokeClass(score: number): string {
    if (score >= this.leadService.scoringWeights().hotThreshold) return 'text-rose-500';
    if (score >= this.leadService.scoringWeights().warmThreshold) return 'text-amber-500';
    return 'text-sky-500';
  }

  getCategoryBadgeClass(category: string): string {
    if (category === 'Hot') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    if (category === 'Warm') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
  }

  openLeadAuditModal(lead: Lead) {
    this.selectedAuditLead.set(lead);
  }

  async quickSimulateEvent(lead: Lead, eventType: LeadActivityEvent['type'], detail: string, points: number) {
    if (!lead.$id) return;
    await this.leadService.recordLeadActivity(lead.$id, eventType, detail, points);
  }

  async simulateAndRefresh(lead: Lead, eventType: LeadActivityEvent['type'], detail: string, points: number) {
    if (!lead.$id) return;
    const updated = await this.leadService.recordLeadActivity(lead.$id, eventType, detail, points);
    if (updated) {
      this.selectedAuditLead.set(updated);
    }
  }

  resetToDefaults() {
    this.editWeights = { ...DEFAULT_SCORING_WEIGHTS };
  }

  applyWeights() {
    this.leadService.saveWeights(this.editWeights);
    this.showWeightsModal.set(false);
    this.appwrite.addNotification({
      title: 'Scoring Rules Applied',
      message: 'Updated lead scoring model weights and recalculated all pipeline scores in real-time.',
      type: 'success'
    });
  }

  exportScoredLeads() {
    const leads = this.filteredLeads();
    const csvContent = 'Name,Email,Job Title,Industry,Company Size,Pipeline Value,Score,Tier,Grade,Fit Points,Intent Points\n' +
      leads.map(l => `"${l.name}","${l.email}","${l.jobTitle || ''}","${l.industry || ''}","${l.companySize || ''}",${l.value || 0},${l.score || 0},"${l.scoreCategory || ''}","${l.grade || ''}",${l.demographicScore || 0},${l.activityScore || 0}`).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laevos-scored-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.appwrite.addNotification({
      title: 'Prospect Export Complete',
      message: `Exported ${leads.length} qualified prospects with detailed intent points to CSV.`,
      type: 'info'
    });
  }
}
