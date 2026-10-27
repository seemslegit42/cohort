import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';
import { LeadService, Lead } from './lead.service';

export interface PersonalizationToken {
  tag: string;
  label: string;
  example: string;
  category: 'lead' | 'company' | 'sender';
}

export interface EmailVariant {
  id: 'A' | 'B';
  name: string;
  subject: string;
  body: string;
  sends: number;
  opens: number;
  clicks: number;
  replies: number;
  openRatePct: number;
  ctrPct: number;
  replyRatePct: number;
}

export interface SequenceStep {
  id: string;
  stepNumber: number;
  title: string;
  delayValue: number;
  delayUnit: 'hours' | 'days';
  channel: 'Email' | 'Task' | 'LinkedIn' | 'SMS';
  isAbTest: boolean;
  variantA: EmailVariant;
  variantB?: EmailVariant;
  splitPctA: number; // e.g. 50
  condition: 'none' | 'if_unreplied' | 'if_unopened' | 'if_status_matches';
  targetStatusCondition?: string;
  active: boolean;
}

export interface SequenceTrigger {
  type: 'lead_status' | 'time_elapsed' | 'behavioral_action' | 'score_threshold' | 'manual';
  label: string;
  statusCondition?: string;
  elapsedDays?: number;
  actionEvent?: string;
  scoreThreshold?: number;
}

export interface EnrolledLead {
  id: string;
  leadId: string;
  leadName: string;
  leadEmail: string;
  leadCompany: string;
  leadTitle: string;
  enrolledAt: string;
  currentStepNumber: number;
  totalSteps: number;
  nextSendDate: string;
  status: 'Active' | 'Completed' | 'Replied & Exited' | 'Paused';
}

export interface AutomatedSequence {
  id: string;
  name: string;
  description: string;
  category: 'Inbound' | 'Outbound' | 'Re-engagement' | 'VIP Executive' | 'Onboarding';
  trigger: SequenceTrigger;
  unenrollOnReply: boolean;
  unenrollOnMeeting: boolean;
  targetAudience: string;
  status: 'Active' | 'Paused' | 'Draft';
  enrolledCount: number;
  completedCount: number;
  avgOpenRate: number;
  avgCtr: number;
  avgReplyRate: number;
  conversions: number;
  steps: SequenceStep[];
  enrolledLeads: EnrolledLead[];
}

@Component({
  selector: 'app-cadences',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="h-full flex flex-col p-3 sm:p-5 md:p-6 animate-fade-in max-w-[1650px] mx-auto space-y-6">
      
      <!-- Top Header -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center text-zinc-950 shadow-[0_0_20px_rgba(20,184,166,0.25)] font-bold">
              <mat-icon class="text-[22px]">alt_route</mat-icon>
            </div>
            <div>
              <h1 class="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Automated Email Sequences</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 font-mono font-normal">Multi-Trigger Engine</span>
              </h1>
              <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Define automated drip sequences scheduled over time, triggered by lead status, inactivity, or behavioral actions with deep dynamic data personalization.
              </p>
            </div>
          </div>
        </div>

        <!-- Top Actions -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <button 
            type="button"
            (click)="showTriggerSimulator.set(true)" 
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px] text-teal-400">bolt</mat-icon>
            <span>Simulate Trigger Execution</span>
          </button>

          <button 
            type="button"
            (click)="openEnrollLeadsModal()" 
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border bg-zinc-900 hover:bg-zinc-800 border-teal-500/30 text-teal-300 flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px]">group_add</mat-icon>
            <span>Enroll CRM Leads</span>
          </button>

          <button 
            type="button"
            (click)="openNewSequenceModal()" 
            class="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer active:scale-95 transition-all">
            <mat-icon class="text-[16px]">add_circle</mat-icon>
            <span>New Sequence</span>
          </button>
        </div>
      </header>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Active Sequences</span>
            <mat-icon class="text-cyan-400 text-[18px]">account_tree</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ activeSequences().length }} <span class="text-xs text-zinc-500 font-sans font-normal">/ {{ sequences().length }} Total</span></div>
          <div class="text-[11px] text-cyan-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">play_circle</mat-icon> {{ totalEnrolledLeads() }} Active Prospects
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Avg Sequence Open Rate</span>
            <mat-icon class="text-teal-400 text-[18px]">mark_email_read</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ overallAvgOpenRate() }}%</div>
          <div class="text-[11px] text-teal-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">trending_up</mat-icon> +19.2% with Dynamic Personalization
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Avg Click-Through (CTR)</span>
            <mat-icon class="text-blue-400 text-[18px]">ads_click</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ overallAvgCtr() }}%</div>
          <div class="text-[11px] text-blue-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">touch_app</mat-icon> High Intent Resource Link Tracking
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Meetings & Deals Converted</span>
            <mat-icon class="text-purple-400 text-[18px]">emoji_events</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ totalConversions() }} Won</div>
          <div class="text-[11px] text-purple-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">monetization_on</mat-icon> \${{ (totalConversions() * 42000).toLocaleString() }} Pipeline Attributed
          </div>
        </div>
      </div>

      <!-- Main Two-Column Workflow Workspace -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        <!-- Left Column: Sequence Selector List (4 cols) -->
        <div class="xl:col-span-4 space-y-3">
          
          <!-- Filters & Search -->
          <div class="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
            <div class="flex items-center justify-between">
              <h2 class="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Sequences Catalog</h2>
              <span class="text-[11px] text-zinc-500 font-mono">{{ filteredSequences().length }} Total</span>
            </div>
            
            <div class="relative">
              <mat-icon class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-[16px]">search</mat-icon>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="Search sequences by name or trigger..." 
                class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/50" />
            </div>

            <!-- Category / Trigger Filter Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
              @for (tab of triggerFilterTabs; track tab.id) {
                <button 
                  type="button"
                  (click)="selectedTriggerFilter.set(tab.id)" 
                  [class]="selectedTriggerFilter() === tab.id ? 'bg-teal-500 text-zinc-950 font-bold' : 'bg-zinc-800/80 text-zinc-400 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer">
                  {{ tab.label }}
                </button>
              }
            </div>
          </div>

          <!-- Sequences Cards List -->
          <div class="space-y-2.5 max-h-[720px] overflow-y-auto pr-1 custom-scrollbar">
            @for (seq of filteredSequences(); track seq.id) {
              <div 
                (click)="selectedSequenceId.set(seq.id)"
                (keydown.enter)="selectedSequenceId.set(seq.id)"
                tabindex="0"
                role="button"
                [class]="selectedSequenceId() === seq.id ? 'bg-[#0b1d20] border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.15)]' : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80'"
                class="p-4 rounded-2xl border transition-all cursor-pointer text-left group">
                
                <div class="flex items-start justify-between gap-2 mb-1.5">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span [class]="seq.status === 'Active' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'" class="w-2 h-2 rounded-full"></span>
                      <h3 class="text-sm font-bold text-white group-hover:text-teal-300 transition-colors truncate font-display">{{ seq.name }}</h3>
                    </div>
                    <div class="flex items-center gap-1.5 mt-1">
                      <mat-icon class="text-[13px] text-teal-400">
                        {{ getTriggerIcon(seq.trigger.type) }}
                      </mat-icon>
                      <span class="text-[11px] text-teal-300 font-medium truncate">{{ seq.trigger.label }}</span>
                    </div>
                  </div>
                  <span [class]="seq.status === 'Active' ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'" class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0">
                    {{ seq.status }}
                  </span>
                </div>

                <p class="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                  {{ seq.description }}
                </p>

                <div class="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-zinc-800/60 text-[11px]">
                  <div>
                    <span class="text-zinc-500 block text-[10px]">Enrolled</span>
                    <span class="font-bold text-zinc-200 font-mono">{{ seq.enrolledCount }}</span>
                  </div>
                  <div>
                    <span class="text-zinc-500 block text-[10px]">Open / CTR</span>
                    <span class="font-bold text-teal-400 font-mono">{{ seq.avgOpenRate }}% / {{ seq.avgCtr }}%</span>
                  </div>
                  <div>
                    <span class="text-zinc-500 block text-[10px]">Steps</span>
                    <span class="font-bold text-purple-400 font-mono">{{ seq.steps.length }} Steps</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Right Column: Sequence Builder, Steps Timeline & Enrolled Queue (8 cols) -->
        @if (selectedSequence(); as seq) {
          <div class="xl:col-span-8 space-y-5">
            
            <!-- Sequence Header Banner -->
            <div class="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-xl relative backdrop-blur-2xl">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                      {{ seq.steps.length }}-Step Sequence
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      {{ seq.category }}
                    </span>
                    <span class="text-zinc-400 text-xs font-mono flex items-center gap-1">
                      <mat-icon class="text-[14px] text-amber-400">bolt</mat-icon> Trigger: {{ seq.trigger.label }}
                    </span>
                  </div>
                  <h2 class="text-xl sm:text-2xl font-bold text-white font-display">{{ seq.name }}</h2>
                  <p class="text-xs sm:text-sm text-zinc-400 mt-1">Audience Target: <span class="text-zinc-200 font-medium">{{ seq.targetAudience }}</span></p>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                  <button 
                    type="button"
                    (click)="toggleSequenceStatus(seq)" 
                    [class]="seq.status === 'Active' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'"
                    class="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer">
                    <mat-icon class="text-[16px]">{{ seq.status === 'Active' ? 'pause' : 'play_arrow' }}</mat-icon>
                    <span>{{ seq.status === 'Active' ? 'Pause' : 'Activate' }}</span>
                  </button>

                  <button 
                    type="button"
                    (click)="openLivePreviewModal(seq.steps[0])" 
                    class="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer">
                    <mat-icon class="text-[16px] text-teal-400">visibility</mat-icon>
                    <span>Preview with Lead Data</span>
                  </button>
                  
                  <button 
                    type="button"
                    (click)="openAddStepModal(seq)" 
                    class="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer">
                    <mat-icon class="text-[16px]">add_circle</mat-icon>
                    <span>Add Sequence Step</span>
                  </button>
                </div>
              </div>

              <!-- Unenrollment Rules Bar -->
              <div class="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
                <div class="flex items-center gap-4">
                  <span class="flex items-center gap-1.5">
                    <mat-icon class="text-[15px] text-emerald-400">check_circle</mat-icon>
                    Auto-unenroll on prospect reply: <strong class="text-white">{{ seq.unenrollOnReply ? 'Enabled' : 'Disabled' }}</strong>
                  </span>
                  <span class="flex items-center gap-1.5">
                    <mat-icon class="text-[15px] text-teal-400">event_available</mat-icon>
                    Auto-unenroll on meeting booked: <strong class="text-white">{{ seq.unenrollOnMeeting ? 'Enabled' : 'Disabled' }}</strong>
                  </span>
                </div>
                <div class="text-[11px] text-zinc-500 font-mono">
                  Trigger condition: <span class="text-teal-400">{{ getTriggerSummary(seq.trigger) }}</span>
                </div>
              </div>
            </div>

            <!-- View Switcher (Steps Timeline vs Enrolled Prospects) -->
            <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div class="flex items-center gap-2">
                <button 
                  type="button"
                  (click)="activeSequenceView.set('timeline')" 
                  [class]="activeSequenceView() === 'timeline' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'"
                  class="px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer">
                  <mat-icon class="text-[16px] text-teal-400">timeline</mat-icon>
                  <span>Step-by-Step Sequence Timeline ({{ seq.steps.length }})</span>
                </button>

                <button 
                  type="button"
                  (click)="activeSequenceView.set('queue')" 
                  [class]="activeSequenceView() === 'queue' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'"
                  class="px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer">
                  <mat-icon class="text-[16px] text-cyan-400">people</mat-icon>
                  <span>Enrolled Leads & Queue ({{ seq.enrolledLeads.length }})</span>
                </button>
              </div>

              <span class="text-xs text-zinc-500 font-mono">
                {{ countAbTests(seq) }} Steps with A/B Split Test Active
              </span>
            </div>

            <!-- TAB 1: Step-by-Step Sequence Timeline -->
            @if (activeSequenceView() === 'timeline') {
              <div class="space-y-4">
                
                @for (step of seq.steps; track step.id; let idx = $index; let isLast = $last) {
                  
                  <!-- Delay Timeline Connector (between steps) -->
                  @if (idx > 0) {
                    <div class="flex items-center justify-center my-2">
                      <div class="px-3.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-teal-400 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                        <mat-icon class="text-[14px]">hourglass_empty</mat-icon>
                        <span>Wait {{ step.delayValue }} {{ step.delayUnit }} before executing Step #{{ step.stepNumber }}</span>
                      </div>
                    </div>
                  }

                  <!-- Step Card -->
                  <div class="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 relative hover:border-zinc-700 transition-all space-y-4">
                    
                    <!-- Step Top Bar -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xs font-bold text-teal-400 font-mono">
                          #{{ step.stepNumber }}
                        </div>
                        <div>
                          <div class="flex items-center gap-2">
                            <h4 class="text-sm font-bold text-white">{{ step.title }}</h4>
                            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                              <mat-icon class="text-[12px]">{{ getChannelIcon(step.channel) }}</mat-icon>
                              <span>{{ step.channel }}</span>
                            </span>
                            <span class="text-xs text-zinc-400 font-mono">
                              {{ idx === 0 ? 'Immediately upon trigger' : '+' + step.delayValue + ' ' + step.delayUnit + ' delay' }}
                            </span>
                            @if (step.isAbTest) {
                              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                <mat-icon class="text-[12px]">tune</mat-icon> A/B Split Test Active
                              </span>
                            }
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2 text-xs">
                        <button 
                          (click)="openLivePreviewModal(step)"
                          class="px-2.5 py-1.5 rounded-lg border bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all">
                          <mat-icon class="text-[14px] text-teal-400">visibility</mat-icon>
                          <span>Preview Lead Data</span>
                        </button>

                        <button 
                          (click)="toggleStepAbTest(step)"
                          [class]="step.isAbTest ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' : 'text-zinc-400 bg-zinc-800 border-zinc-700'"
                          class="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all">
                          <mat-icon class="text-[14px]">flaky</mat-icon>
                          {{ step.isAbTest ? 'Disable A/B' : 'Enable A/B' }}
                        </button>

                        <button 
                          (click)="openEditStepModal(seq, step)"
                          class="px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all">
                          <mat-icon class="text-[14px]">edit</mat-icon>
                          <span>Edit</span>
                        </button>

                        @if (seq.steps.length > 1) {
                          <button 
                            (click)="deleteStep(seq, step)"
                            class="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            aria-label="Delete step">
                            <mat-icon class="text-[16px]">delete</mat-icon>
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Email Variants Comparison Grid -->
                    <div class="grid grid-cols-1" [class.lg:grid-cols-2]="step.isAbTest" gap-4>
                      
                      <!-- Variant A Card -->
                      <div class="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3 relative">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded-md bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-mono font-bold text-xs">A</span>
                            <span class="text-xs font-bold text-white">{{ step.variantA.name }}</span>
                          </div>
                          <div class="flex items-center gap-3 text-[11px] font-mono">
                            <span title="Open Rate" class="text-teal-400 font-bold">Open: {{ step.variantA.openRatePct }}%</span>
                            <span title="Click-Through Rate" class="text-blue-400 font-bold">CTR: {{ step.variantA.ctrPct }}%</span>
                            <span title="Reply Rate" class="text-emerald-400 font-bold">Reply: {{ step.variantA.replyRatePct }}%</span>
                          </div>
                        </div>

                        <div class="space-y-1.5 text-xs">
                          <div class="text-zinc-300 font-medium text-[11px] bg-zinc-900/80 px-2.5 py-1.5 rounded border border-zinc-800 truncate">
                            <span class="text-zinc-500 font-mono">Subject: </span> {{ step.variantA.subject }}
                          </div>
                          <p class="text-[11px] text-zinc-400 font-mono whitespace-pre-line bg-zinc-900/40 p-2.5 rounded border border-zinc-800/60 max-h-24 overflow-y-auto custom-scrollbar leading-relaxed">
                            {{ step.variantA.body }}
                          </p>
                        </div>

                        <div class="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-850">
                          <span>{{ step.variantA.sends }} sends &bull; {{ step.variantA.opens }} opens &bull; {{ step.variantA.clicks }} clicks</span>
                          @if (step.isAbTest && step.variantA.ctrPct >= (step.variantB?.ctrPct || 0)) {
                            <span class="text-emerald-400 font-bold flex items-center gap-0.5">
                              <mat-icon class="text-[12px]">trophy</mat-icon> Leading Variant
                            </span>
                          }
                        </div>
                      </div>

                      <!-- Variant B Card (When A/B Test enabled) -->
                      @if (step.isAbTest && step.variantB) {
                        <div class="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3 relative">
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                              <span class="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-xs">B</span>
                              <span class="text-xs font-bold text-white">{{ step.variantB.name }}</span>
                            </div>
                            <div class="flex items-center gap-3 text-[11px] font-mono">
                              <span title="Open Rate" class="text-teal-400 font-bold">Open: {{ step.variantB.openRatePct }}%</span>
                              <span title="Click-Through Rate" class="text-blue-400 font-bold">CTR: {{ step.variantB.ctrPct }}%</span>
                              <span title="Reply Rate" class="text-emerald-400 font-bold">Reply: {{ step.variantB.replyRatePct }}%</span>
                            </div>
                          </div>

                          <div class="space-y-1.5 text-xs">
                            <div class="text-zinc-300 font-medium text-[11px] bg-zinc-900/80 px-2.5 py-1.5 rounded border border-zinc-800 truncate">
                              <span class="text-zinc-500 font-mono">Subject: </span> {{ step.variantB.subject }}
                            </div>
                            <p class="text-[11px] text-zinc-400 font-mono whitespace-pre-line bg-zinc-900/40 p-2.5 rounded border border-zinc-800/60 max-h-24 overflow-y-auto custom-scrollbar leading-relaxed">
                              {{ step.variantB.body }}
                            </p>
                          </div>

                          <div class="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-850">
                            <span>{{ step.variantB.sends }} sends &bull; {{ step.variantB.opens }} opens &bull; {{ step.variantB.clicks }} clicks</span>
                            @if (step.variantB.ctrPct > step.variantA.ctrPct) {
                              <span class="text-purple-300 font-bold flex items-center gap-0.5">
                                <mat-icon class="text-[12px]">trophy</mat-icon> Leading Variant
                              </span>
                            }
                          </div>
                        </div>
                      }

                    </div>

                  </div>
                }
              </div>
            }

            <!-- TAB 2: Enrolled Leads Queue Table -->
            @if (activeSequenceView() === 'queue') {
              <div class="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-bold text-white font-display">Active Prospects in Sequence Queue</h3>
                    <p class="text-xs text-zinc-400">Leads actively advancing through the {{ seq.name }} scheduled steps.</p>
                  </div>
                  <button 
                    (click)="openEnrollLeadsModal()" 
                    class="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5">
                    <mat-icon class="text-[16px]">person_add</mat-icon>
                    <span>Enroll More Leads</span>
                  </button>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                        <th class="pb-2.5 font-bold">Prospect</th>
                        <th class="pb-2.5 font-bold">Company & Title</th>
                        <th class="pb-2.5 font-bold">Current Step</th>
                        <th class="pb-2.5 font-bold">Next Send ETA</th>
                        <th class="pb-2.5 font-bold">Status</th>
                        <th class="pb-2.5 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-zinc-800/60">
                      @for (enrolled of seq.enrolledLeads; track enrolled.id) {
                        <tr class="hover:bg-zinc-800/30 transition-colors">
                          <td class="py-3">
                            <div class="font-bold text-white">{{ enrolled.leadName }}</div>
                            <div class="text-[11px] text-zinc-400 font-mono">{{ enrolled.leadEmail }}</div>
                          </td>
                          <td class="py-3 text-zinc-300">
                            <div>{{ enrolled.leadCompany }}</div>
                            <div class="text-[11px] text-zinc-500">{{ enrolled.leadTitle }}</div>
                          </td>
                          <td class="py-3">
                            <span class="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-teal-300 font-mono text-[11px] font-bold">
                              Step {{ enrolled.currentStepNumber }} of {{ enrolled.totalSteps }}
                            </span>
                          </td>
                          <td class="py-3 text-zinc-400 font-mono text-[11px]">
                            {{ enrolled.nextSendDate }}
                          </td>
                          <td class="py-3">
                            <span [class]="getEnrolledStatusClass(enrolled.status)" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border">
                              {{ enrolled.status }}
                            </span>
                          </td>
                          <td class="py-3 text-right">
                            <div class="flex items-center justify-end gap-1.5">
                              <button 
                                (click)="advanceLeadStep(seq, enrolled)" 
                                title="Execute & Advance to Next Step"
                                class="p-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                <mat-icon class="text-[15px]">skip_next</mat-icon>
                              </button>
                              <button 
                                (click)="unenrollLead(seq, enrolled)" 
                                title="Unenroll from Sequence"
                                class="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <mat-icon class="text-[15px]">person_remove</mat-icon>
                              </button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

              </div>
            }

          </div>
        }

      </div>

      <!-- MODAL 1: Step Editor (Subject, Body, Delay, Conditions & Personalization Tokens) -->
      @if (editingStep(); as step) {
        <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" (click)="editingStep.set(null)" (keydown.escape)="editingStep.set(null)" tabindex="0" role="dialog" aria-modal="true">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
            
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div class="flex items-center gap-2">
                <mat-icon class="text-teal-400 text-[22px]">edit_note</mat-icon>
                <h3 class="text-base font-bold text-white font-display">Configure Sequence Step #{{ step.stepNumber }}</h3>
              </div>
              <button (click)="editingStep.set(null)" class="text-zinc-500 hover:text-white" aria-label="Close modal">
                <mat-icon class="text-[20px]">close</mat-icon>
              </button>
            </div>

            <div class="space-y-4 text-xs">
              
              <!-- Step Title & Channel -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="stepTitleInput" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Step Title / Objective</label>
                  <input id="stepTitleInput" type="text" [(ngModel)]="step.title" class="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label for="stepChannelSelect" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Channel Touchpoint</label>
                  <select id="stepChannelSelect" [(ngModel)]="step.channel" class="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-teal-500">
                    <option value="Email">Automated Email</option>
                    <option value="LinkedIn">LinkedIn Social Touch</option>
                    <option value="Task">Sales Rep Manual Task</option>
                    <option value="SMS">Direct SMS Touch</option>
                  </select>
                </div>
              </div>

              <!-- Time Delay Configuration -->
              <div class="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                <label for="stepDelayVal" class="block text-[10px] font-bold uppercase text-zinc-400">Step Execution Schedule Delay</label>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label for="stepDelayVal" class="block text-[9px] text-zinc-500 mb-1">Wait Duration</label>
                    <input id="stepDelayVal" type="number" min="0" [(ngModel)]="step.delayValue" class="w-full py-1.5 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono" />
                  </div>
                  <div>
                    <label for="stepDelayUnit" class="block text-[9px] text-zinc-500 mb-1">Time Unit</label>
                    <select id="stepDelayUnit" [(ngModel)]="step.delayUnit" class="w-full py-1.5 px-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white">
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                  <div class="sm:col-span-1 col-span-2 flex items-end">
                    <span class="text-[11px] text-teal-400 font-mono pb-2">
                      {{ step.delayValue === 0 ? '⚡ Immediate dispatch' : '⏳ Sends +' + step.delayValue + ' ' + step.delayUnit + ' after prior step' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Personalization Tokens Quick Bar -->
              <div class="p-3 rounded-xl bg-teal-950/20 border border-teal-500/30 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-teal-300 font-mono">Insert Personalization Token:</span>
                  <span class="text-[10px] text-zinc-400">Click token chip to insert into text</span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  @for (tok of availableTokens; track tok.tag) {
                    <button 
                      type="button"
                      (click)="insertTokenIntoActiveField(tok.tag)" 
                      class="px-2 py-1 rounded bg-zinc-900 hover:bg-teal-500 hover:text-zinc-950 border border-zinc-700 text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer">
                      {{ tok.tag }}
                    </button>
                  }
                </div>
              </div>

              <!-- Email Content (Variant A) -->
              <div class="space-y-3 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-white text-xs flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded bg-teal-500/20 text-teal-300 flex items-center justify-center font-mono text-[10px]">A</span>
                    Email Template Content (Variant A)
                  </span>
                </div>

                <div>
                  <label for="variantASubjectInput" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Subject Line</label>
                  <input 
                    id="variantASubjectInput"
                    type="text" 
                    [(ngModel)]="step.variantA.subject" 
                    placeholder="e.g. Quick note for {{ '{{lead.firstName}}' }} at {{ '{{lead.company}}' }}"
                    class="w-full py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium focus:outline-none focus:border-teal-500" />
                </div>

                <div>
                  <label for="variantABodyInput" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Email Body Content</label>
                  <textarea 
                    id="variantABodyInput"
                    rows="6" 
                    [(ngModel)]="step.variantA.body" 
                    placeholder="Type email body here with tokens like {{ '{{lead.firstName}}' }}..."
                    class="w-full py-2 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-teal-500 custom-scrollbar leading-relaxed"></textarea>
                </div>
              </div>

            </div>

            <!-- Modal Action Buttons -->
            <div class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button (click)="editingStep.set(null)" class="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button (click)="saveStepEdits()" class="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20">
                <mat-icon class="text-[16px]">save</mat-icon>
                <span>Save Step</span>
              </button>
            </div>

          </div>
        </div>
      }

      <!-- MODAL 2: Live Personalization Preview with Real CRM Lead Switcher -->
      @if (previewStep(); as step) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" (click)="previewStep.set(null)" (keydown.escape)="previewStep.set(null)" tabindex="0" role="dialog" aria-modal="true">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
            
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div class="flex items-center gap-2">
                <mat-icon class="text-teal-400 text-[22px]">mark_email_read</mat-icon>
                <div>
                  <h3 class="text-base font-bold text-white font-display">Live Email Personalization Preview</h3>
                  <p class="text-[11px] text-zinc-400">Rendering Step #{{ step.stepNumber }} with dynamic prospect tokens</p>
                </div>
              </div>
              <button (click)="previewStep.set(null)" class="text-zinc-500 hover:text-white" aria-label="Close modal">
                <mat-icon class="text-[20px]">close</mat-icon>
              </button>
            </div>

            <!-- Lead Switcher Selector -->
            <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label for="previewLeadSelect" class="block text-[10px] font-bold uppercase text-zinc-400">Preview as CRM Prospect:</label>
                <div class="text-xs text-teal-400 font-mono">{{ selectedPreviewLead().name }} &bull; {{ selectedPreviewLead().jobTitle }} at {{ selectedPreviewLead().industry }}</div>
              </div>
              <select 
                id="previewLeadSelect"
                [ngModel]="selectedPreviewLeadId()" 
                (ngModelChange)="selectedPreviewLeadId.set($event)"
                class="py-1.5 px-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-xs focus:outline-none focus:border-teal-500">
                @for (lead of leadService.leads(); track lead.$id) {
                  <option [value]="lead.$id">{{ lead.name }} ({{ lead.jobTitle }} &bull; {{ lead.industry }})</option>
                }
              </select>
            </div>

            <!-- Rendered Email Inbox Simulation Box -->
            <div class="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-inner">
              
              <!-- Sender & Recipient Bar -->
              <div class="space-y-1.5 text-xs pb-3 border-b border-zinc-850">
                <div class="flex items-center justify-between text-zinc-400">
                  <span><strong>From:</strong> Alex Vance &lt;alex.vance&#64;laevos.internal&gt;</span>
                  <span class="font-mono text-[10px] text-zinc-500">Scheduled: {{ step.delayValue === 0 ? 'Immediately' : '+' + step.delayValue + ' ' + step.delayUnit }}</span>
                </div>
                <div class="text-zinc-300">
                  <strong>To:</strong> {{ selectedPreviewLead().name }} &lt;{{ selectedPreviewLead().email }}&gt;
                </div>
                <div class="text-sm font-bold text-white pt-1">
                  <strong>Subject:</strong> {{ renderTokens(step.variantA.subject, selectedPreviewLead()) }}
                </div>
              </div>

              <!-- Rendered Email Body -->
              <div class="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-line bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                {{ renderTokens(step.variantA.body, selectedPreviewLead()) }}
              </div>

              <!-- Footer Signature -->
              <div class="text-[11px] text-zinc-500 border-t border-zinc-850 pt-2 font-mono">
                Sent via lxv Automated Outbound Engine &bull; Zero-Spam Compliance &bull; Unsubscribe Enabled
              </div>

            </div>

            <div class="flex items-center justify-between pt-3 border-t border-zinc-800">
              <span class="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <mat-icon class="text-[14px]">check_circle</mat-icon> All tokens resolved cleanly
              </span>
              <button (click)="previewStep.set(null)" class="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs">
                Done Previewing
              </button>
            </div>

          </div>
        </div>
      }

      <!-- MODAL 3: Create New Sequence -->
      @if (showNewSequenceModal()) {
        <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" (click)="showNewSequenceModal.set(false)" (keydown.escape)="showNewSequenceModal.set(false)" tabindex="0" role="dialog" aria-modal="true">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
            
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div class="flex items-center gap-2">
                <mat-icon class="text-teal-400 text-[22px]">add_circle</mat-icon>
                <h3 class="text-base font-bold text-white font-display">Create Automated Email Sequence</h3>
              </div>
              <button (click)="showNewSequenceModal.set(false)" class="text-zinc-500 hover:text-white" aria-label="Close modal">
                <mat-icon class="text-[20px]">close</mat-icon>
              </button>
            </div>

            <div class="space-y-4 text-xs">
              <div>
                <label for="newSeqNameInput" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Sequence Name</label>
                <input id="newSeqNameInput" type="text" [(ngModel)]="newSequenceForm.name" placeholder="e.g. Inbound Demo Post-Call Nurture" class="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-teal-500" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="newSeqCategorySelect" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Category</label>
                  <select id="newSeqCategorySelect" [(ngModel)]="newSequenceForm.category" class="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-teal-500">
                    <option value="Inbound">Inbound Nurture</option>
                    <option value="Outbound">Cold Outbound</option>
                    <option value="Re-engagement">Deal Re-engagement</option>
                    <option value="VIP Executive">VIP Executive</option>
                    <option value="Onboarding">Post-Sale Onboarding</option>
                  </select>
                </div>

                <div>
                  <label for="newSeqTriggerTypeSelect" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Trigger Mechanism</label>
                  <select id="newSeqTriggerTypeSelect" [(ngModel)]="newSequenceForm.triggerType" class="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-teal-500">
                    <option value="lead_status">Lead Status Transition</option>
                    <option value="time_elapsed">Time Elapsed / Inactivity</option>
                    <option value="behavioral_action">Behavioral Prospect Action</option>
                    <option value="score_threshold">AI Lead Score Threshold</option>
                    <option value="manual">Manual Rep Enrollment</option>
                  </select>
                </div>
              </div>

              <!-- Trigger Details Based on Selection -->
              @if (newSequenceForm.triggerType === 'lead_status') {
                <div class="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                  <label for="newSeqStatusCond" class="block text-[10px] font-bold uppercase text-zinc-400">Trigger on Status Change To:</label>
                  <select id="newSeqStatusCond" [(ngModel)]="newSequenceForm.triggerStatus" class="w-full py-1.5 px-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white">
                    <option value="New">New (Immediately upon lead creation)</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified (MQL / SQL conversion)</option>
                    <option value="Proposal">Proposal Sent</option>
                    <option value="Negotiation">In Active Negotiation</option>
                  </select>
                </div>
              }

              @if (newSequenceForm.triggerType === 'time_elapsed') {
                <div class="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                  <label for="newSeqElapsedDays" class="block text-[10px] font-bold uppercase text-zinc-400">Trigger after Inactivity (Days):</label>
                  <input id="newSeqElapsedDays" type="number" min="1" max="60" [(ngModel)]="newSequenceForm.triggerElapsedDays" class="w-full py-1.5 px-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono" />
                </div>
              }

              <div>
                <label for="newSeqAudienceInput" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Target Audience Segment</label>
                <input id="newSeqAudienceInput" type="text" [(ngModel)]="newSequenceForm.targetAudience" placeholder="e.g. Enterprise Engineering Decision Makers" class="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-teal-500" />
              </div>

              <div class="space-y-2 pt-2 border-t border-zinc-800">
                <label class="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="newSequenceForm.unenrollOnReply" class="rounded accent-teal-500" />
                  <span>Auto-unenroll lead immediately if they reply</span>
                </label>
                <label class="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="newSequenceForm.unenrollOnMeeting" class="rounded accent-teal-500" />
                  <span>Auto-unenroll lead when meeting is scheduled</span>
                </label>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button (click)="showNewSequenceModal.set(false)" class="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button (click)="createNewSequence()" class="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20">
                <mat-icon class="text-[16px]">check</mat-icon>
                <span>Create & Configure Steps</span>
              </button>
            </div>

          </div>
        </div>
      }

      <!-- MODAL 4: Mass Enroll CRM Leads -->
      @if (showEnrollLeadsModal()) {
        <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" (click)="showEnrollLeadsModal.set(false)" (keydown.escape)="showEnrollLeadsModal.set(false)" tabindex="0" role="dialog" aria-modal="true">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
            
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div class="flex items-center gap-2">
                <mat-icon class="text-teal-400 text-[22px]">group_add</mat-icon>
                <h3 class="text-base font-bold text-white font-display">Enroll Prospects into Sequence</h3>
              </div>
              <button (click)="showEnrollLeadsModal.set(false)" class="text-zinc-500 hover:text-white" aria-label="Close modal">
                <mat-icon class="text-[20px]">close</mat-icon>
              </button>
            </div>

            <p class="text-xs text-zinc-400">
              Select leads from your CRM database to immediately enroll into <strong>{{ selectedSequence().name }}</strong>.
            </p>

            <div class="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              @for (lead of leadService.leads(); track lead.$id) {
                <label class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 cursor-pointer">
                  <div class="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      [checked]="selectedLeadsToEnroll.includes(lead.$id || '')" 
                      (change)="toggleLeadEnrollSelection(lead.$id || '')" 
                      class="rounded accent-teal-500" />
                    <div>
                      <div class="font-bold text-white text-xs">{{ lead.name }}</div>
                      <div class="text-[10px] text-zinc-400 font-mono">{{ lead.jobTitle }} &bull; {{ lead.industry }}</div>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-teal-400">
                    {{ lead.status }}
                  </span>
                </label>
              }
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-zinc-800">
              <span class="text-xs text-zinc-400 font-mono">{{ selectedLeadsToEnroll.length }} Leads Selected</span>
              <div class="flex items-center gap-2">
                <button (click)="showEnrollLeadsModal.set(false)" class="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold">
                  Cancel
                </button>
                <button (click)="executeMassEnrollment()" class="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20">
                  <mat-icon class="text-[16px]">playlist_add_check</mat-icon>
                  <span>Enroll {{ selectedLeadsToEnroll.length }} Leads</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      }

      <!-- MODAL 5: Lead Action Trigger Simulator -->
      @if (showTriggerSimulator()) {
        <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" (click)="showTriggerSimulator.set(false)" (keydown.escape)="showTriggerSimulator.set(false)" tabindex="0" role="dialog" aria-modal="true">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-5 animate-fade-in" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
            
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div class="flex items-center gap-2">
                <mat-icon class="text-teal-400 text-[22px]">bolt</mat-icon>
                <h3 class="text-base font-bold text-white font-display">Simulate Prospect Trigger Event</h3>
              </div>
              <button (click)="showTriggerSimulator.set(false)" class="text-zinc-500 hover:text-white" aria-label="Close modal">
                <mat-icon class="text-[20px]">close</mat-icon>
              </button>
            </div>

            <p class="text-xs text-zinc-400">
              Simulate an external prospect event (such as a status transition, inactivity duration, or whitepaper download) to test automated enrollment and dynamic personalized dispatch.
            </p>

            <div class="space-y-4 text-xs">
              <div>
                <label for="crmLeadSelector" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Select Target Prospect</label>
                <select id="crmLeadSelector" [(ngModel)]="simulatedLeadId" class="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-teal-500">
                  @for (lead of leadService.leads(); track lead.$id) {
                    <option [value]="lead.$id">{{ lead.name }} ({{ lead.jobTitle }} &bull; {{ lead.industry }})</option>
                  }
                </select>
              </div>

              <div>
                <label for="actionEventSelector" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Select Trigger Signal Event</label>
                <select id="actionEventSelector" [(ngModel)]="simulatedAction" class="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-teal-500">
                  <option value="resource_download">Whitepaper / Technical Blueprint Download</option>
                  <option value="webinar_attend">Live Executive Webinar Attendance</option>
                  <option value="pricing_view">High-Intent Pricing Page Visit (3+ min)</option>
                  <option value="status_qualified">Lead Status Transitions to Qualified</option>
                  <option value="inactivity_3d">3 Days Elapsed with No Email Response</option>
                  <option value="demo_request">Inbound Architecture Demo Request</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button (click)="showTriggerSimulator.set(false)" class="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button (click)="executeTriggerSimulation()" class="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20">
                <mat-icon class="text-[16px]">play_arrow</mat-icon>
                <span>Trigger & Dispatch Sequence</span>
              </button>
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
export class CadencesComponent {
  appwrite = inject(Appwrite);
  leadService = inject(LeadService);

  activeSequenceView = signal<'timeline' | 'queue'>('timeline');
  selectedSequenceId = signal<string>('seq-1');
  searchQuery = '';
  selectedTriggerFilter = signal<string>('all');

  triggerFilterTabs = [
    { id: 'all', label: 'All Triggers' },
    { id: 'lead_status', label: 'Status-Based' },
    { id: 'time_elapsed', label: 'Time / Inactivity' },
    { id: 'behavioral_action', label: 'Behavioral' },
    { id: 'score_threshold', label: 'Score 70+' }
  ];

  availableTokens: PersonalizationToken[] = [
    { tag: '{{lead.firstName}}', label: 'First Name', example: 'Jonathan', category: 'lead' },
    { tag: '{{lead.lastName}}', label: 'Last Name', example: 'Reynolds', category: 'lead' },
    { tag: '{{lead.company}}', label: 'Company Name', example: 'Nexus Financial', category: 'company' },
    { tag: '{{lead.jobTitle}}', label: 'Job Title', example: 'VP of Engineering', category: 'lead' },
    { tag: '{{lead.industry}}', label: 'Industry', example: 'FinTech', category: 'company' },
    { tag: '{{lead.dealValue}}', label: 'Deal ARR Value', example: '$280,000', category: 'lead' },
    { tag: '{{lead.city}}', label: 'City / Region', example: 'New York', category: 'company' },
    { tag: '{{lead.status}}', label: 'Lead Stage', example: 'Qualified', category: 'lead' },
    { tag: '{{rep.name}}', label: 'Assigned Sales Rep', example: 'Alex Vance', category: 'sender' },
    { tag: '{{sender.calendarLink}}', label: 'Calendar Link', example: 'https://laevos.internal/meet/alex', category: 'sender' }
  ];

  // Modals state
  editingStep = signal<SequenceStep | null>(null);
  previewStep = signal<SequenceStep | null>(null);
  showNewSequenceModal = signal<boolean>(false);
  showEnrollLeadsModal = signal<boolean>(false);
  showTriggerSimulator = signal<boolean>(false);

  selectedPreviewLeadId = signal<string>('1');
  selectedLeadsToEnroll: string[] = [];

  simulatedLeadId = '1';
  simulatedAction = 'resource_download';

  // New sequence form model
  newSequenceForm = {
    name: '',
    category: 'Inbound' as AutomatedSequence['category'],
    triggerType: 'lead_status' as SequenceTrigger['type'],
    triggerStatus: 'Qualified',
    triggerElapsedDays: 3,
    targetAudience: '',
    unenrollOnReply: true,
    unenrollOnMeeting: true
  };

  sequences = signal<AutomatedSequence[]>([
    {
      id: 'seq-1',
      name: 'Resource Download Post-Intent Sequence',
      description: 'Multi-step nurture triggered immediately when a prospect downloads a technical architecture blueprint or security whitepaper.',
      category: 'Inbound',
      trigger: {
        type: 'behavioral_action',
        label: 'Downloaded Whitepaper / Architecture Blueprint',
        actionEvent: 'resource_download'
      },
      unenrollOnReply: true,
      unenrollOnMeeting: true,
      targetAudience: 'Architects & VPs of Engineering',
      status: 'Active',
      enrolledCount: 412,
      completedCount: 284,
      avgOpenRate: 68,
      avgCtr: 24,
      avgReplyRate: 14,
      conversions: 32,
      enrolledLeads: [
        {
          id: 'enl-1',
          leadId: '1',
          leadName: 'Jonathan Reynolds',
          leadEmail: 'j.reynolds@nexusfinancial.io',
          leadCompany: 'Nexus Financial',
          leadTitle: 'VP of Engineering',
          enrolledAt: '2026-08-28',
          currentStepNumber: 2,
          totalSteps: 3,
          nextSendDate: 'Tomorrow at 10:00 AM',
          status: 'Active'
        },
        {
          id: 'enl-2',
          leadId: '2',
          leadName: 'Elena Rostova',
          leadEmail: 'e.rostova@hyperioncloud.com',
          leadCompany: 'Hyperion Cloud',
          leadTitle: 'Chief Technology Officer',
          enrolledAt: '2026-08-30',
          currentStepNumber: 1,
          totalSteps: 3,
          nextSendDate: 'Sent (Awaiting Day 2 Delay)',
          status: 'Active'
        }
      ],
      steps: [
        {
          id: 's-101',
          stepNumber: 1,
          title: 'Direct Asset Delivery & Context',
          delayValue: 0,
          delayUnit: 'hours',
          channel: 'Email',
          isAbTest: true,
          splitPctA: 50,
          condition: 'none',
          active: true,
          variantA: {
            id: 'A',
            name: 'Direct Asset Delivery & Context',
            subject: 'Here is your Cloud Security & Telemetry Architecture Blueprint for {{lead.company}}',
            body: `Hi {{lead.firstName}},\n\nThank you for requesting our 2026 Cloud Security & Telemetry Blueprint for {{lead.company}}.\n\nHere is your direct access link: https://laevos.internal/docs/security-blueprint-v4.pdf\n\nMost engineering leaders in {{lead.industry}} reviewing this are particularly focused on Section 3 regarding Zero-Trust Multi-Tenancy.\n\nBest,\n{{rep.name}}\n{{rep.title}}`,
            sends: 206,
            opens: 148,
            clicks: 58,
            replies: 24,
            openRatePct: 71,
            ctrPct: 28,
            replyRatePct: 12
          },
          variantB: {
            id: 'B',
            name: 'Personal Question from Lead Architect',
            subject: 'Quick note regarding the telemetry blueprint you downloaded',
            body: `Hi {{lead.firstName}},\n\nI saw you just grabbed our Telemetry Blueprint for {{lead.company}}. Before you dive in, are you currently evaluating latency reduction or multi-tenant compliance?\n\nIf helpful, I can send over our specific benchmark comparisons with your current stack.\n\nBest,\n{{rep.name}}`,
            sends: 206,
            opens: 132,
            clicks: 42,
            replies: 34,
            openRatePct: 64,
            ctrPct: 20,
            replyRatePct: 16
          }
        },
        {
          id: 's-102',
          stepNumber: 2,
          title: 'Case Study Proof & Metric Validation',
          delayValue: 2,
          delayUnit: 'days',
          channel: 'Email',
          isAbTest: true,
          splitPctA: 50,
          condition: 'if_unreplied',
          active: true,
          variantA: {
            id: 'A',
            name: 'Case Study Proof: 300% Ingest Speed',
            subject: 'How FinTech Core cut API telemetry latency by 82%',
            body: `Hey {{lead.firstName}},\n\nFollowing up on the blueprint from Tuesday. Here is a 3-minute case study detailing how FinTech Core handled 100M+ daily events with 0 database bottlenecks.\n\nRead case study: https://laevos.internal/case-studies/fintech-core\n\nWould you have 10 minutes next Wednesday to review how this applies to {{lead.company}}?`,
            sends: 180,
            opens: 118,
            clicks: 44,
            replies: 22,
            openRatePct: 65,
            ctrPct: 24,
            replyRatePct: 12
          },
          variantB: {
            id: 'B',
            name: 'Interactive Calculator Invite',
            subject: 'Calculate {{lead.company}} infrastructure savings in 60 seconds',
            body: `Hi {{lead.firstName}},\n\nWe put together an interactive sizing model based on the telemetry architecture blueprint.\n\nEnter your projected Q4 ingestion rates to see immediate monthly savings: https://laevos.internal/calculator\n\nLet me know your thoughts!`,
            sends: 180,
            opens: 126,
            clicks: 62,
            replies: 28,
            openRatePct: 70,
            ctrPct: 34,
            replyRatePct: 15
          }
        },
        {
          id: 's-103',
          stepNumber: 3,
          title: 'Direct Executive Meeting Invite',
          delayValue: 4,
          delayUnit: 'days',
          channel: 'Email',
          isAbTest: false,
          splitPctA: 100,
          condition: 'if_unreplied',
          active: true,
          variantA: {
            id: 'A',
            name: 'Architecture Roadmap Consultation',
            subject: '15-minute architecture discussion for {{lead.company}}?',
            body: `Hi {{lead.firstName}},\n\nI want to make sure I don't flood your inbox. If you are exploring upgrades to your telemetry pipelines for {{lead.company}}, I'd love to share our private benchmark suite.\n\nGrab 15 minutes here: {{sender.calendarLink}}\n\nIf not the right timing, feel free to reply and I'll pause outreach!\n\nBest,\n{{rep.name}}`,
            sends: 140,
            opens: 94,
            clicks: 38,
            replies: 20,
            openRatePct: 67,
            ctrPct: 27,
            replyRatePct: 14
          }
        }
      ]
    },
    {
      id: 'seq-2',
      name: 'Status: Qualified Opportunity Fast-Track',
      description: 'Triggered automatically when a lead status transitions to Qualified (SQL stage) to accelerate pipeline velocity.',
      category: 'Inbound',
      trigger: {
        type: 'lead_status',
        label: 'Status Transitions to "Qualified"',
        statusCondition: 'Qualified'
      },
      unenrollOnReply: true,
      unenrollOnMeeting: true,
      targetAudience: 'Qualified Enterprise Pipeline Opportunities',
      status: 'Active',
      enrolledCount: 195,
      completedCount: 142,
      avgOpenRate: 78,
      avgCtr: 36,
      avgReplyRate: 26,
      conversions: 38,
      enrolledLeads: [
        {
          id: 'enl-3',
          leadId: '3',
          leadName: 'Marcus Vance',
          leadEmail: 'm.vance@apexlogistics.net',
          leadCompany: 'Apex Logistics',
          leadTitle: 'VP of Global Logistics',
          enrolledAt: '2026-08-29',
          currentStepNumber: 1,
          totalSteps: 2,
          nextSendDate: 'Today at 2:00 PM',
          status: 'Active'
        }
      ],
      steps: [
        {
          id: 's-201',
          stepNumber: 1,
          title: 'Technical Scope & NDA Execution',
          delayValue: 1,
          delayUnit: 'hours',
          channel: 'Email',
          isAbTest: false,
          splitPctA: 100,
          condition: 'none',
          active: true,
          variantA: {
            id: 'A',
            name: 'Scope Confirmation',
            subject: 'Next steps on {{lead.company}} architecture evaluation (${{lead.dealValue}})',
            body: `Hi {{lead.firstName}},\n\nGreat connecting with your team. Following up on your qualification notes, here is the enterprise scoping doc prepared for {{lead.company}}:\n\nhttps://laevos.internal/deals/scoping-doc\n\nLet me know if you would like me to route our standard mutual NDA before Friday's deep dive.\n\nBest,\n{{rep.name}}`,
            sends: 195,
            opens: 152,
            clicks: 70,
            replies: 50,
            openRatePct: 78,
            ctrPct: 36,
            replyRatePct: 26
          }
        },
        {
          id: 's-202',
          stepNumber: 2,
          title: 'Executive Sponsor Introduction',
          delayValue: 3,
          delayUnit: 'days',
          channel: 'Email',
          isAbTest: true,
          splitPctA: 50,
          condition: 'if_unreplied',
          active: true,
          variantA: {
            id: 'A',
            name: 'Principal Engineer Introduction',
            subject: 'Introducing our Principal Architect for {{lead.company}}',
            body: `Hi {{lead.firstName}},\n\nWanted to introduce you to Sarah from our Principal Systems team who oversees {{lead.industry}} deployments.\n\nShe reviewed your projected data scale and has pre-configured a sandbox instance.\n\nPick a time to meet Sarah here: {{sender.calendarLink}}`,
            sends: 90,
            opens: 72,
            clicks: 34,
            replies: 26,
            openRatePct: 80,
            ctrPct: 37,
            replyRatePct: 28
          },
          variantB: {
            id: 'B',
            name: 'Pre-Populated Sandbox Access',
            subject: 'Your private sandbox instance is provisioned',
            body: `Hi {{lead.firstName}},\n\nYour custom test cluster for {{lead.company}} is live with sample {{lead.industry}} schemas pre-loaded.\n\nLog in here: https://laevos.internal/sandbox/{{lead.company}}\n\nLet me know if you'd like a quick walkthrough!`,
            sends: 90,
            opens: 68,
            clicks: 40,
            replies: 24,
            openRatePct: 75,
            ctrPct: 44,
            replyRatePct: 26
          }
        }
      ]
    },
    {
      id: 'seq-3',
      name: 'Stale Lead / Inactivity Re-engagement',
      description: 'Triggered after 5 days of lead inactivity without an email reply to rekindle deal momentum.',
      category: 'Re-engagement',
      trigger: {
        type: 'time_elapsed',
        label: '5 Days Elapsed with 0 Prospect Replies',
        elapsedDays: 5
      },
      unenrollOnReply: true,
      unenrollOnMeeting: true,
      targetAudience: 'Unresponsive or Stalled Pipeline Leads',
      status: 'Active',
      enrolledCount: 120,
      completedCount: 92,
      avgOpenRate: 64,
      avgCtr: 22,
      avgReplyRate: 18,
      conversions: 16,
      enrolledLeads: [],
      steps: [
        {
          id: 's-301',
          stepNumber: 1,
          title: 'Permission to Close Out Project File',
          delayValue: 0,
          delayUnit: 'hours',
          channel: 'Email',
          isAbTest: true,
          splitPctA: 50,
          condition: 'none',
          active: true,
          variantA: {
            id: 'A',
            name: 'Permission to Close File',
            subject: 'Permission to close your file for {{lead.company}}?',
            body: `Hi {{lead.firstName}},\n\nI haven't heard back, so I assume priorities have shifted at {{lead.company}} or you found another solution.\n\nShould I go ahead and close out your evaluation file for now, or is this still on your radar for Q4?\n\nThanks,\n{{rep.name}}`,
            sends: 60,
            opens: 44,
            clicks: 14,
            replies: 16,
            openRatePct: 73,
            ctrPct: 23,
            replyRatePct: 26
          },
          variantB: {
            id: 'B',
            name: 'New Product Benchmark Release',
            subject: 'New Q3 benchmarks for {{lead.industry}} teams',
            body: `Hi {{lead.firstName}},\n\nWe just released our updated benchmarks for {{lead.industry}} workloads.\n\nBefore I close our thread, wanted to send the summary over: https://laevos.internal/benchmarks-q3\n\nHope this is helpful!\n\nBest,\n{{rep.name}}`,
            sends: 60,
            opens: 33,
            clicks: 12,
            replies: 6,
            openRatePct: 55,
            ctrPct: 20,
            replyRatePct: 10
          }
        }
      ]
    }
  ]);

  selectedSequence = computed(() => {
    return this.sequences().find(s => s.id === this.selectedSequenceId()) || this.sequences()[0];
  });

  filteredSequences = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    const filter = this.selectedTriggerFilter();

    return this.sequences().filter(s => {
      const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.trigger.label.toLowerCase().includes(q);
      const matchesTrigger = filter === 'all' || s.trigger.type === filter;
      return matchesQuery && matchesTrigger;
    });
  });

  activeSequences = computed(() => {
    return this.sequences().filter(s => s.status === 'Active');
  });

  totalEnrolledLeads = computed(() => {
    return this.sequences().reduce((sum, s) => sum + s.enrolledCount, 0);
  });

  overallAvgOpenRate = computed(() => {
    const list = this.activeSequences();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, s) => sum + s.avgOpenRate, 0) / list.length);
  });

  overallAvgCtr = computed(() => {
    const list = this.activeSequences();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, s) => sum + s.avgCtr, 0) / list.length);
  });

  totalConversions = computed(() => {
    return this.sequences().reduce((sum, s) => sum + s.conversions, 0);
  });

  selectedPreviewLead = computed(() => {
    return this.leadService.leads().find(l => l.$id === this.selectedPreviewLeadId()) || this.leadService.leads()[0];
  });

  getTriggerIcon(type: SequenceTrigger['type']): string {
    switch (type) {
      case 'lead_status': return 'flag';
      case 'time_elapsed': return 'hourglass_top';
      case 'behavioral_action': return 'bolt';
      case 'score_threshold': return 'psychology';
      default: return 'person_add';
    }
  }

  getChannelIcon(channel: SequenceStep['channel']): string {
    switch (channel) {
      case 'Email': return 'mail';
      case 'LinkedIn': return 'share';
      case 'SMS': return 'sms';
      default: return 'task_alt';
    }
  }

  getTriggerSummary(t: SequenceTrigger): string {
    switch (t.type) {
      case 'lead_status': return `On status change to "${t.statusCondition || 'Qualified'}"`;
      case 'time_elapsed': return `After ${t.elapsedDays || 3} days of inactivity`;
      case 'behavioral_action': return `On prospect signal: ${t.actionEvent || 'resource_download'}`;
      case 'score_threshold': return `When AI Lead Score reaches ${t.scoreThreshold || 75}+ pts`;
      default: return 'Manual or Batch Lead Enrollment';
    }
  }

  getEnrolledStatusClass(status: EnrolledLead['status']): string {
    switch (status) {
      case 'Active': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Completed': return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'Replied & Exited': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  }

  countAbTests(seq: AutomatedSequence): number {
    return seq.steps.filter(s => s.isAbTest).length;
  }

  renderTokens(template: string, lead: Lead | undefined): string {
    if (!lead || !template) return template || '';
    const firstName = lead.name ? lead.name.split(' ')[0] : 'there';
    const lastName = lead.name && lead.name.split(' ').length > 1 ? lead.name.split(' ').slice(1).join(' ') : '';
    const company = lead.industry ? `${lead.name.split(' ')[0]} Enterprise` : 'your organization';
    const jobTitle = lead.jobTitle || 'Executive Lead';
    const industry = lead.industry || 'Technology';
    const dealValue = lead.value ? lead.value.toLocaleString() : '100,000';
    const city = lead.region || 'Global';
    const status = lead.status || 'Qualified';
    const score = lead.score ? `${lead.score} pts` : '85 pts';
    const repName = 'Alex Vance';
    const repEmail = 'alex.vance@laevos.internal';
    const repTitle = 'Senior Solutions Architect';
    const calendarLink = 'https://laevos.internal/meet/alex';

    return template
      .replace(/\{\{lead\.firstName\}\}/g, firstName)
      .replace(/\{\{contact\.firstName\}\}/g, firstName)
      .replace(/\{\{lead\.lastName\}\}/g, lastName)
      .replace(/\{\{contact\.lastName\}\}/g, lastName)
      .replace(/\{\{lead\.company\}\}/g, company)
      .replace(/\{\{company\.name\}\}/g, company)
      .replace(/\{\{lead\.jobTitle\}\}/g, jobTitle)
      .replace(/\{\{contact\.jobTitle\}\}/g, jobTitle)
      .replace(/\{\{lead\.industry\}\}/g, industry)
      .replace(/\{\{lead\.dealValue\}\}/g, dealValue)
      .replace(/\{\{lead\.city\}\}/g, city)
      .replace(/\{\{lead\.status\}\}/g, status)
      .replace(/\{\{lead\.score\}\}/g, score)
      .replace(/\{\{rep\.name\}\}/g, repName)
      .replace(/\{\{rep\.email\}\}/g, repEmail)
      .replace(/\{\{rep\.title\}\}/g, repTitle)
      .replace(/\{\{sender\.calendarLink\}\}/g, calendarLink);
  }

  insertTokenIntoActiveField(tokenTag: string) {
    const step = this.editingStep();
    if (!step) return;
    step.variantA.body += (step.variantA.body ? ' ' : '') + tokenTag;
  }

  toggleSequenceStatus(seq: AutomatedSequence) {
    seq.status = seq.status === 'Active' ? 'Paused' : 'Active';
    this.sequences.update(list => [...list]);
    this.appwrite.addNotification({
      title: 'Sequence Status Updated',
      message: `Sequence "${seq.name}" is now ${seq.status}.`,
      type: 'info'
    });
  }

  toggleStepAbTest(step: SequenceStep) {
    step.isAbTest = !step.isAbTest;
    if (step.isAbTest && !step.variantB) {
      step.variantB = {
        id: 'B',
        name: 'Variant B (Alternative Hook)',
        subject: `Alternative: ${step.variantA.subject}`,
        body: `Hi {{lead.firstName}},\n\n[Alternative phrasing tailored to test different value hooks]...`,
        sends: 0,
        opens: 0,
        clicks: 0,
        replies: 0,
        openRatePct: 0,
        ctrPct: 0,
        replyRatePct: 0
      };
    }
    this.sequences.update(list => [...list]);
  }

  openEditStepModal(seq: AutomatedSequence, step: SequenceStep) {
    this.editingStep.set(step);
  }

  saveStepEdits() {
    this.sequences.update(list => [...list]);
    this.editingStep.set(null);
    this.appwrite.addNotification({
      title: 'Step Saved',
      message: 'Sequence step template and schedule updated successfully.',
      type: 'success'
    });
  }

  openLivePreviewModal(step: SequenceStep) {
    this.previewStep.set(step);
  }

  openAddStepModal(seq: AutomatedSequence) {
    const nextNum = seq.steps.length + 1;
    const lastDelay = seq.steps.length ? seq.steps[seq.steps.length - 1].delayValue : 0;

    const newStep: SequenceStep = {
      id: 's-' + Date.now(),
      stepNumber: nextNum,
      title: `Step #${nextNum} Follow-Up Outreach`,
      delayValue: lastDelay + 3,
      delayUnit: 'days',
      channel: 'Email',
      isAbTest: false,
      splitPctA: 100,
      condition: 'if_unreplied',
      active: true,
      variantA: {
        id: 'A',
        name: `Step ${nextNum} Touchpoint`,
        subject: `Checking in regarding {{lead.company}} goals`,
        body: `Hi {{lead.firstName}},\n\nTouching base following up on our previous note. Are you still evaluating options for {{lead.company}}?\n\nBest,\n{{rep.name}}`,
        sends: 0,
        opens: 0,
        clicks: 0,
        replies: 0,
        openRatePct: 0,
        ctrPct: 0,
        replyRatePct: 0
      }
    };

    seq.steps.push(newStep);
    this.sequences.update(list => [...list]);
    this.editingStep.set(newStep);
  }

  deleteStep(seq: AutomatedSequence, step: SequenceStep) {
    seq.steps = seq.steps.filter(s => s.id !== step.id);
    seq.steps.forEach((s, idx) => s.stepNumber = idx + 1);
    this.sequences.update(list => [...list]);
    this.appwrite.addNotification({
      title: 'Step Removed',
      message: `Step removed and subsequent step numbers re-indexed.`,
      type: 'info'
    });
  }

  openNewSequenceModal() {
    this.newSequenceForm = {
      name: '',
      category: 'Inbound',
      triggerType: 'lead_status',
      triggerStatus: 'Qualified',
      triggerElapsedDays: 3,
      targetAudience: 'Enterprise Engineering Decision Makers',
      unenrollOnReply: true,
      unenrollOnMeeting: true
    };
    this.showNewSequenceModal.set(true);
  }

  createNewSequence() {
    if (!this.newSequenceForm.name.trim()) {
      this.newSequenceForm.name = 'New Automated Outreach Sequence';
    }

    let triggerLabel = 'Manual Rep Enrollment';
    if (this.newSequenceForm.triggerType === 'lead_status') {
      triggerLabel = `Status Transitions to "${this.newSequenceForm.triggerStatus}"`;
    } else if (this.newSequenceForm.triggerType === 'time_elapsed') {
      triggerLabel = `${this.newSequenceForm.triggerElapsedDays} Days Elapsed without Response`;
    }

    const newSeq: AutomatedSequence = {
      id: 'seq-' + Date.now(),
      name: this.newSequenceForm.name,
      description: `Automated sequence triggered via ${triggerLabel} with dynamic token personalization.`,
      category: this.newSequenceForm.category,
      trigger: {
        type: this.newSequenceForm.triggerType,
        label: triggerLabel,
        statusCondition: this.newSequenceForm.triggerStatus,
        elapsedDays: this.newSequenceForm.triggerElapsedDays
      },
      unenrollOnReply: this.newSequenceForm.unenrollOnReply,
      unenrollOnMeeting: this.newSequenceForm.unenrollOnMeeting,
      targetAudience: this.newSequenceForm.targetAudience || 'General CRM Pipeline',
      status: 'Active',
      enrolledCount: 0,
      completedCount: 0,
      avgOpenRate: 0,
      avgCtr: 0,
      avgReplyRate: 0,
      conversions: 0,
      enrolledLeads: [],
      steps: [
        {
          id: 's-' + Date.now(),
          stepNumber: 1,
          title: 'Initial Personalized Touchpoint',
          delayValue: 0,
          delayUnit: 'hours',
          channel: 'Email',
          isAbTest: false,
          splitPctA: 100,
          condition: 'none',
          active: true,
          variantA: {
            id: 'A',
            name: 'Initial Value Introduction',
            subject: 'Exploring technical scale for {{lead.company}}',
            body: `Hi {{lead.firstName}},\n\nWanted to reach out to see how {{lead.company}} is managing real-time data pipelines in {{lead.industry}}.\n\nDo you have 10 minutes for a brief introduction next week?\n\nBest,\n{{rep.name}}`,
            sends: 0,
            opens: 0,
            clicks: 0,
            replies: 0,
            openRatePct: 0,
            ctrPct: 0,
            replyRatePct: 0
          }
        }
      ]
    };

    this.sequences.update(list => [newSeq, ...list]);
    this.selectedSequenceId.set(newSeq.id);
    this.showNewSequenceModal.set(false);
    this.appwrite.addNotification({
      title: 'Sequence Created',
      message: `"${newSeq.name}" has been created and set to Active.`,
      type: 'success'
    });
  }

  openEnrollLeadsModal() {
    this.selectedLeadsToEnroll = [];
    this.showEnrollLeadsModal.set(true);
  }

  toggleLeadEnrollSelection(id: string) {
    if (this.selectedLeadsToEnroll.includes(id)) {
      this.selectedLeadsToEnroll = this.selectedLeadsToEnroll.filter(i => i !== id);
    } else {
      this.selectedLeadsToEnroll.push(id);
    }
  }

  executeMassEnrollment() {
    const seq = this.selectedSequence();
    const allLeads = this.leadService.leads();

    this.selectedLeadsToEnroll.forEach(leadId => {
      const lead = allLeads.find(l => l.$id === leadId);
      if (lead) {
        seq.enrolledLeads.unshift({
          id: 'enl-' + Date.now() + '-' + Math.random().toString(36).substring(7),
          leadId: lead.$id || '',
          leadName: lead.name,
          leadEmail: lead.email,
          leadCompany: lead.industry ? `${lead.name.split(' ')[0]} Corp` : 'Enterprise',
          leadTitle: lead.jobTitle || 'Executive Lead',
          enrolledAt: new Date().toISOString().split('T')[0],
          currentStepNumber: 1,
          totalSteps: seq.steps.length,
          nextSendDate: 'Today (Immediate)',
          status: 'Active'
        });
        seq.enrolledCount += 1;
      }
    });

    this.sequences.update(list => [...list]);
    this.showEnrollLeadsModal.set(false);
    this.appwrite.addNotification({
      title: 'Leads Enrolled',
      message: `Enrolled ${this.selectedLeadsToEnroll.length} prospects into "${seq.name}". Step #1 queued for dispatch.`,
      type: 'success'
    });
  }

  advanceLeadStep(seq: AutomatedSequence, enrolled: EnrolledLead) {
    if (enrolled.currentStepNumber < enrolled.totalSteps) {
      enrolled.currentStepNumber += 1;
      enrolled.nextSendDate = `In ${seq.steps[enrolled.currentStepNumber - 1]?.delayValue || 2} ${seq.steps[enrolled.currentStepNumber - 1]?.delayUnit || 'days'}`;
      this.appwrite.addNotification({
        title: 'Step Dispatched',
        message: `Advanced ${enrolled.leadName} to Step #${enrolled.currentStepNumber} of "${seq.name}".`,
        type: 'info'
      });
    } else {
      enrolled.status = 'Completed';
      seq.completedCount += 1;
      this.appwrite.addNotification({
        title: 'Sequence Completed',
        message: `${enrolled.leadName} has finished all steps of "${seq.name}".`,
        type: 'success'
      });
    }
    this.sequences.update(list => [...list]);
  }

  unenrollLead(seq: AutomatedSequence, enrolled: EnrolledLead) {
    seq.enrolledLeads = seq.enrolledLeads.filter(e => e.id !== enrolled.id);
    this.sequences.update(list => [...list]);
    this.appwrite.addNotification({
      title: 'Lead Unenrolled',
      message: `Removed ${enrolled.leadName} from "${seq.name}".`,
      type: 'info'
    });
  }

  async executeTriggerSimulation() {
    const targetLead = this.leadService.leads().find(l => l.$id === this.simulatedLeadId) || this.leadService.leads()[0];
    const seq = this.selectedSequence();

    if (targetLead && targetLead.$id) {
      // Record in scoring engine
      await this.leadService.recordLeadActivity(
        targetLead.$id,
        'resource_download',
        `Triggered Automated Sequence: ${seq.name} (${this.simulatedAction})`,
        18
      );

      // Increment sequence enrollment
      seq.enrolledCount += 1;
      seq.enrolledLeads.unshift({
        id: 'enl-sim-' + Date.now(),
        leadId: targetLead.$id,
        leadName: targetLead.name,
        leadEmail: targetLead.email,
        leadCompany: targetLead.industry ? `${targetLead.name.split(' ')[0]} Corp` : 'Enterprise Partner',
        leadTitle: targetLead.jobTitle || 'Executive Lead',
        enrolledAt: new Date().toISOString().split('T')[0],
        currentStepNumber: 1,
        totalSteps: seq.steps.length,
        nextSendDate: 'Today (Step 1 Dispatched)',
        status: 'Active'
      });

      if (seq.steps[0]) {
        seq.steps[0].variantA.sends += 1;
        seq.steps[0].variantA.opens += 1;
        seq.steps[0].variantA.clicks += 1;
      }
      this.sequences.update(list => [...list]);

      this.appwrite.addNotification({
        title: 'Trigger Executed & Email Dispatched',
        message: `Prospect ${targetLead.name} triggered "${this.simulatedAction}". Enrolled into Step 1 of "${seq.name}" with evaluated dynamic tokens.`,
        type: 'success'
      });

      this.showTriggerSimulator.set(false);
    }
  }
}
