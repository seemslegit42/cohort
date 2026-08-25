import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';
import { LeadService, LeadActivityEvent } from './lead.service';

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

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  delayHours: number;
  channel: 'Email' | 'LinkedIn' | 'SMS' | 'Task';
  isAbTest: boolean;
  variantA: EmailVariant;
  variantB?: EmailVariant;
  splitPctA: number; // e.g. 50%
  active: boolean;
}

export interface AutomatedWorkflow {
  id: string;
  name: string;
  triggerAction: 'resource_download' | 'webinar_attend' | 'pricing_view' | 'demo_request' | 'score_threshold' | 'manual';
  triggerLabel: string;
  status: 'Active' | 'Paused' | 'Draft';
  targetAudience: string;
  totalEnrolled: number;
  avgOpenRate: number;
  avgCtr: number;
  avgReplyRate: number;
  conversions: number;
  steps: WorkflowStep[];
}

@Component({
  selector: 'app-cadences',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="h-full flex flex-col p-3 sm:p-5 md:p-6 animate-fade-in max-w-[1600px] mx-auto space-y-6">
      
      <!-- Header -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center text-zinc-950 shadow-[0_0_20px_rgba(20,184,166,0.25)] font-bold">
              <mat-icon class="text-[22px]">alt_route</mat-icon>
            </div>
            <div>
              <h1 class="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Automated Email Workflows & A/B Engine</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 font-mono font-normal">Action-Triggered</span>
              </h1>
              <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Automated multi-step outreach sequences triggered by prospect behavioral signals with built-in A/B subject & content split testing.
              </p>
            </div>
          </div>
        </div>

        <!-- Header Actions -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <button 
            type="button"
            (click)="showTriggerSimulator.set(true)" 
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px] text-teal-400">bolt</mat-icon>
            <span>Simulate Lead Action Trigger</span>
          </button>

          <button 
            type="button"
            (click)="openNewWorkflowModal()" 
            class="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer active:scale-95 transition-all">
            <mat-icon class="text-[16px]">add_circle</mat-icon>
            <span>Create Workflow Sequence</span>
          </button>
        </div>
      </header>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Active Workflows</span>
            <mat-icon class="text-cyan-400 text-[18px]">account_tree</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ activeWorkflows().length }} <span class="text-xs text-zinc-500 font-sans font-normal">/ {{ workflows().length }} Total</span></div>
          <div class="text-[11px] text-cyan-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">play_circle</mat-icon> {{ totalEnrolled() }} Prospects in Queue
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span class="font-bold uppercase tracking-wider text-[10px]">Avg Sequence Open Rate</span>
            <mat-icon class="text-teal-400 text-[18px]">mark_email_read</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ overallAvgOpenRate() }}%</div>
          <div class="text-[11px] text-teal-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">trending_up</mat-icon> +18.4% with A/B Optimized Content
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
            <mat-icon class="text-[14px]">monetization_on</mat-icon> \${{ (totalConversions() * 38500).toLocaleString() }} Pipeline Attributed
          </div>
        </div>
      </div>

      <!-- Main Two-Column Workflow Workspace -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        <!-- Left Column: Workflow Selector List (4 cols) -->
        <div class="xl:col-span-4 space-y-3">
          <div class="flex items-center justify-between px-1">
            <h2 class="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Automated Triggers</h2>
            <span class="text-[11px] text-zinc-500 font-mono">{{ workflows().length }} Workflows</span>
          </div>

          <div class="space-y-2.5 max-h-[720px] overflow-y-auto pr-1 custom-scrollbar">
            @for (wf of workflows(); track wf.id) {
              <div 
                (click)="selectedWorkflowId.set(wf.id)"
                (keydown.enter)="selectedWorkflowId.set(wf.id)"
                tabindex="0"
                role="button"
                [class]="selectedWorkflowId() === wf.id ? 'bg-[#0b1d20] border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.15)]' : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80'"
                class="p-4 rounded-2xl border transition-all cursor-pointer text-left group">
                
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span [class]="wf.status === 'Active' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'" class="w-2 h-2 rounded-full"></span>
                      <h3 class="text-sm font-bold text-white group-hover:text-teal-300 transition-colors truncate font-display">{{ wf.name }}</h3>
                    </div>
                    <div class="flex items-center gap-1.5 mt-1">
                      <mat-icon class="text-[13px] text-teal-400">bolt</mat-icon>
                      <span class="text-[11px] text-teal-300 font-medium truncate">{{ wf.triggerLabel }}</span>
                    </div>
                  </div>
                  <span [class]="wf.status === 'Active' ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'" class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0">
                    {{ wf.status }}
                  </span>
                </div>

                <div class="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-zinc-800/60 text-[11px]">
                  <div>
                    <span class="text-zinc-500 block text-[10px]">Enrolled</span>
                    <span class="font-bold text-zinc-200 font-mono">{{ wf.totalEnrolled }}</span>
                  </div>
                  <div>
                    <span class="text-zinc-500 block text-[10px]">Open / CTR</span>
                    <span class="font-bold text-teal-400 font-mono">{{ wf.avgOpenRate }}% / {{ wf.avgCtr }}%</span>
                  </div>
                  <div>
                    <span class="text-zinc-500 block text-[10px]">Converted</span>
                    <span class="font-bold text-purple-400 font-mono">{{ wf.conversions }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Right Column: Workflow Steps & A/B Testing Studio (8 cols) -->
        @if (selectedWorkflow(); as wf) {
          <div class="xl:col-span-8 space-y-6">
            
            <!-- Workflow Header Banner -->
            <div class="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-xl relative backdrop-blur-2xl">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                      {{ wf.steps.length }}-Step Automated Workflow
                    </span>
                    <span class="text-zinc-400 text-xs font-mono flex items-center gap-1">
                      <mat-icon class="text-[14px] text-amber-400">psychology</mat-icon> Trigger: {{ wf.triggerLabel }}
                    </span>
                  </div>
                  <h2 class="text-xl sm:text-2xl font-bold text-white font-display">{{ wf.name }}</h2>
                  <p class="text-xs sm:text-sm text-zinc-400 mt-1">Audience Segment: <span class="text-zinc-200 font-medium">{{ wf.targetAudience }}</span></p>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                  <button 
                    type="button"
                    (click)="toggleWorkflowStatus(wf)" 
                    [class]="wf.status === 'Active' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'"
                    class="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer">
                    <mat-icon class="text-[16px]">{{ wf.status === 'Active' ? 'pause' : 'play_arrow' }}</mat-icon>
                    <span>{{ wf.status === 'Active' ? 'Pause Workflow' : 'Activate Workflow' }}</span>
                  </button>
                  
                  <button 
                    type="button"
                    (click)="openAddStepModal(wf)" 
                    class="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer">
                    <mat-icon class="text-[16px]">add_circle</mat-icon>
                    <span>Add Sequence Step</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Steps Visual Sequence with A/B Testing Cards -->
            <div class="space-y-4">
              <div class="flex items-center justify-between px-1">
                <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Workflow Steps & A/B Split Telemetry</h3>
                <span class="text-xs text-teal-400 font-mono font-semibold">{{ countAbTests(wf) }} Steps with Active A/B Split</span>
              </div>

              @for (step of wf.steps; track step.id; let idx = $index) {
                <div class="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 relative hover:border-zinc-700 transition-all space-y-4">
                  
                  <!-- Step Top Bar -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xs font-bold text-teal-400 font-mono">
                        #{{ step.stepNumber }}
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                            <mat-icon class="text-[12px]">mail</mat-icon>
                            <span>{{ step.channel }}</span>
                          </span>
                          <span class="text-xs text-zinc-400 font-mono">
                            {{ step.delayHours === 0 ? 'Immediately upon trigger' : 'Send after +' + step.delayHours + ' hours' }}
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
                        (click)="toggleStepAbTest(step)"
                        [class]="step.isAbTest ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' : 'text-zinc-400 bg-zinc-800 border-zinc-700'"
                        class="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all">
                        <mat-icon class="text-[14px]">flaky</mat-icon>
                        {{ step.isAbTest ? 'Disable A/B' : 'Enable A/B Test' }}
                      </button>
                    </div>
                  </div>

                  <!-- A/B Comparison Cards -->
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
                        <div class="text-zinc-300 font-medium text-[11px] bg-zinc-900/80 px-2.5 py-1 rounded border border-zinc-800 truncate">
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
                          <div class="text-zinc-300 font-medium text-[11px] bg-zinc-900/80 px-2.5 py-1 rounded border border-zinc-800 truncate">
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

          </div>
        }

      </div>

      <!-- Lead Action Trigger Simulation Modal -->
      @if (showTriggerSimulator()) {
        <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" (click)="showTriggerSimulator.set(false)" (keydown.escape)="showTriggerSimulator.set(false)" tabindex="0" role="dialog" aria-modal="true">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-5 animate-fade-in" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="0">
            
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div class="flex items-center gap-2">
                <mat-icon class="text-teal-400 text-[22px]">bolt</mat-icon>
                <h3 class="text-base font-bold text-white font-display">Simulate Prospect Action Trigger</h3>
              </div>
              <button (click)="showTriggerSimulator.set(false)" class="text-zinc-500 hover:text-white" aria-label="Close modal">
                <mat-icon class="text-[20px]">close</mat-icon>
              </button>
            </div>

            <p class="text-xs text-zinc-400">
              Simulate an external prospect behavioral action (such as downloading a technical whitepaper, attending a webinar, or visiting pricing) to test immediate workflow enrollment and A/B dispatch.
            </p>

            <div class="space-y-4 text-xs">
              <div>
                <label for="crmLeadSelector" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Select CRM Prospect</label>
                <select id="crmLeadSelector" [(ngModel)]="simulatedLeadId" class="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-teal-500">
                  @for (lead of leadService.leads(); track lead.$id) {
                    <option [value]="lead.$id">{{ lead.name }} ({{ lead.jobTitle }} &bull; {{ lead.industry }})</option>
                  }
                </select>
              </div>

              <div>
                <label for="actionEventSelector" class="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Select Action Event</label>
                <select id="actionEventSelector" [(ngModel)]="simulatedAction" class="w-full py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-teal-500">
                  <option value="resource_download">Whitepaper / Technical Resource Download</option>
                  <option value="webinar_attend">Live Executive Webinar Attendance</option>
                  <option value="pricing_view">High-Intent Pricing Page Visit (3+ minutes)</option>
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

  selectedWorkflowId = signal<string>('wf-1');
  showTriggerSimulator = signal<boolean>(false);
  simulatedLeadId = '';
  simulatedAction = 'resource_download';

  workflows = signal<AutomatedWorkflow[]>([
    {
      id: 'wf-1',
      name: 'Resource Download Post-Intent Sequence',
      triggerAction: 'resource_download',
      triggerLabel: 'Downloaded Whitepaper / Architecture Blueprint',
      status: 'Active',
      targetAudience: 'Architects & VPs of Engineering',
      totalEnrolled: 412,
      avgOpenRate: 68,
      avgCtr: 24,
      avgReplyRate: 14,
      conversions: 32,
      steps: [
        {
          id: 's-101',
          stepNumber: 1,
          delayHours: 0,
          channel: 'Email',
          isAbTest: true,
          splitPctA: 50,
          active: true,
          variantA: {
            id: 'A',
            name: 'Direct Asset Delivery & Context',
            subject: 'Here is your Cloud Security & Telemetry Architecture Blueprint',
            body: `Hi {{contact.firstName}},\n\nThank you for requesting our 2026 Cloud Security & Telemetry Blueprint.\n\nHere is your direct access link: https://laevos.internal/docs/security-blueprint-v4.pdf\n\nMost engineering leaders reviewing this are particularly focused on Section 3 regarding Zero-Trust Multi-Tenancy.\n\nBest,\nΛΞVOS Engineering Team`,
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
            body: `Hi {{contact.firstName}},\n\nI saw you just grabbed our Telemetry Blueprint. Before you dive in, are you currently evaluating latency reduction or multi-tenant database compliance?\n\nIf helpful, I can send over our specific benchmark comparisons with your current stack.\n\nBest,\nAlex (Principal Systems Architect)`,
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
          delayHours: 48,
          channel: 'Email',
          isAbTest: true,
          splitPctA: 50,
          active: true,
          variantA: {
            id: 'A',
            name: 'Case Study Proof: 300% Ingest Speed',
            subject: 'How FinTech Core cut API telemetry latency by 82%',
            body: `Hey {{contact.firstName}},\n\nFollowing up on the blueprint from Tuesday. Here is a 3-minute case study detailing how FinTech Core handled 100M+ daily events with 0 database bottlenecks.\n\nRead case study: https://laevos.internal/case-studies/fintech-core\n\nWould you have 10 minutes next Wednesday to review how this applies to {{company.name}}?`,
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
            subject: 'Calculate {{company.name}} infrastructure savings in 60 seconds',
            body: `Hi {{contact.firstName}},\n\nWe put together an interactive sizing model based on the telemetry architecture blueprint.\n\nEnter your projected Q4 ingestion rates to see immediate monthly savings: https://laevos.internal/calculator\n\nLet me know your thoughts!`,
            sends: 180,
            opens: 126,
            clicks: 62,
            replies: 28,
            openRatePct: 70,
            ctrPct: 34,
            replyRatePct: 15
          }
        }
      ]
    },
    {
      id: 'wf-2',
      name: 'Webinar Attendance Fast-Track Nurture',
      triggerAction: 'webinar_attend',
      triggerLabel: 'Attended Live Executive Masterclass',
      status: 'Active',
      targetAudience: 'Product Leaders & Technical Directors',
      totalEnrolled: 256,
      avgOpenRate: 76,
      avgCtr: 31,
      avgReplyRate: 22,
      conversions: 28,
      steps: [
        {
          id: 's-201',
          stepNumber: 1,
          delayHours: 2,
          channel: 'Email',
          isAbTest: true,
          splitPctA: 50,
          active: true,
          variantA: {
            id: 'A',
            name: 'Session Recording + Executive Deck',
            subject: 'Webinar Replay & Slide Deck: Scaling Real-Time Pipelines',
            body: `Hi {{contact.firstName}},\n\nThanks for attending our Live Masterclass today. As promised, here are the full replay links and high-res architectural slides:\n\nReplay: https://laevos.internal/masterclass/recording\n\nSeveral attendees asked for 1-on-1 private pipeline audits. Let me know if you would like to book 15 minutes this week.`,
            sends: 128,
            opens: 104,
            clicks: 46,
            replies: 30,
            openRatePct: 81,
            ctrPct: 35,
            replyRatePct: 23
          },
          variantB: {
            id: 'B',
            name: 'Key Takeaways Summary in Body',
            subject: '3 core takeaways from today’s Real-Time Architecture session',
            body: `Hi {{contact.firstName}},\n\nIn case you had to hop off early during today’s masterclass, here are the 3 top architectural decisions we covered:\n1. Zoneless state propagation\n2. Real-time Appwrite team permission scoping\n3. Sub-50ms query indexing\n\nWould you like a custom sandbox environment spun up for your team to test?`,
            sends: 128,
            opens: 92,
            clicks: 34,
            replies: 26,
            openRatePct: 71,
            ctrPct: 26,
            replyRatePct: 20
          }
        }
      ]
    },
    {
      id: 'wf-3',
      name: 'High-Intent Pricing Page Return Nurture',
      triggerAction: 'pricing_view',
      triggerLabel: 'Visited Pricing / Custom Calculator Page',
      status: 'Active',
      targetAudience: 'Finance Ops & Procurement Evaluators',
      totalEnrolled: 184,
      avgOpenRate: 72,
      avgCtr: 28,
      avgReplyRate: 19,
      conversions: 21,
      steps: [
        {
          id: 's-301',
          stepNumber: 1,
          delayHours: 4,
          channel: 'Email',
          isAbTest: false,
          splitPctA: 100,
          active: true,
          variantA: {
            id: 'A',
            name: 'Custom Enterprise Tier Breakdown',
            subject: 'Customizing a high-scale plan for {{company.name}}',
            body: `Hi {{contact.firstName}},\n\nNoticed you were exploring our Enterprise and Scale tier configurations.\n\nEvery enterprise has distinct data residency and SLA requirements. I would be glad to share a tailored breakdown with transparent volume discounts.\n\nDo you have 5 minutes for a quick chat tomorrow?`,
            sends: 184,
            opens: 132,
            clicks: 52,
            replies: 35,
            openRatePct: 72,
            ctrPct: 28,
            replyRatePct: 19
          }
        }
      ]
    }
  ]);

  selectedWorkflow = computed(() => {
    return this.workflows().find(w => w.id === this.selectedWorkflowId()) || this.workflows()[0];
  });

  activeWorkflows = computed(() => {
    return this.workflows().filter(w => w.status === 'Active');
  });

  totalEnrolled = computed(() => {
    return this.workflows().reduce((sum, w) => sum + w.totalEnrolled, 0);
  });

  overallAvgOpenRate = computed(() => {
    const list = this.activeWorkflows();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, w) => sum + w.avgOpenRate, 0) / list.length);
  });

  overallAvgCtr = computed(() => {
    const list = this.activeWorkflows();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, w) => sum + w.avgCtr, 0) / list.length);
  });

  totalConversions = computed(() => {
    return this.workflows().reduce((sum, w) => sum + w.conversions, 0);
  });

  countAbTests(wf: AutomatedWorkflow): number {
    return wf.steps.filter(s => s.isAbTest).length;
  }

  toggleWorkflowStatus(wf: AutomatedWorkflow) {
    wf.status = wf.status === 'Active' ? 'Paused' : 'Active';
    this.workflows.update(list => [...list]);
    this.appwrite.addNotification({
      title: 'Workflow Status Updated',
      message: `"${wf.name}" is now ${wf.status}.`,
      type: 'info'
    });
  }

  toggleStepAbTest(step: WorkflowStep) {
    step.isAbTest = !step.isAbTest;
    if (step.isAbTest && !step.variantB) {
      step.variantB = {
        id: 'B',
        name: 'Variant B (Alternative Hook)',
        subject: `Alternative: ${step.variantA.subject}`,
        body: `Hi {{contact.firstName}},\n\n[Alternative phrasing tailored to test different value hooks]...`,
        sends: 0,
        opens: 0,
        clicks: 0,
        replies: 0,
        openRatePct: 0,
        ctrPct: 0,
        replyRatePct: 0
      };
    }
    this.workflows.update(list => [...list]);
  }

  openNewWorkflowModal() {
    const newWf: AutomatedWorkflow = {
      id: 'wf-' + Date.now(),
      name: 'Demo Request VIP Follow-Up',
      triggerAction: 'demo_request',
      triggerLabel: 'Inbound Demo Request Submitted',
      status: 'Active',
      targetAudience: 'Inbound Enterprise Decision Makers',
      totalEnrolled: 1,
      avgOpenRate: 85,
      avgCtr: 45,
      avgReplyRate: 35,
      conversions: 1,
      steps: [
        {
          id: 's-' + Date.now(),
          stepNumber: 1,
          delayHours: 0,
          channel: 'Email',
          isAbTest: true,
          splitPctA: 50,
          active: true,
          variantA: {
            id: 'A',
            name: 'Direct Calendar Link',
            subject: 'Confirmed: Your ΛΞVOS Architecture Demo Session',
            body: `Hi {{contact.firstName}},\n\nThank you for requesting a dedicated architecture demo session.\n\nPlease pick a convenient time on my calendar here: https://laevos.internal/meet/alex\n\nLooking forward to meeting with you!`,
            sends: 1,
            opens: 1,
            clicks: 1,
            replies: 1,
            openRatePct: 100,
            ctrPct: 100,
            replyRatePct: 100
          },
          variantB: {
            id: 'B',
            name: 'Executive Technical Overview',
            subject: 'Preparing for your demo with our Principal Engineer',
            body: `Hi {{contact.firstName}},\n\nOur principal engineering lead will be leading your session. What specific stack integrations are priority for {{company.name}}?`,
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

    this.workflows.update(list => [newWf, ...list]);
    this.selectedWorkflowId.set(newWf.id);
    this.appwrite.addNotification({
      title: 'Workflow Created',
      message: `Created automated sequence "${newWf.name}".`,
      type: 'success'
    });
  }

  openAddStepModal(wf: AutomatedWorkflow) {
    const nextNum = wf.steps.length + 1;
    const lastDelay = wf.steps.length ? wf.steps[wf.steps.length - 1].delayHours : 0;

    wf.steps.push({
      id: 's-' + Date.now(),
      stepNumber: nextNum,
      delayHours: lastDelay + 72,
      channel: 'Email',
      isAbTest: false,
      splitPctA: 100,
      active: true,
      variantA: {
        id: 'A',
        name: `Step ${nextNum} Follow-up Touchpoint`,
        subject: `Checking in regarding {{company.name}} goals`,
        body: `Hi {{contact.firstName}},\n\nTouching base following our previous message...`,
        sends: 0,
        opens: 0,
        clicks: 0,
        replies: 0,
        openRatePct: 0,
        ctrPct: 0,
        replyRatePct: 0
      }
    });

    this.workflows.update(list => [...list]);
    this.appwrite.addNotification({
      title: 'Sequence Step Added',
      message: `Appended Step #${nextNum} to workflow "${wf.name}".`,
      type: 'info'
    });
  }

  async executeTriggerSimulation() {
    const targetLead = this.leadService.leads().find(l => l.$id === this.simulatedLeadId) || this.leadService.leads()[0];
    const wf = this.selectedWorkflow();

    if (targetLead && targetLead.$id) {
      // Record in scoring engine
      await this.leadService.recordLeadActivity(
        targetLead.$id,
        this.simulatedAction as LeadActivityEvent['type'],
        `Triggered Workflow Sequence: ${wf.name}`,
        18
      );

      // Increment workflow enrollment and stats
      wf.totalEnrolled += 1;
      if (wf.steps[0]) {
        wf.steps[0].variantA.sends += 1;
        wf.steps[0].variantA.opens += 1;
        wf.steps[0].variantA.clicks += 1;
      }
      this.workflows.update(list => [...list]);

      this.appwrite.addNotification({
        title: 'Workflow Trigger Executed',
        message: `Prospect ${targetLead.name} performed "${this.simulatedAction}". Enrolled into Step 1 of "${wf.name}" with A/B variant test logged.`,
        type: 'success'
      });

      this.showTriggerSimulator.set(false);
    }
  }
}
