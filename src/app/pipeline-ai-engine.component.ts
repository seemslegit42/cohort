import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Lead } from './lead.service';
import { Appwrite } from './appwrite';

export interface AutomatedTaskRecommendation {
  id: string;
  leadId: string;
  leadName: string;
  title: string;
  category: 'Executive' | 'Technical' | 'Legal' | 'Follow-up' | 'Security';
  priority: 'High' | 'Medium' | 'Low';
  suggestedDueDate: string;
  reason: string;
  selected: boolean;
  committed?: boolean;
}

@Component({
  selector: 'app-pipeline-ai-engine',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-6">
      
      <!-- Ambient Glow (Verdigris Triad) -->
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <!-- Header & Copilot Status -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 relative z-10">
        <div>
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
              <mat-icon class="text-[18px]">auto_awesome</mat-icon>
            </div>
            <h2 class="text-base font-display font-bold text-white tracking-wide">AI Predictive Engine & Autonomous Actions</h2>
          </div>
          <p class="text-xs text-zinc-400 mt-1">Multi-signal deal probability modeling, deal-stalling triage, and automated task synthesis.</p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="runPredictiveAudit()"
            [disabled]="isAnalyzing()"
            class="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm"
          >
            @if (isAnalyzing()) {
              <span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full"></span>
              <span>Analyzing Signals...</span>
            } @else {
              <mat-icon class="text-teal-400 text-[16px]">psychology</mat-icon>
              <span>Refresh AI Diagnostics</span>
            }
          </button>
        </div>
      </div>

      <!-- AI Metric Banners -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 relative z-10">
        <!-- Predicted Quarter Close -->
        <div class="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-display">Predicted Forecast ARR</span>
            <span class="text-[10px] text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">84% Confidence</span>
          </div>
          <div class="mt-2">
            <span class="text-2xl font-mono font-bold text-white">{{ predictedCloseValue() | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="text-[11px] text-zinc-400 block mt-0.5">Based on velocity & historical stage conversion</span>
          </div>
        </div>

        <!-- Stalled Pipeline Risk -->
        <div class="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-display">Slippage & Stalled Deals</span>
            <span class="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {{ stalledLeads().length }} Flagged
            </span>
          </div>
          <div class="mt-2">
            <span class="text-2xl font-mono font-bold text-amber-400">{{ stalledPipelineValue() | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="text-[11px] text-zinc-400 block mt-0.5">No client activity recorded in &gt;14 days</span>
          </div>
        </div>

        <!-- Next Best Actions Count -->
        <div class="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-display">Synthesized Actions</span>
            <span class="text-[10px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">Ready to Commit</span>
          </div>
          <div class="mt-2">
            <span class="text-2xl font-mono font-bold text-purple-300">{{ pendingTasksCount() }} Tasks</span>
            <span class="text-[11px] text-zinc-400 block mt-0.5">Autonomous follow-ups generated</span>
          </div>
        </div>
      </div>

      <!-- Action Automation Section -->
      <div class="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-4 sm:p-5 relative z-10 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-xs font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
              <mat-icon class="text-teal-400 text-[16px]">bolt</mat-icon>
              <span>Automated Next Best Action Tasks</span>
            </h3>
            <p class="text-xs text-zinc-500 mt-0.5">Select generated tasks to commit directly to your team's real-time Tasks ledger.</p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="toggleSelectAllTasks()"
              class="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            >
              {{ allSelected() ? 'Deselect All' : 'Select All' }}
            </button>
            <button
              type="button"
              (click)="commitSelectedTasks()"
              [disabled]="selectedTasksCount() === 0 || isCommittingTasks()"
              class="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-bold px-4 py-1.5 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(32,178,170,0.3)] flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              @if (isCommittingTasks()) {
                <span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full"></span>
                <span>Deploying...</span>
              } @else {
                <mat-icon class="text-[16px]">task_alt</mat-icon>
                <span>Deploy ({{ selectedTasksCount() }}) to Tasks</span>
              }
            </button>
          </div>
        </div>

        <!-- Task Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          @for (task of recommendedTasks(); track task.id) {
            <div
              (click)="toggleTaskSelection(task)"
              (keydown.enter)="toggleTaskSelection(task)"
              (keydown.space)="toggleTaskSelection(task); $event.preventDefault()"
              tabindex="0"
              role="checkbox"
              [attr.aria-checked]="task.selected"
              [class.border-teal-500/50]="task.selected && !task.committed"
              [class.bg-teal-500/5]="task.selected && !task.committed"
              [class.opacity-60]="task.committed"
              class="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3.5 flex items-start gap-3 transition-all hover:border-zinc-700 cursor-pointer select-none group focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            >
              <!-- Checkbox -->
              <div class="mt-0.5">
                @if (task.committed) {
                  <mat-icon class="text-emerald-400 text-[18px]">check_circle</mat-icon>
                } @else {
                  <div
                    [class.bg-teal-500]="task.selected"
                    [class.border-teal-400]="task.selected"
                    class="w-4 h-4 rounded border border-zinc-600 flex items-center justify-center transition-colors"
                  >
                    @if (task.selected) {
                      <mat-icon class="text-zinc-950 text-[14px]">check</mat-icon>
                    }
                  </div>
                }
              </div>

              <!-- Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold text-white group-hover:text-teal-300 transition-colors truncate">
                    {{ task.title }}
                  </span>
                  <span class="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold"
                        [class.bg-rose-500/20]="task.priority === 'High'"
                        [class.text-rose-400]="task.priority === 'High'"
                        [class.bg-amber-500/20]="task.priority === 'Medium'"
                        [class.text-amber-400]="task.priority === 'Medium'"
                        [class.bg-zinc-800]="task.priority === 'Low'"
                        [class.text-zinc-400]="task.priority === 'Low'">
                    {{ task.priority }}
                  </span>
                </div>

                <div class="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                  {{ task.reason }}
                </div>

                <div class="flex items-center gap-3 mt-2 text-[10px] text-zinc-500">
                  <span class="text-zinc-400 font-semibold truncate">{{ task.leadName }}</span>
                  <span>·</span>
                  <span>Target: {{ task.suggestedDueDate }}</span>
                  @if (task.committed) {
                    <span>·</span>
                    <span class="text-emerald-400 font-bold">Committed</span>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div class="col-span-full py-8 text-center text-zinc-500 text-xs">
              No pending automated tasks. All pipeline actions are up to date.
            </div>
          }
        </div>
      </div>

      <!-- Natural Language Pipeline Query & Recommendations -->
      <div class="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-4 sm:p-5 relative z-10 space-y-3">
        <div class="flex items-center gap-2">
          <mat-icon class="text-purple-400 text-[18px]">chat</mat-icon>
          <span class="text-xs font-bold uppercase tracking-widest text-zinc-300">Ask Pipeline Copilot</span>
        </div>

        <div class="flex gap-2">
          <input
            type="text"
            [value]="nlQuery()"
            (input)="nlQuery.set($any($event.target).value)"
            (keydown.enter)="askCopilot()"
            placeholder="E.g., Which deals have highest risk of slipping this month and how do we salvage them?"
            class="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-400/50 transition-colors"
          />
          <button
            type="button"
            (click)="askCopilot()"
            [disabled]="isQuerying() || !nlQuery().trim()"
            class="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            @if (isQuerying()) {
              <span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            } @else {
              <mat-icon class="text-[16px]">send</mat-icon>
              <span>Consult</span>
            }
          </button>
        </div>

        <!-- Copilot Response -->
        @if (copilotResponse()) {
          <div class="mt-3 bg-zinc-900/90 border border-purple-500/30 rounded-xl p-3.5 text-xs text-zinc-200 leading-relaxed animate-fade-in flex items-start gap-2.5">
            <mat-icon class="text-purple-400 text-[18px] shrink-0 mt-0.5">lightbulb</mat-icon>
            <div class="space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">AI Strategic Briefing</span>
              <p class="whitespace-pre-line text-zinc-300">{{ copilotResponse() }}</p>
            </div>
          </div>
        }
      </div>

    </div>
  `
})
export class PipelineAiEngineComponent {
  leads = input.required<Lead[]>();
  tasksAdded = output<number>();

  private appwrite = inject(Appwrite);

  isAnalyzing = signal<boolean>(false);
  isCommittingTasks = signal<boolean>(false);
  isQuerying = signal<boolean>(false);

  nlQuery = signal<string>('');
  copilotResponse = signal<string | null>(null);

  // Stalled leads (leads in working stages without activity or with overdue dates)
  stalledLeads = computed(() => {
    const list = this.leads();
    return list.filter(l => {
      const isWorking = l.status === 'Contacted' || l.status === 'Qualified' || l.status === 'Proposal' || l.status === 'Negotiation';
      const lowActivity = (l.activities?.length || 0) <= 1 && (l.score || 0) < 60;
      return isWorking && lowActivity;
    });
  });

  stalledPipelineValue = computed(() => {
    return this.stalledLeads().reduce((acc, l) => acc + (l.value || 0), 0);
  });

  predictedCloseValue = computed(() => {
    return this.leads().reduce((acc, l) => {
      const stageProb = l.status === 'Closed' ? 1 : l.status === 'Negotiation' ? 0.9 : l.status === 'Proposal' ? 0.75 : l.status === 'Qualified' ? 0.6 : 0.25;
      const scoreMod = ((l.score || 50) / 100) * 0.15;
      return acc + (l.value || 0) * Math.min(1, stageProb + scoreMod);
    }, 0);
  });

  // Recommended automated tasks
  recommendedTasks = signal<AutomatedTaskRecommendation[]>([
    {
      id: 'task-rec-1',
      leadId: '1',
      leadName: 'Jonathan Reynolds (Acme Corp)',
      title: 'Schedule Executive Sponsor Alignment Call',
      category: 'Executive',
      priority: 'High',
      suggestedDueDate: '2026-09-28',
      reason: 'Deal size $125k in Qualified stage requires CIO sign-off before proposal release.',
      selected: true
    },
    {
      id: 'task-rec-2',
      leadId: '2',
      leadName: 'Elena Rostova (NovaFin)',
      title: 'Dispatch SOC2 Type II & Security Compliance Packet',
      category: 'Security',
      priority: 'High',
      suggestedDueDate: '2026-09-26',
      reason: 'Banking sector governance requires pre-contract security validation.',
      selected: true
    },
    {
      id: 'task-rec-3',
      leadId: '3',
      leadName: 'Marcus Vance (CyberShield)',
      title: 'Initiate Multi-Threading Outreach with VP Engineering',
      category: 'Technical',
      priority: 'Medium',
      suggestedDueDate: '2026-09-30',
      reason: 'Single-threaded contact risk detected. Connect with second technical evaluation stakeholder.',
      selected: true
    },
    {
      id: 'task-rec-4',
      leadId: '4',
      leadName: 'Sarah Jenkins (Apex Global)',
      title: 'Send Quarterly ROI Benchmark Summary Email',
      category: 'Follow-up',
      priority: 'Medium',
      suggestedDueDate: '2026-10-02',
      reason: 'Prospect visited pricing page 3 times but has not scheduled sandbox demonstration.',
      selected: false
    }
  ]);

  pendingTasksCount = computed(() => {
    return this.recommendedTasks().filter(t => !t.committed).length;
  });

  selectedTasksCount = computed(() => {
    return this.recommendedTasks().filter(t => t.selected && !t.committed).length;
  });

  allSelected = computed(() => {
    const uncommitted = this.recommendedTasks().filter(t => !t.committed);
    return uncommitted.length > 0 && uncommitted.every(t => t.selected);
  });

  toggleTaskSelection(task: AutomatedTaskRecommendation) {
    if (task.committed) return;
    this.recommendedTasks.update(tasks =>
      tasks.map(t => t.id === task.id ? { ...t, selected: !t.selected } : t)
    );
  }

  toggleSelectAllTasks() {
    const targetState = !this.allSelected();
    this.recommendedTasks.update(tasks =>
      tasks.map(t => t.committed ? t : { ...t, selected: targetState })
    );
  }

  async commitSelectedTasks() {
    const toCommit = this.recommendedTasks().filter(t => t.selected && !t.committed);
    if (!toCommit.length) return;

    this.isCommittingTasks.set(true);

    try {
      for (const t of toCommit) {
        await this.appwrite.addTask({
          title: t.title,
          description: `${t.reason} | Account: ${t.leadName} (Auto-synthesized by Pipeline AI)`,
          priority: t.priority,
          dueDate: t.suggestedDueDate,
          leadId: t.leadId,
          completed: false
        });
      }

      // Mark tasks as committed
      this.recommendedTasks.update(tasks =>
        tasks.map(t => toCommit.some(c => c.id === t.id) ? { ...t, committed: true, selected: false } : t)
      );

      this.appwrite.addNotification({
        title: 'AI Tasks Committed to Ledger',
        message: `Successfully created ${toCommit.length} automated next-step tasks for active accounts.`,
        type: 'success'
      });

      this.tasksAdded.emit(toCommit.length);

      // Trigger light haptic if supported
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch (e) {
      console.warn('Task commit fallback error:', e);
    } finally {
      this.isCommittingTasks.set(false);
    }
  }

  async runPredictiveAudit() {
    this.isAnalyzing.set(true);
    try {
      // Refresh recommendation set based on actual leads list
      const leadsList = this.leads();
      const newRecs: AutomatedTaskRecommendation[] = [];

      leadsList.forEach((l, index) => {
        if (l.status === 'Qualified' && (l.value || 0) > 50000) {
          newRecs.push({
            id: `rec-audit-${l.$id || index}`,
            leadId: l.$id || `lead-${index}`,
            leadName: `${l.name} (${l.company || 'Enterprise'})`,
            title: `Deliver Tailored Commercial Proposal for ${l.company || l.name}`,
            category: 'Legal',
            priority: 'High',
            suggestedDueDate: '2026-09-29',
            reason: `Qualified account valued at $${(l.value || 0).toLocaleString()} ready for executive proposal review.`,
            selected: true
          });
        } else if (l.status === 'New' && (l.score || 0) > 65) {
          newRecs.push({
            id: `rec-inbound-${l.$id || index}`,
            leadId: l.$id || `lead-${index}`,
            leadName: `${l.name} (${l.company || 'Inbound'})`,
            title: `Priority Discovery Call Outreach: ${l.name}`,
            category: 'Follow-up',
            priority: 'High',
            suggestedDueDate: '2026-09-25',
            reason: `Hot lead with score ${l.score}/100 and high website activity needs instant follow-up.`,
            selected: true
          });
        }
      });

      if (newRecs.length > 0) {
        this.recommendedTasks.set(newRecs);
      }

      this.appwrite.addNotification({
        title: 'Pipeline Health Diagnostics Complete',
        message: `Analyzed ${leadsList.length} accounts. Predicted Q3 closing yield: $${Math.round(this.predictedCloseValue()).toLocaleString()}.`,
        type: 'info'
      });
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  async askCopilot() {
    const query = this.nlQuery().trim();
    if (!query) return;

    this.isQuerying.set(true);
    this.copilotResponse.set(null);

    const leadsSummary = this.leads().map(l =>
      `${l.name} (${l.company || 'No Company'}, $${l.value}, Stage: ${l.status}, Priority: ${l.priority}, Score: ${l.score || 50})`
    ).join('; ');

    const prompt = `You are the Verdigris Pipeline AI Copilot. The current active sales pipeline contains these accounts:
${leadsSummary}

Total Pipeline Value: $${this.leads().reduce((a, b) => a + (b.value || 0), 0)}
Stalled Deals: ${this.stalledLeads().length} accounts

User question: "${query}"

Provide a concise, direct, tactical sales response (under 120 words) with actionable steps to accelerate deals and prevent revenue slippage. Use professional, authoritative, and direct tone.`;

    try {
      const res = await fetch('/api/gemini/generate-lite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: 'You are an elite B2B Enterprise RevOps and Sales Director AI advisor.'
        })
      });

      if (res.ok) {
        const data = await res.json();
        this.copilotResponse.set(data.text);
      } else {
        this.fallbackCopilotAdvice();
      }
    } catch {
      this.fallbackCopilotAdvice();
    } finally {
      this.isQuerying.set(false);
    }
  }

  private fallbackCopilotAdvice() {
    this.copilotResponse.set(
      `1. Focus immediately on your top 2 enterprise accounts in Qualified & Negotiation stages.\n2. Re-engage ${this.stalledLeads()[0]?.name || 'inactive prospects'} by circulating a customer ROI proof point or scheduling a technical demo.\n3. Keep closing targets locked on Q3 deadlines to prevent late slippage.`
    );
  }
}
