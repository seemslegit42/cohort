import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';
import { LeadService, Lead } from './lead.service';
import { 
  EmailWorkflowService, 
  EmailWorkflow, 
  EmailWorkflowStep, 
  PERSONALIZATION_TOKENS, 
  WorkflowTriggerType 
} from './email-workflow.service';

@Component({
  selector: 'app-email-workflows',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="max-w-[1600px] mx-auto space-y-6 animate-fade-in relative px-2 md:px-0 pb-12">
      
      <!-- Top Bar / Breadcrumb Header -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-2">
        <div>
          <div class="flex items-center gap-2 text-xs text-zinc-400 font-mono mb-1">
            <span class="text-teal-400 font-bold">Appwrite CRM</span>
            <span>/</span>
            <span>Sales Automations</span>
            <span>/</span>
            <span class="text-zinc-200">Email Workflows</span>
          </div>
          <h1 class="font-display text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-[0_0_15px_rgba(32,178,170,0.15)]">
              <mat-icon class="text-teal-400 text-[24px]">mark_email_unread</mat-icon>
            </div>
            Email Workflow Engine
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Build trigger-based multi-touch outreach cadences, configure dynamic token personalization, and persist automated email pipelines to Appwrite.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Tenant Scope Badge -->
          <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
            <div class="w-2 h-2 rounded-full" [ngClass]="appwrite.isConnected() ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400'"></div>
            <span class="text-zinc-400">Tenant:</span>
            <span class="font-mono text-zinc-200 font-bold">{{ appwrite.activeTeam()?.$id || 'laevos-crm' }}</span>
          </div>

          @if (currentView() === 'editor') {
            <button 
              id="backToLibraryBtn"
              (click)="setView('list')"
              class="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5">
              <mat-icon class="text-sm">arrow_back</mat-icon>
              Workflow Library
            </button>

            <button 
              id="saveWorkflowBtn"
              (click)="saveActiveWorkflow()"
              [disabled]="workflowService.isSaving()"
              class="bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(32,178,170,0.25)] flex items-center gap-1.5">
              <mat-icon class="text-sm">cloud_upload</mat-icon>
              {{ workflowService.isSaving() ? 'Saving to Appwrite...' : 'Save Workflow' }}
            </button>
          } @else {
            <button 
              id="newWorkflowBtn"
              (click)="openNewWorkflowModal()"
              class="bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(32,178,170,0.25)] flex items-center gap-2">
              <mat-icon class="text-sm">add</mat-icon>
              Create New Sequence
            </button>
          }
        </div>
      </header>

      <!-- KPI Metrics Strip -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Active Workflows</p>
            <p class="text-2xl font-bold text-white font-display mt-1">{{ workflowService.activeWorkflowsCount() }}</p>
            <p class="text-[10px] text-teal-400 flex items-center gap-1 mt-0.5">
              <mat-icon class="text-[12px]">check_circle</mat-icon> Ready for auto-triggers
            </p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <mat-icon>alt_route</mat-icon>
          </div>
        </div>

        <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Enrolled Prospects</p>
            <p class="text-2xl font-bold text-white font-display mt-1">{{ workflowService.totalEnrolledCount() }}</p>
            <p class="text-[10px] text-zinc-400 mt-0.5">Across all active sequences</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <mat-icon>people</mat-icon>
          </div>
        </div>

        <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Avg Open Rate</p>
            <p class="text-2xl font-bold text-teal-400 font-display mt-1">{{ workflowService.avgOpenRate() }}%</p>
            <p class="text-[10px] text-zinc-400 mt-0.5">+14.2% vs industry avg</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <mat-icon>visibility</mat-icon>
          </div>
        </div>

        <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Avg Reply Rate</p>
            <p class="text-2xl font-bold text-emerald-400 font-display mt-1">{{ workflowService.avgReplyRate() }}%</p>
            <p class="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <mat-icon class="text-[12px]">trending_up</mat-icon> High conversion
            </p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <mat-icon>reply_all</mat-icon>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT: VIEW 1 (LIST / DIRECTORY) -->
      @if (currentView() === 'list') {
        <div class="space-y-4 animate-fade-in">
          
          <!-- Filters & Search Toolbar -->
          <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-2 w-full md:w-auto">
              <button 
                (click)="filterStatus.set('all')"
                [ngClass]="filterStatus() === 'all' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'"
                class="px-3 py-1.5 rounded-lg text-xs transition-colors">
                All ({{ workflowService.workflows().length }})
              </button>
              <button 
                (click)="filterStatus.set('active')"
                [ngClass]="filterStatus() === 'active' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold' : 'text-zinc-400 hover:text-zinc-200'"
                class="px-3 py-1.5 rounded-lg text-xs transition-colors">
                Active ({{ workflowService.activeWorkflowsCount() }})
              </button>
              <button 
                (click)="filterStatus.set('draft')"
                [ngClass]="filterStatus() === 'draft' ? 'bg-zinc-800 text-zinc-300 font-bold' : 'text-zinc-400 hover:text-zinc-200'"
                class="px-3 py-1.5 rounded-lg text-xs transition-colors">
                Drafts
              </button>
              <button 
                (click)="filterStatus.set('paused')"
                [ngClass]="filterStatus() === 'paused' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold' : 'text-zinc-400 hover:text-zinc-200'"
                class="px-3 py-1.5 rounded-lg text-xs transition-colors">
                Paused
              </button>
            </div>

            <div class="relative w-full md:w-80">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</mat-icon>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="Search workflows, triggers, or tags..."
                class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500/50" />
            </div>
          </div>

          <!-- Workflows Cards Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            @for (wf of filteredWorkflows(); track wf.$id) {
              <div class="bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-lg">
                <div class="space-y-3">
                  <!-- Header Strip -->
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span 
                          [ngClass]="{
                            'bg-teal-500/10 text-teal-400 border-teal-500/20': wf.status === 'active',
                            'bg-zinc-800 text-zinc-400 border-zinc-700': wf.status === 'draft',
                            'bg-amber-500/10 text-amber-400 border-amber-500/20': wf.status === 'paused'
                          }"
                          class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border font-mono">
                          {{ wf.status }}
                        </span>
                        <span class="text-[11px] text-zinc-500 font-mono">{{ wf.steps.length }} Steps</span>
                      </div>
                      <h3 class="text-base font-bold text-white font-display mt-2 group-hover:text-teal-300 transition-colors truncate">
                        {{ wf.name }}
                      </h3>
                    </div>

                    <!-- Quick Toggle Active Status -->
                    <button 
                      (click)="toggleWorkflow(wf.$id, $event)" 
                      [title]="wf.status === 'active' ? 'Pause Workflow' : 'Activate Workflow'"
                      class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      [ngClass]="wf.status === 'active' ? 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'">
                      <mat-icon class="text-sm">{{ wf.status === 'active' ? 'pause' : 'play_arrow' }}</mat-icon>
                    </button>
                  </div>

                  <!-- Description -->
                  <p class="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {{ wf.description }}
                  </p>

                  <!-- Trigger Pill -->
                  <div class="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60 flex items-center gap-2.5">
                    <div class="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center flex-shrink-0">
                      <mat-icon class="text-[14px]">bolt</mat-icon>
                    </div>
                    <div class="text-[11px] min-w-0">
                      <span class="text-zinc-500 font-mono uppercase text-[9px] block">Trigger Rule:</span>
                      <span class="text-zinc-300 font-medium truncate block">{{ getTriggerDescription(wf.trigger) }}</span>
                    </div>
                  </div>

                  <!-- Step Pipeline Mini Preview -->
                  <div class="space-y-1.5 pt-1">
                    <span class="text-[10px] font-mono uppercase text-zinc-500 font-bold block">Pipeline Steps:</span>
                    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                      @for (step of wf.steps; track step.id; let idx = $index) {
                        <div class="flex items-center gap-1.5 flex-shrink-0">
                          <span class="bg-zinc-800/90 text-zinc-300 px-2 py-1 rounded-md text-[10px] font-medium border border-zinc-700/60 truncate max-w-[140px]">
                            #{{ idx + 1 }} {{ step.name }}
                          </span>
                          @if (idx < wf.steps.length - 1) {
                            <mat-icon class="text-zinc-600 text-[12px]">chevron_right</mat-icon>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <!-- Footer Stats & Actions -->
                <div class="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <div class="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span class="text-zinc-500 text-[10px] block">Enrolled</span>
                      <span class="text-zinc-200 font-bold">{{ wf.enrolledCount }}</span>
                    </div>
                    <div>
                      <span class="text-zinc-500 text-[10px] block">Open %</span>
                      <span class="text-teal-400 font-bold">{{ wf.openRate }}%</span>
                    </div>
                    <div>
                      <span class="text-zinc-500 text-[10px] block">Reply %</span>
                      <span class="text-emerald-400 font-bold">{{ wf.replyRate }}%</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <button 
                      (click)="editWorkflow(wf.$id)"
                      class="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                      <mat-icon class="text-xs">edit</mat-icon>
                      Edit
                    </button>
                    
                    <button 
                      (click)="duplicateWorkflow(wf.$id, $event)"
                      title="Duplicate Workflow"
                      class="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                      <mat-icon class="text-sm">content_copy</mat-icon>
                    </button>

                    <button 
                      (click)="deleteWorkflow(wf.$id, $event)"
                      title="Delete Workflow"
                      class="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                      <mat-icon class="text-sm">delete_outline</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            }

            @if (filteredWorkflows().length === 0) {
              <div class="col-span-full py-16 text-center bg-zinc-900/20 border border-zinc-800/60 rounded-2xl">
                <mat-icon class="text-zinc-700 text-4xl mb-2">mark_email_unread</mat-icon>
                <p class="text-zinc-400 font-bold text-sm">No email workflows found</p>
                <p class="text-zinc-500 text-xs mt-1">Create a new sequence or clear your search filters.</p>
                <button 
                  (click)="openNewWorkflowModal()"
                  class="mt-4 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs transition-all inline-flex items-center gap-2">
                  <mat-icon class="text-xs">add</mat-icon>
                  Create Sequence
                </button>
              </div>
            }
          </div>

        </div>
      }

      <!-- MAIN CONTENT: VIEW 2 (VISUAL ARCHITECT & STEP BUILDER) -->
      @if (currentView() === 'editor' && activeWorkflow(); as wf) {
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-fade-in">
          
          <!-- Left Column: Workflow Settings, Triggers, & Live Lead Previewer (5 cols) -->
          <div class="xl:col-span-5 space-y-6">
            
            <!-- Workflow Metadata Box -->
            <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-2">
                  <mat-icon class="text-teal-400 text-sm">tune</mat-icon>
                  Workflow Parameters
                </h3>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-zinc-500 font-mono">Status:</span>
                  <select 
                    [ngModel]="wf.status" 
                    (ngModelChange)="updateWfField('status', $event)"
                    class="bg-zinc-950 border border-zinc-800 rounded-lg text-xs px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-teal-500/50 font-bold">
                    <option value="active">Active (Deploy)</option>
                    <option value="draft">Draft (Offline)</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <div class="space-y-3">
                <div>
                  <label for="wfNameInput" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">Sequence Name</label>
                  <input 
                    id="wfNameInput"
                    type="text" 
                    [ngModel]="wf.name" 
                    (ngModelChange)="updateWfField('name', $event)"
                    placeholder="e.g. Enterprise Qualification Fast-Track"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 font-bold" />
                </div>

                <div>
                  <label for="wfDescInput" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">Objective / Operational Description</label>
                  <textarea 
                    id="wfDescInput"
                    rows="2"
                    [ngModel]="wf.description" 
                    (ngModelChange)="updateWfField('description', $event)"
                    placeholder="Describe the cadence trigger goal and target prospect criteria..."
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-teal-500/50"></textarea>
                </div>
              </div>
            </div>

            <!-- Trigger Rule Configuration -->
            <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-2">
                <mat-icon class="text-amber-400 text-sm">bolt</mat-icon>
                Trigger Activation Rule
              </h3>
              
              <div class="space-y-3">
                <div>
                  <label for="triggerTypeSelect" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">Event Ingest Trigger</label>
                  <select 
                    id="triggerTypeSelect"
                    [ngModel]="wf.trigger.type" 
                    (ngModelChange)="updateTriggerType($event)"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50">
                    <option value="stage_changed">CRM Stage Transition (e.g. Enters Discovery / Qualified)</option>
                    <option value="lead_score_reached">Predictive Lead Score Threshold (e.g. Score >= 80)</option>
                    <option value="deal_value_exceeded">Deal Valuation Threshold (e.g. Deal >= $50,000)</option>
                    <option value="inactivity_detected">Prospect Inactivity / Dormancy (e.g. 10+ days silent)</option>
                    <option value="lead_created">New Inbound Lead Created</option>
                  </select>
                </div>

                <!-- Stage Target criteria -->
                @if (wf.trigger.type === 'stage_changed') {
                  <div class="grid grid-cols-2 gap-3 animate-fade-in">
                    <div>
                      <label for="targetStageSelect" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">Target Stage</label>
                      <select 
                        id="targetStageSelect"
                        [ngModel]="wf.trigger.targetStage || 'Discovery'" 
                        (ngModelChange)="updateTriggerField('targetStage', $event)"
                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50">
                        <option value="New">New</option>
                        <option value="Discovery">Discovery</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Proposal">Proposal</option>
                        <option value="Negotiation">Negotiation</option>
                      </select>
                    </div>
                    <div>
                      <label for="minDealValueInput" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">Min Value ($)</label>
                      <input 
                        id="minDealValueInput"
                        type="number" 
                        [ngModel]="wf.trigger.minDealValue || 0" 
                        (ngModelChange)="updateTriggerField('minDealValue', $event)"
                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50" />
                    </div>
                  </div>
                }

                <!-- Score Target criteria -->
                @if (wf.trigger.type === 'lead_score_reached') {
                  <div class="animate-fade-in">
                    <label for="minScoreInput" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">Trigger Score Threshold (0 - 100)</label>
                    <div class="flex items-center gap-3">
                      <input 
                        id="minScoreInput"
                        type="range" 
                        min="50" 
                        max="100" 
                        [ngModel]="wf.trigger.minScore || 80" 
                        (ngModelChange)="updateTriggerField('minScore', $event)"
                        class="w-full accent-teal-500 bg-zinc-950 rounded-lg h-1.5" />
                      <span class="font-mono font-bold text-teal-400 text-xs w-8">{{ wf.trigger.minScore || 80 }}</span>
                    </div>
                  </div>
                }

                <!-- Inactivity criteria -->
                @if (wf.trigger.type === 'inactivity_detected') {
                  <div class="animate-fade-in">
                    <label for="inactivityDaysInput" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">Dormancy Period (Days without activity)</label>
                    <input 
                      id="inactivityDaysInput"
                      type="number" 
                      min="1" 
                      max="90" 
                      [ngModel]="wf.trigger.inactivityDays || 10" 
                      (ngModelChange)="updateTriggerField('inactivityDays', $event)"
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50" />
                  </div>
                }
              </div>
            </div>

            <!-- Real CRM Lead Preview & Simulator Panel -->
            <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-2">
                  <mat-icon class="text-purple-400 text-sm">psychology</mat-icon>
                  Live Prospect Preview & Simulator
                </h3>
                <button 
                  (click)="runWorkflowSimulation(wf)" 
                  class="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
                  <mat-icon class="text-xs">play_arrow</mat-icon>
                  Test Run Simulation
                </button>
              </div>

              <!-- Lead Selection Dropdown -->
              <div class="space-y-1">
                <label for="previewLeadSelect" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Select Target Prospect for Live Render</label>
                <select 
                  id="previewLeadSelect"
                  [(ngModel)]="selectedLeadId"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50 font-mono">
                  @for (lead of leadService.leads(); track lead.$id) {
                    <option [value]="lead.$id">
                      {{ lead.name }} &bull; {{ lead.jobTitle }} &bull; {{ lead.status }} ({{ lead.value ? ('$' + lead.value.toLocaleString()) : '$0' }})
                    </option>
                  }
                </select>
              </div>

              <!-- Live Rendered Preview of Selected Step -->
              @if (activeStep(); as step) {
                <div class="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2.5 animate-fade-in">
                  <div class="flex items-center justify-between text-[11px] font-mono border-b border-zinc-800/80 pb-2">
                    <span class="text-zinc-500">Previewing Step #{{ step.stepOrder }}:</span>
                    <span class="text-teal-400 font-bold">
                      {{ step.delayValue === 0 ? 'Dispatches Immediately' : '+' + step.delayValue + ' ' + step.delayUnit }}
                    </span>
                  </div>

                  <div class="text-xs text-zinc-300">
                    <span class="text-zinc-500 text-[10px] uppercase font-mono block">Recipient:</span>
                    <strong>To:</strong> {{ currentPreviewLead().name }} &lt;{{ currentPreviewLead().email }}&gt;
                  </div>

                  <div class="text-xs text-white">
                    <span class="text-zinc-500 text-[10px] uppercase font-mono block">Subject Line:</span>
                    <p class="font-bold text-zinc-100 mt-0.5">
                      {{ workflowService.renderTemplate(step.subject, currentPreviewLead()) }}
                    </p>
                  </div>

                  <div class="text-xs text-zinc-300 pt-1">
                    <span class="text-zinc-500 text-[10px] uppercase font-mono block mb-1">Message Body Preview:</span>
                    <div class="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/50 whitespace-pre-wrap font-sans text-zinc-300 text-xs leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                      {{ workflowService.renderTemplate(step.body, currentPreviewLead()) }}
                    </div>
                  </div>
                </div>
              }

              <!-- Simulation Logs Output -->
              @if (workflowService.executionLogs().length > 0) {
                <div class="mt-4 pt-4 border-t border-zinc-800/80 space-y-2 animate-fade-in">
                  <div class="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase font-bold">
                    <span>Recent Dispatch Telemetry Logs</span>
                    <span class="text-teal-400">Appwrite Realtime OK</span>
                  </div>
                  <div class="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                    @for (log of workflowService.executionLogs(); track log.id) {
                      <div class="p-2 rounded-lg bg-zinc-950 border border-zinc-800/60 flex items-center justify-between text-[11px] font-mono">
                        <div class="flex items-center gap-2 truncate">
                          <span class="w-1.5 h-1.5 rounded-full" [ngClass]="log.status === 'dispatched' ? 'bg-teal-400' : 'bg-zinc-600'"></span>
                          <span class="text-zinc-300 font-bold">Step #{{ log.stepNumber }}</span>
                          <span class="text-zinc-500 truncate">{{ log.leadName }}</span>
                        </div>
                        <span class="text-[10px] text-zinc-500 flex-shrink-0">{{ log.delayString }} ({{ log.timestamp }})</span>
                      </div>
                    }
                  </div>
                </div>
              }

            </div>

          </div>

          <!-- Right Column: Interactive Step Timeline Builder (7 cols) -->
          <div class="xl:col-span-7 space-y-6">
            
            <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 space-y-6">
              
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                <div>
                  <h2 class="text-base font-bold text-white font-display flex items-center gap-2">
                    <mat-icon class="text-teal-400 text-sm">alt_route</mat-icon>
                    Sequence Timeline ({{ wf.steps.length }} Steps)
                  </h2>
                  <p class="text-xs text-zinc-400 mt-0.5">Configure step delays, subject lines, personalized templates, and A/B test variations.</p>
                </div>

                <button 
                  id="addStepBtn"
                  (click)="addStepToActive(wf.$id)"
                  class="bg-zinc-800 hover:bg-zinc-700 text-teal-300 border border-teal-500/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto">
                  <mat-icon class="text-xs">add</mat-icon>
                  Add Sequence Step
                </button>
              </div>

              <!-- Steps List with Timeline Connectors -->
              <div class="space-y-6">
                @for (step of wf.steps; track step.id; let idx = $index) {
                  <div 
                    (click)="selectedStepId.set(step.id)"
                    (keydown.enter)="selectedStepId.set(step.id)"
                    tabindex="0"
                    role="button"
                    class="relative bg-zinc-950 border rounded-2xl p-5 transition-all group"
                    [ngClass]="selectedStepId() === step.id ? 'border-teal-500/50 ring-1 ring-teal-500/20 shadow-xl shadow-teal-500/5' : 'border-zinc-800/80 hover:border-zinc-700'">
                    
                    <!-- Step Header & Order -->
                    <div class="flex items-start justify-between gap-3 mb-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold font-mono text-xs">
                          {{ idx + 1 }}
                        </div>
                        <div>
                          <input 
                            type="text" 
                            [ngModel]="step.name" 
                            (ngModelChange)="updateStepField(wf.$id, step.id, 'name', $event)"
                            class="bg-transparent font-bold text-sm text-white focus:outline-none focus:border-b border-teal-500/50 font-display" />
                          <div class="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                            <span>ID: {{ step.id }}</span>
                            <span>&bull;</span>
                            <span class="text-teal-400 font-medium">
                              {{ step.delayValue === 0 ? 'Immediate Dispatch' : '+' + step.delayValue + ' ' + step.delayUnit + ' delay' }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <!-- Step Control Actions -->
                      <div class="flex items-center gap-1">
                        @if (idx > 0) {
                          <button 
                            (click)="moveStep(wf.$id, idx, 'up', $event)" 
                            title="Move Step Up"
                            class="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors">
                            <mat-icon class="text-sm">arrow_upward</mat-icon>
                          </button>
                        }
                        @if (idx < wf.steps.length - 1) {
                          <button 
                            (click)="moveStep(wf.$id, idx, 'down', $event)" 
                            title="Move Step Down"
                            class="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors">
                            <mat-icon class="text-sm">arrow_downward</mat-icon>
                          </button>
                        }
                        <button 
                          (click)="removeStep(wf.$id, step.id, $event)" 
                          title="Delete Step"
                          class="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                          <mat-icon class="text-sm">delete_outline</mat-icon>
                        </button>
                      </div>
                    </div>

                    <!-- Step Delay Controls -->
                    <div class="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/60 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div class="flex items-center gap-2 text-zinc-400">
                        <mat-icon class="text-teal-400 text-sm">schedule</mat-icon>
                        <span class="font-bold text-zinc-300">Delivery Delay:</span>
                        <span>Send this touch</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="0" 
                          max="90" 
                          [ngModel]="step.delayValue" 
                          (ngModelChange)="updateStepField(wf.$id, step.id, 'delayValue', +$event)"
                          class="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-center font-bold text-white text-xs focus:outline-none focus:border-teal-500/50" />
                        <select 
                          [ngModel]="step.delayUnit" 
                          (ngModelChange)="updateStepField(wf.$id, step.id, 'delayUnit', $event)"
                          class="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 text-xs focus:outline-none focus:border-teal-500/50 font-medium">
                          <option value="minutes">Minutes after previous</option>
                          <option value="hours">Hours after previous</option>
                          <option value="days">Days after previous</option>
                        </select>
                      </div>
                    </div>

                    <!-- Subject Line with Quick Token Chips -->
                    <div class="space-y-1.5 mb-4">
                      <div class="flex items-center justify-between">
                        <label for="stepSubjectInput-{{step.id}}" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Email Subject</label>
                        <span class="text-[10px] text-zinc-500 font-mono">Tokens enabled</span>
                      </div>
                      <input 
                        id="stepSubjectInput-{{step.id}}"
                        type="text" 
                        [ngModel]="step.subject" 
                        (ngModelChange)="updateStepField(wf.$id, step.id, 'subject', $event)"
                        [placeholder]="'e.g. Following up on {{lead.company}} requirements'"
                        class="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 font-medium" />
                    </div>

                    <!-- Personalization Token Chips Bar -->
                    <div class="mb-2">
                      <span class="text-[10px] font-mono uppercase text-zinc-500 font-bold block mb-1.5">Insert Dynamic Token:</span>
                      <div class="flex flex-wrap gap-1.5">
                        @for (token of tokens; track token.tag) {
                          <button 
                            (click)="insertToken(wf.$id, step.id, token.tag, $event)"
                            class="bg-zinc-900 hover:bg-teal-500/10 hover:text-teal-300 hover:border-teal-500/30 text-zinc-400 border border-zinc-800 text-[10px] font-mono px-2 py-0.5 rounded-md transition-colors">
                            + {{ token.tag }}
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Message Body Template -->
                    <div class="space-y-1.5 mb-4">
                      <label for="stepBodyInput-{{step.id}}" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Email Body Template (Markdown Supported)</label>
                      <textarea 
                        id="stepBodyInput-{{step.id}}"
                        rows="6"
                        [ngModel]="step.body" 
                        (ngModelChange)="updateStepField(wf.$id, step.id, 'body', $event)"
                        [placeholder]="'Write your email copy here. Use dynamic tokens like {{lead.firstName}} to personalize at scale.'"
                        class="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 font-mono leading-relaxed"></textarea>
                    </div>

                    <!-- Smart Exit & Action Triggers -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-900 text-xs">
                      <div>
                        <label for="actionOnReplySelect-{{step.id}}" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">When Prospect Replies:</label>
                        <select 
                          id="actionOnReplySelect-{{step.id}}"
                          [ngModel]="step.actionOnReply || 'stop_sequence'" 
                          (ngModelChange)="updateStepField(wf.$id, step.id, 'actionOnReply', $event)"
                          class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-teal-500/50">
                          <option value="stop_sequence">Auto-pause sequence for prospect</option>
                          <option value="mark_hot_lead">Mark lead as Hot & alert rep</option>
                          <option value="notify_rep">Notify sales rep in Appwrite</option>
                          <option value="none">No automated action</option>
                        </select>
                      </div>

                      <div>
                        <label for="actionOnOpenSelect-{{step.id}}" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">When Email is Opened:</label>
                        <select 
                          id="actionOnOpenSelect-{{step.id}}"
                          [ngModel]="step.actionOnOpen || 'none'" 
                          (ngModelChange)="updateStepField(wf.$id, step.id, 'actionOnOpen', $event)"
                          class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-teal-500/50">
                          <option value="none">Standard tracking only</option>
                          <option value="increase_score">Increase Lead Score (+10 pts)</option>
                          <option value="create_task">Auto-generate follow-up CRM Task</option>
                          <option value="notify_rep">Trigger Realtime Alert</option>
                        </select>
                      </div>
                    </div>

                  </div>
                }
              </div>

              <!-- Add Step Button at Bottom of Pipeline -->
              <div class="pt-2 text-center">
                <button 
                  (click)="addStepToActive(wf.$id)"
                  class="w-full py-3 rounded-xl border border-dashed border-zinc-800 hover:border-teal-500/40 text-zinc-400 hover:text-teal-400 transition-colors text-xs font-bold flex items-center justify-center gap-2">
                  <mat-icon class="text-sm">add_circle_outline</mat-icon>
                  Append Step #{{ wf.steps.length + 1 }} to Cadence
                </button>
              </div>

            </div>

          </div>

        </div>
      }

      <!-- NEW WORKFLOW CREATION MODAL -->
      @if (showNewModal()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 class="text-lg font-bold text-white font-display flex items-center gap-2">
                <mat-icon class="text-teal-400">add_task</mat-icon>
                Create Email Workflow Sequence
              </h2>
              <button (click)="showNewModal.set(false)" class="text-zinc-500 hover:text-zinc-300">
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label for="newWfNameInput" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">Sequence Name</label>
                <input 
                  id="newWfNameInput"
                  type="text" 
                  [(ngModel)]="newWfName" 
                  placeholder="e.g. Post-Demo Executive Follow-Up Cadence"
                  class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 font-bold" />
              </div>

              <div>
                <label for="newWfDescInput" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">Description</label>
                <textarea 
                  id="newWfDescInput"
                  rows="2" 
                  [(ngModel)]="newWfDesc" 
                  placeholder="Briefly describe what triggers this sequence..."
                  class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-teal-500/50"></textarea>
              </div>

              <div>
                <label for="newWfTriggerSelect" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">Activation Trigger Rule</label>
                <select 
                  id="newWfTriggerSelect"
                  [(ngModel)]="newWfTriggerType"
                  class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50 font-medium">
                  <option value="stage_changed">CRM Stage Transition (e.g. Discovery / Proposal)</option>
                  <option value="lead_score_reached">High Predictive Lead Score (Score >= 80)</option>
                  <option value="deal_value_exceeded">High Deal Valuation (> $50k)</option>
                  <option value="inactivity_detected">Prospect Inactivity (Dormancy)</option>
                  <option value="lead_created">New Lead Creation Ingest</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button 
                (click)="showNewModal.set(false)"
                class="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors">
                Cancel
              </button>
              <button 
                (click)="submitNewWorkflow()"
                class="bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/20 flex items-center gap-1.5">
                <mat-icon class="text-sm">check</mat-icon>
                Create & Configure
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #3f3f46; }
  `]
})
export class EmailWorkflowsComponent {
  appwrite = inject(Appwrite);
  leadService = inject(LeadService);
  workflowService = inject(EmailWorkflowService);

  tokens = PERSONALIZATION_TOKENS;
  currentView = signal<'list' | 'editor'>('list');
  filterStatus = signal<'all' | 'active' | 'draft' | 'paused'>('all');
  searchQuery = signal<string>('');

  selectedStepId = signal<string | null>(null);
  selectedLeadId = signal<string>('');
  showNewModal = signal<boolean>(false);

  // New Workflow Modal Form State
  newWfName = '';
  newWfDesc = '';
  newWfTriggerType: WorkflowTriggerType = 'stage_changed';

  filteredWorkflows = computed(() => {
    let list = this.workflowService.workflows();
    const status = this.filterStatus();
    const query = this.searchQuery().toLowerCase().trim();

    if (status !== 'all') {
      list = list.filter(w => w.status === status);
    }

    if (query) {
      list = list.filter(w => 
        w.name.toLowerCase().includes(query) ||
        w.description.toLowerCase().includes(query) ||
        w.tags?.some(t => t.toLowerCase().includes(query)) ||
        w.trigger.type.toLowerCase().includes(query)
      );
    }

    return list;
  });

  activeWorkflow = computed(() => {
    return this.workflowService.selectedWorkflow();
  });

  activeStep = computed<EmailWorkflowStep | null>(() => {
    const wf = this.activeWorkflow();
    if (!wf || wf.steps.length === 0) return null;
    const stepId = this.selectedStepId();
    if (!stepId) return wf.steps[0];
    return wf.steps.find(s => s.id === stepId) || wf.steps[0];
  });

  currentPreviewLead = computed<Lead>(() => {
    const leads = this.leadService.leads();
    const targetId = this.selectedLeadId();
    if (!targetId && leads.length > 0) return leads[0];
    return leads.find(l => l.$id === targetId) || leads[0] || {
      name: 'Sarah Connor',
      email: 's.connor@cyberdyne.io',
      source: 'Enterprise Inbound',
      status: 'Discovery',
      value: 145000,
      jobTitle: 'VP of Technology',
      industry: 'AI Infrastructure',
      score: 94
    };
  });

  setView(view: 'list' | 'editor') {
    this.currentView.set(view);
  }

  editWorkflow(id: string) {
    this.workflowService.selectedWorkflowId.set(id);
    const wf = this.workflowService.workflows().find(w => w.$id === id);
    if (wf && wf.steps.length > 0) {
      this.selectedStepId.set(wf.steps[0].id);
    }
    this.setView('editor');
  }

  async toggleWorkflow(id: string, event: Event) {
    event.stopPropagation();
    await this.workflowService.toggleStatus(id);
  }

  async duplicateWorkflow(id: string, event: Event) {
    event.stopPropagation();
    await this.workflowService.duplicateWorkflow(id);
  }

  async deleteWorkflow(id: string, event: Event) {
    event.stopPropagation();
    await this.workflowService.deleteWorkflow(id);
  }

  getTriggerDescription(trigger: EmailWorkflow['trigger']): string {
    switch (trigger.type) {
      case 'stage_changed':
        return `Lead enters stage "${trigger.targetStage || 'Discovery'}" ${trigger.minDealValue ? '(Deal >= $' + trigger.minDealValue.toLocaleString() + ')' : ''}`;
      case 'lead_score_reached':
        return `Lead score reaches ${trigger.minScore || 80}+ points`;
      case 'deal_value_exceeded':
        return `Deal value exceeds $${(trigger.minDealValue || 100000).toLocaleString()}`;
      case 'inactivity_detected':
        return `Prospect inactive for ${trigger.inactivityDays || 10}+ days`;
      case 'lead_created':
        return 'New inbound prospect created';
      default:
        return 'Custom trigger rule';
    }
  }

  updateWfField(field: keyof EmailWorkflow, val: string | number | boolean) {
    const wf = this.activeWorkflow();
    if (!wf) return;
    this.workflowService.updateWorkflow(wf.$id, { [field]: val });
  }

  updateTriggerType(type: WorkflowTriggerType) {
    const wf = this.activeWorkflow();
    if (!wf) return;
    const currentTrigger = wf.trigger;
    const updated = {
      ...currentTrigger,
      type
    };
    this.workflowService.updateWorkflow(wf.$id, { trigger: updated });
  }

  updateTriggerField(field: string, val: string | number | boolean) {
    const wf = this.activeWorkflow();
    if (!wf) return;
    const currentTrigger = wf.trigger;
    const updated = {
      ...currentTrigger,
      [field]: val
    };
    this.workflowService.updateWorkflow(wf.$id, { trigger: updated });
  }

  async addStepToActive(workflowId: string) {
    await this.workflowService.addStep(workflowId);
    const wf = this.activeWorkflow();
    if (wf && wf.steps.length > 0) {
      this.selectedStepId.set(wf.steps[wf.steps.length - 1].id);
    }
  }

  async updateStepField(workflowId: string, stepId: string, field: keyof EmailWorkflowStep, val: string | number | boolean) {
    await this.workflowService.updateStep(workflowId, stepId, { [field]: val });
  }

  async removeStep(workflowId: string, stepId: string, event: Event) {
    event.stopPropagation();
    await this.workflowService.removeStep(workflowId, stepId);
  }

  async moveStep(workflowId: string, index: number, direction: 'up' | 'down', event: Event) {
    event.stopPropagation();
    await this.workflowService.moveStep(workflowId, index, direction);
  }

  insertToken(workflowId: string, stepId: string, tokenTag: string, event: Event) {
    event.stopPropagation();
    const wf = this.activeWorkflow();
    if (!wf) return;
    const step = wf.steps.find(s => s.id === stepId);
    if (!step) return;

    const newBody = (step.body || '') + (step.body.endsWith(' ') || step.body.endsWith('\n') ? '' : ' ') + tokenTag;
    this.updateStepField(workflowId, stepId, 'body', newBody);
  }

  openNewWorkflowModal() {
    this.newWfName = '';
    this.newWfDesc = '';
    this.newWfTriggerType = 'stage_changed';
    this.showNewModal.set(true);
  }

  async submitNewWorkflow() {
    if (!this.newWfName.trim()) {
      this.newWfName = 'New Email Sequence';
    }

    const created = await this.workflowService.createWorkflow({
      name: this.newWfName,
      description: this.newWfDesc || 'Custom automated trigger-based sequence.',
      status: 'draft',
      trigger: {
        type: this.newWfTriggerType,
        targetStage: 'Discovery',
        minDealValue: 0
      }
    });

    this.showNewModal.set(false);
    this.editWorkflow(created.$id);
  }

  async saveActiveWorkflow() {
    const wf = this.activeWorkflow();
    if (!wf) return;
    await this.workflowService.updateWorkflow(wf.$id, wf);
    this.appwrite.addNotification({
      title: 'Workflow Saved to Appwrite',
      message: `"${wf.name}" has been synchronized to Appwrite database collection.`,
      type: 'success'
    });
  }

  runWorkflowSimulation(wf: EmailWorkflow) {
    const lead = this.currentPreviewLead();
    this.workflowService.simulateWorkflowRun(wf, lead);
  }
}
