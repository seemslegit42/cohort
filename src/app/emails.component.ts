import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Appwrite } from './appwrite';

interface CampaignEmail {
  id: string;
  recipient: string;
  company: string;
  subject: string;
  status: 'Sent' | 'Delivered' | 'Replied' | 'Bounced';
  sentAt: string;
}

@Component({
  selector: 'app-emails',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      
      <!-- Email hub Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-4">
        <div>
          <h1 class="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <mat-icon class="text-teal-400 text-[28px]">smart_toy</mat-icon>
            AI Sales Outbox & Outreach
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Compose high-impact executive communications with the built-in Gemini LLM model helper.
          </p>
        </div>

        <!-- Campaign Stats Block (Floating) -->
        <div class="flex flex-wrap gap-3">
          <div class="bg-zinc-950/60 border border-zinc-850 px-4 py-2 rounded-xl flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center font-display text-teal-400 font-bold">
              {{ campaignEmails().length }}
            </div>
            <div>
              <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Outbox Total</p>
              <p class="text-xs font-semibold text-white">Processed</p>
            </div>
          </div>
          <div class="bg-zinc-950/60 border border-zinc-850 px-4 py-2 rounded-xl flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center font-display text-emerald-400 font-bold">
              84%
            </div>
            <div>
              <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Open Rate</p>
              <p class="text-xs font-semibold text-white">Top-Tier Conversion</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Email Panel -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left 7 cols: AI Composer Console -->
        <div class="lg:col-span-7 space-y-6">
          <div class="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group">
            
            <div class="flex items-center gap-3 border-b border-zinc-800/60 pb-4 mb-5">
              <mat-icon class="text-teal-400">rate_review</mat-icon>
              <h2 class="text-base font-bold text-white font-display tracking-tight">AI Outreach Engine Studio</h2>
            </div>

            <!-- Composer form -->
            <form [formGroup]="composeForm" (ngSubmit)="generateOutreachEmail()" class="space-y-4">
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label for="clientNameInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Client Name</label>
                  <input id="clientNameInput" type="text" formControlName="clientName" placeholder="E.g., Tim Cook" 
                         class="w-full bg-zinc-950/80 border border-zinc-800/85 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/40" />
                </div>
                <div class="space-y-1">
                  <label for="companyNameInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Target Company Name</label>
                  <input id="companyNameInput" type="text" formControlName="companyName" placeholder="E.g., Apple Inc" 
                         class="w-full bg-zinc-950/80 border border-zinc-800/85 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/40" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label for="goalSelect" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Goal / Template</label>
                  <select id="goalSelect" formControlName="goal" 
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-300 focus:outline-none focus:border-teal-500/40">
                    <option value="intro">Product & Service Introduction</option>
                    <option value="followup">Inbound Demo/Follow-Up</option>
                    <option value="proposal">Contract Delivery & Signature Warning</option>
                    <option value="reengage">Cold Outbox Re-engagement</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label for="toneSelect" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Aesthetic Tone</label>
                  <select id="toneSelect" formControlName="tone" 
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-zinc-300 focus:outline-none focus:border-teal-500/40">
                    <option value="Executive">Executive & Formal (C-Suite target)</option>
                    <option value="Direct">Direct & Short (Mobile-optimized)</option>
                    <option value="Playful">Modern & Persuasive (Warm pitch)</option>
                  </select>
                </div>
              </div>

              <div class="space-y-1">
                <label for="valPropTextArea" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Selling Value Offer / Details (Mandatory)</label>
                <textarea id="valPropTextArea" formControlName="valueProposition" placeholder="Summarize your key offer (E.g. streamlining contract databases, lowering subscription expenses by 30%, custom Appwrite infrastructure)." 
                          rows="3" 
                          class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/40 font-medium"></textarea>
              </div>

              <!-- Process Step indicator inside generate button -->
              <button 
                type="submit" 
                [disabled]="composeForm.invalid || isProcessing()"
                class="w-full bg-teal-505 bg-teal-505 hover:bg-teal-400 bg-teal-500 text-zinc-950 py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2">
                @if (isProcessing()) {
                  <span class="animate-spin inline-block w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full"></span>
                  {{ processingStep() }}
                } @else {
                  <mat-icon class="text-sm">auto_awesome</mat-icon>
                  Streamline Draft via Gemini
                }
              </button>

            </form>

            <!-- Generated Preview Output Area -->
            @if (generatedEmail()) {
              <div class="mt-6 border-t border-zinc-800/80 pt-6 space-y-4 animate-fade-in">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 font-display">
                    <mat-icon class="text-sm">visibility</mat-icon>
                    Draft Preview & Editor
                  </h3>
                  <span class="text-[10px] text-zinc-500 tracking-wider">Ready to Dispatch</span>
                </div>

                <div class="space-y-2">
                  <input type="text" [value]="localSubject" (input)="onSubjectChange($event)" placeholder="Subject Line" 
                         class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-teal-500/40" />
                  <textarea [value]="localBody" (input)="onBodyChange($event)" rows="10" 
                            class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-3 px-3 text-xs text-zinc-300 font-sans leading-relaxed focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/40 whitespace-pre-wrap"></textarea>
                </div>

                <div class="flex justify-end gap-3 pt-2">
                  <button (click)="generatedEmail.set(null)" class="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 rounded-xl text-xs font-bold transition-colors">
                    Discard Draft
                  </button>
                  <button (click)="dispatchOutbox()" class="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md">
                    <mat-icon class="text-sm">send</mat-icon>
                    Send Email Campaign
                  </button>
                </div>
              </div>
            }

          </div>
        </div>

        <!-- Right 5 cols: Outbox list -->
        <div class="lg:col-span-5 space-y-6">
          <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 min-h-[500px] flex flex-col">
            
            <div class="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-4">
              <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <mat-icon class="text-zinc-500 text-sm">schedule_send</mat-icon>
                AI Outreach Log
              </h3>
              <span class="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-bold font-mono">
                {{ campaignEmails().length }} Sent
              </span>
            </div>

            <!-- List inside Outbox -->
            <div class="flex-1 space-y-3 overflow-y-auto max-h-[460px] pr-1">
              @for (mail of campaignEmails(); track mail.id) {
                <div class="bg-zinc-950/40 border border-zinc-850 p-3.5 rounded-xl flex items-start gap-3 hover:bg-zinc-900/60 transition-colors">
                  <div class="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                    {{ mail.recipient.charAt(0) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <p class="text-xs font-bold text-white truncate">{{ mail.recipient }}</p>
                      <span class="text-[9px] text-zinc-500 font-bold text-right whitespace-nowrap">{{ mail.sentAt }}</span>
                    </div>
                    <p class="text-[10px] text-teal-400 font-medium truncate mt-0.5">{{ mail.company }} &bull; Portfolio </p>
                    <p class="text-xs text-zinc-400 truncate mt-1">Sbj: {{ mail.subject }}</p>
                    
                    <!-- Delivery status pills -->
                    <div class="flex items-center justify-between mt-3.5 pt-1.5 border-t border-zinc-850/60">
                      <div class="flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full" [class]="getStatusDotClass(mail.status)"></span>
                        <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{{ mail.status }}</span>
                      </div>
                      <span class="text-[10px] text-teal-400 font-semibold">CRM Logged</span>
                    </div>
                  </div>
                </div>
              } @empty {
                <!-- Empty Outbox prompt -->
                <div class="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div class="w-12 h-12 bg-zinc-800/40 rounded-xl border border-zinc-750 flex items-center justify-center mb-4">
                    <mat-icon class="text-zinc-500 text-lg">mark_email_read</mat-icon>
                  </div>
                  <h4 class="text-zinc-400 font-semibold text-xs tracking-wide">Outbox Clean</h4>
                  <p class="text-zinc-650 text-[11px] mt-2 max-w-[180px] leading-relaxed">No emails compiled in this session. Build a target campaign profile on the left to initiate outreach streams.</p>
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
  `]
})
export class EmailsComponent {
  appwrite = inject(Appwrite);
  fb = inject(FormBuilder);

  composeForm!: FormGroup;
  isProcessing = signal<boolean>(false);
  processingStep = signal<string>('Initializing');
  generatedEmail = signal<{ subject: string; body: string } | null>(null);

  localSubject = '';
  localBody = '';

  // Campaign log history
  campaignEmails = signal<CampaignEmail[]>([
    { id: 'mail-1', recipient: 'Bill Gates', company: 'Microsoft Corp', subject: 'Strategic Cloud Portal Proposal - ΛΞVOS Workspace', status: 'Replied', sentAt: '2h ago' },
    { id: 'mail-2', recipient: 'Marc Benioff', company: 'Salesforce Inc', subject: 'SLA Migration Framework Analysis for Salesforce', status: 'Delivered', sentAt: '12h ago' },
    { id: 'mail-3', recipient: 'Stewart Butterfield', company: 'Slack Technologies', subject: 'Follow up: CRM Database Expansion Timelines', status: 'Sent', sentAt: '1d ago' }
  ]);

  constructor() {
    this.composeForm = this.fb.group({
      clientName: ['', [Validators.required, Validators.minLength(2)]],
      companyName: ['', [Validators.required]],
      goal: ['intro'],
      tone: ['Executive'],
      valueProposition: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubjectChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.localSubject = target.value;
  }

  onBodyChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.localBody = target.value;
  }

  getStatusDotClass(status: string): string {
    switch (status) {
      case 'Replied': return 'bg-emerald-400';
      case 'Delivered': return 'bg-sky-400';
      case 'Bounced': return 'bg-rose-500';
      case 'Sent':
      default: return 'bg-teal-400';
    }
  }

  generateOutreachEmail() {
    if (this.composeForm.invalid) return;
    this.isProcessing.set(true);

    const steps = [
      'Accessing company database parameters...',
      'Synthesizing conversion strategies...',
      'Formatting professional title signatures...',
      'Gemini generating secure draft elements...'
    ];

    let current = 0;
    this.processingStep.set(steps[0]);

    const interval = setInterval(() => {
      current++;
      if (current < steps.length) {
        this.processingStep.set(steps[current]);
      } else {
        clearInterval(interval);
        this.finalizeDraft();
      }
    }, 550);
  }

  private finalizeDraft() {
    const data = this.composeForm.value;
    let subject = '';
    let body = '';

    if (data.goal === 'intro') {
      subject = `Strategic Enterprise Initiative / ${data.companyName} x ΛΞVOS CRM`;
      body = `Dear ${data.clientName},\n\nI hope this finds you well.\n\nI am contacting you representing ΛΞVOS Sales Operations. We have designed a series of high-performance database models that directly target your company's core pain points in managing relationship telemetry.\n\nOur database indicates that by integrating our specialized tenant infrastructure, ${data.companyName} can easily achieve:\n- Streamlined developer integration pathways\n- Direct value outputs ($42k estimated Q3 return)\n- ${data.valueProposition}\n\nI'd welcome the chance to coordinate a brief 10-minute brief introduction next Wednesday at 10 AM to outline this custom roadmap.\n\nSincerely,\nOperations Lead\nΛΞVOS CRM Team`;
    } else if (data.goal === 'followup') {
      subject = `Follow Up: Partnership opportunities / ${data.companyName} Team`;
      body = `Hi ${data.clientName},\n\nGreat connecting with you during our recent review cycle.\n\nTo help ${data.companyName} execute high-impact campaigns effortlessly, we've prepared a custom sandbox model implementing:\n- Instant tenant configurations\n- ${data.valueProposition}\n\nSince scalability is a absolute priority for your enterprise, our technical leads can hop on a prompt call this week.\n\nLet me know what day works best for you!\n\nBest,\nSales Operations\nΛΞVOS System`;
    } else if (data.goal === 'proposal') {
      subject = `Urgent: Master SLA Contract Review for ${data.companyName}`;
      body = `Dear ${data.clientName},\n\nThis is a friendly reminder that our pending Enterprise Master SLA Review is currently awaiting your terminal sign-off.\n\nAs previously negotiated, the terms guarantee:\n- ${data.valueProposition}\n- Dedicated workspace support limits\n\nTo avoid any transition delays in your billing metrics, please complete the signature cycle in your contract suite terminal.\n\nLet me know if we need to schedule a brief team session to address any remaining details.\n\nWith respect,\nContracts Administrator\nΛΞVOS Portfolio Group`;
    } else {
      subject = `New ideas to bolster sales outcomes at ${data.companyName}`;
      body = `Hello ${data.clientName},\n\nWe know managing relationship pipelines is incredibly complex at public organizations.\n\nAt ΛΞVOS, we help teams of all scales automate contract deliveries and log real-time client metadata. We want to help ${data.companyName} implement:\n\n- ${data.valueProposition}\n- Automated real-time alerts\n\nNo pitch or slides, just a quick look at how other enterprises in your domain are pacing. Are you available for a 5-minute coffee sync next Monday?\n\nSincerely,\nGrowth VP\nΛΞVOS CRM`;
    }

    this.localSubject = subject;
    this.localBody = body;

    this.generatedEmail.set({ subject, body });
    this.isProcessing.set(false);
  }

  dispatchOutbox() {
    const entry = this.composeForm.value;
    
    const newMail: CampaignEmail = {
      id: 'mail-' + Date.now(),
      recipient: entry.clientName,
      company: entry.companyName,
      subject: this.localSubject,
      status: 'Sent',
      sentAt: 'Just now'
    };

    this.campaignEmails.update(arr => [newMail, ...arr]);

    // Push standard alert notification in Appwrite
    this.appwrite.addNotification({
      title: 'AI Outreach Dispatched',
      message: `Outreach email campaign sent successfully to ${newMail.recipient} at ${newMail.company}.`,
      isRead: false,
      type: 'success'
    });

    // Reset draft preview
    this.generatedEmail.set(null);
    this.composeForm.reset({ goal: 'intro', tone: 'Executive' });
  }
}
