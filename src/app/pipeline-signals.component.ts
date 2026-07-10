import { Component, ChangeDetectionStrategy,computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Appwrite } from './appwrite';

@Component({
  selector: 'app-pipeline-signals',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="h-full flex flex-col p-6 animate-fade-in max-w-[1400px] mx-auto">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-3 drop-shadow-md">
            <mat-icon class="text-teal-400 text-[32px]">satellite_alt</mat-icon>
            Pipeline Signals
          </h1>
          <p class="text-sm text-zinc-400 mt-2">AI-driven intent data and predictive modeling on high-value targets, aggregating global enterprise telemetry.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button class="bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(20,184,166,0.2)] flex items-center gap-2">
            <mat-icon class="text-[18px]">sync</mat-icon>
            Run Global Telemetry Sync
          </button>
        </div>
      </div>

      <!-- Signals Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        @for (signal of aiSignals(); track signal.id) {
          <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-teal-500/30 transition-all shadow-md">
            <!-- Confidence Meter -->
            <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/10 to-transparent pointer-events-none rounded-bl-3xl"></div>
            
            <div class="flex justify-between items-start mb-4">
              <div class="flex items-center gap-3">
                <img alt="" [src]="'https://api.dicebear.com/7.x/identicon/svg?seed=' + signal.company" class="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/50 p-1" />
                <div>
                  <h3 class="text-lg font-bold text-white">{{ signal.company }}</h3>
                  <p class="text-xs text-zinc-400">{{ signal.industry }} • {{ signal.region }}</p>
                </div>
              </div>
              <div class="flex flex-col items-end">
                <span class="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-1">Intent</span>
                <span class="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                  {{ signal.intentScore }}%
                  <mat-icon class="text-[14px]">local_fire_department</mat-icon>
                </span>
              </div>
            </div>

            <p class="text-sm text-zinc-300 leading-relaxed mb-6 h-[60px] line-clamp-3">
              {{ signal.aiAssessment }}
            </p>

            <div class="pt-5 border-t border-zinc-800/80 flex items-center justify-between">
              <div>
                <span class="block text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Forecast Value</span>
                <span class="text-white font-mono text-base font-bold">{{ signal.projectedValue | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
              <button class="bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border border-zinc-700 shadow-sm flex items-center gap-1">
                Target Account 
                <mat-icon class="text-[14px]">track_changes</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PipelineSignalsComponent {
  appwrite = inject(Appwrite);

  aiSignals = computed(() => {
    return [
      {
        id: '1',
        company: 'Stark Industries',
        industry: 'Defense & Tech',
        region: 'North America',
        intentScore: 94,
        projectedValue: 1250000,
        aiAssessment: 'Strong digital signals indicate leadership is actively evaluating modernization of their aging legacy systems. Procurement whitepapers have been downloaded across 3 regional IPs in the last week.'
      },
      {
        id: '2',
        company: 'Cyberdyne Systems',
        industry: 'Robotics',
        region: 'Global',
        intentScore: 88,
        projectedValue: 850000,
        aiAssessment: 'Recent C-level executive turnover suggests an impending architecture review. High correlation with our targeted ad campaigns indicates readiness to engage in vendor comparison.'
      },
      {
        id: '3',
        company: 'Massive Dynamic',
        industry: 'Bio-Tech',
        region: 'Europe',
        intentScore: 76,
        projectedValue: 420000,
        aiAssessment: 'Steady accumulation of organic search queries around CRM synchronization. Initial interest is cold but highly strategic. A carefully drafted executive brief could secure a discovery meeting.'
      },
      {
        id: '4',
        company: 'Wayne Enterprises',
        industry: 'Conglomerate',
        region: 'Gotham',
        intentScore: 91,
        projectedValue: 2100000,
        aiAssessment: 'Significant hiring in Sales Operations hints at infrastructure scaling. The AI model detects a 60% probability of them launching an RFP within 30 days.'
      },
      {
        id: '5',
        company: 'Umbrella Corp',
        industry: 'Pharmaceuticals',
        region: 'EMEA',
        intentScore: 82,
        projectedValue: 940000,
        aiAssessment: 'Subscribed to our newsletter last month; engagement with case studies is up. The system recommends an immediate cadence of "Thought Leadership" style nurturing.'
      },
      {
        id: '6',
        company: 'Aperture Science',
        industry: 'Research',
        region: 'North America',
        intentScore: 65,
        projectedValue: 115000,
        aiAssessment: 'Fragmented intent data. They are currently testing alternative solutions but experiencing churn. Perfect opportunity to position our superior integration capabilities.'
      }
    ];
  });
}
