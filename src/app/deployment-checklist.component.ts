import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

@Component({
  selector: 'app-deployment-checklist',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="max-w-[1400px] mx-auto space-y-6 animate-fade-in p-6">
      
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-4">
        <div>
          <h1 class="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <mat-icon class="text-teal-400 text-[28px]">fact_check</mat-icon>
            Deployment Checklist
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            System rollout verification: DNS, SES, Webhooks, Smoke-tests, and Rollback procedures.
          </p>
        </div>

        <div class="flex gap-3">
          <button (click)="runAll()" class="bg-teal-500 hover:bg-teal-400 text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-teal-500/10 flex items-center gap-2">
            <mat-icon class="text-sm">play_arrow</mat-icon>
            Run All Checks
          </button>
        </div>
      </header>

      <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden">
        <div class="divide-y divide-zinc-800/60">
          @for (item of items(); track item.id) {
            <div class="p-5 flex items-start sm:items-center gap-4 flex-col sm:flex-row hover:bg-zinc-900/40 transition-colors">
              <div class="flex-shrink-0">
                @if (item.status === 'completed') {
                  <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <mat-icon class="text-xl">check_circle</mat-icon>
                  </div>
                } @else if (item.status === 'failed') {
                  <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <mat-icon class="text-xl">error</mat-icon>
                  </div>
                } @else if (item.status === 'in-progress') {
                  <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <mat-icon class="text-xl animate-spin">refresh</mat-icon>
                  </div>
                } @else {
                  <div class="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500">
                    <mat-icon class="text-xl">radio_button_unchecked</mat-icon>
                  </div>
                }
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border border-zinc-700 text-zinc-400">
                    {{ item.category }}
                  </span>
                  <h3 class="text-sm font-bold text-white">{{ item.title }}</h3>
                </div>
                <p class="text-xs text-zinc-400">{{ item.description }}</p>
              </div>

              <div class="flex items-center gap-2">
                <button (click)="runCheck(item.id)" 
                        class="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs font-bold text-zinc-300 transition-colors"
                        [disabled]="item.status === 'in-progress'">
                  {{ item.status === 'pending' ? 'Run Check' : (item.status === 'in-progress' ? 'Running...' : 'Re-run') }}
                </button>
              </div>
            </div>
          }
        </div>
      </div>

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DeploymentChecklistComponent {
  items = signal<ChecklistItem[]>([
    {
      id: 'dns-1',
      category: 'DNS',
      title: 'Verify Domain Records',
      description: 'Check A, AAAA, and CNAME records for the primary domain and subdomains.',
      status: 'pending'
    },
    {
      id: 'ses-1',
      category: 'SES',
      title: 'Amazon SES Production Access',
      description: 'Ensure SES is out of sandbox mode and sending limits are configured correctly.',
      status: 'pending'
    },
    {
      id: 'ses-2',
      category: 'SES',
      title: 'DKIM & SPF Records',
      description: 'Validate that DKIM and SPF records are correctly propagating for email deliverability.',
      status: 'pending'
    },
    {
      id: 'webhook-1',
      category: 'Webhook',
      title: 'Stripe Webhook Delivery',
      description: 'Send test payloads to ensure billing webhooks return 200 OK.',
      status: 'pending'
    },
    {
      id: 'webhook-2',
      category: 'Webhook',
      title: 'Nextcloud Sync Endpoints',
      description: 'Verify CalDAV and WebDAV endpoints are accessible and responding.',
      status: 'pending'
    },
    {
      id: 'smoke-1',
      category: 'Smoke Test',
      title: 'Critical Path: Auth',
      description: 'Automated login, token refresh, and logout flow validation.',
      status: 'pending'
    },
    {
      id: 'smoke-2',
      category: 'Smoke Test',
      title: 'Critical Path: Lead Creation',
      description: 'Simulate end-to-end lead ingestion via API and UI.',
      status: 'pending'
    },
    {
      id: 'rollback-1',
      category: 'Rollback',
      title: 'Database Snapshot Verification',
      description: 'Confirm the latest automated pre-deployment database snapshot is available.',
      status: 'pending'
    },
    {
      id: 'rollback-2',
      category: 'Rollback',
      title: 'Previous Container Image',
      description: 'Ensure the previous stable container image is tagged and ready in the registry.',
      status: 'pending'
    }
  ]);

  runCheck(id: string) {
    this.items.update(list => list.map(item => 
      item.id === id ? { ...item, status: 'in-progress' } : item
    ));

    setTimeout(() => {
      this.items.update(list => list.map(item => 
        item.id === id ? { ...item, status: Math.random() > 0.1 ? 'completed' : 'failed' } : item
      ));
    }, 1500 + Math.random() * 1000);
  }

  runAll() {
    this.items().forEach(item => {
      if (item.status !== 'completed') {
        this.runCheck(item.id);
      }
    });
  }
}
