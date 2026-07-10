import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Appwrite } from './appwrite';

export interface AutomationRule {
  id: string;
  name: string;
  triggerEvent: string;
  actionType: 'webhook' | 'function' | 'sequence' | 'alert';
  matchCriteria: string;
  enabled: boolean;
  color: 'aqua' | 'green' | 'purple';
}

export interface TerminalLog {
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  source: string;
  message: string;
}

@Component({
  selector: 'app-automations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="max-w-[1400px] mx-auto space-y-8 animate-fade-in relative px-2 md:px-0">
      
      <!-- Top Neon Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 mb-6">
        <div>
          <h1 class="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-[0_0_15px_rgba(32,178,170,0.15)]">
              <mat-icon class="text-[#20B2AA] text-[24px]">auto_awesome</mat-icon>
            </div>
            B.E.E.P. Control Suite
          </h1>
          <p class="text-xs text-zinc-400 mt-2">
            Behavioral Event & Execution Processor for ΛΞV Inc. Real-time background event matching, serverless functions, and AI sequence activations.
          </p>
        </div>
        
        <!-- Live System Vein Visual (Living Metaphor) -->
        <div class="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-lg min-w-[280px]">
          <div class="flex flex-col">
            <span class="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">B.E.E.P. Pulse rate</span>
            <span class="text-xs font-bold text-white font-mono mt-0.5">HEALTHY / ACTIVE</span>
          </div>
          <!-- SVG Vein / Pulse (Living Metaphor) -->
          <div class="flex-1 h-8 relative overflow-hidden select-none">
            <svg class="w-full h-full" viewBox="0 0 160 30" preserveAspectRatio="none">
              <!-- Background glowing trace -->
              <path 
                d="M 0 15 L 40 15 L 50 5 L 60 25 L 70 15 L 110 15 L 120 2 L 130 28 L 140 15 L 160 15" 
                fill="none" 
                stroke="rgba(62,185,145,0.15)" 
                stroke-width="1.5" />
              <!-- Active running pulse -->
              <path 
                d="M 0 15 L 40 15 L 50 5 L 60 25 L 70 15 L 110 15 L 120 2 L 130 28 L 140 15 L 160 15" 
                fill="none" 
                stroke="#3EB991" 
                stroke-width="2" 
                stroke-dasharray="160"
                class="pulse-path" />
            </svg>
          </div>
        </div>
      </header>

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Rules and Registration Panel (7 cols) -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- Registration form GlassPane -->
          <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group">
            <div class="absolute -right-20 -top-20 w-40 h-40 bg-teal-500/5 blur-3xl rounded-full pointer-events-none"></div>
            
            <div class="flex items-center gap-3 border-b border-zinc-800/60 pb-4 mb-5">
              <mat-icon class="text-[#20B2AA]">playlist_add</mat-icon>
              <h2 class="text-base font-bold text-white font-display tracking-tight">Register New Automation Rule</h2>
            </div>

            <!-- Form -->
            <form [formGroup]="ruleForm" (ngSubmit)="onCreateRule()" class="space-y-4">
              <div class="space-y-1">
                <label for="ruleNameInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-display">Rule Label</label>
                <input id="ruleNameInput" type="text" formControlName="name" placeholder="E.g., High-Value Ingest Webhook" 
                       class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/40 font-sans" />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label for="eventSelect" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-display">Event Trigger</label>
                  <select id="eventSelect" formControlName="triggerEvent" 
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-300 focus:outline-none focus:border-teal-500/40 font-sans">
                    <option value="Lead Ingest">Lead Ingest (New user added)</option>
                    <option value="Contract Signed">Contract Signed (SLA closed)</option>
                    <option value="Telemetry Breach">Telemetry Breach (API overload)</option>
                    <option value="Pipeline Signal">Pipeline Signal (Positive buyer intent)</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label for="actionSelect" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-display">Action Type</label>
                  <select id="actionSelect" formControlName="actionType" 
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-300 focus:outline-none focus:border-teal-500/40 font-sans">
                    <option value="function">Trigger Enrichment Function (Gemini model)</option>
                    <option value="webhook">Post to Slack Webhook (#sales-alerts)</option>
                    <option value="sequence">Dispatch AI Outreach Sequence</option>
                    <option value="alert">Register CRM Notification & Task</option>
                  </select>
                </div>
              </div>

              <div class="space-y-1">
                <label for="criteriaInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-display">Match Criteria (JSON / Logical Condition)</label>
                <input id="criteriaInput" type="text" formControlName="matchCriteria" placeholder="E.g., $value > 50000 && company == 'Enterprise'" 
                       class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-teal-500/40 font-mono" />
              </div>

              <div class="flex justify-end pt-2">
                <button 
                  type="submit" 
                  [disabled]="ruleForm.invalid"
                  class="bg-teal-500 hover:bg-teal-400 text-zinc-950 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/10 flex items-center gap-2">
                  <mat-icon class="text-xs">save</mat-icon>
                  Deploy Rule to B.E.E.P.
                </button>
              </div>
            </form>
          </div>

          <!-- Active Rules list (GlassPane) -->
          <div class="space-y-4">
            <div class="flex items-center justify-between px-1">
              <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-widest font-display">Active Automation Rules</h3>
              <span class="text-[10px] font-mono text-zinc-500">{{ rules().length }} active</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (rule of rules(); track rule.id) {
                <div 
                  class="bg-zinc-900/40 backdrop-blur-xl border rounded-2xl p-5 hover:bg-zinc-900/60 transition-all flex flex-col justify-between group relative overflow-hidden"
                  [ngClass]="getRuleCardBorder(rule)">
                  
                  <!-- Internal glowing circle representing class color -->
                  <div class="absolute -right-10 -bottom-10 w-24 h-24 blur-3xl rounded-full opacity-10"
                       [ngClass]="{
                         'bg-[#20B2AA]': rule.color === 'aqua',
                         'bg-[#3EB991]': rule.color === 'green',
                         'bg-[#6A0DAD]': rule.color === 'purple'
                       }"></div>

                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border"
                            [ngClass]="getRuleBadgeClass(rule)">
                        {{ rule.actionType }}
                      </span>
                      
                      <!-- Toggle switch -->
                      <button 
                        (click)="toggleRule(rule.id)"
                        class="w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center"
                        [ngClass]="rule.enabled ? 'bg-teal-500' : 'bg-zinc-800'">
                        <span class="w-4 h-4 rounded-full bg-zinc-950 transition-all shadow-md block"
                              [ngClass]="rule.enabled ? 'translate-x-4' : 'translate-x-0'"></span>
                      </button>
                    </div>

                    <h4 class="text-sm font-bold text-white font-display mb-1.5 group-hover:text-teal-400 transition-colors">{{ rule.name }}</h4>
                    <p class="text-[11px] text-zinc-400 font-medium leading-relaxed mb-3">
                      When <span class="text-zinc-300 font-semibold">{{ rule.triggerEvent }}</span> fits criteria: <code class="bg-zinc-950/80 px-1 py-0.5 rounded text-zinc-400 text-[10px] font-mono border border-zinc-800/60">{{ rule.matchCriteria }}</code>
                    </p>
                  </div>

                  <div class="flex items-center justify-between pt-3 border-t border-zinc-850/60 mt-3 text-[10px]">
                    <span class="text-zinc-500 font-medium">Telemetry status:</span>
                    <span [ngClass]="rule.enabled ? 'text-[#3EB991] font-bold animate-pulse' : 'text-zinc-500 font-medium'">
                      {{ rule.enabled ? '● MATCHING' : '○ DORMANT' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>

        <!-- Terminal & Simulator Console (5 cols) -->
        <div class="lg:col-span-5 space-y-6">
          
          <!-- Simulator controls (GlassPane) -->
          <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 relative overflow-hidden group">
            <div class="flex items-center gap-3 border-b border-zinc-800/60 pb-3 mb-4">
              <mat-icon class="text-[#3EB991]">tune</mat-icon>
              <h3 class="text-xs font-bold text-white uppercase tracking-wider font-display">B.E.E.P. Event Simulator</h3>
            </div>
            
            <p class="text-[11px] text-zinc-400 mb-4 font-medium leading-relaxed">
              Inject synthetic telemetry payloads directly into the B.E.E.P. core to evaluate rule matching, Appwrite hooks, and log feedback loops.
            </p>

            <div class="space-y-2.5">
              <button 
                (click)="simulateEvent('Lead Ingest')" 
                class="w-full bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-800 hover:border-[#20B2AA]/30 text-zinc-200 text-xs py-2.5 px-4 rounded-xl font-bold flex items-center justify-between transition-all group">
                <span class="flex items-center gap-2">
                  <mat-icon class="text-[#20B2AA] text-[18px]">group_add</mat-icon>
                  Inbound Lead Ingest
                </span>
                <span class="text-[10px] text-zinc-500 font-mono group-hover:text-[#20B2AA] font-bold">Inject Event &rarr;</span>
              </button>

              <button 
                (click)="simulateEvent('Contract Signed')" 
                class="w-full bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-800 hover:border-[#3EB991]/30 text-zinc-200 text-xs py-2.5 px-4 rounded-xl font-bold flex items-center justify-between transition-all group">
                <span class="flex items-center gap-2">
                  <mat-icon class="text-[#3EB991] text-[18px]">verified_user</mat-icon>
                  Contract Sign Finalization
                </span>
                <span class="text-[10px] text-zinc-500 font-mono group-hover:text-[#3EB991] font-bold">Inject Event &rarr;</span>
              </button>

              <button 
                (click)="simulateEvent('Telemetry Breach')" 
                class="w-full bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-500/30 text-zinc-200 text-xs py-2.5 px-4 rounded-xl font-bold flex items-center justify-between transition-all group">
                <span class="flex items-center gap-2">
                  <mat-icon class="text-purple-400 text-[18px]">report_problem</mat-icon>
                  Server Telemetry Breach
                </span>
                <span class="text-[10px] text-zinc-500 font-mono group-hover:text-purple-400 font-bold">Inject Event &rarr;</span>
              </button>
            </div>
          </div>

          <!-- Real-time Event Terminal logs (GlassPane) -->
          <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 flex flex-col h-[400px]">
            <div class="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-4">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-display">
                <mat-icon class="text-zinc-500 text-sm">terminal</mat-icon>
                B.E.E.P. Terminal Log
              </h3>
              <button 
                (click)="clearLogs()" 
                class="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors bg-zinc-950/60 border border-zinc-850 px-2.5 py-1 rounded-lg">
                Clear
              </button>
            </div>

            <!-- Log entries -->
            <div class="flex-1 space-y-3 overflow-y-auto pr-1 font-mono text-[11px] custom-scrollbar">
              @for (log of logs(); track $index) {
                <div class="leading-relaxed border-l-2 pl-2.5 transition-all"
                     [ngClass]="{
                       'border-teal-500/50 text-teal-400/90': log.type === 'success',
                       'border-zinc-700 text-zinc-400/90': log.type === 'info',
                       'border-amber-500/50 text-amber-300': log.type === 'warn',
                       'border-rose-500/50 text-rose-400': log.type === 'error'
                     }">
                  <div class="flex items-center justify-between text-[9px] text-zinc-500 mb-0.5 select-none">
                    <span>[{{ log.timestamp }}] - {{ log.source }}</span>
                    <span class="uppercase font-bold">{{ log.type }}</span>
                  </div>
                  <p class="text-zinc-300 text-[11px] font-medium leading-relaxed whitespace-pre-wrap">{{ log.message }}</p>
                </div>
              } @empty {
                <div class="h-full flex flex-col items-center justify-center text-center p-8 select-none">
                  <mat-icon class="text-zinc-700 text-3xl mb-3">developer_board</mat-icon>
                  <p class="text-zinc-500 text-xs">Waiting for events...</p>
                  <p class="text-zinc-600 text-[10px] mt-1 max-w-[180px]">Simulate payloads above or add new rules to see compilation loops.</p>
                </div>
              }
            </div>
          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .pulse-path {
      stroke-dashoffset: 320;
      animation: pulseAnim 3s linear infinite;
    }
    @keyframes pulseAnim {
      to {
        stroke-dashoffset: 0;
      }
    }

    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
  `]
})
export class AutomationsComponent implements OnInit {
  appwrite = inject(Appwrite);
  fb = inject(FormBuilder);

  ruleForm!: FormGroup;

  // Initial Automation Rules
  rules = signal<AutomationRule[]>([
    {
      id: 'rule-1',
      name: 'Lead Enrichment Streamline',
      triggerEvent: 'Lead Ingest',
      actionType: 'function',
      matchCriteria: '$company != null',
      enabled: true,
      color: 'aqua'
    },
    {
      id: 'rule-2',
      name: 'Enterprise Slack Alert',
      triggerEvent: 'Contract Signed',
      actionType: 'webhook',
      matchCriteria: '$value >= 100000',
      enabled: true,
      color: 'green'
    },
    {
      id: 'rule-3',
      name: 'Urgent Telemetry Response',
      triggerEvent: 'Telemetry Breach',
      actionType: 'alert',
      matchCriteria: '$errorCode == "API_LIMIT_REACHED"',
      enabled: false,
      color: 'purple'
    }
  ]);

  // Terminal state
  logs = signal<TerminalLog[]>([]);

  ngOnInit() {
    this.ruleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      triggerEvent: ['Lead Ingest', [Validators.required]],
      actionType: ['function', [Validators.required]],
      matchCriteria: ['', [Validators.required, Validators.minLength(3)]]
    });

    // Populate initial terminal trace logs
    this.addLogEntry('info', 'SYS-CORE', 'B.E.E.P. Engine successfully instantiated on ΛΞV Inc telemetry servers.');
    this.addLogEntry('success', 'SYS-DB', 'Registered triggers connected with Appwrite collections.');
  }

  onCreateRule() {
    if (this.ruleForm.invalid) return;
    const val = this.ruleForm.value;

    const colors: ('aqua' | 'green' | 'purple')[] = ['aqua', 'green', 'purple'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newRule: AutomationRule = {
      id: 'rule-' + Date.now(),
      name: val.name,
      triggerEvent: val.triggerEvent,
      actionType: val.actionType,
      matchCriteria: val.matchCriteria,
      enabled: true,
      color: randomColor
    };

    this.rules.update(arr => [...arr, newRule]);
    
    // Log registration
    this.addLogEntry('success', 'COMPILER', `Deployed trigger rule "${newRule.name}" to memory heap.`);
    
    // Add toast notification
    this.appwrite.addNotification({
      title: 'B.E.E.P. Rule Registered',
      message: `Trigger rule "${newRule.name}" has been deployed and is actively watching telemetry.`,
      isRead: false,
      type: 'success'
    });

    this.ruleForm.reset({
      triggerEvent: 'Lead Ingest',
      actionType: 'function'
    });
  }

  toggleRule(id: string) {
    this.rules.update(arr => arr.map(rule => {
      if (rule.id === id) {
        const nextState = !rule.enabled;
        this.addLogEntry(
          nextState ? 'info' : 'warn', 
          'SCHEDULER', 
          `Rule "${rule.name}" has been ${nextState ? 'ACTIVATED' : 'SUSPENDED'} in loop context.`
        );
        return { ...rule, enabled: nextState };
      }
      return rule;
    }));
  }

  simulateEvent(eventType: string) {
    this.addLogEntry('info', 'SIMULATOR', `Manual payload injected for event type: ${eventType}`);

    // Filter enabled rules matching this event
    const matchedRules = this.rules().filter(r => r.triggerEvent === eventType && r.enabled);

    if (matchedRules.length === 0) {
      this.addLogEntry('warn', 'PROCESSOR', `Event type "${eventType}" ingested, but no matching ACTIVE trigger rules found. Discarding payload.`);
      
      this.appwrite.addNotification({
        title: 'B.E.E.P. Ingestion Complete',
        message: `Injected "${eventType}" event, but no matching active rules executed.`,
        isRead: false,
        type: 'warning'
      });
      return;
    }

    matchedRules.forEach(rule => {
      this.addLogEntry('success', 'PROCESSOR', `MATCH FOUND: Rule "${rule.name}" triggered dynamically on criteria "${rule.matchCriteria}".`);
      
      // Handle actions simulating actual outputs
      setTimeout(() => {
        if (rule.actionType === 'function') {
          this.addLogEntry('success', 'GEMINI-LLM', `Initialized Appwrite Serverless Function client...\nEnriching contact profile with historical Q2 relationship signals...\nSuccess! Enriched data written to row.`);
          
          this.appwrite.addNotification({
            title: 'Contact Enriched Successfully',
            message: `Rule "${rule.name}" successfully executed serverless Gemini enrichment.`,
            isRead: false,
            type: 'success'
          });

        } else if (rule.actionType === 'webhook') {
          this.addLogEntry('success', 'WEBHOOK', `Outgoing HTTP POST request dispatched to Slack webhook endpoint.\nResponse status: 200 OK.`);
          
          this.appwrite.addNotification({
            title: 'Slack Notification Sent',
            message: `Slack channel #sales-alerts notified of Contract sign-off events.`,
            isRead: false,
            type: 'info'
          });

        } else if (rule.actionType === 'sequence') {
          this.addLogEntry('success', 'SEQUENCE', `AI Outreach Engine successfully loaded C-Suite profile draft templates.\nOutbox item generated for dispatch queue.`);
          
          this.appwrite.addNotification({
            title: 'AI Outreach Draft Formed',
            message: `B.E.E.P. initialized follow-up sequences automatically.`,
            isRead: false,
            type: 'success'
          });

        } else if (rule.actionType === 'alert') {
          this.addLogEntry('success', 'CRM-DB', `Created standard CRM warning notification and logged dynamic action task items.`);
          
          this.appwrite.addNotification({
            title: 'System Telemetry Alert Checked',
            message: `Created critical response action task in high-priority database queue.`,
            isRead: false,
            type: 'warning'
          });

          // Create a mock task as well!
          this.appwrite.addTask({
            title: `Investigate telemetry breach trigger: ${rule.matchCriteria}`,
            priority: 'High'
          });
        }
      }, 600);
    });
  }

  clearLogs() {
    this.logs.set([]);
  }

  private addLogEntry(type: 'info' | 'success' | 'warn' | 'error', source: string, message: string) {
    const entry: TerminalLog = {
      timestamp: this.formatTime(new Date()),
      type,
      source,
      message
    };
    this.logs.update(arr => [entry, ...arr].slice(0, 50)); // Cap logs history
  }

  getRuleCardBorder(rule: AutomationRule): string {
    if (!rule.enabled) return 'border-zinc-850/60 opacity-60';
    switch (rule.color) {
      case 'aqua': return 'border-[#20B2AA]/30 bg-[#20B2AA]/5';
      case 'green': return 'border-[#3EB991]/30 bg-[#3EB991]/5';
      case 'purple': return 'border-purple-500/30 bg-purple-500/5';
    }
  }

  getRuleBadgeClass(rule: AutomationRule): string {
    if (!rule.enabled) return 'bg-zinc-950 text-zinc-500 border-zinc-800';
    switch (rule.color) {
      case 'aqua': return 'bg-[#20B2AA]/10 text-[#20B2AA] border-[#20B2AA]/20';
      case 'green': return 'bg-[#3EB991]/10 text-[#3EB991] border-[#3EB991]/20';
      case 'purple': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  }

  private formatTime(date: Date): string {
    const hrs = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const secs = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${hrs}:${mins}:${secs}.${ms}`;
  }
}
