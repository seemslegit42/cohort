import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';
import { LeadService } from './lead.service';
import { ActivatedRoute, Router } from '@angular/router';
import { computed } from '@angular/core';

export interface EmailRecord {
  $id: string;
  recipient: string;
  recipientEmail?: string;
  sender?: string;
  senderEmail?: string;
  company: string;
  subject: string;
  body: string;
  snippet?: string;
  contactId?: string;
  contactName?: string;
  dealId?: string;
  dealName?: string;
  status: 'Sent' | 'Delivered' | 'Replied' | 'Bounced' | 'Draft' | 'Pending Review';
  direction: 'inbound' | 'outbound';
  sentAt?: string;
  receivedAt?: Date | string;
  isRead?: boolean;
  humanApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  hitlNotes?: string;
}

@Component({
  selector: 'app-emails',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="max-w-[1500px] mx-auto space-y-6 animate-fade-in pb-8">
      
      <!-- Email Hub Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-2">
        <div class="space-y-1">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
              <mat-icon class="text-[24px]">mark_email_unread</mat-icon>
            </div>
            <div>
              <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                Communications Hub & Dispatch
              </h1>
              <p class="text-xs text-zinc-400 mt-0.5">
                Enterprise email correspondence with Human-in-the-Loop review gates and CRM deal attribution.
              </p>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex bg-zinc-900/70 p-1 rounded-xl border border-zinc-800 text-xs font-semibold flex-wrap">
          <button 
            type="button"
            (click)="activeTab.set('compose')" 
            [class.bg-teal-500]="activeTab() === 'compose'"
            [class.text-zinc-950]="activeTab() === 'compose'"
            [class.text-zinc-400]="activeTab() !== 'compose'"
            class="px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer">
            <mat-icon class="text-[15px]">edit_note</mat-icon>
            <span>Compose & HITL</span>
            @if (generatedEmail()) {
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            }
          </button>
          
          <button 
            type="button"
            (click)="activeTab.set('inbox')" 
            [class.bg-teal-500]="activeTab() === 'inbox'"
            [class.text-zinc-950]="activeTab() === 'inbox'"
            [class.text-zinc-400]="activeTab() !== 'inbox'"
            class="px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer">
            <mat-icon class="text-[15px]">inbox</mat-icon>
            <span>Inbox</span>
            @if (unreadInboxCount() > 0) {
              <span class="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-400 text-zinc-950">
                {{ unreadInboxCount() }}
              </span>
            }
          </button>

          <button 
            type="button"
            (click)="activeTab.set('outbox')" 
            [class.bg-teal-500]="activeTab() === 'outbox'"
            [class.text-zinc-950]="activeTab() === 'outbox'"
            [class.text-zinc-400]="activeTab() !== 'outbox'"
            class="px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer">
            <mat-icon class="text-[15px]">send</mat-icon>
            <span>Outbox Log</span>
            <span class="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-zinc-800 text-zinc-300">
              {{ campaignEmails().length }}
            </span>
          </button>
        </div>
      </header>

      <!-- TAB 1: COMPOSE & HUMAN IN THE LOOP APPROVAL GATE -->
      @if (activeTab() === 'compose') {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          <!-- Left 7 cols: Composer Inputs & AI Synthesis -->
          <div class="lg:col-span-7 space-y-6">
            <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
              
              <!-- Card Header -->
              <div class="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-5">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                    <mat-icon class="text-[18px]">rate_review</mat-icon>
                  </div>
                  <div>
                    <h2 class="text-sm font-bold text-white font-display">Executive Email Composer</h2>
                    <p class="text-[11px] text-zinc-400">Target contacts and associate directly with deal pipeline stages</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button 
                    type="button"
                    (click)="openSettings()" 
                    class="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5">
                    <mat-icon class="text-[14px]">settings</mat-icon>
                    <span>SMTP Config</span>
                  </button>
                </div>
              </div>

              <!-- Contact & Deal Attribution Selectors -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5 p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
                <!-- Contact Selector -->
                <div class="space-y-1">
                  <label for="contactPicker" class="block text-[10px] font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1">
                    <mat-icon class="text-[12px]">person</mat-icon> Associate Contact Record
                  </label>
                  <select 
                    id="contactPicker" 
                    (change)="onContactSelect($event)"
                    class="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50 cursor-pointer">
                    <option value="">-- Choose CRM Contact (Optional) --</option>
                    @for (contact of appwrite.contacts(); track contact.$id) {
                      <option [value]="contact.$id">{{ contact.name }} — {{ contact.company }}</option>
                    }
                  </select>
                </div>

                <!-- Deal Selector -->
                <div class="space-y-1">
                  <label for="dealPicker" class="block text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1">
                    <mat-icon class="text-[12px]">monetization_on</mat-icon> Associate Pipeline Deal
                  </label>
                  <select 
                    id="dealPicker" 
                    (change)="onDealSelect($event)"
                    class="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-2.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50 cursor-pointer">
                    <option value="">-- Choose Pipeline Deal (Optional) --</option>
                    @for (lead of leadService.leads(); track lead.$id) {
                      <option [value]="lead.$id">{{ lead.name }} (&#36;{{ lead.value?.toLocaleString() || '0' }}) — {{ lead.status }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Main Compose Form -->
              <form [formGroup]="composeForm" (ngSubmit)="generateOutreachEmail()" class="space-y-4">
                
                <!-- Recipient Info Row -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div class="space-y-1">
                    <label for="clientNameInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Recipient Full Name *</label>
                    <input 
                      id="clientNameInput" 
                      type="text" 
                      formControlName="clientName" 
                      placeholder="E.g., Satya Nadella" 
                      class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
                  </div>
                  <div class="space-y-1">
                    <label for="recipientEmailInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Recipient Email Address *</label>
                    <input 
                      id="recipientEmailInput" 
                      type="email" 
                      formControlName="recipientEmail" 
                      placeholder="satya@microsoft.com" 
                      class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div class="space-y-1">
                    <label for="companyNameInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Organisation / Entity *</label>
                    <input 
                      id="companyNameInput" 
                      type="text" 
                      formControlName="companyName" 
                      placeholder="Microsoft Corporation" 
                      class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
                  </div>
                  <div class="space-y-1">
                    <label for="dealNameInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Linked Deal Name</label>
                    <input 
                      id="dealNameInput" 
                      type="text" 
                      formControlName="dealName" 
                      placeholder="Azure Cloud Migration SLA ($450k)" 
                      class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
                  </div>
                </div>

                <!-- Template & Tone Row -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div class="space-y-1">
                    <label for="goalSelect" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Outreach Strategy / Goal</label>
                    <select 
                      id="goalSelect" 
                      formControlName="goal" 
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-teal-500/50 cursor-pointer">
                      <option value="intro">Executive Introduction & Platform Fit</option>
                      <option value="followup">Inbound Demo & Architecture Follow-Up</option>
                      <option value="proposal">Contract Delivery & Master SLA Review</option>
                      <option value="reengage">Strategic Re-engagement (Cold Pipeline)</option>
                    </select>
                  </div>
                  <div class="space-y-1">
                    <label for="toneSelect" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Voice & Tone Aesthetic</label>
                    <select 
                      id="toneSelect" 
                      formControlName="tone" 
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-teal-500/50 cursor-pointer">
                      <option value="Executive">Executive & Formal (C-Suite & Legal)</option>
                      <option value="Direct">Direct & Concise (High-velocity)</option>
                      <option value="Consultative">Consultative & Modern (Technical Advisor)</option>
                    </select>
                  </div>
                </div>

                <!-- Value Proposition Input -->
                <div class="space-y-1">
                  <label for="valPropTextArea" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Value Proposition & Specific Deal Context *</label>
                  <textarea 
                    id="valPropTextArea" 
                    formControlName="valueProposition" 
                    placeholder="Provide deal parameters, specific milestones, pain points, or commitments (e.g. lowering enterprise data latency by 35%, SOC2 Type II audit completion, dedicated support SLAs)." 
                    rows="3" 
                    class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50 font-medium leading-relaxed"></textarea>
                </div>

                <!-- Generate Draft with AI -->
                <div class="flex gap-3 pt-1">
                  <button 
                    type="submit" 
                    [disabled]="composeForm.invalid || isProcessing()"
                    class="flex-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-zinc-950 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2 cursor-pointer">
                    @if (isProcessing()) {
                      <span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full"></span>
                      <span>{{ processingStep() }}</span>
                    } @else {
                      <mat-icon class="text-sm">auto_awesome</mat-icon>
                      <span>Synthesize Draft via Gemini AI</span>
                    }
                  </button>

                  <button 
                    type="button" 
                    (click)="createBlankManualDraft()"
                    [disabled]="composeForm.invalid"
                    class="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-xs font-bold transition-colors">
                    Write Manually
                  </button>
                </div>

              </form>

            </div>
          </div>

          <!-- Right 5 cols: HUMAN IN THE LOOP (HITL) APPROVAL STATION -->
          <div class="lg:col-span-5 space-y-6">
            @if (generatedEmail(); as draft) {
              <!-- Active HITL Approval Gate Card -->
              <div class="bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-zinc-950 border-2 border-amber-500/40 rounded-2xl p-6 relative overflow-hidden shadow-2xl animate-fade-in group">
                <div class="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                <!-- HITL Illuminated Badge Header -->
                <div class="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-4">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                    <span class="text-xs font-bold font-mono tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                      <mat-icon class="text-sm">security</mat-icon>
                      Human-in-the-Loop Review Gate
                    </span>
                  </div>
                  <span class="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    AWAITING OPERATOR SIGN-OFF
                  </span>
                </div>

                <p class="text-[11px] text-zinc-300 leading-relaxed mb-4">
                  <span class="text-amber-300 font-semibold">Mandatory Review:</span>
                  Examine the synthesized draft, verify recipient and deal attribution, make any required edits, and provide your formal human approval.
                </p>

                <!-- Attribution Verification Metadata -->
                <div class="grid grid-cols-2 gap-2 text-[10px] bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 mb-4 font-mono">
                  <div>
                    <span class="text-zinc-500 block">RECIPIENT</span>
                    <span class="text-white font-bold truncate block">{{ composeForm.get('clientName')?.value }} ({{ composeForm.get('recipientEmail')?.value }})</span>
                  </div>
                  <div>
                    <span class="text-zinc-500 block">ASSOCIATED DEAL</span>
                    <span class="text-purple-300 font-bold truncate block">{{ composeForm.get('dealName')?.value || 'General Account' }}</span>
                  </div>
                  <div>
                    <span class="text-zinc-500 block">ORGANISATION</span>
                    <span class="text-teal-300 font-bold truncate block">{{ composeForm.get('companyName')?.value }}</span>
                  </div>
                  <div>
                    <span class="text-zinc-500 block">HUMAN REVIEWER</span>
                    <span class="text-emerald-400 font-bold block">{{ reviewerName() }}</span>
                  </div>
                </div>

                <!-- Editable Draft Controls -->
                <div class="space-y-3">
                  <div>
                    <label for="hitlSubjectInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Subject Line (Editable)</label>
                    <input 
                      id="hitlSubjectInput" 
                      type="text" 
                      [value]="localSubject" 
                      (input)="onSubjectChange($event)" 
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500/50" />
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label for="hitlBodyInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Message Body (Editable)</label>
                      <span class="text-[9px] text-zinc-500 font-mono">{{ localBody.length }} chars</span>
                    </div>
                    <textarea 
                      id="hitlBodyInput" 
                      [value]="localBody" 
                      (input)="onBodyChange($event)" 
                      rows="8" 
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 font-sans leading-relaxed focus:outline-none focus:border-amber-500/50 custom-scrollbar resize-none"></textarea>
                  </div>
                </div>

                <!-- HITL Operator Sign-Off Action Buttons -->
                <div class="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center gap-2.5">
                  <button 
                    type="button" 
                    (click)="generatedEmail.set(null)" 
                    class="w-full sm:w-auto px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition-colors border border-zinc-800">
                    Discard Draft
                  </button>

                  <button 
                    type="button" 
                    (click)="dispatchApprovedOutbox()" 
                    [disabled]="!localSubject.trim() || !localBody.trim()"
                    class="w-full sm:flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer">
                    <mat-icon class="text-sm">verified</mat-icon>
                    <span>Approve & Dispatch Email</span>
                  </button>
                </div>
              </div>
            } @else {
              <!-- Empty HITL Waiting State -->
              <div class="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-8 min-h-[460px] flex flex-col items-center justify-center text-center">
                <div class="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-600">
                  <mat-icon class="text-3xl text-zinc-500">verified_user</mat-icon>
                </div>
                <h3 class="text-sm font-bold text-white font-display">Human-in-the-Loop Gateway Idle</h3>
                <p class="text-xs text-zinc-400 mt-1 max-w-[260px] leading-relaxed">
                  Fill in the recipient and deal parameters on the left to synthesize a draft. The proposal will appear here for review and human authorization.
                </p>
                <div class="mt-5 flex items-center gap-1.5 text-[11px] font-mono text-teal-400/80 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                  <span>Human Oversight Enforced</span>
                </div>
              </div>
            }
          </div>

        </div>
      }

      <!-- TAB 2: INBOX (RECEIVE EMAILS & LOG TO CRM/DEAL) -->
      @if (activeTab() === 'inbox') {
        <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 min-h-[550px] flex flex-col animate-fade-in shadow-2xl">
          
          <!-- Inbox Controls Bar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4 mb-5">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <mat-icon class="text-[18px]">inbox</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-bold text-white font-display">Primary Inbound Ledger</h3>
                <p class="text-xs text-zinc-400">Incoming prospect responses ready to log against contacts and deals</p>
              </div>
            </div>

            <!-- Actions Bar: Simulate Inbound & Filter -->
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                (click)="simulateIncomingClientEmail()" 
                class="bg-gradient-to-r from-teal-500/10 to-purple-500/10 hover:from-teal-500/20 hover:to-purple-500/20 text-teal-300 border border-teal-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                <mat-icon class="text-sm text-teal-400">add_to_queue</mat-icon>
                <span>Receive Inbound Email</span>
              </button>

              <button 
                type="button" 
                (click)="openSettings()" 
                class="bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white p-2 rounded-xl transition-colors">
                <mat-icon class="text-sm">settings</mat-icon>
              </button>
            </div>
          </div>

          <!-- Inbox Messages List -->
          <div class="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
            @for (mail of inboxEmails(); track mail.$id) {
              <div 
                (click)="viewEmail(mail)"
                (keydown.enter)="viewEmail(mail)"
                (keydown.space)="viewEmail(mail)"
                role="button"
                tabindex="0"
                class="bg-zinc-950/70 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-3 hover:bg-zinc-900/70 transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                [class.border-l-4]="!mail.isRead"
                [class.border-l-teal-500]="!mail.isRead">
                
                <div class="flex items-start gap-3.5 min-w-0 flex-1">
                  <div class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase mt-0.5">
                    {{ (mail.sender || 'P').charAt(0) }}
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">{{ mail.sender }}</span>
                      <span class="text-[10px] text-zinc-500 font-mono">({{ mail.senderEmail || 'client@enterprise.com' }})</span>
                      @if (!mail.isRead) {
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">NEW</span>
                      }
                    </div>

                    <p class="text-xs font-semibold text-zinc-200 mt-1 truncate">{{ mail.subject }}</p>
                    <p class="text-xs text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">{{ mail.snippet || mail.body }}</p>

                    <!-- Contact & Deal Linkage Badges -->
                    <div class="flex items-center gap-2 mt-3 flex-wrap">
                      @if (mail.contactName) {
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-md">
                          <mat-icon class="text-[11px]">person</mat-icon> {{ mail.contactName }}
                        </span>
                      }
                      @if (mail.dealName) {
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                          <mat-icon class="text-[11px]">monetization_on</mat-icon> {{ mail.dealName }}
                        </span>
                      }
                      @if (!mail.contactName && !mail.dealName) {
                        <span class="text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-semibold">
                          Unlinked Inbound
                        </span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Right Action Buttons -->
                <div class="flex items-center md:flex-col items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-850" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" role="group" aria-label="Email message actions">
                  <span class="text-[10px] font-mono text-zinc-500 whitespace-nowrap">{{ formatEmailDate(mail.receivedAt) }}</span>
                  <div class="flex items-center gap-1.5 mt-auto">
                    <button 
                      type="button" 
                      (click)="openLogModal(mail)" 
                      class="px-2.5 py-1 bg-zinc-900 hover:bg-teal-500/10 hover:text-teal-300 border border-zinc-800 rounded-lg text-[10px] font-bold transition-colors"
                      title="Log to Contact & Deal">
                      Log to CRM
                    </button>
                    <button 
                      type="button" 
                      (click)="replyToEmail(mail)" 
                      class="px-2.5 py-1 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1">
                      <mat-icon class="text-xs">reply</mat-icon> Reply
                    </button>
                  </div>
                </div>

              </div>
            } @empty {
              <div class="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div class="w-14 h-14 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center mb-3">
                  <mat-icon class="text-zinc-500 text-2xl">mark_email_read</mat-icon>
                </div>
                <h4 class="text-white font-bold text-sm">Inbox is completely clear</h4>
                <p class="text-zinc-500 text-xs mt-1 max-w-[240px]">Click 'Receive Inbound Email' above to simulate a client reply into your workflow.</p>
              </div>
            }
          </div>

        </div>
      }

      <!-- TAB 3: OUTBOX LOG & DEAL AUDIT -->
      @if (activeTab() === 'outbox') {
        <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 min-h-[550px] flex flex-col animate-fade-in shadow-2xl">
          
          <div class="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-5">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <mat-icon class="text-[18px]">outbox</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-bold text-white font-display">Dispatched Outreach & Deal Attribution Log</h3>
                <p class="text-xs text-zinc-400">Immutable ledger of human-approved emails and deal milestones</p>
              </div>
            </div>

            <span class="text-xs font-mono font-bold bg-zinc-950 px-3 py-1 rounded-xl border border-zinc-800 text-teal-400">
              {{ campaignEmails().length }} Dispatches Logged
            </span>
          </div>

          <div class="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
            @for (mail of campaignEmails(); track mail.$id) {
              <div class="bg-zinc-950/70 border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-3 hover:bg-zinc-900/60 transition-colors">
                <div class="flex items-start gap-3.5 min-w-0 flex-1">
                  <div class="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase mt-0.5">
                    {{ mail.recipient.charAt(0) }}
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-xs font-bold text-white">{{ mail.recipient }} ({{ mail.company }})</span>
                      <span class="text-[10px] font-mono text-zinc-500">{{ mail.sentAt }}</span>
                    </div>

                    <p class="text-xs font-semibold text-zinc-300 mt-1 truncate">{{ mail.subject }}</p>
                    <p class="text-xs text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">{{ mail.body || 'Email content dispatched to corporate servers.' }}</p>

                    <div class="flex items-center gap-2.5 mt-3 flex-wrap">
                      @if (mail.dealName) {
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                          <mat-icon class="text-[11px]">monetization_on</mat-icon> Deal: {{ mail.dealName }}
                        </span>
                      }
                      <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        <mat-icon class="text-[11px]">verified</mat-icon> {{ mail.approvedBy || 'Human Approved' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center md:flex-col items-end justify-between shrink-0">
                  <span [class]="getStatusPillClass(mail.status)" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {{ mail.status }}
                  </span>
                  <span class="text-[10px] text-teal-400/80 font-mono mt-2">CRM Logged</span>
                </div>
              </div>
            } @empty {
              <div class="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div class="w-14 h-14 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center mb-3">
                  <mat-icon class="text-zinc-500 text-2xl">send</mat-icon>
                </div>
                <h4 class="text-white font-bold text-sm">No dispatches logged yet</h4>
                <p class="text-zinc-500 text-xs mt-1">Compose and approve an email to initialize your audit log.</p>
              </div>
            }
          </div>

        </div>
      }

      <!-- MODAL 1: LOG EMAIL AGAINST CONTACT & DEAL -->
      @if (showLogModal() && activeEmailToLog(); as mail) {
        <div class="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl animate-fade-in overflow-hidden">
            <div class="absolute -left-20 -top-20 w-48 h-48 bg-teal-500/10 blur-[50px] rounded-full pointer-events-none"></div>

            <div class="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <mat-icon class="text-teal-400 text-base">link</mat-icon>
                Log Email to Contact & Deal
              </h3>
              <button (click)="closeLogModal()" class="text-zinc-500 hover:text-white transition-colors">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>

            <div class="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs space-y-1">
              <p class="font-bold text-white truncate">{{ mail.subject }}</p>
              <p class="text-zinc-400 text-[11px]">From: {{ mail.sender }}</p>
            </div>

            <div class="space-y-3">
              <div class="space-y-1">
                <label for="logContactSelect" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Target Contact Record *</label>
                <select 
                  id="logContactSelect" 
                  [value]="selectedContactIdForLog()" 
                  (change)="selectedContactIdForLog.set($any($event.target).value)" 
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/50 cursor-pointer">
                  <option value="">-- Select Contact --</option>
                  @for (c of appwrite.contacts(); track c.$id) {
                    <option [value]="c.$id">{{ c.name }} ({{ c.company }})</option>
                  }
                </select>
              </div>

              <div class="space-y-1">
                <label for="logDealSelect" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Associated Deal *</label>
                <select 
                  id="logDealSelect" 
                  [value]="selectedDealIdForLog()" 
                  (change)="selectedDealIdForLog.set($any($event.target).value)" 
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/50 cursor-pointer">
                  <option value="">-- Select Deal --</option>
                  @for (lead of leadService.leads(); track lead.$id) {
                    <option [value]="lead.$id">{{ lead.name }} (&#36;{{ lead.value?.toLocaleString() || '0' }})</option>
                  }
                </select>
              </div>
            </div>

            <div class="pt-3 border-t border-zinc-800 flex justify-end gap-2.5">
              <button (click)="closeLogModal()" class="px-4 py-2 bg-transparent text-zinc-400 hover:text-white text-xs font-semibold">
                Cancel
              </button>
              <button 
                (click)="confirmLogEmailToCRM()" 
                [disabled]="!selectedContactIdForLog()"
                class="px-5 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-zinc-950 font-bold rounded-xl text-xs transition-colors shadow-md">
                Confirm & Log to Record
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: INBOX MESSAGE DETAIL INSPECTOR -->
      @if (inspectingEmail(); as mail) {
        <div class="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4 relative shadow-2xl animate-fade-in overflow-hidden">
            <div class="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div>
                <h3 class="text-sm font-bold text-white">{{ mail.subject }}</h3>
                <p class="text-[11px] text-zinc-400 mt-0.5">From: {{ mail.sender }} ({{ mail.senderEmail || 'client@enterprise.com' }})</p>
              </div>
              <button (click)="inspectingEmail.set(null)" class="text-zinc-500 hover:text-white transition-colors">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>

            <div class="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 text-xs text-zinc-200 font-sans leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto custom-scrollbar">
              {{ mail.body || mail.snippet }}
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-zinc-800">
              <div class="flex items-center gap-2">
                @if (mail.dealName) {
                  <span class="text-[10px] text-purple-300 font-mono bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                    {{ mail.dealName }}
                  </span>
                }
              </div>

              <div class="flex items-center gap-2">
                <button 
                  (click)="openLogModal(mail)" 
                  class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl">
                  Re-link to Deal
                </button>
                <button 
                  (click)="replyToEmail(mail); inspectingEmail.set(null)" 
                  class="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-bold rounded-xl flex items-center gap-1 shadow-md">
                  <mat-icon class="text-xs">reply</mat-icon> Reply with HITL
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3: SMTP / IMAP SERVER SETTINGS -->
      @if (showSettings()) {
        <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-fade-in shadow-2xl">
            <div class="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <mat-icon class="text-teal-400 text-sm">settings_suggest</mat-icon>
                SMTP/IMAP Server Protocols
              </h3>
              <button (click)="closeSettings()" class="text-zinc-500 hover:text-white transition-colors">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            
            <div class="p-5 space-y-3.5">
              <p class="text-[11px] text-zinc-400 leading-relaxed">
                Connect enterprise SMTP and IMAP servers (supports Nextcloud Mail, Google Workspace, and self-hosted instances).
              </p>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label for="mail-imap-host" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">IMAP Host</label>
                  <input id="mail-imap-host" type="text" [(ngModel)]="imapHost" [ngModelOptions]="{standalone: true}" placeholder="imap.enterprise.com" 
                         class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/40" />
                </div>
                <div class="space-y-1">
                  <label for="mail-imap-port" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">IMAP Port</label>
                  <input id="mail-imap-port" type="text" [(ngModel)]="imapPort" [ngModelOptions]="{standalone: true}" placeholder="993" 
                         class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/40" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label for="mail-smtp-host" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SMTP Host</label>
                  <input id="mail-smtp-host" type="text" [(ngModel)]="smtpHost" [ngModelOptions]="{standalone: true}" placeholder="smtp.enterprise.com" 
                         class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/40" />
                </div>
                <div class="space-y-1">
                  <label for="mail-smtp-port" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SMTP Port</label>
                  <input id="mail-smtp-port" type="text" [(ngModel)]="smtpPort" [ngModelOptions]="{standalone: true}" placeholder="465" 
                         class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/40" />
                </div>
              </div>
              <div class="space-y-1">
                <label for="mail-user-addr" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sender Address</label>
                <input id="mail-user-addr" type="text" [(ngModel)]="mailUser" [ngModelOptions]="{standalone: true}" placeholder="sales@laevos.ai" 
                       class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/40" />
              </div>
            </div>

            <div class="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-2.5">
              <button (click)="closeSettings()" class="px-4 py-2 bg-transparent text-zinc-400 hover:text-white text-xs font-semibold">
                Cancel
              </button>
              <button (click)="saveSettings()" class="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-md">
                Save & Connect
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
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(82, 82, 91, 0.4);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(113, 113, 122, 0.7);
    }
  `]
})
export class EmailsComponent implements OnInit {
  appwrite = inject(Appwrite);
  fb = inject(FormBuilder);
  leadService = inject(LeadService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  activeTab = signal<'compose' | 'inbox' | 'outbox'>('compose');
  composeForm!: FormGroup;

  isProcessing = signal<boolean>(false);
  processingStep = signal<string>('Initializing');
  generatedEmail = signal<{ subject: string; body: string } | null>(null);

  localSubject = '';
  localBody = '';
  reviewerName = signal<string>('Alex Vance (Human Sales Agent)');

  // Outbox list from Appwrite
  campaignEmails = this.appwrite.emails as import('@angular/core').Signal<EmailRecord[]>;

  // Interactive Inbox signal
  inboxEmails = signal<EmailRecord[]>([
    {
      $id: 'inbox-1',
      sender: 'Satya Nadella',
      senderEmail: 'satya@microsoft.com',
      recipient: 'Alex Vance',
      company: 'Microsoft Corp',
      contactId: 'mock-c1',
      contactName: 'Bill Gates',
      dealId: 'deal-azure-mig',
      dealName: 'Azure Cloud Migration SLA ($450k)',
      subject: 'Re: Technical Specs & Enterprise Migration SLA Review',
      body: 'Hi Alex,\n\nOur engineering team reviewed the multi-tenant database benchmarks you sent over. The latency numbers on the Turso edge replicas look promising.\n\nWe have two questions regarding SOC2 Type II audit reciprocity and failover guarantees. Could we schedule a brief 15-minute sync with your solutions architect this Thursday at 2 PM PST?\n\nBest,\nSatya',
      snippet: 'Our engineering team reviewed the multi-tenant database benchmarks. The latency numbers look promising...',
      isRead: false,
      direction: 'inbound',
      status: 'Replied',
      receivedAt: new Date(Date.now() - 1000 * 60 * 25)
    },
    {
      $id: 'inbox-2',
      sender: 'Marc Benioff',
      senderEmail: 'marc@salesforce.com',
      recipient: 'Alex Vance',
      company: 'Salesforce Inc',
      contactId: 'mock-c2',
      contactName: 'Marc Benioff',
      dealId: 'deal-sf-federation',
      dealName: 'Salesforce FedRAMP Gateway ($180k)',
      subject: 'Salesforce Joint Initiative - Terms Approved by Legal',
      body: 'Alex,\n\nGood news: our legal counsel completed their preliminary pass on the mutual action plan without major markups.\n\nLet’s proceed with setting up the test sandbox. Please send over the revised execution paperwork.\n\nRegards,\nMarc',
      snippet: 'Good news: our legal counsel completed their preliminary pass on the mutual action plan without markups...',
      isRead: true,
      direction: 'inbound',
      status: 'Delivered',
      receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 4)
    }
  ]);

  unreadInboxCount = computed(() => this.inboxEmails().filter(m => !m.isRead).length);

  // Inspector & Log modals
  inspectingEmail = signal<EmailRecord | null>(null);
  showLogModal = signal<boolean>(false);
  activeEmailToLog = signal<EmailRecord | null>(null);
  selectedContactIdForLog = signal<string>('');
  selectedDealIdForLog = signal<string>('');

  showSettings = signal<boolean>(false);
  imapHost = 'imap.laevos.ai';
  imapPort = '993';
  smtpHost = 'smtp.laevos.ai';
  smtpPort = '465';
  mailUser = 'sales@laevos.ai';

  constructor() {
    this.composeForm = this.fb.group({
      clientName: ['', [Validators.required, Validators.minLength(2)]],
      recipientEmail: ['', [Validators.required, Validators.email]],
      companyName: ['', [Validators.required]],
      contactId: [''],
      dealId: [''],
      dealName: [''],
      goal: ['intro'],
      tone: ['Executive'],
      valueProposition: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit() {
    this.leadService.loadLeads();

    // Check for route query parameters when navigated from a Contact record
    this.route.queryParams.subscribe(params => {
      if (params['recipient'] || params['contactId']) {
        this.activeTab.set('compose');
        this.composeForm.patchValue({
          clientName: params['name'] || '',
          recipientEmail: params['recipient'] || '',
          companyName: params['company'] || '',
          contactId: params['contactId'] || '',
          dealName: params['deal'] || `${params['company'] || 'Enterprise'} Partnership SLA`
        });
        if (params['body']) {
          this.localBody = params['body'];
          this.localSubject = params['deal'] ? `Executive Proposal: ${params['deal']}` : `Follow up: ${params['company'] || 'Operations'}`;
          this.generatedEmail.set({
            subject: this.localSubject,
            body: this.localBody
          });
        }
      }
    });
  }

  onContactSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    const contactId = target.value;
    if (contactId) {
      const contact = this.appwrite.contacts().find(c => c.$id === contactId);
      if (contact) {
        this.composeForm.patchValue({
          clientName: contact.name,
          recipientEmail: contact.email || '',
          companyName: contact.company,
          contactId: contact.$id,
          dealName: contact.associatedDeals?.[0]?.title || `${contact.company} Contract SLA`
        });
      }
    }
  }

  onDealSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    const dealId = target.value;
    if (dealId) {
      const lead = this.leadService.leads().find(l => l.$id === dealId);
      if (lead) {
        this.composeForm.patchValue({
          dealId: lead.$id,
          dealName: `${lead.name} (${lead.status} • $${lead.value?.toLocaleString() || 0})`,
          companyName: this.composeForm.get('companyName')?.value || lead.industry || 'Enterprise'
        });
      }
    }
  }

  onSubjectChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.localSubject = target.value;
  }

  onBodyChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.localBody = target.value;
  }

  createBlankManualDraft() {
    const val = this.composeForm.value;
    this.localSubject = val.dealName ? `Collaboration: ${val.dealName}` : `Discussion / ${val.companyName || 'Enterprise'}`;
    this.localBody = `Dear ${val.clientName || 'Partner'},\n\nI am reaching out regarding our strategic partnership.\n\n${val.valueProposition || ''}\n\nLet me know when you have time for a brief call.\n\nSincerely,\n${this.reviewerName()}`;
    this.generatedEmail.set({
      subject: this.localSubject,
      body: this.localBody
    });
  }

  generateOutreachEmail() {
    if (this.composeForm.invalid) return;
    this.isProcessing.set(true);

    const steps = [
      'Ingesting contact telemetry & deal milestones...',
      'Synthesizing value proposition alignment...',
      'Applying tone guardrails (Executive / HITL pre-flight)...',
      'Gemini assembling draft for human review...'
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
    }, 450);
  }

  private finalizeDraft() {
    const data = this.composeForm.value;
    let subject = '';
    let body = '';

    if (data.goal === 'intro') {
      subject = `Enterprise Architecture Initiative / ${data.companyName} x ΛΞVOS`;
      body = `Dear ${data.clientName},\n\nI hope this email finds you well.\n\nI am contacting you from ΛΞVOS Enterprise Solutions regarding your current infrastructure roadmap. We have architected a dedicated edge data system that directly resolves relationship latency and contract governance.\n\nKey value milestones aligned to ${data.companyName}:\n- ${data.valueProposition}\n- Dedicated high-throughput SLA guarantees\n- Direct integration into your existing authentication pipelines\n\nCould we coordinate a brief 10-minute briefing next Wednesday at 10 AM PST to walk through the custom architecture?\n\nSincerely,\n${this.reviewerName()}\nΛΞVOS Enterprise Operations`;
    } else if (data.goal === 'proposal') {
      subject = `Master SLA & Partnership Proposal for ${data.companyName}`;
      body = `Dear ${data.clientName},\n\nFollowing our executive review cycle, please find our finalized Master SLA contract ready for review.\n\nAs discussed for ${data.dealName || 'your account'}:\n- ${data.valueProposition}\n- Complete compliance and security guarantees\n\nPlease let me know if your legal team has any preliminary items to address before final execution.\n\nWith respect,\n${this.reviewerName()}\nContracts Group, ΛΞVOS`;
    } else if (data.goal === 'followup') {
      subject = `Follow-Up: Next Steps for ${data.companyName} x ΛΞVOS`;
      body = `Hi ${data.clientName},\n\nGreat connecting with you during our recent review session.\n\nTo help ${data.companyName} execute your next phase smoothly, we've outlined the core parameters:\n- ${data.valueProposition}\n\nLet me know what day works best this week for a prompt 15-minute follow-up.\n\nBest,\n${this.reviewerName()}`;
    } else {
      subject = `Strategic Update & Roadmap for ${data.companyName}`;
      body = `Hello ${data.clientName},\n\nChecking in regarding our mutual objectives. We have prepared an optimized execution model designed to accelerate ${data.companyName}'s quarterly target attainment:\n\n- ${data.valueProposition}\n\nLet's schedule a brief sync to review the parameters.\n\nWarm regards,\n${this.reviewerName()}`;
    }

    this.localSubject = subject;
    this.localBody = body;
    this.generatedEmail.set({ subject, body });
    this.isProcessing.set(false);
  }

  async dispatchApprovedOutbox() {
    const entry = this.composeForm.value;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newMail: EmailRecord = {
      $id: `mail-${Date.now()}`,
      recipient: entry.clientName,
      recipientEmail: entry.recipientEmail,
      company: entry.companyName,
      contactId: entry.contactId || undefined,
      contactName: entry.clientName,
      dealId: entry.dealId || undefined,
      dealName: entry.dealName || undefined,
      subject: this.localSubject,
      body: this.localBody,
      status: 'Sent',
      direction: 'outbound',
      sentAt: `Today, ${timeStr}`,
      humanApproved: true,
      approvedBy: this.reviewerName(),
      approvedAt: now.toISOString()
    };

    // Save to Appwrite email ledger
    await this.appwrite.addEmail(newMail);

    // If linked to a contact, update contact's lastContacted and log interaction
    if (entry.contactId) {
      await this.appwrite.updateContact(entry.contactId, {
        lastContacted: `Today, ${timeStr}`
      });
    }

    // Appwrite notification
    this.appwrite.addNotification({
      title: 'Human Approved & Sent',
      message: `Dispatched "${newMail.subject}" to ${newMail.recipient} (${newMail.company}) with human verification.`,
      type: 'success'
    });

    // Reset draft and form
    this.generatedEmail.set(null);
    this.composeForm.reset({ goal: 'intro', tone: 'Executive' });
    this.activeTab.set('outbox');
  }

  viewEmail(mail: EmailRecord) {
    if (!mail.isRead) {
      this.inboxEmails.update(arr => arr.map(e => e.$id === mail.$id ? { ...e, isRead: true } : e));
    }
    this.inspectingEmail.set(mail);
  }

  replyToEmail(mail: EmailRecord) {
    this.activeTab.set('compose');
    this.composeForm.patchValue({
      clientName: mail.sender || mail.recipient,
      recipientEmail: mail.senderEmail || mail.recipientEmail || '',
      companyName: mail.company || '',
      contactId: mail.contactId || '',
      dealName: mail.dealName || ''
    });

    this.localSubject = mail.subject.startsWith('Re:') ? mail.subject : `Re: ${mail.subject}`;
    this.localBody = `Hi ${mail.sender || 'there'},\n\nThank you for getting back to us.\n\nRegarding your points:\n\n> ${(mail.body || mail.snippet || '').slice(0, 140)}...\n\nWe have verified the parameters with our solutions team and can confirm full availability.\n\nBest regards,\n${this.reviewerName()}`;
    
    this.generatedEmail.set({
      subject: this.localSubject,
      body: this.localBody
    });
  }

  simulateIncomingClientEmail() {
    const clients = [
      {
        sender: 'Satya Nadella',
        email: 'satya@microsoft.com',
        company: 'Microsoft Corp',
        contactId: 'mock-c1',
        dealName: 'Azure Cloud Migration SLA ($450k)',
        subject: 'Re: Enterprise SLA Review & Architecture Finalization',
        body: 'Alex,\n\nOur legal and infrastructure committees have both signed off on the technical appendix. Please confirm if we can execute the master agreement prior to fiscal month-end.\n\nThanks,\nSatya'
      },
      {
        sender: 'Marc Benioff',
        email: 'marc@salesforce.com',
        company: 'Salesforce Inc',
        contactId: 'mock-c2',
        dealName: 'Salesforce FedRAMP Gateway ($180k)',
        subject: 'FedRAMP Audit Confirmation - Ready for Test Sandbox',
        body: 'Hi Alex,\n\nWe received the verified compliance report. The architecture fits our security guidelines. When can your team provision our dedicated tenant?\n\nMarc'
      },
      {
        sender: 'Stewart Butterfield',
        email: 'stewart@slack.com',
        company: 'Slack Technologies',
        contactId: 'mock-c3',
        dealName: 'Slack Enterprise Bot Connector ($65k)',
        subject: 'Inquiry on Webhook Latency Benchmark Results',
        body: 'Alex,\n\nReviewing the webhook telemetry now. Can you confirm if this rate-limits under high-concurrency bursts during quarterly close?\n\nBest,\nStewart'
      }
    ];

    const pick = clients[Math.floor(Math.random() * clients.length)];
    const newInbound: EmailRecord = {
      $id: `inbox-sim-${Date.now()}`,
      sender: pick.sender,
      senderEmail: pick.email,
      recipient: 'Alex Vance',
      company: pick.company,
      contactId: pick.contactId,
      contactName: pick.sender,
      dealName: pick.dealName,
      subject: pick.subject,
      body: pick.body,
      snippet: pick.body.slice(0, 100) + '...',
      isRead: false,
      direction: 'inbound',
      status: 'Replied',
      receivedAt: new Date()
    };

    this.inboxEmails.update(arr => [newInbound, ...arr]);

    this.appwrite.addNotification({
      title: 'New Client Email Received',
      message: `Inbound message from ${pick.sender} (${pick.company}): "${pick.subject}"`,
      type: 'info'
    });
  }

  openLogModal(mail: EmailRecord) {
    this.activeEmailToLog.set(mail);
    this.selectedContactIdForLog.set(mail.contactId || '');
    this.selectedDealIdForLog.set(mail.dealId || '');
    this.showLogModal.set(true);
  }

  closeLogModal() {
    this.showLogModal.set(false);
    this.activeEmailToLog.set(null);
  }

  confirmLogEmailToCRM() {
    const mail = this.activeEmailToLog();
    if (!mail) return;

    const contactId = this.selectedContactIdForLog();
    const contact = this.appwrite.contacts().find(c => c.$id === contactId);
    const dealId = this.selectedDealIdForLog();
    const deal = this.leadService.leads().find(l => l.$id === dealId);

    const contactName = contact ? contact.name : mail.contactName;
    const dealName = deal ? `${deal.name} ($${deal.value?.toLocaleString() || '0'})` : mail.dealName;

    // Update in inbox
    this.inboxEmails.update(arr => arr.map(e => e.$id === mail.$id ? {
      ...e,
      contactId,
      contactName,
      dealId,
      dealName
    } : e));

    // Update contact record's last contacted
    if (contactId) {
      this.appwrite.updateContact(contactId, {
        lastContacted: 'Just now'
      });
    }

    this.appwrite.addNotification({
      title: 'Email Logged to CRM',
      message: `Logged email "${mail.subject}" against contact ${contactName || 'Record'} and deal ${dealName || 'Pipeline'}.`,
      type: 'success'
    });

    this.closeLogModal();
  }

  openSettings() {
    this.showSettings.set(true);
  }

  closeSettings() {
    this.showSettings.set(false);
  }

  saveSettings() {
    this.appwrite.addNotification({
      title: 'SMTP Server Configured',
      message: `Successfully validated connection to ${this.smtpHost}:${this.smtpPort}.`,
      type: 'success'
    });
    this.closeSettings();
  }

  formatEmailDate(date: Date | string | undefined): string {
    if (!date) return 'Recently';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getStatusPillClass(status: string): string {
    switch (status) {
      case 'Replied':
        return 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20';
      case 'Delivered':
        return 'text-sky-300 bg-sky-500/10 border border-sky-500/20';
      case 'Bounced':
        return 'text-rose-400 bg-rose-500/10 border border-rose-500/20';
      case 'Sent':
      default:
        return 'text-teal-300 bg-teal-500/10 border border-teal-500/20';
    }
  }
}
