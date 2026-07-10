import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  date: string;
  color: string;
}

@Component({
  selector: 'app-notes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="max-w-[1400px] mx-auto animate-fade-in px-2 md:px-0 h-full flex flex-col pb-12">
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-8">
        <div>
          <h1 class="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <mat-icon class="text-amber-400 text-[24px]">description</mat-icon>
            </div>
            Knowledge Base
          </h1>
          <p class="text-sm text-zinc-400 mt-2">
            Capture executive summaries, meeting takeaways, and unstructured insights.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative hidden sm:block">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</mat-icon>
            <input type="text" placeholder="Search notes..." class="w-64 bg-zinc-900/60 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors" />
          </div>
          <button class="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20">
            <mat-icon class="text-[18px]">edit_document</mat-icon>
            New Note
          </button>
        </div>
      </header>

      <div class="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        @for (note of notes(); track note.id) {
          <div class="break-inside-avoid bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800/80 p-5 hover:border-zinc-700 hover:shadow-xl transition-all group relative overflow-hidden" [ngClass]="note.color">
            <div class="absolute top-0 left-0 right-0 h-1 opacity-50 bg-gradient-to-r from-transparent via-current to-transparent"></div>
            
            <div class="flex justify-between items-start mb-3">
              <span class="text-xs font-semibold text-zinc-500">{{ note.date }}</span>
              <button class="text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <mat-icon class="text-[18px]">more_horiz</mat-icon>
              </button>
            </div>
            
            <h3 class="text-lg font-bold text-zinc-100 mb-2 leading-snug">{{ note.title }}</h3>
            <p class="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{{ note.content }}</p>
            
            <div class="mt-5 flex flex-wrap gap-2">
              @for (tag of note.tags; track tag) {
                <span class="px-2 py-1 bg-zinc-950/80 text-zinc-300 border border-zinc-800/80 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  {{ tag }}
                </span>
              }
            </div>
          </div>
        }
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
    /* Dynamic colored lines at top of cards via class */
    .border-t-rose-500 { border-top-color: rgba(244, 63, 94, 0.5) !important; text-decoration-color: #f43f5e; }
    .border-t-amber-500 { border-top-color: rgba(245, 158, 11, 0.5) !important; text-decoration-color: #f59e0b; }
    .border-t-teal-500 { border-top-color: rgba(20, 184, 166, 0.5) !important; text-decoration-color: #14b8a6; }
    .border-t-purple-500 { border-top-color: rgba(168, 85, 247, 0.5) !important; text-decoration-color: #a855f7; }
    .border-t-blue-500 { border-top-color: rgba(59, 130, 246, 0.5) !important; text-decoration-color: #3b82f6; }
  `]
})
export class NotesComponent {
  notes = signal<Note[]>([
    {
      id: '1',
      title: 'Salesforce Account Renewal Strategy',
      content: 'Key decision makers: Sarah Jenkins (CTO), Mike Ross (VP Sales).\n\nThe renewal is up in 45 days. They mentioned looking at competitors specifically due to API latency issues. We need to prepare a custom technical brief showing our Q3 optimizations resolving those latency spikes. Offer a staggered pricing tier if they sign a 2-year term.',
      date: 'Today, 9:41 AM',
      tags: ['Salesforce', 'Strategy', 'Q3'],
      color: 'border-t-rose-500 text-rose-500'
    },
    {
      id: '2',
      title: 'UI Component Feedback',
      content: 'The new dashboard layout looks phenomenal. The CRM stats need to have real-time webhook updates instead of polling. Waiting on frontend team to merge the sidebar updates.',
      date: 'Yesterday, 4:20 PM',
      tags: ['Feedback', 'UI/UX'],
      color: 'border-t-teal-500 text-teal-500'
    },
    {
      id: '3',
      title: 'Q4 Product Roadmap Brainstorm',
      content: '- AI automated outreach sequences (in progress)\n- Advanced real-time collaborative canvas for contract signing\n- Native iOS application phase 1\n- Drip campaigns for lost leads\n\nNeed to align with marketing on the drip campaign messaging.',
      date: 'Mon, Oct 12',
      tags: ['Planning', 'Roadmap'],
      color: 'border-t-purple-500 text-purple-500'
    },
    {
      id: '4',
      title: 'Lead Qualification Criteria',
      content: 'Standardizing our qualification definition:\n1. B2B SaaS company\n2. > 50 employees\n3. Experiencing churn > 5% monthly\n4. Uses Stripe for billing\n\nAny lead meeting 3/4 criteria should be marked as Qualified.',
      date: 'Fri, Oct 9',
      tags: ['Process', 'Sales'],
      color: 'border-t-amber-500 text-amber-500'
    },
    {
      id: '5',
      title: 'Weekly Standup Notes',
      content: 'Blockers: Appwrite cloud functions timeout issue on large lead imports.\nWins: Closed the Enterprise deal with TechCorp.\nNext steps: Deploy the batching system for imports by Thursday.',
      date: 'Wed, Oct 7',
      tags: ['Sync', 'Engineering'],
      color: 'border-t-blue-500 text-blue-500'
    }
  ]);
}
