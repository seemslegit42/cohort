import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';
import { LeadService } from './lead.service';

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  title: string;
  influence: 'High' | 'Medium' | 'Low';
  sentiment: 'Champion' | 'Positive' | 'Neutral' | 'Skeptical' | 'Blocker';
  keyConcern: string;
  email: string;
}

export interface MapMilestone {
  id: string;
  title: string;
  category: 'Legal' | 'Technical' | 'Security' | 'Executive' | 'Commercial';
  owner: string;
  dueDate: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'At Risk';
  deliverables: string;
}

export interface BattlecardItem {
  id: string;
  competitor: string;
  strengths: string[];
  vulnerabilities: string[];
  killPoints: string[];
  pricingCounterStrategy: string;
  objections: { trigger: string; response: string }[];
}

export interface DealRoom {
  id: string;
  title: string;
  clientName: string;
  dealValue: number;
  stage: string;
  targetCloseDate: string;
  probability: number;
  industry: string;
  securityScore: number;
  stakeholders: Stakeholder[];
  milestones: MapMilestone[];
  competitors: string[];
  notes: string;
}

@Component({
  selector: 'app-deal-rooms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="h-full flex flex-col p-3 sm:p-5 md:p-6 animate-fade-in max-w-[1600px] mx-auto space-y-6 relative overflow-x-hidden">
      
      <!-- Header -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.25)] border border-purple-400/30">
              <i class="ti ti-door-enter text-[22px]"></i>
            </div>
            <div>
              <h1 class="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Enterprise Deal Rooms</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 font-mono font-normal">War-Room v2.4</span>
              </h1>
              <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">Collaborative buyer portals, multi-stakeholder buying committees, and tactical objection battlecards.</p>
            </div>
          </div>
        </div>

        <!-- Header Actions -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <button 
            type="button"
            (click)="activeSubTab.set('deals')" 
            [class]="activeSubTab() === 'deals' ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs' : 'text-zinc-400 hover:text-white bg-zinc-900/60 border-zinc-800'"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer">
            <i class="ti ti-layout-dashboard text-[16px] text-teal-400"></i>
            <span>Active Deal Rooms</span>
          </button>

          <button 
            type="button"
            (click)="activeSubTab.set('battlecards')" 
            [class]="activeSubTab() === 'battlecards' ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs' : 'text-zinc-400 hover:text-white bg-zinc-900/60 border-zinc-800'"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer">
            <i class="ti ti-shield text-[16px] text-purple-400"></i>
            <span>Competitor Battlecards</span>
          </button>

          <button 
            type="button"
            (click)="activeSubTab.set('objections')" 
            [class]="activeSubTab() === 'objections' ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs' : 'text-zinc-400 hover:text-white bg-zinc-900/60 border-zinc-800'"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer">
            <i class="ti ti-brain text-[16px] text-amber-400"></i>
            <span>Objection AI Simulator</span>
          </button>

          <button 
            type="button"
            (click)="openCreateDealRoomModal()" 
            class="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer active:scale-95 transition-all">
            <i class="ti ti-plus text-[16px]"></i>
            <span>Forge Deal Room</span>
          </button>
        </div>
      </header>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Total War-Room Pipeline</span>
            <i class="ti ti-currency-dollar text-teal-400 text-[18px]"></i>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">\${{ totalPipelineValue().toLocaleString() }}</div>
          <div class="text-[11px] text-teal-400 flex items-center gap-1 mt-1 font-semibold">
            <i class="ti ti-trending-up text-[14px]"></i> {{ dealRooms().length }} Tier-1 strategic pursuits
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Avg Probability Score</span>
            <i class="ti ti-chart-bar text-purple-400 text-[18px]"></i>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ avgProbability() }}%</div>
          <div class="text-[11px] text-purple-400 flex items-center gap-1 mt-1 font-semibold">
            <i class="ti ti-badge-check text-[14px]"></i> Multi-threaded confidence
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Mapped Stakeholders</span>
            <i class="ti ti-users text-amber-400 text-[18px]"></i>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ totalStakeholders() }} Profiles</div>
          <div class="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-semibold">
            <i class="ti ti-star text-[14px]"></i> {{ totalChampions() }} Identified Champions
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Active Battlecards</span>
            <i class="ti ti-shield text-indigo-400 text-[18px]"></i>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ battlecards().length }} Competitors</div>
          <div class="text-[11px] text-indigo-400 flex items-center gap-1 mt-1 font-semibold">
            <i class="ti ti-bolt text-[14px]"></i> 24 Verified counter-tactics
          </div>
        </div>
      </div>

      <!-- MAIN TAB: Deal Rooms Management -->
      @if (activeSubTab() === 'deals') {
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          <!-- Left Column: Deal Rooms Selector List (4 cols) -->
          <div class="xl:col-span-4 space-y-3" [class.hidden]="isMobileDetailViewOpen() && isMobileViewport()">
            <div class="flex items-center justify-between px-1">
              <h2 class="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Select Deal Room</h2>
              <span class="text-[11px] text-zinc-500 font-mono">{{ dealRooms().length }} Deals</span>
            </div>

            <div class="space-y-2.5 max-h-[720px] overflow-y-auto pr-1 custom-scrollbar">
              @for (deal of dealRooms(); track deal.id) {
                <div 
                  (click)="selectDeal(deal.id)"
                  (keydown.enter)="selectDeal(deal.id)"
                  tabindex="0"
                  role="button"
                  [class]="selectedDealId() === deal.id ? 'bg-[#121f20] border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.12)]' : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80'"
                  class="p-4 rounded-2xl border transition-all cursor-pointer text-left group relative overflow-hidden touch-pan-y">
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full" [ngClass]="getStageColor(deal.stage)"></span>
                        <h3 class="text-sm font-bold text-white group-hover:text-teal-300 transition-colors truncate font-display">{{ deal.title }}</h3>
                      </div>
                      <p class="text-xs text-zinc-400 mt-0.5">{{ deal.clientName }} &bull; {{ deal.industry }}</p>
                    </div>
                    <span class="text-xs font-mono font-bold text-teal-400 shrink-0 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">\${{ deal.dealValue.toLocaleString() }}</span>
                  </div>

                  <div class="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-zinc-800/60 text-[11px]">
                    <div>
                      <span class="text-zinc-500 block text-[10px]">Probability</span>
                      <span class="font-bold text-zinc-200 font-mono">{{ deal.probability }}%</span>
                    </div>
                    <div>
                      <span class="text-zinc-500 block text-[10px]">Committee</span>
                      <span class="font-bold text-zinc-200 font-mono">{{ deal.stakeholders.length }} members</span>
                    </div>
                    <div>
                      <span class="text-zinc-500 block text-[10px]">Target Close</span>
                      <span class="font-bold text-zinc-200 font-mono">{{ deal.targetCloseDate }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Right Column: Deal Room Detailed Workspace (8 cols) -->
          @if (selectedDeal(); as deal) {
            <div class="xl:col-span-8 space-y-6" [class.hidden]="!isMobileDetailViewOpen() && isMobileViewport()">
              
              <!-- Deal Room Banner -->
              <div class="p-5 sm:p-6 rounded-2xl bg-[#0e1617] border border-[#304245] shadow-xl relative overflow-hidden backdrop-blur-2xl">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2.5 mb-1.5">
                      @if (isMobileViewport()) {
                        <button (click)="isMobileDetailViewOpen.set(false)" class="text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-700/80 rounded-lg p-1 mr-2">
                          <i class="ti ti-arrow-left text-[16px]"></i>
                        </button>
                      }
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/30">
                        {{ deal.stage }}
                      </span>
                      <span class="text-zinc-500 text-xs font-mono">ID: {{ deal.id }}</span>
                    </div>
                    <h2 class="text-xl sm:text-2xl font-bold text-white font-display">{{ deal.title }}</h2>
                    <p class="text-xs sm:text-sm text-zinc-400 mt-1">{{ deal.clientName }} &bull; Contract Target: <span class="text-zinc-200 font-semibold">\${{ deal.dealValue.toLocaleString() }} ARR</span></p>
                  </div>

                  <!-- Quick Actions -->
                  <div class="flex items-center gap-2">
                    <button 
                      type="button"
                      (click)="generateBuyerPortalLink(deal)" 
                      class="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
                      <i class="ti ti-link text-[15px] text-teal-400"></i>
                      <span>Buyer Link</span>
                    </button>
                    <button 
                      type="button"
                      (click)="openAddStakeholderModal()" 
                      class="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
                      <i class="ti ti-user-plus text-[15px] text-amber-400"></i>
                      <span>Add Stakeholder</span>
                    </button>
                  </div>
                </div>

                <!-- Progress Tracker Bar -->
                <div class="mt-5 pt-4 border-t border-zinc-800/80">
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <span class="text-zinc-400 font-semibold">Deal Velocity & Security Review Health</span>
                    <span class="text-teal-400 font-mono font-bold">{{ deal.securityScore }}% Ready for Exec Signature</span>
                  </div>
                  <div class="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                    <div class="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500" [style.width.%]="deal.securityScore"></div>
                  </div>
                </div>

                <!-- One-tap Status Updates -->
                <div class="mt-4 pt-4 border-t border-[#304245] flex items-center gap-2 overflow-x-auto no-scrollbar">
                  @for(stage of ['Discovery', 'Security & Procurement', 'Executive Alignment', 'Proposal & Pricing Strategy', 'Closed Won']; track stage) {
                    <button (click)="updateDealStage(deal, stage)" [class]="deal.stage === stage ? 'bg-teal-500 text-zinc-950 font-bold border-teal-500' : 'bg-zinc-900/50 text-zinc-400 hover:text-white border-zinc-700'" class="px-3 py-1.5 rounded-lg border text-[10px] uppercase tracking-wider whitespace-nowrap transition-colors active:scale-95 shrink-0">
                      {{ stage }}
                    </button>
                  }
                </div>
              </div>

              <!-- Stakeholder Buying Committee Matrix -->
              <div class="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <i class="ti ti-users-group text-[16px]"></i>
                    </div>
                    <h3 class="text-sm font-bold text-white font-display">Buying Committee & Decision Makers</h3>
                  </div>
                  <span class="text-xs text-zinc-500 font-mono">{{ deal.stakeholders.length }} mapped members</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  @for (person of deal.stakeholders; track person.id) {
                    <div class="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/90 hover:border-zinc-700 transition-all flex flex-col justify-between">
                      <div>
                        <div class="flex items-start justify-between gap-2 mb-2">
                          <div class="flex items-center gap-2.5">
                            <img src="https://api.dicebear.com/7.x/notionists/svg?seed={{ person.name }}" class="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800" alt="Avatar" />
                            <div>
                              <h4 class="text-xs font-bold text-white font-display">{{ person.name }}</h4>
                              <p class="text-[11px] text-zinc-400">{{ person.title }}</p>
                            </div>
                          </div>
                          
                          <span 
                            [class]="getSentimentBadgeClass(person.sentiment)"
                            class="px-2 py-0.5 rounded-md text-[10px] font-semibold border font-mono">
                            {{ person.sentiment }}
                          </span>
                        </div>

                        <div class="space-y-1 my-2 text-[11px]">
                          <div class="flex items-center justify-between text-zinc-500">
                            <span>Organizational Role:</span>
                            <span class="text-zinc-300 font-medium">{{ person.role }}</span>
                          </div>
                          <div class="flex items-center justify-between text-zinc-500">
                            <span>Influence Power:</span>
                            <span [class]="person.influence === 'High' ? 'text-amber-400 font-bold' : 'text-zinc-300'">{{ person.influence }}</span>
                          </div>
                          <div class="pt-1 text-[11px] text-zinc-400 italic">
                            <span class="text-zinc-500 not-italic font-semibold">Key Concern:</span> "{{ person.keyConcern }}"
                          </div>
                        </div>
                      </div>

                      <div class="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                        <span class="text-zinc-500 truncate">{{ person.email }}</span>
                        <button (click)="cycleSentiment(person)" class="text-teal-400 hover:text-teal-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer">
                          <i class="ti ti-refresh text-[12px]"></i> Update Sentiment
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Mutual Action Plan (MAP) Milestones -->
              <div class="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                      <i class="ti ti-flag text-[16px]"></i>
                    </div>
                    <h3 class="text-sm font-bold text-white font-display">Mutual Action Plan (MAP) Timeline</h3>
                  </div>
                  <button (click)="openAddMilestoneModal()" class="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold cursor-pointer">
                    <i class="ti ti-circle-plus text-[14px]"></i> Add Milestone
                  </button>
                </div>

                <div class="space-y-2.5">
                  @for (milestone of deal.milestones; track milestone.id) {
                    <div class="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-all">
                      <div class="flex items-start gap-3 min-w-0">
                        <button 
                          (click)="toggleMilestoneStatus(milestone)" 
                          [class]="milestone.status === 'Completed' ? 'bg-teal-500/20 text-teal-400 border-teal-500/40' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'"
                          class="w-6 h-6 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 transition-all cursor-pointer">
                          <i class="ti text-[14px]" [class.ti-check]="milestone.status === 'Completed'" [class.ti-circle]="milestone.status !== 'Completed'"></i>
                        </button>
                        <div class="min-w-0">
                          <div class="flex items-center gap-2 flex-wrap">
                            <h4 [class.line-through]="milestone.status === 'Completed'" [class.text-zinc-500]="milestone.status === 'Completed'" class="text-xs font-bold text-white">{{ milestone.title }}</h4>
                            <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-900 text-zinc-400 border border-zinc-800">{{ milestone.category }}</span>
                          </div>
                          <p class="text-[11px] text-zinc-400 mt-0.5">{{ milestone.deliverables }} &bull; <span class="text-zinc-500">Owner: {{ milestone.owner }}</span></p>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span class="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800">{{ milestone.dueDate }}</span>
                        <span [class]="getMilestoneStatusClass(milestone.status)" class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border">
                          {{ milestone.status }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </div>

            </div>
          }
        </div>
      }

      <!-- TAB: Competitor Battlecards -->
      @if (activeSubTab() === 'battlecards') {
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-white font-display">Active Competitor Battlecard Hub</h2>
              <p class="text-xs text-zinc-400">Tactical vulnerabilities, kill-points, and pricing traps to neutralize competitors in live calls.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            @for (card of battlecards(); track card.id) {
              <div class="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-lg">
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                        <i class="ti ti-shield-check text-[18px]"></i>
                      </div>
                      <h3 class="text-base font-bold text-white font-display">{{ card.competitor }}</h3>
                    </div>
                    <span class="text-[10px] font-mono uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">Tier 1 Threat</span>
                  </div>

                  <!-- Kill Points -->
                  <div class="space-y-2 my-3">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <i class="ti ti-alert-triangle text-[14px]"></i> Critical Kill-Points (Silver Bullets)
                    </span>
                    <ul class="space-y-1 pl-1">
                      @for (kp of card.killPoints; track kp) {
                        <li class="text-xs text-zinc-300 flex items-start gap-1.5">
                          <span class="text-rose-500 font-bold">&bull;</span>
                          <span>{{ kp }}</span>
                        </li>
                      }
                    </ul>
                  </div>

                  <!-- Known Vulnerabilities -->
                  <div class="space-y-2 my-3 pt-3 border-t border-zinc-800/80">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <i class="ti ti-lock-open text-[14px]"></i> Documented Architecture Flaws
                    </span>
                    <ul class="space-y-1 pl-1">
                      @for (vuln of card.vulnerabilities; track vuln) {
                        <li class="text-xs text-zinc-400 flex items-start gap-1.5">
                          <span class="text-amber-500 font-bold">&bull;</span>
                          <span>{{ vuln }}</span>
                        </li>
                      }
                    </ul>
                  </div>

                  <!-- Pricing Counter-Strategy -->
                  <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800/90 my-3">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-teal-400 block mb-1">Pricing Trap & Counter-Pitch</span>
                    <p class="text-xs text-zinc-300 italic">{{ card.pricingCounterStrategy }}</p>
                  </div>
                </div>

                <div class="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span class="text-[11px] text-zinc-500 font-mono">{{ card.objections.length }} Prepared Rebuttals</span>
                  <button (click)="testBattlecardWithSimulator(card)" class="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer">
                    <i class="ti ti-brain text-[14px]"></i> Drill in Simulator
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB: AI Objection Simulator -->
      @if (activeSubTab() === 'objections') {
        <div class="max-w-4xl mx-auto space-y-6">
          <div class="p-6 rounded-2xl bg-gradient-to-br from-[#121a1f] to-[#0a1012] border border-teal-500/30 shadow-2xl backdrop-blur-2xl">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <i class="ti ti-brain text-[22px]"></i>
              </div>
              <div>
                <h2 class="text-lg font-bold text-white font-display">Real-Time Objection Response Engine</h2>
                <p class="text-xs text-zinc-400">Select or type a buyer objection to simulate instantaneous, bulletproof sales responses.</p>
              </div>
            </div>

            <!-- Quick Objection Chips -->
            <div class="space-y-2 mb-4">
              <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">Preset Common Objections:</span>
              <div class="flex flex-wrap gap-2">
                @for (preset of presetObjections; track preset) {
                  <button 
                    type="button"
                    (click)="selectedObjectionQuery.set(preset); runObjectionAnalysis(preset)"
                    class="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-teal-500/40 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer text-left">
                    "{{ preset }}"
                  </button>
                }
              </div>
            </div>

            <!-- Custom Input -->
            <div class="flex items-center gap-2 mb-4">
              <input 
                type="text" 
                [value]="selectedObjectionQuery()" 
                (input)="selectedObjectionQuery.set($any($event.target).value)" 
                (keydown.enter)="runObjectionAnalysis(selectedObjectionQuery())"
                placeholder="Type customer objection (e.g. 'Your integration timeline is too slow for Q4 rollout')..." 
                class="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500" />
              
              <button 
                type="button"
                (click)="runObjectionAnalysis(selectedObjectionQuery())" 
                [disabled]="!selectedObjectionQuery().trim()"
                class="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-teal-500/20 cursor-pointer">
                <i class="ti ti-bolt text-[16px]"></i> Generate Rebuttal
              </button>
            </div>

            <!-- Generated Response Result -->
            @if (analyzedResponse(); as resp) {
              <div class="p-5 rounded-2xl bg-zinc-950/90 border border-teal-500/40 space-y-4 animate-fade-in">
                <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      {{ resp.framework }}
                    </span>
                    <span class="text-xs text-zinc-400">Confidence Score: <span class="text-white font-bold font-mono">{{ resp.confidence }}%</span></span>
                  </div>
                  <button (click)="copyRebuttal(resp.script)" class="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                    <i class="ti ti-copy text-[14px]"></i> Copy Script
                  </button>
                </div>

                <div>
                  <h4 class="text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">Recommended Verbal Script</h4>
                  <p class="text-sm text-zinc-200 leading-relaxed font-serif bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 italic">
                    "{{ resp.script }}"
                  </p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div class="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">Follow-Up Proof Asset</span>
                    <p class="text-zinc-300">{{ resp.proofAsset }}</p>
                  </div>
                  <div class="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">Next Call Closing Pivot</span>
                    <p class="text-zinc-300">{{ resp.closingPivot }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DealRoomsComponent {
  appwrite = inject(Appwrite);
  leadService = inject(LeadService);

  activeSubTab = signal<'deals' | 'battlecards' | 'objections'>('deals');
  selectedDealId = signal<string>('deal-1');
  isMobileDetailViewOpen = signal<boolean>(false);

  selectedObjectionQuery = signal<string>('Your license cost is 35% higher than Microsoft Dynamics.');
  analyzedResponse = signal<{ framework: string; confidence: number; script: string; proofAsset: string; closingPivot: string } | null>({
    framework: '3-Part TCO & Risk Arbitrage',
    confidence: 96,
    script: 'I completely respect the initial invoice comparison. Where enterprise clients like Apex Global saw the real math was in year-2 maintenance: Dynamics requires $120k in certified consultants and bespoke connector maintenance, whereas our native unified API eliminated 90% of custom middleware upkeep within 6 weeks.',
    proofAsset: 'Gartner 3-Year Enterprise TCO Benchmark Study + Case Study: Tier-1 Bank Migration',
    closingPivot: 'Would you be open to running your exact data schema through our 15-minute TCO audit alongside your CFO next Tuesday?'
  });

  presetObjections = [
    'Your license cost is 35% higher than Microsoft Dynamics.',
    'We already have standard Salesforce licenses across the team.',
    'Our Infosec team requires a 6-month on-premise audit.',
    'We are freezing all non-essential SaaS spend until next fiscal quarter.'
  ];

  dealRooms = signal<DealRoom[]>([
    {
      id: 'deal-1',
      title: 'Apex Global FinTech Platform',
      clientName: 'Apex Global Capital',
      dealValue: 450000,
      stage: 'Security & Procurement',
      targetCloseDate: '2026-09-30',
      probability: 85,
      industry: 'Financial Services',
      securityScore: 92,
      notes: 'Finalizing SOC2 Type II audit report package and SLA indemnity clause.',
      competitors: ['Salesforce Financial Cloud', 'Microsoft Dynamics 365'],
      stakeholders: [
        {
          id: 'sh-1',
          name: 'Elena Rostova',
          title: 'Chief Technology Officer',
          role: 'Technical Decision Maker',
          influence: 'High',
          sentiment: 'Champion',
          keyConcern: 'Real-time WebSocket latency and multi-tenant telemetry isolation',
          email: 'elena.rostova@apexcap.com'
        },
        {
          id: 'sh-2',
          name: 'Marcus Vance',
          title: 'Chief Information Security Officer',
          role: 'Security Gatekeeper',
          influence: 'High',
          sentiment: 'Positive',
          keyConcern: 'Key management and data residency compliance in EU/US',
          email: 'm.vance@apexcap.com'
        },
        {
          id: 'sh-3',
          name: 'David Sterling',
          title: 'VP of Procurement & Vendor Relations',
          role: 'Economic Buyer',
          influence: 'High',
          sentiment: 'Neutral',
          keyConcern: 'Payment terms 45-day net and multi-year price locks',
          email: 'david.sterling@apexcap.com'
        }
      ],
      milestones: [
        {
          id: 'm-1',
          title: 'Architecture & Scalability Benchmark',
          category: 'Technical',
          owner: 'Alex Chen (Solutions Architect)',
          dueDate: '2026-08-25',
          status: 'Completed',
          deliverables: 'Validated 100k events/sec throughput audit log'
        },
        {
          id: 'm-2',
          title: 'Infosec Pen-Test & ISO27001 Package Review',
          category: 'Security',
          owner: 'Marcus Vance / SecOps',
          dueDate: '2026-09-05',
          status: 'In Progress',
          deliverables: 'Verified DPA and encryption key escrow documentation'
        },
        {
          id: 'm-3',
          title: 'MSA & SLA Legal Redlines Finalization',
          category: 'Legal',
          owner: 'Sarah Connor (Corporate Counsel)',
          dueDate: '2026-09-18',
          status: 'Pending',
          deliverables: 'Executed Master Services Agreement with 99.99% uptime guarantee'
        }
      ]
    },
    {
      id: 'deal-2',
      title: 'Helios Logistics Cloud Migration',
      clientName: 'Helios Global Freight',
      dealValue: 180000,
      stage: 'Executive Alignment',
      targetCloseDate: '2026-10-15',
      probability: 70,
      industry: 'Supply Chain & Logistics',
      securityScore: 68,
      notes: 'Overcoming legacy SAP connector hesitation with sandbox demo.',
      competitors: ['HubSpot Enterprise', 'Custom In-House'],
      stakeholders: [
        {
          id: 'sh-4',
          name: 'Janice Morales',
          title: 'VP of Operations',
          role: 'Business Champion',
          influence: 'High',
          sentiment: 'Champion',
          keyConcern: 'Driver mobile app sync when offline in transit',
          email: 'j.morales@helioslogistics.io'
        },
        {
          id: 'sh-5',
          name: 'Arthur Pendelton',
          title: 'Head of Legacy Infrastructure',
          role: 'Technical Assessor',
          influence: 'Medium',
          sentiment: 'Skeptical',
          keyConcern: 'Disruption to 15-year old AS400 warehouse database',
          email: 'arthur.p@helioslogistics.io'
        }
      ],
      milestones: [
        {
          id: 'm-4',
          title: 'Pilot Telemetry Deployment (5 Hubs)',
          category: 'Technical',
          owner: 'Engineering Pilot Team',
          dueDate: '2026-09-10',
          status: 'In Progress',
          deliverables: 'Live sync proof-of-concept across 5 freight terminals'
        },
        {
          id: 'm-5',
          title: 'Executive Sponsor ROI Presentation',
          category: 'Executive',
          owner: 'Janice Morales & VP Sales',
          dueDate: '2026-09-22',
          status: 'Pending',
          deliverables: '12-page ROI breakdown showing $340k annual fuel savings'
        }
      ]
    },
    {
      id: 'deal-3',
      title: 'Nova Quantum BioMed Infrastructure',
      clientName: 'Nova Quantum Therapeutics',
      dealValue: 320000,
      stage: 'Proposal & Pricing Strategy',
      targetCloseDate: '2026-11-01',
      probability: 60,
      industry: 'Biotechnology & Health',
      securityScore: 55,
      notes: 'HIPAA and FDA Title 21 CFR Part 11 electronic records validation required.',
      competitors: ['Veeva Systems', 'Salesforce Health Cloud'],
      stakeholders: [
        {
          id: 'sh-6',
          name: 'Dr. Alistair Thorne',
          title: 'Chief Scientific Officer',
          role: 'Executive Sponsor',
          influence: 'High',
          sentiment: 'Positive',
          keyConcern: 'Clinical trial audit trails and cryptographic integrity',
          email: 'thorne@novaquantum.bio'
        }
      ],
      milestones: [
        {
          id: 'm-6',
          title: 'HIPAA BAA and CFR Part 11 Compliance Signoff',
          category: 'Security',
          owner: 'Regulatory Affairs Team',
          dueDate: '2026-10-05',
          status: 'Pending',
          deliverables: 'Executed Business Associate Agreement'
        }
      ]
    }
  ]);

  battlecards = signal<BattlecardItem[]>([
    {
      id: 'bc-1',
      competitor: 'Salesforce Enterprise CRM',
      strengths: ['Massive third-party ecosystem', 'Brand recognition in Fortune 500', 'Established consulting network'],
      vulnerabilities: [
        'Bloated codebase requiring 6+ months for basic custom objects',
        'Exorbitant addon fees for basic API calls & analytics seats',
        'Legacy UI causes severe sales rep dissatisfaction and slow adoption'
      ],
      killPoints: [
        'Show live 200ms sub-second page loads vs 4.5s Salesforce Lightning record spin',
        'Transparent all-inclusive flat pricing with zero per-API surcharge traps',
        'Native bi-directional Appwrite real-time syncing without middleware'
      ],
      pricingCounterStrategy: 'Highlight 3-year TCO where Salesforce initial discount balloons by 40% at year-2 renewal.',
      objections: [
        {
          trigger: 'Salesforce is the safe bet that no one gets fired for buying.',
          response: 'True in 2012, but today 64% of Salesforce implementations exceed budget by 50% and 40% fail adoption due to legacy UX friction.'
        }
      ]
    },
    {
      id: 'bc-2',
      competitor: 'HubSpot Enterprise',
      strengths: ['Friendly marketing automation', 'Clean inbound lead scoring', 'Accessible starter tier'],
      vulnerabilities: [
        'Weak custom relational data modeling for complex B2B parent-child accounts',
        'Extremely expensive contact-tier pricing escalations',
        'Limited enterprise role-based security & audit permissions'
      ],
      killPoints: [
        'Demonstrate multi-tenant custom schema flexibility without contact-tier penalties',
        'Show granular RBAC and cryptographic audit trail capabilities required by FinTech/HealthTech'
      ],
      pricingCounterStrategy: 'Compare contact storage penalties: storing 500k inactive leads on HubSpot costs $30k/yr extra; on our platform it is included.',
      objections: [
        {
          trigger: 'HubSpot is easier for our marketing team.',
          response: 'Our platform seamlessly connects to existing HubSpot marketing workflows while providing enterprise RevOps depth that HubSpot cannot handle.'
        }
      ]
    },
    {
      id: 'bc-3',
      competitor: 'Microsoft Dynamics 365',
      strengths: ['Seamless Office365 and Azure bundle', 'Enterprise licensing agreements'],
      vulnerabilities: [
        'Terrible UX that reps actively avoid using',
        'Requires costly specialized .NET / PowerPlatform implementation partners',
        'High customization inertia making rapid pipeline changes slow'
      ],
      killPoints: [
        'Rep velocity test: logging a deal takes 3 clicks vs 14 clicks in Dynamics',
        'Instantaneous reactive UI built for high-tempo modern sales reps'
      ],
      pricingCounterStrategy: 'Factor in Dynamics mandatory partner consulting fees ($250/hr for 400 hours = $100k hidden fee).',
      objections: [
        {
          trigger: 'We already have Microsoft Enterprise Agreement credits.',
          response: 'Free or discounted licenses mean nothing if your sales reps maintain private spreadsheets because Dynamics is too slow to update.'
        }
      ]
    }
  ]);

  selectedDeal = computed(() => {
    return this.dealRooms().find(d => d.id === this.selectedDealId()) || this.dealRooms()[0];
  });

  totalPipelineValue = computed(() => {
    return this.dealRooms().reduce((sum, d) => sum + d.dealValue, 0);
  });

  avgProbability = computed(() => {
    const list = this.dealRooms();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, d) => sum + d.probability, 0) / list.length);
  });

  totalStakeholders = computed(() => {
    return this.dealRooms().reduce((sum, d) => sum + d.stakeholders.length, 0);
  });

  totalChampions = computed(() => {
    return this.dealRooms().reduce((sum, d) => sum + d.stakeholders.filter(s => s.sentiment === 'Champion').length, 0);
  });

  getStageColor(stage: string): string {
    if (stage.includes('Security')) return 'bg-purple-400';
    if (stage.includes('Alignment')) return 'bg-amber-400';
    if (stage.includes('Proposal')) return 'bg-teal-400';
    return 'bg-emerald-400';
  }

  getSentimentBadgeClass(sentiment: Stakeholder['sentiment']): string {
    switch (sentiment) {
      case 'Champion': return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'Positive': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Neutral': return 'bg-zinc-800 text-zinc-300 border-zinc-700';
      case 'Skeptical': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Blocker': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
  }

  getMilestoneStatusClass(status: MapMilestone['status']): string {
    switch (status) {
      case 'Completed': return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'In Progress': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Pending': return 'bg-zinc-900 text-zinc-500 border-zinc-800';
      case 'At Risk': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  }

  isMobileViewport(): boolean {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1280; // xl breakpoint
    }
    return false;
  }

  selectDeal(id: string) {
    this.selectedDealId.set(id);
    if (this.isMobileViewport()) {
      this.isMobileDetailViewOpen.set(true);
    }
  }

  updateDealStage(deal: DealRoom, newStage: string) {
    deal.stage = newStage;
    this.dealRooms.update(rooms => [...rooms]);
    this.appwrite.addNotification({
      title: 'Pipeline Updated',
      message: `${deal.clientName} advanced to ${newStage}.`,
      type: 'success'
    });
  }

  cycleSentiment(person: Stakeholder) {
    const sequence: Stakeholder['sentiment'][] = ['Champion', 'Positive', 'Neutral', 'Skeptical', 'Blocker'];
    const nextIdx = (sequence.indexOf(person.sentiment) + 1) % sequence.length;
    person.sentiment = sequence[nextIdx];

    this.dealRooms.update(rooms => [...rooms]);
    this.appwrite.addNotification({
      title: 'Sentiment Updated',
      message: `${person.name}'s sentiment updated to "${person.sentiment}".`,
      type: 'info'
    });
  }

  toggleMilestoneStatus(milestone: MapMilestone) {
    milestone.status = milestone.status === 'Completed' ? 'In Progress' : 'Completed';
    this.dealRooms.update(rooms => [...rooms]);
    this.appwrite.addNotification({
      title: 'Milestone Updated',
      message: `"${milestone.title}" marked as ${milestone.status}.`,
      type: 'success'
    });
  }

  runObjectionAnalysis(query: string) {
    const q = query.toLowerCase();
    let script = 'I understand that perspective. Many enterprise customers felt similarly during initial evaluation, but discovered our platform eliminated hidden maintenance fees and increased adoption speed 3x.';
    let framework = 'Feel, Felt, Found + Empirical Proof';
    let proofAsset = 'Independent Forrester TEI (Total Economic Impact) Report';
    let closingPivot = 'Let us run a 10-day parallel trial against your current system with 3 of your top reps.';

    if (q.includes('price') || q.includes('cost') || q.includes('higher') || q.includes('expensive')) {
      framework = 'TCO Realization & Risk Arbitrage';
      script = 'When evaluating sticker price alone, that makes sense. However, when we audit the total cost of ownership including required external consultants and API volume taxes, our clients consistently save 38% net over 3 years.';
      proofAsset = 'CFO Financial Model & TCO Comparison Spreadsheet';
      closingPivot = 'Can we model your projected volume against our transparent pricing tier in a 15-minute sync?';
    } else if (q.includes('salesforce') || q.includes('microsoft') || q.includes('dynamics')) {
      framework = 'Rep Velocity & Zero-Overhead Integration';
      script = 'We actually do not ask you to rip out your core ERP; we empower your active sales reps with a sub-second reactive workspace that syncs bi-directionally without losing your central records of truth.';
      proofAsset = 'Bi-Directional Enterprise Connector Architecture Whitepaper';
      closingPivot = 'Would your RevOps lead be open to a 20-minute sandbox walkthrough tomorrow?';
    } else if (q.includes('security') || q.includes('infosec') || q.includes('audit')) {
      framework = 'Cryptographic Compliance & Zero-Trust Assurance';
      script = 'Security is our baseline foundation. We provide complete SOC2 Type II, ISO27001, HIPAA BAA compliance with customer-managed encryption keys and dedicated tenant isolation.';
      proofAsset = 'Standardized CAIQ & SOC2 Type II Executive Security Summary';
      closingPivot = 'I can invite your CISO to our secure compliance portal for instant self-service audit review today.';
    }

    this.analyzedResponse.set({
      framework,
      confidence: 95,
      script,
      proofAsset,
      closingPivot
    });
  }

  testBattlecardWithSimulator(card: BattlecardItem) {
    this.selectedObjectionQuery.set(card.objections[0]?.trigger || `We are strongly considering ${card.competitor}.`);
    this.activeSubTab.set('objections');
    this.runObjectionAnalysis(this.selectedObjectionQuery());
  }

  copyRebuttal(script: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(script).then(() => {
        this.appwrite.addNotification({
          title: 'Rebuttal Copied',
          message: 'Sales script copied to clipboard.',
          type: 'success'
        });
      });
    }
  }

  generateBuyerPortalLink(deal: DealRoom) {
    const portalUrl = `${window.location.origin}/deal-rooms/portal/${deal.id}?auth=secure_${Date.now().toString(36)}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(portalUrl).then(() => {
        this.appwrite.addNotification({
          title: 'Buyer Portal Link Ready',
          message: `Secure portal link for "${deal.clientName}" copied to clipboard.`,
          type: 'success'
        });
      });
    }
  }

  openCreateDealRoomModal() {
    const newDeal: DealRoom = {
      id: 'deal-' + Date.now(),
      title: 'Solaria Energy Microgrid Contract',
      clientName: 'Solaria Global Networks',
      dealValue: 240000,
      stage: 'Proposal & Pricing Strategy',
      targetCloseDate: '2026-11-15',
      probability: 65,
      industry: 'Renewable Energy',
      securityScore: 75,
      notes: 'Custom microgrid telemetry sync required.',
      competitors: ['Salesforce', 'Legacy Custom'],
      stakeholders: [
        {
          id: 'sh-' + Date.now(),
          name: 'Vivian Zhao',
          title: 'Director of Grid Telemetry',
          role: 'Technical Assessor',
          influence: 'High',
          sentiment: 'Champion',
          keyConcern: 'IoT sub-second response times',
          email: 'vivian.z@solariagrid.com'
        }
      ],
      milestones: [
        {
          id: 'm-' + Date.now(),
          title: 'Initial Proof of Concept Validation',
          category: 'Technical',
          owner: 'Solutions Engineering',
          dueDate: '2026-10-01',
          status: 'In Progress',
          deliverables: 'Benchmarked telemetry dashboard'
        }
      ]
    };

    this.dealRooms.update(list => [newDeal, ...list]);
    this.selectedDealId.set(newDeal.id);
    this.appwrite.addNotification({
      title: 'Deal Room Manifested',
      message: `Created collaborative war-room for "${newDeal.title}".`,
      type: 'success'
    });
  }

  openAddStakeholderModal() {
    const current = this.selectedDeal();
    if (!current) return;

    const newSh: Stakeholder = {
      id: 'sh-' + Date.now(),
      name: 'Julian Sterling',
      title: 'Director of Global Procurement',
      role: 'Economic Gatekeeper',
      influence: 'High',
      sentiment: 'Neutral',
      keyConcern: 'Multi-year discount and payment terms',
      email: `julian.sterling@${current.clientName.toLowerCase().replace(/[^a-z]/g, '')}.com`
    };

    current.stakeholders.push(newSh);
    this.dealRooms.update(rooms => [...rooms]);

    this.appwrite.addNotification({
      title: 'Stakeholder Enrolled',
      message: `Enrolled ${newSh.name} into buying committee matrix.`,
      type: 'success'
    });
  }

  openAddMilestoneModal() {
    const current = this.selectedDeal();
    if (!current) return;

    const newM: MapMilestone = {
      id: 'm-' + Date.now(),
      title: 'Executive Sponsor Final Walkthrough',
      category: 'Executive',
      owner: 'Account Executive & VP Sales',
      dueDate: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
      status: 'Pending',
      deliverables: 'Signed closing statement and agreement draft'
    };

    current.milestones.push(newM);
    this.dealRooms.update(rooms => [...rooms]);

    this.appwrite.addNotification({
      title: 'Milestone Added',
      message: `Added "${newM.title}" to Mutual Action Plan.`,
      type: 'info'
    });
  }
}
