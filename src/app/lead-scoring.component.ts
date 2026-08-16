import { Component, ChangeDetectionStrategy, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LeadService, Lead } from './lead.service';

@Component({
  selector: 'app-lead-scoring',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden">
      <!-- Header -->
      <div class="shrink-0 border-b border-zinc-900 bg-zinc-950/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 class="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <mat-icon class="text-purple-400">psychology</mat-icon>
            </div>
            AI Lead Scoring
          </h1>
          <p class="text-sm text-zinc-400 mt-1">
            Intelligent analysis of lead behavior, engagement, and firmographics to predict conversion probability.
          </p>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        @if (leadService.loading()) {
          <div class="flex items-center justify-center h-40">
            <mat-icon class="animate-spin text-purple-500">autorenew</mat-icon>
          </div>
        } @else {
          <!-- Score Distribution Overview -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col">
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-bold uppercase tracking-wider text-zinc-400">Hot Leads (70-100)</span>
                <mat-icon class="text-rose-400 text-sm">local_fire_department</mat-icon>
              </div>
              <div class="text-3xl font-display font-bold text-white">{{ stats().hot }}</div>
            </div>
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col">
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-bold uppercase tracking-wider text-zinc-400">Warm Leads (40-69)</span>
                <mat-icon class="text-amber-400 text-sm">wb_sunny</mat-icon>
              </div>
              <div class="text-3xl font-display font-bold text-white">{{ stats().warm }}</div>
            </div>
            <div class="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col">
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-bold uppercase tracking-wider text-zinc-400">Cold Leads (<40)</span>
                <mat-icon class="text-sky-400 text-sm">ac_unit</mat-icon>
              </div>
              <div class="text-3xl font-display font-bold text-white">{{ stats().cold }}</div>
            </div>
          </div>

          <!-- Leads List Sorted by Score -->
          <div class="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-zinc-900/60 border-b border-zinc-800">
                  <th class="p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Lead</th>
                  <th class="p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">AI Score</th>
                  <th class="p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Data Points</th>
                  <th class="p-4 text-xs font-bold uppercase tracking-wider text-zinc-400">AI Scoring Factors</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/60">
                @for (lead of sortedLeads(); track lead.$id) {
                  <tr class="hover:bg-zinc-800/30 transition-colors">
                    <td class="p-4 align-top">
                      <div class="font-medium text-white">{{ lead.name }}</div>
                      <div class="text-xs text-zinc-500 mt-1">{{ lead.industry || 'Unknown Industry' }} • {{ lead.companySize || 'Unknown Size' }}</div>
                    </td>
                    <td class="p-4 align-top">
                      <div class="flex items-center gap-3">
                        <!-- Score Circle -->
                        <div class="relative w-12 h-12 flex items-center justify-center shrink-0">
                          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path class="text-zinc-800" stroke-dasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3"></path>
                            <path [class]="getScoreColor(lead.score || 0)" [attr.stroke-dasharray]="(lead.score || 0) + ', 100'" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
                          </svg>
                          <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-sm font-bold text-white">{{ lead.score || 0 }}</span>
                          </div>
                        </div>
                        <span [class]="getCategoryColor(lead.scoreCategory || 'Cold')" class="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border">
                          {{ lead.scoreCategory || 'Cold' }}
                        </span>
                      </div>
                    </td>
                    <td class="p-4 align-top space-y-2">
                      <div class="flex items-center gap-2 text-xs">
                        <mat-icon class="text-[14px] w-[14px] h-[14px] text-zinc-500">public</mat-icon>
                        <span class="text-zinc-300">Web: <span class="text-white">{{ lead.websiteActivity || 'Low' }}</span></span>
                      </div>
                      <div class="flex items-center gap-2 text-xs">
                        <mat-icon class="text-[14px] w-[14px] h-[14px] text-zinc-500">mail</mat-icon>
                        <span class="text-zinc-300">Email: <span class="text-white">{{ lead.emailEngagement || 'Low' }}</span></span>
                      </div>
                      <div class="flex items-center gap-2 text-xs">
                        <mat-icon class="text-[14px] w-[14px] h-[14px] text-zinc-500">attach_money</mat-icon>
                        <span class="text-zinc-300">Value: <span class="text-white">$\{{ (lead.value || 0) | number }}</span></span>
                      </div>
                    </td>
                    <td class="p-4 align-top">
                      <div class="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 text-xs leading-relaxed text-zinc-300">
                        <div class="flex items-center gap-1.5 mb-2 text-purple-400 font-medium">
                          <mat-icon class="text-[14px] w-[14px] h-[14px]">auto_awesome</mat-icon>
                          AI Insights
                        </div>
                        {{ generateScoringExplanation(lead) }}
                      </div>
                    </td>
                  </tr>
                }
                @if (sortedLeads().length === 0) {
                  <tr>
                    <td colspan="4" class="p-8 text-center text-zinc-500 text-sm">
                      No leads available to score.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #52525b; }
  `]
})
export class LeadScoringComponent implements OnInit {
  leadService = inject(LeadService);

  sortedLeads = computed(() => {
    return [...this.leadService.leads()].sort((a, b) => (b.score || 0) - (a.score || 0));
  });

  stats = computed(() => {
    let hot = 0;
    let warm = 0;
    let cold = 0;
    this.leadService.leads().forEach(lead => {
      const cat = lead.scoreCategory || 'Cold';
      if (cat === 'Hot') hot++;
      else if (cat === 'Warm') warm++;
      else cold++;
    });
    return { hot, warm, cold };
  });

  ngOnInit() {
    if (this.leadService.leads().length === 0) {
      this.leadService.loadLeads();
    }
  }

  getScoreColor(score: number): string {
    if (score >= 70) return 'text-rose-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-sky-500';
  }

  getCategoryColor(category: string): string {
    if (category === 'Hot') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (category === 'Warm') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  }

  generateScoringExplanation(lead: Lead): string {
    if (lead.aiInsights) {
       return lead.aiInsights;
    }
    const factors: string[] = [];
    const score = lead.score || 0;

    if (score >= 70) {
       factors.push('High intent detected.');
    } else if (score >= 40) {
       factors.push('Moderate engagement.');
    } else {
       factors.push('Low initial engagement.');
    }

    if (lead.emailEngagement === 'High') {
      factors.push('Frequent email opens and link clicks strongly boost the score (+30).');
    } else if (lead.emailEngagement === 'Medium') {
      factors.push('Consistent email opens show developing interest (+15).');
    } else {
      factors.push('Lack of email interaction limits the score.');
    }

    if (lead.websiteActivity === 'High') {
      factors.push('High website activity, including pricing page visits, indicates active evaluation (+25).');
    } else if (lead.websiteActivity === 'Medium') {
      factors.push('Recent website visits suggest exploration (+10).');
    }

    if (lead.companySize === 'Enterprise') {
      factors.push('Enterprise firmographics perfectly align with the Ideal Customer Profile (+25).');
    } else if (lead.companySize === 'Mid-Market') {
      factors.push('Mid-Market size fits secondary target segments (+15).');
    }
    
    if (lead.industry && ['SaaS', 'FinTech', 'Healthcare', 'Cyber Security', 'Bio-Tech'].includes(lead.industry)) {
      factors.push(`Operating in a high-value sector (${lead.industry}) increases conversion probability (+20).`);
    } else if (lead.industry) {
      factors.push(`Standard industry weighting applied (+10).`);
    }

    if (lead.value && lead.value > 50000) {
      factors.push('High deal value adds priority points (+20).');
    }

    return factors.join(' ');
  }
}
