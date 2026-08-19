import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';

export interface CadenceStep {
  id: string;
  stepNumber: number;
  dayDelay: number;
  channel: 'Email' | 'LinkedIn' | 'Phone / Voice' | 'Custom Task' | 'Video Message';
  subject: string;
  templateBody: string;
  variantB?: string;
  openRatePct: number;
  replyRatePct: number;
  active: boolean;
}

export interface CadenceSequence {
  id: string;
  name: string;
  targetPersona: string;
  status: 'Active' | 'Draft' | 'Paused';
  totalEnrolled: number;
  openRate: number;
  replyRate: number;
  meetingsBooked: number;
  steps: CadenceStep[];
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
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-zinc-950 shadow-[0_0_20px_rgba(6,182,212,0.25)] font-bold">
              <mat-icon class="text-[22px]">alt_route</mat-icon>
            </div>
            <div>
              <h1 class="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Autonomous Outbound Cadence Studio</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-normal">Omni-Channel v4.0</span>
              </h1>
              <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">Multi-touch sequence orchestration, dynamic Liquid template merging, and automated voice note synthesis.</p>
            </div>
          </div>
        </div>

        <!-- Header Actions -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <button 
            type="button"
            (click)="testCadenceEnrollment()" 
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px] text-teal-400">person_add</mat-icon>
            <span>Simulate Prospect Run</span>
          </button>

          <button 
            type="button"
            (click)="createNewSequence()" 
            class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer active:scale-95 transition-all">
            <mat-icon class="text-[16px]">add</mat-icon>
            <span>New Cadence Sequence</span>
          </button>
        </div>
      </header>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Enrolled Prospects</span>
            <mat-icon class="text-cyan-400 text-[18px]">people</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ totalEnrolled().toLocaleString() }}</div>
          <div class="text-[11px] text-cyan-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">play_arrow</mat-icon> {{ activeSequences().length }} active automated tracks
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Avg Sequence Open Rate</span>
            <mat-icon class="text-teal-400 text-[18px]">mark_email_read</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ avgOpenRate() }}%</div>
          <div class="text-[11px] text-teal-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">arrow_upward</mat-icon> +14% vs industry baseline
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Positive Reply Rate</span>
            <mat-icon class="text-emerald-400 text-[18px]">chat</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ avgReplyRate() }}%</div>
          <div class="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">verified</mat-icon> Highly qualified replies
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Meetings Booked</span>
            <mat-icon class="text-purple-400 text-[18px]">event_available</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ totalMeetingsBooked() }} Demos</div>
          <div class="text-[11px] text-purple-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">calendar_month</mat-icon> \${{ (totalMeetingsBooked() * 45000).toLocaleString() }} Pipeline Gen
          </div>
        </div>
      </div>

      <!-- Main Two-Column Layout -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        <!-- Left Column: Sequence Selector List (4 cols) -->
        <div class="xl:col-span-4 space-y-3">
          <div class="flex items-center justify-between px-1">
            <h2 class="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Cadence Tracks</h2>
            <span class="text-[11px] text-zinc-500 font-mono">{{ sequences().length }} Tracks</span>
          </div>

          <div class="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            @for (seq of sequences(); track seq.id) {
              <div 
                (click)="selectedSequenceId.set(seq.id)"
                (keydown.enter)="selectedSequenceId.set(seq.id)"
                tabindex="0"
                role="button"
                [class]="selectedSequenceId() === seq.id ? 'bg-[#0f1d24] border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.12)]' : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80'"
                class="p-4 rounded-2xl border transition-all cursor-pointer text-left group">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span [class]="seq.status === 'Active' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'" class="w-2 h-2 rounded-full"></span>
                      <h3 class="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate font-display">{{ seq.name }}</h3>
                    </div>
                    <p class="text-xs text-zinc-400 mt-0.5">{{ seq.targetPersona }}</p>
                  </div>
                  <span [class]="seq.status === 'Active' ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'" class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0">
                    {{ seq.status }}
                  </span>
                </div>

                <div class="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-zinc-800/60 text-[11px]">
                  <div>
                    <span class="text-zinc-500 block text-[10px]">Prospects</span>
                    <span class="font-bold text-zinc-200 font-mono">{{ seq.totalEnrolled }}</span>
                  </div>
                  <div>
                    <span class="text-zinc-500 block text-[10px]">Open Rate</span>
                    <span class="font-bold text-teal-400 font-mono">{{ seq.openRate }}%</span>
                  </div>
                  <div>
                    <span class="text-zinc-500 block text-[10px]">Meetings</span>
                    <span class="font-bold text-purple-400 font-mono">{{ seq.meetingsBooked }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Right Column: Step Sequence Timeline & Liquid Editor (8 cols) -->
        @if (selectedSequence(); as seq) {
          <div class="xl:col-span-8 space-y-6">
            
            <!-- Sequence Header Banner -->
            <div class="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-xl relative backdrop-blur-2xl">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {{ seq.steps.length }}-Step Omni-Sequence
                    </span>
                    <span class="text-zinc-500 text-xs font-mono">ID: {{ seq.id }}</span>
                  </div>
                  <h2 class="text-xl sm:text-2xl font-bold text-white font-display">{{ seq.name }}</h2>
                  <p class="text-xs sm:text-sm text-zinc-400 mt-1">Targeting: <span class="text-zinc-200 font-medium">{{ seq.targetPersona }}</span></p>
                </div>

                <div class="flex items-center gap-2">
                  <button 
                    type="button"
                    (click)="toggleSequenceStatus(seq)" 
                    [class]="seq.status === 'Active' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'"
                    class="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer">
                    <mat-icon class="text-[16px]">{{ seq.status === 'Active' ? 'pause' : 'play_arrow' }}</mat-icon>
                    <span>{{ seq.status === 'Active' ? 'Pause Cadence' : 'Activate Cadence' }}</span>
                  </button>
                  <button 
                    type="button"
                    (click)="openAddStepModal(seq)" 
                    class="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer">
                    <mat-icon class="text-[16px]">add_circle</mat-icon>
                    <span>Append Step</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Steps Visual Sequence Timeline -->
            <div class="space-y-4">
              <div class="flex items-center justify-between px-1">
                <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Step-by-Step Touchpoints</h3>
                <span class="text-xs text-cyan-400 font-mono font-semibold">Total Duration: ~{{ getTotalDuration(seq) }} Business Days</span>
              </div>

              @for (step of seq.steps; track step.id; let idx = $index) {
                <div class="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 relative hover:border-zinc-700 transition-all">
                  
                  <!-- Step Top Bar -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xs font-bold text-cyan-400 font-mono">
                        #{{ step.stepNumber }}
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <span [class]="getChannelBadgeClass(step.channel)" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1">
                            <mat-icon class="text-[12px]">{{ getChannelIcon(step.channel) }}</mat-icon>
                            <span>{{ step.channel }}</span>
                          </span>
                          <span class="text-xs text-zinc-400 font-mono">Day {{ step.dayDelay }}</span>
                        </div>
                        <h4 class="text-sm font-bold text-white mt-1">{{ step.subject }}</h4>
                      </div>
                    </div>

                    <div class="flex items-center gap-3 self-end sm:self-center text-xs">
                      <div class="text-right font-mono">
                        <span class="text-[10px] text-zinc-500 block">Open / Reply</span>
                        <span class="text-teal-400 font-bold">{{ step.openRatePct }}%</span> / <span class="text-emerald-400 font-bold">{{ step.replyRatePct }}%</span>
                      </div>
                      <button (click)="previewMergedTemplate(step)" class="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer">
                        <mat-icon class="text-[14px]">preview</mat-icon> Preview
                      </button>
                    </div>
                  </div>

                  <!-- Template Content Body -->
                  <div class="pt-3.5">
                    <p class="text-xs text-zinc-300 font-mono whitespace-pre-line bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
                      {{ step.templateBody }}
                    </p>
                  </div>

                </div>
              }
            </div>

          </div>
        }

      </div>

      <!-- Merged Template Live Preview Modal -->
      @if (previewStep()) {
        <div class="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4" (click)="previewStep.set(null)">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div class="flex items-center gap-2">
                <mat-icon class="text-cyan-400 text-[20px]">visibility</mat-icon>
                <h3 class="text-sm font-bold text-white font-display">Liquid Variable Merge Preview</h3>
              </div>
              <button (click)="previewStep.set(null)" class="text-zinc-500 hover:text-white">
                <mat-icon class="text-[20px]">close</mat-icon>
              </button>
            </div>

            <div class="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs space-y-1">
              <div class="flex justify-between text-zinc-400">
                <span>Simulated Prospect:</span>
                <span class="text-white font-semibold">Sarah Connor (CTO, Apex Cybernetics)</span>
              </div>
              <div class="flex justify-between text-zinc-400">
                <span>Recent Trigger Event:</span>
                <span class="text-teal-400 font-semibold">Series-B \$42M Funding Round</span>
              </div>
            </div>

            <div class="space-y-2">
              <span class="text-[11px] font-bold uppercase text-zinc-400">Merged Payload Output:</span>
              <div class="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 whitespace-pre-line leading-relaxed font-sans">
                {{ getHydratedTemplate(previewStep()!.templateBody) }}
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button (click)="previewStep.set(null)" class="px-4 py-2 bg-zinc-800 text-white rounded-xl text-xs font-semibold">Close Preview</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CadencesComponent {
  appwrite = inject(Appwrite);

  selectedSequenceId = signal<string>('cad-1');
  previewStep = signal<CadenceStep | null>(null);

  sequences = signal<CadenceSequence[]>([
    {
      id: 'cad-1',
      name: 'Enterprise VP of Engineering / CTO Outreach',
      targetPersona: 'VP Eng, CTO, Chief Architect in Series B-D FinTech',
      status: 'Active',
      totalEnrolled: 342,
      openRate: 64,
      replyRate: 22,
      meetingsBooked: 28,
      steps: [
        {
          id: 's-1',
          stepNumber: 1,
          dayDelay: 1,
          channel: 'Email',
          subject: '{{contact.firstName}} - telemetry scalability at {{company.name}}',
          templateBody: `Hi {{contact.firstName}},\n\nSaw {{company.name}}'s recent expansion into {{company.industryDomain}}. Rapid data ingestion often causes latency bottlenecks in standard message brokers.\n\nWe built a zero-latency unified architecture that eliminated 85% of middleware overhead for high-tempo engineering teams.\n\nOpen to a brief 8-minute architectural breakdown this Thursday?`,
          openRatePct: 78,
          replyRatePct: 18,
          active: true
        },
        {
          id: 's-2',
          stepNumber: 2,
          dayDelay: 3,
          channel: 'LinkedIn',
          subject: 'Connection Request & InMail Thought-Leadership',
          templateBody: `Hi {{contact.firstName}} - loved your team's engineering blog post on event streaming. Dropping a quick note here as well regarding our telemetry benchmark whitepaper.`,
          openRatePct: 62,
          replyRatePct: 24,
          active: true
        },
        {
          id: 's-3',
          stepNumber: 3,
          dayDelay: 6,
          channel: 'Phone / Voice',
          subject: 'AI Voice Memo / Follow-up Call Script',
          templateBody: `Leave 30-sec punchy voicemail referencing the latency reduction numbers achieved by similar FinTech engineering departments.`,
          openRatePct: 45,
          replyRatePct: 12,
          active: true
        },
        {
          id: 's-4',
          stepNumber: 4,
          dayDelay: 10,
          channel: 'Email',
          subject: 'Quick resource: benchmark report for {{company.name}}',
          templateBody: `Hey {{contact.firstName}},\n\nPutting this on your radar in case you're tackling Q4 latency quotas. Here is our 4-page independent stress test report.\n\nLet me know if this aligns with what your team is seeing.\n\nBest,\nRevOps Team`,
          openRatePct: 58,
          replyRatePct: 31,
          active: true
        }
      ]
    },
    {
      id: 'cad-2',
      name: 'RevOps & Sales Leadership Inbound Fast-Track',
      targetPersona: 'Head of RevOps, VP of Sales, CRO',
      status: 'Active',
      totalEnrolled: 188,
      openRate: 72,
      replyRate: 29,
      meetingsBooked: 24,
      steps: [
        {
          id: 's-5',
          stepNumber: 1,
          dayDelay: 1,
          channel: 'Email',
          subject: 'Fixing pipeline leakage at {{company.name}}',
          templateBody: `Hi {{contact.firstName}},\n\nMost revenue leaders we speak with lose 20-30% of forecast accuracy due to disconnected CRM updates.\n\nOur system updates signals in real-time with zero rep admin friction.\n\nWorth a 10-minute preview next week?`,
          openRatePct: 82,
          replyRatePct: 34,
          active: true
        },
        {
          id: 's-6',
          stepNumber: 2,
          dayDelay: 4,
          channel: 'Video Message',
          subject: 'Loom screen preview of {{company.name}} deal room',
          templateBody: `Short 45-second personalized screen recording walking through our automated Monte Carlo forecast engine.`,
          openRatePct: 69,
          replyRatePct: 26,
          active: true
        }
      ]
    },
    {
      id: 'cad-3',
      name: 'Cold Outbound Security & CISO Sequence',
      targetPersona: 'CISO, VP Information Security, Compliance Officers',
      status: 'Draft',
      totalEnrolled: 0,
      openRate: 0,
      replyRate: 0,
      meetingsBooked: 0,
      steps: [
        {
          id: 's-7',
          stepNumber: 1,
          dayDelay: 1,
          channel: 'Email',
          subject: 'SOC2 / ISO27001 Cryptographic Audit for {{company.name}}',
          templateBody: `Hi {{contact.firstName}},\n\nReaching out regarding key management and tenant isolation standards in multi-tenant environments...`,
          openRatePct: 0,
          replyRatePct: 0,
          active: true
        }
      ]
    }
  ]);

  selectedSequence = computed(() => {
    return this.sequences().find(s => s.id === this.selectedSequenceId()) || this.sequences()[0];
  });

  totalEnrolled = computed(() => {
    return this.sequences().reduce((sum, s) => sum + s.totalEnrolled, 0);
  });

  activeSequences = computed(() => {
    return this.sequences().filter(s => s.status === 'Active');
  });

  avgOpenRate = computed(() => {
    const active = this.activeSequences();
    if (!active.length) return 0;
    return Math.round(active.reduce((sum, s) => sum + s.openRate, 0) / active.length);
  });

  avgReplyRate = computed(() => {
    const active = this.activeSequences();
    if (!active.length) return 0;
    return Math.round(active.reduce((sum, s) => sum + s.replyRate, 0) / active.length);
  });

  totalMeetingsBooked = computed(() => {
    return this.sequences().reduce((sum, s) => sum + s.meetingsBooked, 0);
  });

  getTotalDuration(seq: CadenceSequence): number {
    return seq.steps.reduce((max, s) => Math.max(max, s.dayDelay), 0);
  }

  getChannelIcon(channel: CadenceStep['channel']): string {
    switch (channel) {
      case 'Email': return 'mail';
      case 'LinkedIn': return 'share';
      case 'Phone / Voice': return 'call';
      case 'Video Message': return 'videocam';
      case 'Custom Task': return 'task_alt';
    }
  }

  getChannelBadgeClass(channel: CadenceStep['channel']): string {
    switch (channel) {
      case 'Email': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'LinkedIn': return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Phone / Voice': return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Video Message': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'Custom Task': return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  }

  toggleSequenceStatus(seq: CadenceSequence) {
    seq.status = seq.status === 'Active' ? 'Paused' : 'Active';
    this.sequences.update(list => [...list]);
    this.appwrite.addNotification({
      title: 'Sequence Updated',
      message: `"${seq.name}" is now ${seq.status}.`,
      type: 'info'
    });
  }

  previewMergedTemplate(step: CadenceStep) {
    this.previewStep.set(step);
  }

  getHydratedTemplate(raw: string): string {
    return raw
      .replace(/\{\{contact\.firstName\}\}/g, 'Sarah')
      .replace(/\{\{company\.name\}\}/g, 'Apex Cybernetics')
      .replace(/\{\{company\.industryDomain\}\}/g, 'Tier-1 High-Frequency FinTech');
  }

  testCadenceEnrollment() {
    const current = this.selectedSequence();
    if (current) {
      current.totalEnrolled += 1;
      this.sequences.update(list => [...list]);
      this.appwrite.addNotification({
        title: 'Prospect Enrolled',
        message: `Simulated prospect "Sarah Connor" enrolled into Step 1 of "${current.name}".`,
        type: 'success'
      });
    }
  }

  createNewSequence() {
    const newSeq: CadenceSequence = {
      id: 'cad-' + Date.now(),
      name: 'Strategic Account Expansion Track',
      targetPersona: 'Existing Account Champions & Procurement',
      status: 'Active',
      totalEnrolled: 1,
      openRate: 80,
      replyRate: 35,
      meetingsBooked: 1,
      steps: [
        {
          id: 's-' + Date.now(),
          stepNumber: 1,
          dayDelay: 1,
          channel: 'Email',
          subject: 'Expanding {{company.name}} license capabilities for Q4',
          templateBody: `Hi {{contact.firstName}},\n\nChecking in on team adoption after the initial pilot rollout...`,
          openRatePct: 80,
          replyRatePct: 35,
          active: true
        }
      ]
    };

    this.sequences.update(list => [newSeq, ...list]);
    this.selectedSequenceId.set(newSeq.id);
    this.appwrite.addNotification({
      title: 'Cadence Track Created',
      message: `Created new outbound sequence "${newSeq.name}".`,
      type: 'success'
    });
  }

  openAddStepModal(seq: CadenceSequence) {
    const nextNum = seq.steps.length + 1;
    const lastDelay = seq.steps.length ? seq.steps[seq.steps.length - 1].dayDelay : 1;

    seq.steps.push({
      id: 's-' + Date.now(),
      stepNumber: nextNum,
      dayDelay: lastDelay + 3,
      channel: 'Email',
      subject: `Step ${nextNum}: Follow-up check with {{contact.firstName}}`,
      templateBody: `Hi {{contact.firstName}},\n\nFollowing up on my previous note regarding {{company.name}}...`,
      openRatePct: 55,
      replyRatePct: 20,
      active: true
    });

    this.sequences.update(list => [...list]);
    this.appwrite.addNotification({
      title: 'Step Appended',
      message: `Appended Step #${nextNum} to "${seq.name}".`,
      type: 'info'
    });
  }
}
