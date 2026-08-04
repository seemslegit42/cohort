import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: 'Draft' | 'Sending' | 'Sent';
  sentDate?: Date;
  audience: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    conversions: number;
  };
}

@Component({
  selector: 'app-campaigns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="h-full flex flex-col relative">
      <div class="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
      
      <div class="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 relative z-10">
        <div class="max-w-6xl mx-auto space-y-6">
          
          <!-- Header -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
            <div>
              <h1 class="font-display text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <mat-icon class="text-indigo-400">campaign</mat-icon>
                Email Campaigns
              </h1>
              <p class="text-xs md:text-sm text-zinc-400 mt-2">Create and track bulk email outreach using SendGrid integration.</p>
            </div>
            
            <div class="flex items-center gap-3">
              <button (click)="openCreateModal()" class="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center gap-2">
                <mat-icon class="text-[18px]">add</mat-icon>
                New Campaign
              </button>
            </div>
          </div>

          <!-- Overall KPI Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-5 relative overflow-hidden">
              <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
              <div class="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <mat-icon class="text-[16px] text-blue-400">send</mat-icon> Total Sent
              </div>
              <div class="text-3xl font-display font-bold text-white">{{ totalSent() | number }}</div>
            </div>
            <div class="bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-5 relative overflow-hidden">
              <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
              <div class="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <mat-icon class="text-[16px] text-emerald-400">drafts</mat-icon> Avg Open Rate
              </div>
              <div class="text-3xl font-display font-bold text-white">{{ avgOpenRate() | number:'1.1-1' }}%</div>
            </div>
            <div class="bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-5 relative overflow-hidden">
              <div class="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
              <div class="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <mat-icon class="text-[16px] text-purple-400">ads_click</mat-icon> Avg CTR
              </div>
              <div class="text-3xl font-display font-bold text-white">{{ avgCtr() | number:'1.1-1' }}%</div>
            </div>
            <div class="bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-5 relative overflow-hidden">
              <div class="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
              <div class="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <mat-icon class="text-[16px] text-amber-400">monetization_on</mat-icon> Conversions
              </div>
              <div class="text-3xl font-display font-bold text-white">{{ totalConversions() | number }}</div>
            </div>
          </div>

          <!-- Campaigns List -->
          <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-zinc-800/80 bg-zinc-900/80">
                    <th class="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Campaign</th>
                    <th class="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Audience</th>
                    <th class="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Sent</th>
                    <th class="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Opens</th>
                    <th class="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Clicks</th>
                    <th class="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Conv.</th>
                    <th class="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/50 text-sm">
                  @if (campaigns().length === 0) {
                    <tr>
                      <td colspan="8" class="px-6 py-8 text-center text-zinc-500">
                        <mat-icon class="text-4xl mb-2 opacity-50">campaign</mat-icon>
                        <p>No campaigns found. Create your first campaign.</p>
                      </td>
                    </tr>
                  } @else {
                    @for (camp of campaigns(); track camp.id) {
                      <tr class="hover:bg-zinc-800/30 transition-colors group">
                        <td class="px-6 py-4 border-zinc-800/50 align-top">
                          <div class="font-bold text-white mb-1">
                            {{ camp.name }}
                          </div>
                          <div class="text-zinc-500 text-xs">
                            {{ camp.subject }}
                          </div>
                        </td>
                        <td class="px-6 py-4 border-zinc-800/50 align-top">
                          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                                [ngClass]="{
                                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': camp.status === 'Sent',
                                  'bg-amber-500/10 text-amber-400 border-amber-500/20': camp.status === 'Draft',
                                  'bg-blue-500/10 text-blue-400 border-blue-500/20': camp.status === 'Sending'
                                }">
                            {{ camp.status }}
                          </span>
                          @if (camp.sentDate) {
                            <div class="text-[10px] text-zinc-500 mt-1.5">{{ camp.sentDate | date:'shortDate' }}</div>
                          }
                        </td>
                        <td class="px-6 py-4 border-zinc-800/50 align-top text-zinc-300">
                          <span class="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded font-mono">{{ camp.audience }}</span>
                        </td>
                        <td class="px-6 py-4 border-zinc-800/50 align-top text-right font-mono text-zinc-300">
                          {{ camp.stats.sent | number }}
                        </td>
                        <td class="px-6 py-4 border-zinc-800/50 align-top text-right">
                           <div class="font-mono text-white">{{ camp.stats.opened | number }}</div>
                           @if (camp.stats.sent > 0) {
                             <div class="text-[10px] text-emerald-400 mt-0.5">{{ (camp.stats.opened / camp.stats.sent * 100) | number:'1.0-1' }}%</div>
                           }
                        </td>
                        <td class="px-6 py-4 border-zinc-800/50 align-top text-right">
                           <div class="font-mono text-white">{{ camp.stats.clicked | number }}</div>
                           @if (camp.stats.opened > 0) {
                             <div class="text-[10px] text-purple-400 mt-0.5">{{ (camp.stats.clicked / camp.stats.opened * 100) | number:'1.0-1' }}%</div>
                           }
                        </td>
                        <td class="px-6 py-4 border-zinc-800/50 align-top text-right">
                           <div class="font-mono text-white">{{ camp.stats.conversions | number }}</div>
                           @if (camp.stats.clicked > 0) {
                             <div class="text-[10px] text-amber-400 mt-0.5">{{ (camp.stats.conversions / camp.stats.clicked * 100) | number:'1.0-1' }}%</div>
                           }
                        </td>
                        <td class="px-6 py-4 border-zinc-800/50 align-top text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <button (click)="deleteCampaign(camp.id)" title="Delete Campaign" class="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                            <mat-icon class="text-[18px]">delete</mat-icon>
                          </button>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Campaign Modal -->
      @if (showCreateModal()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div class="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h3 class="text-lg font-display font-bold text-white flex items-center gap-2">
                <mat-icon class="text-indigo-400">campaign</mat-icon> Create Email Campaign
              </h3>
              <button (click)="closeCreateModal()" class="text-zinc-500 hover:text-white transition-colors">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            
            <form (ngSubmit)="sendCampaign()" class="p-6 space-y-4">
              <div>
                <label for="campaignName" class="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Campaign Name</label>
                <input id="campaignName" type="text" [(ngModel)]="newCampaign.name" name="name" required placeholder="Q3 Product Launch" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
              </div>

              <div>
                <label for="audienceSelect" class="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Target Audience Segment</label>
                <select id="audienceSelect" [(ngModel)]="newCampaign.audience" name="audience" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
                  <option value="Hot Leads">Hot Leads (Score > 80)</option>
                  <option value="Warm Leads">Warm Leads (Score 50-79)</option>
                  <option value="Newsletter Subscribers">Newsletter Subscribers</option>
                  <option value="All Contacts">All Contacts</option>
                </select>
              </div>

              <div>
                <label for="campaignSubject" class="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Email Subject</label>
                <input id="campaignSubject" type="text" [(ngModel)]="newCampaign.subject" name="subject" required placeholder="Exciting news for your team..." class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
              </div>
              
              <div>
                <label for="campaignBody" class="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Email HTML/Text</label>
                <textarea id="campaignBody" rows="5" placeholder="Dear {{ '{{' }}firstName{{ '}}' }},&#10;&#10;We are excited to announce..." class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors custom-scrollbar"></textarea>
              </div>
              
              <div class="pt-4 flex justify-between items-center border-t border-zinc-800/50">
                <div class="flex items-center gap-2 text-xs text-zinc-500">
                   <mat-icon class="text-[14px]">cloud_sync</mat-icon> Synced with SendGrid
                </div>
                <div class="flex gap-3">
                  <button type="button" (click)="closeCreateModal()" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" [disabled]="isSending() || !newCampaign.name || !newCampaign.subject" class="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center gap-2">
                    @if (isSending()) {
                      <mat-icon class="animate-spin text-[18px]">refresh</mat-icon> Sending...
                    } @else {
                      <mat-icon class="text-[18px]">send</mat-icon> Send Campaign
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class CampaignsComponent {
  appwrite = inject(Appwrite);

  campaigns = signal<EmailCampaign[]>([
    {
      id: '1',
      name: 'Q2 Feature Release Update',
      subject: 'Unlock new pipeline analytics with our latest release',
      status: 'Sent',
      sentDate: new Date('2026-05-15'),
      audience: 'Hot Leads',
      stats: { sent: 1250, opened: 680, clicked: 145, conversions: 32 }
    },
    {
      id: '2',
      name: 'Monthly Industry Newsletter',
      subject: 'Top 5 Strategies for B2B Sales in 2026',
      status: 'Sent',
      sentDate: new Date('2026-06-01'),
      audience: 'Newsletter Subscribers',
      stats: { sent: 4500, opened: 1210, clicked: 300, conversions: 12 }
    },
    {
      id: '3',
      name: 'Enterprise Reactivation',
      subject: 'Re-evaluating your enterprise software stack?',
      status: 'Sent',
      sentDate: new Date('2026-07-10'),
      audience: 'Cold Leads',
      stats: { sent: 850, opened: 170, clicked: 25, conversions: 2 }
    }
  ]);
  
  showCreateModal = signal<boolean>(false);
  isSending = signal<boolean>(false);

  newCampaign: Partial<EmailCampaign> = {
    audience: 'Hot Leads'
  };

  // KPI Computations
  totalSent = computed(() => this.campaigns().reduce((sum, c) => sum + (c.stats?.sent || 0), 0));
  
  avgOpenRate = computed(() => {
    const totalSent = this.totalSent();
    if (totalSent === 0) return 0;
    const totalOpened = this.campaigns().reduce((sum, c) => sum + (c.stats?.opened || 0), 0);
    return (totalOpened / totalSent) * 100;
  });

  avgCtr = computed(() => {
    const totalOpened = this.campaigns().reduce((sum, c) => sum + (c.stats?.opened || 0), 0);
    if (totalOpened === 0) return 0;
    const totalClicked = this.campaigns().reduce((sum, c) => sum + (c.stats?.clicked || 0), 0);
    return (totalClicked / totalOpened) * 100;
  });

  totalConversions = computed(() => this.campaigns().reduce((sum, c) => sum + (c.stats?.conversions || 0), 0));

  openCreateModal() {
    this.newCampaign = {
      name: '',
      subject: '',
      audience: 'Hot Leads'
    };
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  deleteCampaign(id: string) {
    if (confirm('Are you sure you want to delete this campaign?')) {
      this.campaigns.update(c => c.filter(camp => camp.id !== id));
      this.appwrite.addNotification({
        title: 'Campaign Deleted',
        message: 'The email campaign has been permanently removed.',
        type: 'warning'
      });
    }
  }

  sendCampaign() {
    this.isSending.set(true);
    
    // Simulate API call to SendGrid/Mailchimp
    setTimeout(() => {
      const sentCampaign: EmailCampaign = {
        id: Math.random().toString(36).substr(2, 9),
        name: this.newCampaign.name || 'Untitled Campaign',
        subject: this.newCampaign.subject || 'No Subject',
        status: 'Sent',
        sentDate: new Date(),
        audience: this.newCampaign.audience || 'All',
        stats: {
           // Simulate a newly sent campaign with 0 initial engagement
           sent: this.newCampaign.audience === 'All Contacts' ? 5000 : 
                 this.newCampaign.audience === 'Hot Leads' ? 120 :
                 this.newCampaign.audience === 'Newsletter Subscribers' ? 2400 : 850,
           opened: 0,
           clicked: 0,
           conversions: 0
        }
      };
      
      this.campaigns.update(c => [sentCampaign, ...c]);
      this.isSending.set(false);
      this.closeCreateModal();
      
      this.appwrite.addNotification({
        title: 'Campaign Queued',
        message: 'Your campaign has been successfully queued via SendGrid.',
        isRead: false,
        type: 'success'
      });
    }, 1500);
  }
}
