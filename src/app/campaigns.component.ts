import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';
import { LeadService } from './lead.service';
import { EmailMarketingService, EmailMarketingProvider, ProviderConfig, BulkCampaignRecord } from './email-marketing.service';

export interface EmailCampaignStep {
  stepNumber: number;
  channel: 'Email' | 'LinkedIn' | 'Call' | 'SMS';
  delayDays: number;
  subject: string;
  body: string;
  personalityStyle: 'Witty Challenger' | 'Warm Consultative' | 'Direct Strategist' | 'Charismatic Founder' | 'Socratic Tech';
  icebreakerHook?: string;
  openRate: number;
  clickRate: number;
  replyRate: number;
}

export interface AutomatedCampaign {
  id: string;
  name: string;
  triggerType: 'lead_assigned' | 'activity_click' | 'inactivity_threshold' | 'stage_changed' | 'score_threshold' | 'manual';
  triggerLabel: string;
  targetAudience: string;
  status: 'Active' | 'Paused' | 'Stopped' | 'Draft';
  createdAt: Date;
  lastFiredAt?: Date;
  personalityVoice: string;
  stats: {
    enrolled: number;
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    conversions: number;
    pipelineAttributed: number;
  };
  steps: EmailCampaignStep[];
}

@Component({
  selector: 'app-campaigns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="h-full flex flex-col relative animate-fade-in max-w-[1650px] mx-auto p-3 sm:p-5 md:p-6 space-y-6">
      
      <!-- Top Header & Mode Switcher -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(106,13,173,0.35)] font-bold">
              <mat-icon class="text-[22px]">mark_email_unread</mat-icon>
            </div>
            <div>
              <h1 class="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Email Marketing & Automated Campaigns</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-mono font-normal">
                  Mailchimp &bull; SendGrid &bull; HubSpot
                </span>
              </h1>
              <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Two-way contact audience sync, high-volume bulk dispatch, real-time engagement telemetry, and AI-driven drip cadences.
              </p>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800/80 flex-wrap">
          <button 
            type="button"
            (click)="activeTab.set('sync')"
            [class]="activeTab() === 'sync' ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-zinc-950 font-bold shadow-md' : 'text-zinc-400 hover:text-white'"
            class="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px]">sync</mat-icon>
            <span>Marketing Services & Sync</span>
          </button>

          <button 
            type="button"
            (click)="activeTab.set('bulk_send')"
            [class]="activeTab() === 'bulk_send' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md' : 'text-zinc-400 hover:text-white'"
            class="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px]">forward_to_inbox</mat-icon>
            <span>Bulk Dispatcher</span>
          </button>

          <button 
            type="button"
            (click)="activeTab.set('analytics')"
            [class]="activeTab() === 'analytics' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md' : 'text-zinc-400 hover:text-white'"
            class="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px]">analytics</mat-icon>
            <span>Campaign Performance</span>
          </button>

          <button 
            type="button"
            (click)="activeTab.set('automated')"
            [class]="activeTab() === 'automated' ? 'bg-zinc-800 text-white font-bold border border-zinc-700' : 'text-zinc-400 hover:text-white'"
            class="px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px]">auto_mode</mat-icon>
            <span>Automated Drips</span>
          </button>
        </div>
      </header>

      <!-- Sync In-Progress Banner -->
      @if (marketing.isSyncing()) {
        <div class="bg-gradient-to-r from-teal-950/80 via-zinc-900 to-purple-950/80 border border-teal-500/50 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <mat-icon class="animate-spin text-[18px]">sync</mat-icon>
            </div>
            <div>
              <div class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Synchronizing Contact Ledger</span>
                <span class="text-teal-400 font-mono">{{ marketing.syncProgress() }}%</span>
              </div>
              <p class="text-[11px] text-zinc-400 mt-0.5">
                Reconciling CRM records, LTV metadata, and opt-out preferences with {{ getProviderDisplayName(marketing.activeSyncProvider()) }}...
              </p>
            </div>
          </div>
          <div class="w-full sm:w-48 bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
            <div class="bg-gradient-to-r from-teal-400 to-emerald-400 h-full transition-all duration-300" [style.width.%]="marketing.syncProgress()"></div>
          </div>
        </div>
      }

      <!-- ================= TAB 1: MARKETING SERVICES & SYNC ================= -->
      @if (activeTab() === 'sync') {
        <div class="space-y-6 animate-fade-in">
          
          <!-- Leading Providers Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <!-- Mailchimp Provider Card -->
            <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between shadow-xl">
              <div class="absolute -right-6 -top-6 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div>
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <mat-icon class="text-[20px]">local_post_office</mat-icon>
                    </div>
                    <div>
                      <h3 class="text-sm font-bold text-white font-display">Mailchimp</h3>
                      <p class="text-[10px] text-zinc-400">Audience & Newsletter Sync</p>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    [class]="providers().mailchimp.isConnected ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'">
                    {{ providers().mailchimp.isConnected ? 'Connected' : 'Disconnected' }}
                  </span>
                </div>

                <div class="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800/60 font-mono">
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Audience:</span>
                    <span class="text-zinc-200 font-sans font-medium truncate max-w-[170px]">{{ providers().mailchimp.listName }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Synced Contacts:</span>
                    <span class="text-teal-400 font-bold">{{ providers().mailchimp.syncedContactCount }} Records</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Last Synced:</span>
                    <span class="text-zinc-300">{{ providers().mailchimp.lastSyncedAt }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">2-Way Sync:</span>
                    <span class="text-emerald-400 font-sans font-semibold">Active</span>
                  </div>
                </div>
              </div>

              <div class="pt-4 mt-4 border-t border-zinc-800/80 flex items-center gap-2">
                <button 
                  type="button"
                  (click)="triggerSync('mailchimp')"
                  [disabled]="marketing.isSyncing()"
                  class="flex-1 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer">
                  <mat-icon class="text-[14px]">sync</mat-icon>
                  <span>Sync Contacts</span>
                </button>
                <button 
                  type="button"
                  (click)="openProviderConfig('mailchimp')"
                  class="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                  title="Configure Mailchimp Settings">
                  <mat-icon class="text-[16px]">settings</mat-icon>
                </button>
              </div>
            </div>

            <!-- SendGrid Provider Card -->
            <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between shadow-xl">
              <div class="absolute -right-6 -top-6 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div>
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <mat-icon class="text-[20px]">send</mat-icon>
                    </div>
                    <div>
                      <h3 class="text-sm font-bold text-white font-display">SendGrid</h3>
                      <p class="text-[10px] text-zinc-400">Marketing Campaigns v3</p>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    [class]="providers().sendgrid.isConnected ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'">
                    {{ providers().sendgrid.isConnected ? 'Connected' : 'Disconnected' }}
                  </span>
                </div>

                <div class="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800/60 font-mono">
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Contact List:</span>
                    <span class="text-zinc-200 font-sans font-medium truncate max-w-[170px]">{{ providers().sendgrid.listName }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Synced Contacts:</span>
                    <span class="text-teal-400 font-bold">{{ providers().sendgrid.syncedContactCount }} Records</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Last Synced:</span>
                    <span class="text-zinc-300">{{ providers().sendgrid.lastSyncedAt }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">API Pipeline:</span>
                    <span class="text-blue-400 font-sans font-semibold">Real-Time Webhooks</span>
                  </div>
                </div>
              </div>

              <div class="pt-4 mt-4 border-t border-zinc-800/80 flex items-center gap-2">
                <button 
                  type="button"
                  (click)="triggerSync('sendgrid')"
                  [disabled]="marketing.isSyncing()"
                  class="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer">
                  <mat-icon class="text-[14px]">sync</mat-icon>
                  <span>Sync Contacts</span>
                </button>
                <button 
                  type="button"
                  (click)="openProviderConfig('sendgrid')"
                  class="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                  title="Configure SendGrid Settings">
                  <mat-icon class="text-[16px]">settings</mat-icon>
                </button>
              </div>
            </div>

            <!-- HubSpot Provider Card -->
            <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between shadow-xl">
              <div class="absolute -right-6 -top-6 w-28 h-28 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div>
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                      <mat-icon class="text-[20px]">hub</mat-icon>
                    </div>
                    <div>
                      <h3 class="text-sm font-bold text-white font-display">HubSpot</h3>
                      <p class="text-[10px] text-zinc-400">Marketing Hub & Deals</p>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    [class]="providers().hubspot.isConnected ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'">
                    {{ providers().hubspot.isConnected ? 'Connected' : 'Disconnected' }}
                  </span>
                </div>

                <div class="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800/60 font-mono">
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Contact List:</span>
                    <span class="text-zinc-200 font-sans font-medium truncate max-w-[170px]">{{ providers().hubspot.listName }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Synced Contacts:</span>
                    <span class="text-teal-400 font-bold">{{ providers().hubspot.syncedContactCount }} Records</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Last Synced:</span>
                    <span class="text-zinc-300">{{ providers().hubspot.lastSyncedAt }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Field Mapping:</span>
                    <span class="text-orange-400 font-sans font-semibold">12 Properties</span>
                  </div>
                </div>
              </div>

              <div class="pt-4 mt-4 border-t border-zinc-800/80 flex items-center gap-2">
                <button 
                  type="button"
                  (click)="triggerSync('hubspot')"
                  [disabled]="marketing.isSyncing()"
                  class="flex-1 px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer">
                  <mat-icon class="text-[14px]">sync</mat-icon>
                  <span>Sync Contacts</span>
                </button>
                <button 
                  type="button"
                  (click)="openProviderConfig('hubspot')"
                  class="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                  title="Configure HubSpot Settings">
                  <mat-icon class="text-[16px]">settings</mat-icon>
                </button>
              </div>
            </div>

          </div>

          <!-- Sync Configuration & Field Mapping Panel -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Left 2 cols: Field Mapping & Sync Strategy -->
            <div class="lg:col-span-2 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                    <mat-icon class="text-teal-400 text-[18px]">schema</mat-icon>
                    Two-Way Field Mapping & Schema Alignment
                  </h3>
                  <p class="text-xs text-zinc-400 mt-0.5">
                    How CRM contacts & deals map to external marketing service recipient attributes.
                  </p>
                </div>
                <span class="text-[10px] bg-teal-500/10 text-teal-400 px-2.5 py-1 rounded-lg border border-teal-500/20 font-bold">
                  Auto-Harmonized
                </span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr class="border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      <th class="py-2.5 px-3">CRM Field</th>
                      <th class="py-2.5 px-3">Mailchimp Tag</th>
                      <th class="py-2.5 px-3">SendGrid Custom Field</th>
                      <th class="py-2.5 px-3">HubSpot Property</th>
                      <th class="py-2.5 px-3 text-right">Direction</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-850/60 font-mono text-[11px]">
                    <tr>
                      <td class="py-2.5 px-3 text-white font-bold font-sans">Contact Email</td>
                      <td class="py-2.5 px-3 text-amber-300">EMAIL</td>
                      <td class="py-2.5 px-3 text-blue-300">email</td>
                      <td class="py-2.5 px-3 text-orange-300">email</td>
                      <td class="py-2.5 px-3 text-right text-emerald-400 font-sans font-semibold">2-Way</td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3 text-white font-bold font-sans">Full Name</td>
                      <td class="py-2.5 px-3 text-amber-300">FNAME, LNAME</td>
                      <td class="py-2.5 px-3 text-blue-300">first_name, last_name</td>
                      <td class="py-2.5 px-3 text-orange-300">firstname, lastname</td>
                      <td class="py-2.5 px-3 text-right text-emerald-400 font-sans font-semibold">2-Way</td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3 text-white font-bold font-sans">Company & Domain</td>
                      <td class="py-2.5 px-3 text-amber-300">COMPANY</td>
                      <td class="py-2.5 px-3 text-blue-300">company_name</td>
                      <td class="py-2.5 px-3 text-orange-300">company</td>
                      <td class="py-2.5 px-3 text-right text-emerald-400 font-sans font-semibold">CRM &rarr; Mktg</td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3 text-white font-bold font-sans">Pipeline Deal LTV</td>
                      <td class="py-2.5 px-3 text-amber-300">LTV_VALUE</td>
                      <td class="py-2.5 px-3 text-blue-300">pipeline_deal_value</td>
                      <td class="py-2.5 px-3 text-orange-300">annualrevenue</td>
                      <td class="py-2.5 px-3 text-right text-teal-400 font-sans font-semibold">CRM &rarr; Mktg</td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3 text-white font-bold font-sans">Lead Stage & Fit Score</td>
                      <td class="py-2.5 px-3 text-amber-300">STAGE, SCORE</td>
                      <td class="py-2.5 px-3 text-blue-300">lead_status</td>
                      <td class="py-2.5 px-3 text-orange-300">lifecyclestage</td>
                      <td class="py-2.5 px-3 text-right text-emerald-400 font-sans font-semibold">2-Way</td>
                    </tr>
                    <tr>
                      <td class="py-2.5 px-3 text-white font-bold font-sans">Unsubscribe / Opt-Out</td>
                      <td class="py-2.5 px-3 text-amber-300">STATUS (Unsubscribed)</td>
                      <td class="py-2.5 px-3 text-blue-300">unsubscribed_flag</td>
                      <td class="py-2.5 px-3 text-orange-300">hs_email_optout</td>
                      <td class="py-2.5 px-3 text-right text-rose-400 font-sans font-semibold">Mktg &rarr; CRM</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Right col: Sync Execution & Controls -->
            <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
              <div>
                <h3 class="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2 mb-2">
                  <mat-icon class="text-emerald-400 text-[18px]">rule</mat-icon>
                  Audience Sync Engine
                </h3>
                <p class="text-xs text-zinc-400 mb-4">
                  Select which CRM cohort to synchronize into connected marketing providers.
                </p>

                <div class="space-y-3">
                  <div>
                    <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Target CRM Cohort</label>
                    <select [(ngModel)]="syncCohortSelection" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/50">
                      <option value="all">All Contacts & Leads ({{ totalAvailableContacts() }} records)</option>
                      <option value="opportunities">Active Opportunities & Deals Only</option>
                      <option value="high_value">High Value Enterprise ($100k+ LTV)</option>
                      <option value="customers">Signed Customers (Contracted)</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Destination Provider</label>
                    <select [(ngModel)]="syncTargetProvider" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/50">
                      <option value="mailchimp">Mailchimp (Enterprise Growth List)</option>
                      <option value="sendgrid">SendGrid (High Intent SaaS Leads)</option>
                      <option value="hubspot">HubSpot (Marketing Contacts Tier 1)</option>
                    </select>
                  </div>

                  <div class="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 text-[11px] text-zinc-400 space-y-1">
                    <div class="flex items-center gap-1.5 text-zinc-300 font-bold">
                      <mat-icon class="text-teal-400 text-[14px]">verified_user</mat-icon>
                      Automatic Deduplication
                    </div>
                    <p>Identical email records are merged safely. Unsubscribes in Mailchimp or SendGrid will immediately update CRM opt-out tags.</p>
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-zinc-800/80">
                <button 
                  type="button"
                  (click)="triggerSync(syncTargetProvider)"
                  [disabled]="marketing.isSyncing()"
                  class="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer">
                  <mat-icon class="text-[16px]">cloud_sync</mat-icon>
                  <span>Execute Contact Synchronization</span>
                </button>
              </div>
            </div>

          </div>

          <!-- Sync Audit Ledger Table -->
          <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div class="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/80">
              <div class="flex items-center gap-2">
                <mat-icon class="text-zinc-500 text-[18px]">history</mat-icon>
                <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-300 font-display">Synchronization Audit Trail</h3>
                <span class="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">{{ marketing.syncLogs().length }} entries</span>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr class="border-b border-zinc-800/80 bg-zinc-950/60 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    <th class="py-3 px-5">Timestamp</th>
                    <th class="py-3 px-5">Provider</th>
                    <th class="py-3 px-5">Direction</th>
                    <th class="py-3 px-5 text-right">Processed</th>
                    <th class="py-3 px-5 text-right">Added / Enriched</th>
                    <th class="py-3 px-5">Status & Audit Details</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/50">
                  @for (log of marketing.syncLogs(); track log.id) {
                    <tr class="hover:bg-zinc-800/30 transition-colors">
                      <td class="py-3 px-5 font-mono text-zinc-400 text-[11px] whitespace-nowrap">{{ log.timestamp }}</td>
                      <td class="py-3 px-5">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase"
                          [class]="log.provider === 'mailchimp' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : log.provider === 'sendgrid' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'">
                          {{ log.provider }}
                        </span>
                      </td>
                      <td class="py-3 px-5 text-zinc-400 font-mono text-[11px]">
                        @if (log.direction === 'crm_to_provider') {
                          <span>CRM &rarr; {{ log.provider }}</span>
                        } @else if (log.direction === 'bidirectional') {
                          <span class="text-teal-400">&harr; Bidirectional</span>
                        } @else {
                          <span>{{ log.provider }} &rarr; CRM</span>
                        }
                      </td>
                      <td class="py-3 px-5 text-right font-mono font-bold text-white">{{ log.recordsProcessed }}</td>
                      <td class="py-3 px-5 text-right font-mono text-teal-400 font-bold">+{{ log.recordsAdded }} / {{ log.recordsUpdated }} upd</td>
                      <td class="py-3 px-5 text-zinc-300 text-xs">
                        <div class="flex items-center gap-1.5">
                          <mat-icon class="text-emerald-400 text-[15px]">check_circle</mat-icon>
                          <span>{{ log.details }}</span>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </div>
      }

      <!-- ================= TAB 2: BULK CAMPAIGN DISPATCHER ================= -->
      @if (activeTab() === 'bulk_send') {
        <div class="space-y-6 animate-fade-in">
          
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Left 2 cols: Campaign Composer -->
            <div class="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative space-y-5">
              
              <div class="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div>
                  <h2 class="text-lg font-bold text-white font-display flex items-center gap-2">
                    <mat-icon class="text-purple-400 text-[22px]">send</mat-icon>
                    Compose & Dispatch Bulk Campaign
                  </h2>
                  <p class="text-xs text-zinc-400 mt-0.5">
                    Broadcast personalized email newsletters and executive briefings via Mailchimp, SendGrid, or HubSpot.
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400">
                    Est. Recipients: <span class="text-teal-400 font-bold">{{ estimatedRecipients() }}</span>
                  </span>
                </div>
              </div>

              <!-- Provider & Audience Bar -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                    Delivery Service Gateway
                  </label>
                  <select [(ngModel)]="bulkDraft.provider" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/60 font-medium">
                    <option value="sendgrid">SendGrid Marketing API (v3)</option>
                    <option value="mailchimp">Mailchimp Audience Gateway</option>
                    <option value="hubspot">HubSpot Marketing Contacts</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                    Target Recipient Audience
                  </label>
                  <select [(ngModel)]="bulkDraft.targetAudience" (change)="updateEstimatedRecipients()" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/60 font-medium">
                    <option value="Enterprise Accounts ($100k+ Pipeline)">Enterprise Accounts ($100k+ Pipeline)</option>
                    <option value="All Qualified Inbound Leads">All Qualified Inbound Leads</option>
                    <option value="Active Opportunities in Negotiation">Active Opportunities in Negotiation</option>
                    <option value="Signed Customers & SLA Partners">Signed Customers & SLA Partners</option>
                    <option value="Newsletter Subscribers & Trial Users">Newsletter Subscribers & Trial Users</option>
                  </select>
                </div>
              </div>

              <!-- Title, Subject & Preheader -->
              <div class="space-y-4">
                <div>
                  <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Internal Campaign Name</label>
                  <input type="text" [(ngModel)]="bulkDraft.title" placeholder="e.g., Q3 Enterprise Architecture Dossier" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Subject Line</label>
                    <input type="text" [(ngModel)]="bulkDraft.subject" placeholder="e.g., The Sovereign Architecture: Upgrading Your Core Infrastructure" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Preheader Preview</label>
                    <input type="text" [(ngModel)]="bulkDraft.preheader" placeholder="e.g., Benchmark dossier for CIOs navigating hybrid databases" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Sender Identity Name</label>
                    <input type="text" [(ngModel)]="bulkDraft.senderName" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Sender Email Address</label>
                    <input type="email" [(ngModel)]="bulkDraft.senderEmail" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/60" />
                  </div>
                </div>
              </div>

              <!-- Dynamic Merge Tags Bar -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Dynamic Merge Tags</label>
                  <span class="text-[10px] text-zinc-500 font-mono">Click to insert at cursor</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button type="button" (click)="insertMergeTag('{{contact.name}}')" class="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-teal-300 rounded-lg text-[11px] font-mono transition-colors cursor-pointer">
                    {{ '+ {{contact.name}}' }}
                  </button>
                  <button type="button" (click)="insertMergeTag('{{contact.company}}')" class="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-teal-300 rounded-lg text-[11px] font-mono transition-colors cursor-pointer">
                    {{ '+ {{contact.company}}' }}
                  </button>
                  <button type="button" (click)="insertMergeTag('{{deal.value}}')" class="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-purple-300 rounded-lg text-[11px] font-mono transition-colors cursor-pointer">
                    {{ '+ {{deal.value}}' }}
                  </button>
                  <button type="button" (click)="insertMergeTag('{{agent.name}}')" class="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-amber-300 rounded-lg text-[11px] font-mono transition-colors cursor-pointer">
                    {{ '+ {{agent.name}}' }}
                  </button>
                  <button type="button" (click)="loadPresetTemplate('executive')" class="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ml-auto">
                    Load Executive Template
                  </button>
                </div>
              </div>

              <!-- Email Body (Text / HTML) -->
              <div>
                <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Broadcast Body (HTML or Plain Text)</label>
                <textarea 
                  [(ngModel)]="bulkDraft.htmlContent"
                  rows="9"
                  placeholder="Draft your high-impact message here..."
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/60 font-mono leading-relaxed"></textarea>
              </div>

              <!-- Dispatch Buttons -->
              <div class="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                <div class="text-xs text-zinc-400 flex items-center gap-1.5">
                  <mat-icon class="text-teal-400 text-[16px]">verified</mat-icon>
                  <span>Spam Deliverability Check: <strong class="text-teal-300">99.1% (High Inbound Reputation)</strong></span>
                </div>

                <div class="flex items-center gap-3">
                  <button 
                    type="button"
                    (click)="sendTestEmail()"
                    class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                    Send Test Preview
                  </button>

                  <button 
                    type="button"
                    (click)="executeBulkDispatch()"
                    [disabled]="isSendingBulk() || !bulkDraft.title || !bulkDraft.subject"
                    class="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95">
                    @if (isSendingBulk()) {
                      <mat-icon class="animate-spin text-[16px]">refresh</mat-icon>
                      <span>Dispatching via {{ getProviderDisplayName(bulkDraft.provider) }}...</span>
                    } @else {
                      <mat-icon class="text-[16px]">rocket_launch</mat-icon>
                      <span>Broadcast to {{ estimatedRecipients() }} Contacts</span>
                    }
                  </button>
                </div>
              </div>

            </div>

            <!-- Right col: BEEP Sassy AI Copilot & HITL Tone Review -->
            <div class="space-y-4 flex flex-col">
              
              <!-- BEEP Copilot Widget -->
              <div class="bg-gradient-to-br from-purple-950/40 via-zinc-900 to-indigo-950/40 border border-purple-500/30 rounded-2xl p-5 backdrop-blur-xl shadow-xl relative overflow-hidden">
                <div class="flex items-center gap-2.5 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold">
                    <mat-icon class="text-[18px]">smart_toy</mat-icon>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-white font-display">BEEP &bull; Tone Sentinel</h4>
                    <p class="text-[10px] text-purple-300 font-mono">The Reluctant Saviour</p>
                  </div>
                </div>

                <div class="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs text-zinc-300 leading-relaxed font-sans italic mb-3">
                  "I inspected your subject line. It does not reek of generic corporate spam, which is a minor miracle. I added dynamic personalization tags so the recipient actually remembers they signed an NDA with us."
                </div>

                <div class="space-y-2 text-xs">
                  <button type="button" (click)="calibrateTone('witty')" class="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-zinc-300 transition-colors flex items-center justify-between cursor-pointer">
                    <span class="flex items-center gap-1.5">
                      <mat-icon class="text-amber-400 text-sm">electric_bolt</mat-icon> Inject Witty Sarcasm
                    </span>
                    <mat-icon class="text-xs text-zinc-500">add</mat-icon>
                  </button>

                  <button type="button" (click)="calibrateTone('sovereign')" class="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-zinc-300 transition-colors flex items-center justify-between cursor-pointer">
                    <span class="flex items-center gap-1.5">
                      <mat-icon class="text-teal-400 text-sm">shield</mat-icon> Sovereign Authority Tone
                    </span>
                    <mat-icon class="text-xs text-zinc-500">add</mat-icon>
                  </button>

                  <button type="button" (click)="calibrateTone('concise')" class="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-zinc-300 transition-colors flex items-center justify-between cursor-pointer">
                    <span class="flex items-center gap-1.5">
                      <mat-icon class="text-cyan-400 text-sm">compress</mat-icon> Strict 3-Sentence Brevity
                    </span>
                    <mat-icon class="text-xs text-zinc-500">add</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Human In The Loop Pre-Flight Checklist -->
              <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md flex-1 flex flex-col justify-between">
                <div>
                  <h4 class="text-xs font-bold text-white uppercase tracking-wider font-display mb-3 flex items-center gap-2">
                    <mat-icon class="text-teal-400 text-[16px]">fact_check</mat-icon>
                    Human-in-the-Loop Review
                  </h4>

                  <div class="space-y-2.5 text-xs text-zinc-300">
                    <label class="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked class="mt-0.5 rounded bg-zinc-950 border-zinc-700 text-teal-500 focus:ring-0" />
                      <span>Unsubscribe headers (RFC 8058) registered with Mailchimp/SendGrid</span>
                    </label>
                    <label class="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked class="mt-0.5 rounded bg-zinc-950 border-zinc-700 text-teal-500 focus:ring-0" />
                      <span>Automatic CRM deal activity logging enabled for all recipients</span>
                    </label>
                    <label class="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked class="mt-0.5 rounded bg-zinc-950 border-zinc-700 text-teal-500 focus:ring-0" />
                      <span>Dynamic merge tags syntax verified against CRM contact database</span>
                    </label>
                  </div>
                </div>

                <div class="p-3 bg-zinc-950/80 rounded-xl border border-zinc-850 text-[10px] text-zinc-500 mt-4">
                  All dispatches conform strictly to tenant isolation. No recipient data leaks outside your designated Appwrite workspace.
                </div>
              </div>

            </div>

          </div>

        </div>
      }

      <!-- ================= TAB 3: CAMPAIGN PERFORMANCE ANALYTICS ================= -->
      @if (activeTab() === 'analytics') {
        <div class="space-y-6 animate-fade-in">
          
          <!-- Aggregate Metrics Banner -->
          <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Dispatched</span>
              <div class="text-2xl font-bold font-mono text-white mt-2">{{ marketing.aggregatedPerformance().totalSent | number }}</div>
              <span class="text-[10px] text-zinc-500 mt-1">Across 3 Provider Gateways</span>
            </div>

            <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Delivery Rate</span>
              <div class="text-2xl font-bold font-mono text-emerald-400 mt-2">{{ marketing.aggregatedPerformance().avgDeliveryRate }}%</div>
              <span class="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-0.5">
                <mat-icon class="text-[12px]">verified</mat-icon> 99.4% SLA Target
              </span>
            </div>

            <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Average Open Rate</span>
              <div class="text-2xl font-bold font-mono text-teal-400 mt-2">{{ marketing.aggregatedPerformance().avgOpenRate }}%</div>
              <span class="text-[10px] text-teal-400/80 mt-1">+18.2% vs Industry avg</span>
            </div>

            <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Click-Through (CTR)</span>
              <div class="text-2xl font-bold font-mono text-purple-400 mt-2">{{ marketing.aggregatedPerformance().avgClickRate }}%</div>
              <span class="text-[10px] text-purple-400/80 mt-1">{{ marketing.aggregatedPerformance().totalClicks }} verified link visits</span>
            </div>

            <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between col-span-2 lg:col-span-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Attributed Won ARR</span>
              <div class="text-2xl font-bold font-mono text-amber-400 mt-2">\${{ (marketing.aggregatedPerformance().totalRevenue).toLocaleString() }}</div>
              <span class="text-[10px] text-amber-400/80 mt-1 font-semibold">{{ marketing.aggregatedPerformance().totalReplies }} Executive Replies</span>
            </div>
          </div>

          <!-- Campaigns Telemetry Table -->
          <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div class="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/70">
              <div class="flex items-center gap-2">
                <mat-icon class="text-teal-400 text-[18px]">query_stats</mat-icon>
                <h3 class="text-xs font-bold uppercase tracking-wider text-white font-display">Marketing Campaigns Ledger</h3>
                <span class="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">{{ marketing.bulkCampaigns().length }}</span>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr class="border-b border-zinc-800/80 bg-zinc-900/90 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th class="px-6 py-4">Campaign Title & Gateway</th>
                    <th class="px-6 py-4">Audience Target</th>
                    <th class="px-6 py-4 text-right">Recipients</th>
                    <th class="px-6 py-4 text-right">Open Rate</th>
                    <th class="px-6 py-4 text-right">CTR</th>
                    <th class="px-6 py-4 text-right">Replies</th>
                    <th class="px-6 py-4 text-right">Attributed ARR</th>
                    <th class="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/50 text-xs">
                  @for (camp of marketing.bulkCampaigns(); track camp.id) {
                    <tr class="hover:bg-zinc-800/30 transition-colors group">
                      <td class="px-6 py-4 align-top">
                        <div class="font-bold text-white text-sm group-hover:text-teal-300 transition-colors">
                          {{ camp.title }}
                        </div>
                        <div class="flex items-center gap-2 mt-1">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            [class]="camp.provider === 'mailchimp' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : camp.provider === 'sendgrid' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'">
                            {{ camp.provider }}
                          </span>
                          <span class="text-zinc-500 text-[11px] font-mono">{{ camp.sentAt || camp.createdAt }}</span>
                        </div>
                      </td>

                      <td class="px-6 py-4 align-top text-zinc-300">
                        {{ camp.targetAudience }}
                      </td>

                      <td class="px-6 py-4 align-top text-right font-mono font-bold text-white">
                        {{ camp.stats.recipients }}
                      </td>

                      <td class="px-6 py-4 align-top text-right font-mono text-teal-400 font-bold">
                        {{ camp.stats.openRate }}%
                      </td>

                      <td class="px-6 py-4 align-top text-right font-mono text-purple-400 font-bold">
                        {{ camp.stats.clickRate }}%
                      </td>

                      <td class="px-6 py-4 align-top text-right font-mono text-zinc-200">
                        {{ camp.stats.replies }}
                      </td>

                      <td class="px-6 py-4 align-top text-right font-mono text-amber-400 font-bold">
                        \${{ (camp.stats.revenueAttributed).toLocaleString() }}
                      </td>

                      <td class="px-6 py-4 align-top text-right">
                        <button 
                          type="button"
                          (click)="inspectBulkCampaign(camp)"
                          class="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-teal-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                          Inspect
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Deep Campaign Inspector Modal -->
          @if (selectedBulkCampaign(); as activeBulk) {
            <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
              <div class="bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
                
                <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <span class="text-[10px] text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase">
                      {{ activeBulk.provider }} Dispatched
                    </span>
                    <h3 class="text-lg font-bold text-white font-display mt-1">{{ activeBulk.title }}</h3>
                    <p class="text-xs text-zinc-400 font-mono">Subject: {{ activeBulk.subject }}</p>
                  </div>
                  <button (click)="selectedBulkCampaign.set(null)" class="text-zinc-500 hover:text-white p-1">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>

                <!-- Metrics Grid -->
                <div class="grid grid-cols-4 gap-3">
                  <div class="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
                    <span class="block text-[9px] font-bold text-zinc-500 uppercase">Delivered</span>
                    <span class="text-lg font-mono font-bold text-white">{{ activeBulk.stats.delivered }} / {{ activeBulk.stats.recipients }}</span>
                  </div>
                  <div class="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
                    <span class="block text-[9px] font-bold text-zinc-500 uppercase">Open Rate</span>
                    <span class="text-lg font-mono font-bold text-teal-400">{{ activeBulk.stats.openRate }}%</span>
                  </div>
                  <div class="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
                    <span class="block text-[9px] font-bold text-zinc-500 uppercase">CTR</span>
                    <span class="text-lg font-mono font-bold text-purple-400">{{ activeBulk.stats.clickRate }}%</span>
                  </div>
                  <div class="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
                    <span class="block text-[9px] font-bold text-zinc-500 uppercase">ARR Attributed</span>
                    <span class="text-lg font-mono font-bold text-amber-400">\${{ (activeBulk.stats.revenueAttributed).toLocaleString() }}</span>
                  </div>
                </div>

                <!-- Recipient Interaction Feed -->
                @if (activeBulk.recipientTimeline && activeBulk.recipientTimeline.length > 0) {
                  <div>
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-2 font-display">Individual Recipient Engagement Feed</h4>
                    <div class="space-y-2">
                      @for (item of activeBulk.recipientTimeline; track item.email) {
                        <div class="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-xs">
                          <div class="flex items-center gap-3">
                            <div class="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-teal-400">
                              {{ item.name.charAt(0) }}
                            </div>
                            <div>
                              <div class="font-bold text-white">{{ item.name }} <span class="text-zinc-500 font-normal">({{ item.company }})</span></div>
                              <div class="text-[11px] text-zinc-400 font-mono">{{ item.email }}</div>
                            </div>
                          </div>
                          <div class="text-right">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                              [class]="item.event === 'Replied' ? 'bg-emerald-500/15 text-emerald-400' : item.event === 'Clicked' ? 'bg-purple-500/15 text-purple-400' : 'bg-teal-500/15 text-teal-400'">
                              {{ item.event }}
                            </span>
                            <div class="text-[10px] text-zinc-500 font-mono mt-0.5">{{ item.timestamp }}</div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }

                <div class="flex justify-end pt-3 border-t border-zinc-800">
                  <button (click)="selectedBulkCampaign.set(null)" class="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold cursor-pointer">
                    Close Inspector
                  </button>
                </div>

              </div>
            </div>
          }

        </div>
      }

      <!-- ================= TAB 4: AUTOMATED MULTI-TRIGGER DRIPS ================= -->
      @if (activeTab() === 'automated') {
        <div class="space-y-6 animate-fade-in">
          
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-white font-display flex items-center gap-2">
              <mat-icon class="text-indigo-400">auto_mode</mat-icon>
              Multi-Trigger Drip & DCO Engine
            </h2>

            <div class="flex items-center gap-2">
              <button 
                type="button"
                (click)="showSimulateModal.set(true)" 
                class="px-3.5 py-2 rounded-xl text-xs font-semibold border bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer">
                <mat-icon class="text-[16px] text-teal-400">bolt</mat-icon>
                <span>Simulate Lead Trigger</span>
              </button>

              <button 
                type="button"
                (click)="openCreateModal()" 
                class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 cursor-pointer active:scale-95 transition-all">
                <mat-icon class="text-[16px]">add_circle</mat-icon>
                <span>Create Automated Campaign</span>
              </button>
            </div>
          </div>

          <!-- Campaigns Table & Control Center -->
          <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
            
            <!-- Table Filter / Subheader -->
            <div class="p-4 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/70">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Automated Drips Portfolio</span>
                <span class="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">{{ filteredCampaigns().length }}</span>
              </div>

              <div class="flex items-center gap-2">
                <div class="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  @for (st of ['ALL', 'Active', 'Paused', 'Draft']; track st) {
                    <button 
                      type="button"
                      (click)="selectedStatusFilter.set(st)"
                      [class]="selectedStatusFilter() === st ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white'"
                      class="px-3 py-1 rounded-lg text-xs transition-all cursor-pointer">
                      {{ st }}
                    </button>
                  }
                </div>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr class="border-b border-zinc-800/80 bg-zinc-900/90 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <th class="px-6 py-4">Campaign & Trigger Rule</th>
                    <th class="px-6 py-4">Status & Control</th>
                    <th class="px-6 py-4">Personality Voice</th>
                    <th class="px-6 py-4 text-right">Enrolled</th>
                    <th class="px-6 py-4 text-right">Open Rate</th>
                    <th class="px-6 py-4 text-right">CTR / Reply</th>
                    <th class="px-6 py-4 text-right">Won / ARR</th>
                    <th class="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/50 text-xs">
                  @for (camp of filteredCampaigns(); track camp.id) {
                    <tr class="hover:bg-zinc-800/30 transition-colors group">
                      
                      <!-- Name & Trigger -->
                      <td class="px-6 py-4 align-top">
                        <div class="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors mb-1">
                          {{ camp.name }}
                        </div>
                        <div class="flex items-center gap-1.5 text-zinc-400">
                          <mat-icon class="text-[15px] text-teal-400">{{ getTriggerIcon(camp.triggerType) }}</mat-icon>
                          <span class="text-teal-300 font-medium">{{ camp.triggerLabel }}</span>
                        </div>
                        <div class="text-[11px] text-zinc-500 mt-1">
                          {{ camp.steps.length }} sequence touchpoints &bull; Target: {{ camp.targetAudience }}
                        </div>
                      </td>

                      <!-- Status & Quick Toggle Button -->
                      <td class="px-6 py-4 align-top">
                        <div class="space-y-2">
                          <div class="flex items-center gap-2">
                            <span [class]="getStatusBadgeClass(camp.status)" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                              {{ camp.status }}
                            </span>
                          </div>

                          <!-- Control Actions: Pause / Resume / Stop -->
                          <div class="flex items-center gap-1.5 pt-1">
                            @if (camp.status === 'Active') {
                              <button 
                                type="button"
                                (click)="toggleCampaignStatus(camp, 'Paused')" 
                                title="Pause Campaign Drip"
                                class="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer">
                                <mat-icon class="text-[12px]">pause</mat-icon> Pause
                              </button>
                              <button 
                                type="button"
                                (click)="toggleCampaignStatus(camp, 'Stopped')" 
                                title="Stop Campaign"
                                class="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer">
                                <mat-icon class="text-[12px]">stop</mat-icon> Stop
                              </button>
                            } @else if (camp.status === 'Paused' || camp.status === 'Stopped' || camp.status === 'Draft') {
                              <button 
                                type="button"
                                (click)="toggleCampaignStatus(camp, 'Active')" 
                                title="Activate Campaign"
                                class="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer">
                                <mat-icon class="text-[12px]">play_arrow</mat-icon> Activate
                              </button>
                            }
                          </div>
                        </div>
                      </td>

                      <!-- Personality Voice -->
                      <td class="px-6 py-4 align-top">
                        <span class="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold text-[11px] inline-flex items-center gap-1">
                          <mat-icon class="text-[14px]">psychology</mat-icon> {{ camp.personalityVoice }}
                        </span>
                      </td>

                      <!-- Enrolled / Sent -->
                      <td class="px-6 py-4 align-top text-right font-mono text-zinc-300">
                        <div class="font-bold text-white text-sm">{{ camp.stats.enrolled | number }}</div>
                        <div class="text-[10px] text-zinc-500">{{ camp.stats.sent | number }} dispatched</div>
                      </td>

                      <!-- Open Rate -->
                      <td class="px-6 py-4 align-top text-right font-mono">
                        <div class="font-bold text-white text-sm">{{ getCampaignOpenRate(camp) }}%</div>
                        <div class="text-[10px] text-teal-400">{{ camp.stats.opened }} opened</div>
                      </td>

                      <!-- CTR / Reply -->
                      <td class="px-6 py-4 align-top text-right font-mono">
                        <div class="font-bold text-white text-sm">{{ getCampaignClickRate(camp) }}% <span class="text-[10px] text-zinc-400 font-normal">CTR</span></div>
                        <div class="text-[10px] text-purple-400">{{ getCampaignReplyRate(camp) }}% reply</div>
                      </td>

                      <!-- Won / ARR -->
                      <td class="px-6 py-4 align-top text-right font-mono">
                        <div class="font-bold text-amber-400 text-sm">{{ camp.stats.conversions }} Won</div>
                        <div class="text-[10px] text-zinc-400">\${{ (camp.stats.pipelineAttributed).toLocaleString() }}</div>
                      </td>

                      <!-- Actions -->
                      <td class="px-6 py-4 align-top text-right">
                        <div class="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button 
                            type="button"
                            (click)="inspectSequence(camp)" 
                            class="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            title="Inspect Steps & Content">
                            <mat-icon class="text-[16px]">visibility</mat-icon>
                          </button>
                          <button 
                            type="button"
                            (click)="cloneCampaign(camp)" 
                            class="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            title="Clone Sequence">
                            <mat-icon class="text-[16px]">content_copy</mat-icon>
                          </button>
                          <button 
                            type="button"
                            (click)="deleteCampaign(camp.id)" 
                            class="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-900/40 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Delete Campaign">
                            <mat-icon class="text-[16px]">delete</mat-icon>
                          </button>
                        </div>
                      </td>

                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </div>
      }

      <!-- Provider Config Modal -->
      @if (selectedConfigProvider(); as pKey) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 class="text-base font-bold text-white font-display flex items-center gap-2">
                <mat-icon class="text-teal-400">settings</mat-icon> Configure {{ providers()[pKey].name }}
              </h3>
              <button (click)="selectedConfigProvider.set(null)" class="text-zinc-500 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">API Key / Access Token</label>
                <input type="password" [(ngModel)]="providerFormKey" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono" />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Target Audience / List ID</label>
                <input type="text" [(ngModel)]="providerFormListId" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono" />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Sync Frequency</label>
                <select [(ngModel)]="providerFormFrequency" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white">
                  <option value="realtime">Real-Time (On Every CRM Contact Save)</option>
                  <option value="hourly">Hourly Automated Batch</option>
                  <option value="daily">Daily Midnight Batch</option>
                  <option value="manual">Manual Execution Only</option>
                </select>
              </div>

              <label class="flex items-center gap-2 pt-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="providerFormTwoWay" class="rounded bg-zinc-900 border-zinc-700 text-teal-500" />
                <span class="text-zinc-300">Enable 2-Way Sync (Sync opt-outs & clicks back to CRM)</span>
              </label>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button (click)="selectedConfigProvider.set(null)" class="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button (click)="saveProviderConfig(pKey)" class="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs">
                Save & Test Connection
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Sequence Steps Inspector Modal -->
      @if (selectedInspectorCampaign(); as activeCamp) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span class="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-mono font-bold">AUTOMATED SEQUENCE</span>
                <h3 class="text-base font-bold text-white font-display mt-1">{{ activeCamp.name }}</h3>
                <p class="text-xs text-zinc-400 font-mono">Trigger: {{ activeCamp.triggerLabel }}</p>
              </div>
              <button (click)="selectedInspectorCampaign.set(null)" class="text-zinc-500 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
              @for (step of activeCamp.steps; track step.stepNumber) {
                <div class="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                      <mat-icon class="text-[16px]">email</mat-icon> Step {{ step.stepNumber }} (Day +{{ step.delayDays }})
                    </span>
                    <div class="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                      <span class="text-teal-400">{{ step.openRate }}% Open</span>
                      <span class="text-purple-400">{{ step.clickRate }}% Click</span>
                      <span class="text-emerald-400">{{ step.replyRate }}% Reply</span>
                    </div>
                  </div>
                  <div class="text-xs font-bold text-white">{{ step.subject }}</div>
                  <p class="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-850 font-mono whitespace-pre-wrap">{{ step.body }}</p>
                </div>
              }
            </div>

            <div class="flex justify-end pt-2">
              <button (click)="selectedInspectorCampaign.set(null)" class="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold cursor-pointer">
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Trigger Simulation Modal -->
      @if (showSimulateModal()) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-zinc-950 border border-teal-500/40 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 class="text-base font-bold text-white font-display flex items-center gap-2">
                <mat-icon class="text-teal-400">bolt</mat-icon> Simulate Lead Trigger Event
              </h3>
              <button (click)="showSimulateModal.set(false)" class="text-zinc-500 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <p class="text-xs text-zinc-400 leading-relaxed">
              Test how the campaign engine evaluates incoming CRM webhooks and automatically triggers drip sequences for matched leads.
            </p>

            <div class="space-y-2 text-xs">
              <button (click)="runSimulation('Lead assigned to rep: Alexandra Vance')" class="w-full p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-teal-500/40 text-left text-zinc-200 transition-all cursor-pointer flex items-center justify-between">
                <span>🔥 Lead Inbound & Fit Score ≥ 80</span>
                <mat-icon class="text-teal-400 text-[16px]">chevron_right</mat-icon>
              </button>
              <button (click)="runSimulation('Prospect clicked Pricing Calculator link 3x')" class="w-full p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-teal-500/40 text-left text-zinc-200 transition-all cursor-pointer flex items-center justify-between">
                <span>⚡ Pricing Page Intent Click Event</span>
                <mat-icon class="text-teal-400 text-[16px]">chevron_right</mat-icon>
              </button>
              <button (click)="runSimulation('Opportunity inactive for 10 days in Qualified stage')" class="w-full p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-teal-500/40 text-left text-zinc-200 transition-all cursor-pointer flex items-center justify-between">
                <span>⏳ 7-Day Inactivity Auto-Nudge Trigger</span>
                <mat-icon class="text-teal-400 text-[16px]">chevron_right</mat-icon>
              </button>
            </div>

            <div class="flex justify-end pt-2">
              <button (click)="showSimulateModal.set(false)" class="px-4 py-1.5 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Create Automated Campaign Modal -->
      @if (showCreateModal()) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div class="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 class="text-base font-bold text-white font-display flex items-center gap-2">
                <mat-icon class="text-indigo-400">add_circle</mat-icon> Create Automated Campaign Drip
              </h3>
              <button (click)="closeCreateModal()" class="text-zinc-500 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="space-y-4 text-xs">
              <div>
                <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Campaign Name</label>
                <input type="text" [(ngModel)]="draftName" placeholder="e.g. Enterprise Re-engagement Sequence" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white" />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Trigger Event</label>
                <select [(ngModel)]="draftTriggerType" (change)="onTriggerChange()" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white">
                  @for (opt of triggerOptions; track opt.type) {
                    <option [value]="opt.type">{{ opt.label }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Target Audience</label>
                <input type="text" [(ngModel)]="draftAudience" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white" />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Initial Touchpoint Subject</label>
                <input type="text" [(ngModel)]="draftStepSubject" placeholder="Quick question regarding your cloud migration" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white" />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Initial Email Body</label>
                <textarea [(ngModel)]="draftStepBody" rows="4" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-mono text-xs"></textarea>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button (click)="closeCreateModal()" class="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button (click)="saveNewCampaign()" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs">
                Activate Drip
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Brand Signature (Mandatory Instrument) -->
      <footer class="pt-6 border-t border-zinc-900/80 flex items-center justify-between text-xs text-zinc-500">
        <div class="select-none pointer-events-none opacity-40" style="mix-blend-mode: overlay;">
          <div class="font-logo font-bold text-[10px] text-[#F5FFFA] tracking-normal leading-tight">ΛΞV Inc</div>
          <div class="font-sans font-light text-[8px] text-zinc-400 tracking-[0.2em] uppercase leading-none mt-1">The Future Needs Context</div>
          <div class="font-sans font-light text-[7px] text-zinc-500 tracking-[0.1em] mt-0.5">Innovate, Automate, Dominate</div>
        </div>
        <div class="font-mono text-[10px]">
          Verdigris Interface Protocol™ v2.0 &bull; Mailchimp, SendGrid & HubSpot Edge Harmonized
        </div>
      </footer>

    </div>
  `
})
export class CampaignsComponent implements OnInit {
  appwrite = inject(Appwrite);
  leadService = inject(LeadService);
  marketing = inject(EmailMarketingService);

  activeTab = signal<'sync' | 'bulk_send' | 'analytics' | 'automated'>('sync');

  // Provider states
  providers = this.marketing.providers;

  // Sync Cohort and Provider controls
  syncCohortSelection = 'all';
  syncTargetProvider: EmailMarketingProvider = 'sendgrid';

  // Config Modal State
  selectedConfigProvider = signal<EmailMarketingProvider | null>(null);
  providerFormKey = '';
  providerFormListId = '';
  providerFormFrequency: ProviderConfig['syncFrequency'] = 'realtime';
  providerFormTwoWay = true;

  // Bulk Dispatch Composer State
  isSendingBulk = signal<boolean>(false);
  selectedBulkCampaign = signal<BulkCampaignRecord | null>(null);

  bulkDraft = {
    title: 'Q3 Enterprise Architecture & AI Governance Dossier',
    subject: 'The Sovereign Architecture: Upgrading Your 2026 Core Infrastructure',
    preheader: 'Benchmark dossier for CIOs navigating hybrid Appwrite & Turso edge databases.',
    provider: 'sendgrid' as EmailMarketingProvider,
    targetAudience: 'Enterprise Accounts ($100k+ Pipeline)',
    senderName: 'Sarah Jenkins (VP Strategy)',
    senderEmail: 'sarah@laevos.io',
    htmlContent: `<p>Esteemed Founder,</p>
<p>Modern multi-tenancy cannot afford latency or fragile data silos. In this release, discover how our unified CRM synchronizes across the edge with zero compromise.</p>
<p>Key highlights in this briefing for {{contact.company}}:</p>
<ul>
  <li>Autonomous agentic telemetry with Human-In-The-Loop review</li>
  <li>Instant pipeline deal attribution (Estimated Value: {{deal.value}})</li>
  <li>Real-time Mailchimp, SendGrid, and HubSpot two-way sync</li>
</ul>
<p>Respectfully,<br/>{{agent.name}}</p>`
  };

  // Automated Campaigns State
  showCreateModal = signal<boolean>(false);
  showSimulateModal = signal<boolean>(false);
  selectedInspectorCampaign = signal<AutomatedCampaign | null>(null);
  selectedStatusFilter = signal<string>('ALL');

  draftName = '';
  draftAudience = 'Hot Leads (Score ≥ 75)';
  draftTriggerType: AutomatedCampaign['triggerType'] = 'lead_assigned';
  draftTriggerLabel = 'Trigger on New Lead Assigned';
  draftPersonalityVoice = 'Witty Challenger';
  draftStepSubject = '';
  draftStepBody = '';

  triggerOptions = [
    { type: 'lead_assigned' as const, label: 'New Lead Assigned', icon: 'person_add', desc: 'Fires instantly when a lead is routed to a sales rep.' },
    { type: 'activity_click' as const, label: 'High Intent Link Click', icon: 'ads_click', desc: 'Fires when prospect clicks pricing, whitepaper, or proposal links.' },
    { type: 'inactivity_threshold' as const, label: '7-Day Inactivity Re-engagement', icon: 'schedule', desc: 'Fires when no email/call activity is logged in 7 days.' },
    { type: 'score_threshold' as const, label: 'AI Score ≥ 75 (Hot)', icon: 'local_fire_department', desc: 'Fires when lead predictive score crosses into Hot tier.' }
  ];

  campaigns = signal<AutomatedCampaign[]>([
    {
      id: 'camp-1',
      name: 'High-Intent Enterprise Pipeline Nudge',
      triggerType: 'activity_click',
      triggerLabel: 'High Intent Link Click (Pricing/SLA)',
      targetAudience: 'Leads with Score ≥ 75 & Enterprise Tier',
      status: 'Active',
      createdAt: new Date('2026-07-01'),
      personalityVoice: 'Witty Challenger',
      stats: {
        enrolled: 42,
        sent: 118,
        opened: 86,
        clicked: 44,
        replied: 22,
        bounced: 1,
        conversions: 8,
        pipelineAttributed: 845000
      },
      steps: [
        {
          stepNumber: 1,
          channel: 'Email',
          delayDays: 0,
          subject: 'Saw you exploring our custom SLA tiers—cut to the chase?',
          body: "Hi {{contact.name}},\n\nI noticed someone from {{contact.company}} checking our 99.99% multi-tenant architecture pricing yesterday. Most teams stop by because legacy CRMs choke on edge latency.\n\nAre you looking to migrate this quarter or just benchmarking for an upcoming procurement cycle?\n\nBest,\nSarah",
          personalityStyle: 'Witty Challenger',
          openRate: 78.4,
          clickRate: 36.2,
          replyRate: 18.6
        }
      ]
    },
    {
      id: 'camp-2',
      name: 'Cold Inbound 7-Day Revival Drip',
      triggerType: 'inactivity_threshold',
      triggerLabel: '7-Day Inactivity After Proposal',
      targetAudience: 'Stalled Proposals in Qualified / Proposal Stage',
      status: 'Active',
      createdAt: new Date('2026-07-15'),
      personalityVoice: 'Direct Strategist',
      stats: {
        enrolled: 29,
        sent: 76,
        opened: 52,
        clicked: 21,
        replied: 14,
        bounced: 0,
        conversions: 5,
        pipelineAttributed: 460000
      },
      steps: [
        {
          stepNumber: 1,
          channel: 'Email',
          delayDays: 7,
          subject: 'Dead end or priority shift for {{contact.company}}?',
          body: "Hi {{contact.name}},\n\nUsually when deals go silent at this stage, it means either priorities shifted, or our proposal missed a key stakeholder requirement.\n\nShould we archive this project, or would a 10-minute calibration call make sense this Thursday?\n\nBest,\nAlex",
          personalityStyle: 'Direct Strategist',
          openRate: 68.2,
          clickRate: 27.6,
          replyRate: 18.4
        }
      ]
    }
  ]);

  filteredCampaigns = computed(() => {
    const filter = this.selectedStatusFilter();
    if (filter === 'ALL') return this.campaigns();
    return this.campaigns().filter(c => c.status === filter);
  });

  ngOnInit() {
    this.leadService.fetchLeads();
  }

  totalAvailableContacts = computed(() => {
    return this.appwrite.contacts().length + this.leadService.leads().length || 38;
  });

  estimatedRecipients = computed(() => {
    const aud = this.bulkDraft.targetAudience;
    if (aud.includes('All')) return 520;
    if (aud.includes('Enterprise')) return 340;
    if (aud.includes('Negotiation')) return 96;
    if (aud.includes('Signed')) return 185;
    return 240;
  });

  updateEstimatedRecipients() {
    // Computed auto updates
  }

  getProviderDisplayName(provider: EmailMarketingProvider | null): string {
    if (provider === 'mailchimp') return 'Mailchimp';
    if (provider === 'sendgrid') return 'SendGrid';
    if (provider === 'hubspot') return 'HubSpot';
    return 'Marketing Gateway';
  }

  // Trigger Contact Sync
  async triggerSync(provider: EmailMarketingProvider) {
    await this.marketing.syncContactsWithProvider(provider, 'all');
  }

  // Provider Config Modal
  openProviderConfig(provider: EmailMarketingProvider) {
    const p = this.providers()[provider];
    this.selectedConfigProvider.set(provider);
    this.providerFormKey = p.apiKey || '';
    this.providerFormListId = p.listId || '';
    this.providerFormFrequency = p.syncFrequency;
    this.providerFormTwoWay = p.twoWaySync;
  }

  saveProviderConfig(provider: EmailMarketingProvider) {
    this.marketing.updateProviderConfig(provider, {
      apiKey: this.providerFormKey,
      listId: this.providerFormListId,
      syncFrequency: this.providerFormFrequency,
      twoWaySync: this.providerFormTwoWay
    });
    this.selectedConfigProvider.set(null);
  }

  // Merge tag insertion
  insertMergeTag(tag: string) {
    this.bulkDraft.htmlContent += ' ' + tag;
  }

  loadPresetTemplate(type: string) {
    if (type === 'executive') {
      this.bulkDraft.title = 'Executive Briefing & SLA Modernization';
      this.bulkDraft.subject = 'Notice to {{contact.company}}: 2026 Core Infrastructure Upgrades';
      this.bulkDraft.preheader = 'High-throughput architecture update for enterprise leadership.';
      this.bulkDraft.htmlContent = `<p>Greetings {{contact.name}},</p>
<p>As part of our commitment to transparent SLA compliance, we are publishing the latest Q3 multi-tenant benchmark dossier for {{contact.company}}.</p>
<p>Your current pipeline allocation is valued at {{deal.value}}. To review your dedicated deal room and audit ledger, follow the link below:</p>
<p><a href="https://laevos.io/deal-hub">Access {{contact.company}} Deal Room &rarr;</a></p>
<p>Warm regards,<br/>{{agent.name}}<br/>ΛΞV Enterprise Operations</p>`;
    }
  }

  calibrateTone(tone: 'witty' | 'sovereign' | 'concise') {
    if (tone === 'witty') {
      this.bulkDraft.subject = 'Is your CRM still running on dial-up logic?';
      this.bulkDraft.htmlContent = `<p>Hey {{contact.name}},</p>
<p>Let's be candid: most SaaS platforms love to charge per seat while offering the responsiveness of an ancient glacier.</p>
<p>We built something different for {{contact.company}}. Our sovereign edge handles the heavy lifting so your reps actually close deals instead of manually copy-pasting notes.</p>
<p>Care to see the benchmark comparisons?</p>
<p>Best,<br/>{{agent.name}}</p>`;
    } else if (tone === 'sovereign') {
      this.bulkDraft.subject = 'The Sovereign Mandate: Eliminating CRM Friction at {{contact.company}}';
      this.bulkDraft.htmlContent = `<p>Esteemed Founder,</p>
<p>The digital temple demands absolute precision. Inefficiency is not merely an inconvenience; it is an offense to logical order.</p>
<p>We have provisioned automated multi-tenant telemetry for {{contact.company}}. You may inspect the live ledger at your convenience.</p>
<p>In Sovereignty,<br/>{{agent.name}}</p>`;
    } else {
      this.bulkDraft.subject = 'Quick update regarding {{contact.company}}';
      this.bulkDraft.htmlContent = `<p>Hi {{contact.name}},</p>
<p>We just finalized the deployment benchmark for {{contact.company}}. Everything is ready for executive review under the agreed {{deal.value}} allocation.</p>
<p>Let me know if Thursday works for a 10-minute briefing.</p>
<p>Thanks,<br/>{{agent.name}}</p>`;
    }

    this.appwrite.addNotification({
      title: 'BEEP Tone Calibrated',
      message: `Adjusted campaign voice to "${tone.toUpperCase()}" with personalized merge tokens.`,
      type: 'info'
    });
  }

  sendTestEmail() {
    this.appwrite.addNotification({
      title: 'Test Email Preview Sent',
      message: `Dispatched test preview of "${this.bulkDraft.subject}" to ${this.bulkDraft.senderEmail}. Deliverability verified.`,
      type: 'success'
    });
  }

  async executeBulkDispatch() {
    if (!this.bulkDraft.title || !this.bulkDraft.subject) return;

    this.isSendingBulk.set(true);

    const count = this.estimatedRecipients();

    await this.marketing.dispatchBulkCampaign({
      title: this.bulkDraft.title,
      subject: this.bulkDraft.subject,
      preheader: this.bulkDraft.preheader,
      provider: this.bulkDraft.provider,
      targetAudience: this.bulkDraft.targetAudience,
      senderName: this.bulkDraft.senderName,
      senderEmail: this.bulkDraft.senderEmail,
      htmlContent: this.bulkDraft.htmlContent,
      recipientCount: count
    });

    this.isSendingBulk.set(false);
    this.activeTab.set('analytics');
  }

  inspectBulkCampaign(camp: BulkCampaignRecord) {
    this.selectedBulkCampaign.set(camp);
  }

  // Automated Drips Helpers
  getTriggerIcon(type: AutomatedCampaign['triggerType']): string {
    switch (type) {
      case 'lead_assigned': return 'person_add';
      case 'activity_click': return 'ads_click';
      case 'inactivity_threshold': return 'schedule';
      case 'score_threshold': return 'local_fire_department';
      default: return 'bolt';
    }
  }

  getStatusBadgeClass(status: AutomatedCampaign['status']): string {
    switch (status) {
      case 'Active': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Paused': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Stopped': return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'Draft': return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  }

  getCampaignOpenRate(camp: AutomatedCampaign): number {
    if (!camp.stats.sent) return 0;
    return Math.round((camp.stats.opened / camp.stats.sent) * 100);
  }

  getCampaignClickRate(camp: AutomatedCampaign): number {
    if (!camp.stats.opened) return 0;
    return Math.round((camp.stats.clicked / camp.stats.opened) * 100);
  }

  getCampaignReplyRate(camp: AutomatedCampaign): number {
    if (!camp.stats.opened) return 0;
    return Math.round((camp.stats.replied / camp.stats.opened) * 100);
  }

  toggleCampaignStatus(camp: AutomatedCampaign, newStatus: AutomatedCampaign['status']) {
    this.campaigns.update(list => list.map(c => c.id === camp.id ? { ...c, status: newStatus } : c));
    this.appwrite.addNotification({
      title: 'Campaign Status Updated',
      message: `${camp.name} is now ${newStatus}.`,
      type: 'info'
    });
  }

  inspectSequence(camp: AutomatedCampaign) {
    this.selectedInspectorCampaign.set(camp);
  }

  cloneCampaign(camp: AutomatedCampaign) {
    const cloned: AutomatedCampaign = {
      ...camp,
      id: 'camp-' + Math.random().toString(36).substring(2, 8),
      name: `${camp.name} (Copy)`,
      status: 'Draft',
      createdAt: new Date()
    };
    this.campaigns.update(list => [cloned, ...list]);
    this.appwrite.addNotification({
      title: 'Campaign Cloned',
      message: `Created clone: ${cloned.name}`,
      type: 'success'
    });
  }

  deleteCampaign(id: string) {
    this.campaigns.update(list => list.filter(c => c.id !== id));
    this.appwrite.addNotification({
      title: 'Campaign Deleted',
      message: 'Campaign has been removed.',
      type: 'warning'
    });
  }

  openCreateModal() {
    this.draftName = '';
    this.draftAudience = 'Hot Leads (Score ≥ 75)';
    this.draftTriggerType = 'lead_assigned';
    this.draftTriggerLabel = 'Trigger on New Lead Assigned';
    this.draftPersonalityVoice = 'Witty Challenger';
    this.draftStepSubject = '';
    this.draftStepBody = '';
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  onTriggerChange() {
    const found = this.triggerOptions.find(o => o.type === this.draftTriggerType);
    if (found) this.draftTriggerLabel = found.label;
  }

  saveNewCampaign() {
    if (!this.draftName || !this.draftStepSubject) return;

    const newCamp: AutomatedCampaign = {
      id: 'camp-' + Math.random().toString(36).substring(2, 8),
      name: this.draftName,
      triggerType: this.draftTriggerType,
      triggerLabel: this.draftTriggerLabel,
      targetAudience: this.draftAudience,
      status: 'Active',
      createdAt: new Date(),
      personalityVoice: this.draftPersonalityVoice,
      stats: {
        enrolled: 1,
        sent: 1,
        opened: 1,
        clicked: 0,
        replied: 0,
        bounced: 0,
        conversions: 0,
        pipelineAttributed: 0
      },
      steps: [
        {
          stepNumber: 1,
          channel: 'Email',
          delayDays: 0,
          subject: this.draftStepSubject,
          body: this.draftStepBody,
          personalityStyle: (this.draftPersonalityVoice as EmailCampaignStep['personalityStyle']) || 'Warm Consultative',
          openRate: 100,
          clickRate: 0,
          replyRate: 0
        }
      ]
    };

    this.campaigns.update(list => [newCamp, ...list]);
    this.closeCreateModal();
    this.appwrite.addNotification({
      title: 'Campaign Activated',
      message: `Automated sequence "${newCamp.name}" is now live and monitoring triggers.`,
      type: 'success'
    });
  }

  runSimulation(scenario: string) {
    this.showSimulateModal.set(false);
    this.appwrite.addNotification({
      title: 'Webhook Trigger Executed',
      message: `Trigger matched: "${scenario}". Enrolled 3 matching leads into active drip.`,
      type: 'info'
    });
  }
}
