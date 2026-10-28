/* eslint-disable @typescript-eslint/no-unused-vars */
import { 
  Component, 
  ChangeDetectionStrategy, 
  inject, 
  signal, 
  computed 
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AdhdGamificationService, SatiricalAchievement } from './adhd-gamification.service';
import { LeadService } from './lead.service';
import { Appwrite } from './appwrite';

@Component({
  selector: 'app-adhd-gamification',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, DecimalPipe],
  template: `
    <div class="space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      
      <!-- Top Atmospheric Hero: The Sovereign Anti-Procrastination Altar -->
      <div class="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(106,13,173,0.15)]">
        
        <!-- Background Ambient Glow & Vein Pulse -->
        <div class="absolute -right-20 -top-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div class="absolute -left-20 -bottom-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[11px] font-mono font-bold text-purple-300 uppercase tracking-widest">
              <span class="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
              <span>Neuro-Divergent Reverse Psychology Protocol™</span>
            </div>
            
            <h1 class="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              <span>The Chaos & Spite Engine</span>
              <span class="text-xs px-2.5 py-0.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-mono font-normal">DO NOT OPEN</span>
            </h1>
            
            <p class="text-zinc-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Standard SaaS productivity advice is sterile slop. This altar uses weaponized reverse psychology, dry satire, and spite to trick your dopamine receptors into high-velocity revenue execution.
            </p>
          </div>

          <!-- Quick Audio Ambience & Spite Multiplier Pill -->
          <div class="flex items-center flex-wrap gap-3">
            
            <!-- 40Hz Gamma Binaural Focus Toggle -->
            <button
              (click)="toggleBinaural()"
              [class.bg-teal-500/20]="adhd.isBinauralActive()"
              [class.border-teal-500/50]="adhd.isBinauralActive()"
              [class.text-teal-300]="adhd.isBinauralActive()"
              class="px-4 py-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-mono font-semibold flex items-center gap-2.5 transition-all shadow-md active:scale-95 cursor-pointer">
              <mat-icon [class.animate-spin]="adhd.isBinauralActive()" class="text-base">
                {{ adhd.isBinauralActive() ? 'graphic_eq' : 'headphones' }}
              </mat-icon>
              <span>{{ adhd.isBinauralActive() ? '40Hz Gamma Focus: ACTIVE' : 'Activate 40Hz Glass Thrum' }}</span>
            </button>

            <!-- Refresh AI Dare Button -->
            <button
              (click)="refreshDare()"
              [disabled]="adhd.isLoadingDare()"
              class="px-4 py-2.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 cursor-pointer">
              <mat-icon [class.animate-spin]="adhd.isLoadingDare()" class="text-base text-purple-400">restart_alt</mat-icon>
              <span>Reroll BEEP's Dare</span>
            </button>
          </div>
        </div>

        <!-- Real-Time ADHD Telemetry Strip (The Spite Metrics HUD) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-zinc-800/80">
          
          <!-- Metric 1: Spite Score -->
          <div class="p-3.5 rounded-2xl bg-zinc-950/60 border border-purple-500/20 space-y-1">
            <span class="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <mat-icon class="text-xs">bolt</mat-icon> Total Spite Points
            </span>
            <div class="text-xl sm:text-2xl font-bold font-mono text-white flex items-baseline gap-1.5">
              <span>{{ adhd.spiteScore() | number }}</span>
              <span class="text-[10px] text-teal-400 font-semibold">+{{ adhd.spiteScore() % 50 }} this session</span>
            </div>
            <p class="text-[10px] text-zinc-500 truncate">{{ adhd.rankTitle() }}</p>
          </div>

          <!-- Metric 2: Procrastination Debt -->
          <div class="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span class="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <mat-icon class="text-xs">trending_down</mat-icon> Procrastination Debt
            </span>
            <div class="text-xl sm:text-2xl font-bold font-mono text-red-300">
              \${{ adhd.procrastinationDebt() | number }}
            </div>
            <p class="text-[10px] text-zinc-500">Pay down by finishing micro-dares</p>
          </div>

          <!-- Metric 3: Live Hyperfocus Timer -->
          <div class="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span class="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <mat-icon class="text-xs">timer</mat-icon> Hyperfocus Teleport
            </span>
            <div class="text-xl sm:text-2xl font-bold font-mono text-teal-300">
              {{ formatTimer(adhd.hyperfocusStreakSeconds()) }}
            </div>
            <p class="text-[10px] text-zinc-500">Continuous non-tab-switching time</p>
          </div>

          <!-- Metric 4: Dopamine Reserves -->
          <div class="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
            <span class="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <mat-icon class="text-xs">battery_charging_full</mat-icon> Dopamine Index
            </span>
            <div class="text-xl sm:text-2xl font-bold font-mono text-amber-300">
              {{ adhd.chaosDopamineIndex() }}%
            </div>
            <div class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-amber-500 to-teal-400 h-full transition-all duration-500" [style.width.%]="adhd.chaosDopamineIndex()"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Two-Column Battlefield -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        <!-- LEFT 7 COLS: The Active Reverse Psychology Dare & Forbidden Tasks Chamber -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- BEEP's Active Reverse Psychology Dare Card -->
          @if (adhd.activeDare(); as dare) {
            <div class="relative rounded-3xl border-2 border-dashed border-red-500/40 bg-zinc-950/90 p-6 sm:p-7 backdrop-blur-2xl shadow-xl overflow-hidden group">
              
              <!-- Red/Purple Top Alert Banner -->
              <div class="flex items-center justify-between gap-3 pb-4 border-b border-zinc-800/80 mb-5">
                <div class="flex items-center gap-2">
                  <span class="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                    <mat-icon class="text-base">warning_amber</mat-icon>
                  </span>
                  <div>
                    <h3 class="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">Active Reverse Dare</h3>
                    <p class="text-sm font-bold text-white">{{ dare.dareTitle }}</p>
                  </div>
                </div>

                <div class="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-xs font-mono font-bold text-red-300">
                  +{{ dare.spiteReward }} Spite Points
                </div>
              </div>

              <!-- Sarcastic Reverse Taunt Quote from BEEP -->
              <div class="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-2 mb-5">
                <div class="flex items-center gap-2 text-xs font-semibold text-purple-300">
                  <mat-icon class="text-sm text-purple-400">psychology</mat-icon>
                  <span>BEEP's Psychological Assessment:</span>
                </div>
                <p class="text-sm text-zinc-300 leading-relaxed italic">
                  "{{ dare.reverseTaunt }}"
                </p>
                <div class="text-[11px] text-zinc-400 font-mono pt-1">
                  <span class="text-red-400 font-bold">Predicted Excuse:</span> "{{ dare.predictedExcuse }}"
                </div>
              </div>

              <!-- Forbidden Mission Objective -->
              <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2 mb-6">
                <div class="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">
                  The Forbidden Mission (Do NOT attempt):
                </div>
                <p class="text-sm font-medium text-white">
                  {{ dare.forbiddenMission }}
                </p>
              </div>

              <!-- Live Countdown / Action Controls -->
              <div class="space-y-4">
                
                @if (adhd.isDareRunning()) {
                  <div class="flex items-center justify-between p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 animate-pulse">
                    <div class="flex items-center gap-3">
                      <mat-icon class="text-teal-400 animate-spin">alarm</mat-icon>
                      <div>
                        <span class="text-[10px] font-mono text-teal-400 uppercase font-bold">Defiance Window Remaining:</span>
                        <div class="text-2xl font-mono font-bold text-white">{{ formatTimer(adhd.dareRemainingSeconds()) }}</div>
                      </div>
                    </div>
                    
                    <button
                      (click)="adhd.completeDareOutofSpite()"
                      class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-teal-500/30 transition-all active:scale-95 cursor-pointer flex items-center gap-2">
                      <mat-icon class="text-sm">done_all</mat-icon>
                      <span>I Finished It Out of Pure Spite</span>
                    </button>
                  </div>
                } @else {
                  <div class="flex flex-wrap items-center gap-3">
                    <button
                      (click)="adhd.startDareSprint()"
                      class="flex-1 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 hover:opacity-90 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-600/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2">
                      <mat-icon class="text-base">local_fire_department</mat-icon>
                      <span>Attempt Sprint Out of Sheer Defiance ({{ dare.timeLimitMinutes }} Min)</span>
                    </button>

                    <button
                      (click)="adhd.surrenderDare()"
                      class="px-4 py-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5">
                      <mat-icon class="text-sm text-zinc-500">flag</mat-icon>
                      <span>I Surrender (BEEP Was Right)</span>
                    </button>
                  </div>
                }

                <p class="text-center text-[11px] text-zinc-500 font-mono">
                  {{ dare.beepRoast }}
                </p>
              </div>
            </div>
          }

          <!-- The Forbidden CRM Tasks Chamber -->
          <div class="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 backdrop-blur-2xl space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <mat-icon class="text-base">lock</mat-icon>
                </div>
                <div>
                  <h3 class="font-heading text-base font-bold text-white">The Forbidden Tasks Vault</h3>
                  <p class="text-xs text-zinc-400">Actual CRM tasks labeled as "Too Challenging for Your Attention Span"</p>
                </div>
              </div>
              <span class="text-xs font-mono text-zinc-500">{{ forbiddenTasks().length }} Tasks</span>
            </div>

            <div class="space-y-2.5">
              @for (task of forbiddenTasks(); track task.id) {
                <div class="p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between gap-4 transition-all group">
                  <div class="space-y-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
                        DO NOT CLICK
                      </span>
                      <p class="text-xs sm:text-sm font-semibold text-zinc-200 truncate">{{ task.title }}</p>
                    </div>
                    <p class="text-[11px] text-zinc-400 truncate">{{ task.satiricalWarning }}</p>
                  </div>

                  <button
                    (click)="spiteCompleteTask(task)"
                    class="shrink-0 px-3.5 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm">
                    <mat-icon class="text-sm text-purple-400">bolt</mat-icon>
                    <span class="hidden sm:inline">Defy & Complete</span>
                    <span class="sm:hidden">Defy</span>
                  </button>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- RIGHT 5 COLS: The Procrastination Hedge Fund & Emergency Chaos Portal -->
        <div class="lg:col-span-5 space-y-6">
          
          <!-- Emergency Chaos Reframe Portal ("Self-Sabotage Counter-Measure") -->
          <div class="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-zinc-950 to-zinc-950 p-6 backdrop-blur-2xl space-y-4 shadow-xl">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <mat-icon class="text-base">shuffle</mat-icon>
              </div>
              <div>
                <h3 class="font-heading text-base font-bold text-white">Emergency Chaos Reframe</h3>
                <p class="text-xs text-zinc-400">Trapped in a distraction loop? Let BEEP weaponize it.</p>
              </div>
            </div>

            <!-- Excuse Selector Dropdown -->
            <div class="space-y-2">
              <label for="chaos-distraction-select" class="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                What are you currently wasting time on?
              </label>
              <select
                id="chaos-distraction-select"
                [(ngModel)]="selectedDistraction"
                (ngModelChange)="runChaosReframe()"
                class="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-400 font-medium">
                <option value="Researching mechanical keyboards and sound tests">Researching mechanical keyboards and sound tests</option>
                <option value="Aggressively cleaning and color-coding my desk setup">Aggressively cleaning and color-coding my desk setup</option>
                <option value="Reading 47-minute Wikipedia article on Roman Aqueducts">Reading 47-minute Wikipedia article on Roman Aqueducts</option>
                <option value="Re-organizing browser bookmarks I will never open again">Re-organizing browser bookmarks I will never open again</option>
                <option value="Overthinking an email greeting for 25 minutes">Overthinking an email greeting for 25 minutes</option>
              </select>
            </div>

            <!-- AI Reframe Output Card -->
            @if (reframeResult(); as reframe) {
              <div class="p-4 rounded-2xl bg-zinc-900/90 border border-purple-500/30 space-y-2.5 animate-in fade-in duration-300">
                <div class="flex items-center justify-between text-[11px] font-mono text-purple-400 font-bold">
                  <span>{{ reframe.verdict }}</span>
                  <mat-icon class="text-sm">psychology_alt</mat-icon>
                </div>
                <p class="text-xs font-semibold text-white leading-relaxed">
                  💡 Rebellious Pivot: {{ reframe.rebelliousAction }}
                </p>
                <p class="text-[11px] text-zinc-400 italic">
                  {{ reframe.beepRoast }}
                </p>
              </div>
            }

            <button
              (click)="runChaosReframe()"
              class="w-full py-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5">
              <mat-icon class="text-sm">auto_fix_high</mat-icon>
              <span>Reframe My Executive Dysfunction</span>
            </button>
          </div>

          <!-- Wall Street Satirical Procrastination Ticker -->
          <div class="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 backdrop-blur-2xl space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <mat-icon class="text-base text-teal-400">candlestick_chart</mat-icon>
                <h3 class="font-heading text-sm font-bold text-white uppercase tracking-wider">The Distraction Hedge Fund</h3>
              </div>
              <span class="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">LIVE MARKET</span>
            </div>

            <div class="space-y-2.5">
              @for (ticker of adhd.tickers(); track ticker.symbol) {
                <div class="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-xs font-bold text-white">{{ ticker.symbol }}</span>
                      <span class="text-[10px] text-zinc-400 truncate">{{ ticker.name }}</span>
                    </div>
                    <p class="text-[10px] text-zinc-500">{{ ticker.description }}</p>
                  </div>

                  <div class="text-right">
                    <div class="font-mono text-xs font-bold text-white">\${{ ticker.price | number:'1.2-2' }}</div>
                    <span 
                      class="text-[10px] font-mono font-semibold"
                      [class.text-teal-400]="ticker.trend === 'up'"
                      [class.text-red-400]="ticker.trend === 'down'">
                      {{ ticker.change > 0 ? '+' : '' }}{{ ticker.change }}%
                    </span>
                  </div>
                </div>
              }
            </div>

            <!-- Short Distraction Staking Action -->
            <div class="pt-2">
              <button
                (click)="stakeSpiteCredits()"
                class="w-full py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2">
                <mat-icon class="text-sm">trending_up</mat-icon>
                <span>Short $DOOM (Stake 100 Spite Credits for 15 Min)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Satirical Hall of ADHD Achievements -->
      <div class="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-2xl space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="font-heading text-xl font-bold text-white flex items-center gap-2.5">
              <mat-icon class="text-amber-400">military_tech</mat-icon>
              <span>Satirical ADHD Trophy Altar</span>
            </h2>
            <p class="text-xs text-zinc-400">Milestones achieved exclusively through defiance, caffeine, and panic.</p>
          </div>

          <div class="text-xs font-mono text-zinc-400">
            Unlocked: <span class="text-amber-300 font-bold">{{ unlockedCount() }}/{{ adhd.achievements().length }}</span>
          </div>
        </div>

        <!-- Badges Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (ach of adhd.achievements(); track ach.id) {
            <div 
              class="p-4 rounded-2xl border transition-all space-y-2.5 relative overflow-hidden"
              [class.bg-zinc-900/60]="ach.unlocked"
              [class.border-purple-500/30]="ach.unlocked"
              [class.bg-zinc-950/40]="!ach.unlocked"
              [class.border-zinc-800/50]="!ach.unlocked"
              [class.opacity-60]="!ach.unlocked">
              
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-2.5">
                  <div 
                    class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    [class.bg-purple-500/20]="ach.unlocked"
                    [class.text-purple-300]="ach.unlocked"
                    [class.bg-zinc-800/60]="!ach.unlocked"
                    [class.text-zinc-600]="!ach.unlocked">
                    <mat-icon class="text-lg">{{ ach.icon }}</mat-icon>
                  </div>
                  <div>
                    <h4 class="text-xs sm:text-sm font-bold text-white">{{ ach.title }}</h4>
                    <span class="text-[10px] font-mono text-teal-400">+{{ ach.spiteBonus }} Spite Points</span>
                  </div>
                </div>

                @if (ach.unlocked) {
                  <span class="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[9px] font-mono text-teal-300 font-bold uppercase">
                    Unlocked
                  </span>
                } @else {
                  <span class="px-2 py-0.5 rounded-full bg-zinc-800 text-[9px] font-mono text-zinc-500">
                    Locked
                  </span>
                }
              </div>

              <p class="text-xs text-zinc-400 leading-relaxed">{{ ach.description }}</p>

              <div class="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-400 italic">
                {{ ach.sarcasticComment }}
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Sovereign Codex Watermark Stamp -->
      <div class="pt-6 flex items-center justify-between text-zinc-600 text-[10px] font-mono border-t border-zinc-800/60">
        <div>
          <span class="font-bold text-zinc-500">ΛΞV Inc</span> — The Future Needs Context
        </div>
        <div class="tracking-widest uppercase">
          Reverse Psychology Protocol v2.0
        </div>
      </div>
    </div>
  `
})
export class AdhdGamificationComponent {
  adhd = inject(AdhdGamificationService);
  leadService = inject(LeadService);
  appwrite = inject(Appwrite);

  selectedDistraction = 'Researching mechanical keyboards and sound tests';
  reframeResult = signal<{ verdict: string; rebelliousAction: string; beepRoast: string } | null>({
    verdict: 'Elite Procrastination Maneuver Detected',
    rebelliousAction: 'Since you refuse to do actual work, spite-click the highest value lead and type one single question.',
    beepRoast: 'BEEP: "Cleaning the desk? Really? The desk was dirty in 2024 and it will be dirty in 2030. Go press the button before I start reading your browser history."'
  });

  forbiddenTasks = computed(() => {
    const rawTasks = this.appwrite.tasks();
    const leads = this.leadService.leads();

    const sample = [
      {
        id: 'task-f-1',
        title: 'Draft SLA for $250k Stark Industries contract',
        satiricalWarning: 'BEEP says: You will 100% check Slack 14 times before writing the first sentence.'
      },
      {
        id: 'task-f-2',
        title: 'Follow up on Wayne Enterprises FinTech Proposal',
        satiricalWarning: 'BEEP says: High likelihood you will reorganize your Spotify playlist instead.'
      },
      {
        id: 'task-f-3',
        title: 'Review Cyberdyne Systems Security Questionnaire',
        satiricalWarning: 'BEEP says: Reading 3 pages of compliance terms is medically impossible for you today.'
      }
    ];

    if (rawTasks && rawTasks.length > 0) {
      return rawTasks.slice(0, 4).map((t, idx) => {
        const relatedLead = leads[idx % (leads.length || 1)]?.name || 'Key Account';
        return {
          id: t.$id || 'task-' + idx,
          title: t.title || `Follow up with ${relatedLead}`,
          satiricalWarning: `BEEP says: "You lack the fortitude to finish '${t.title}' for ${relatedLead} in one sitting."`
        };
      });
    }

    return sample;
  });

  unlockedCount = computed(() => {
    return this.adhd.achievements().filter(a => a.unlocked).length;
  });

  toggleBinaural() {
    this.adhd.toggleBinauralThrum();
  }

  refreshDare() {
    this.adhd.fetchNewAIDare();
  }

  async runChaosReframe() {
    const res = await this.adhd.emergencyReframe(this.selectedDistraction);
    this.reframeResult.set(res);
  }

  spiteCompleteTask(task: { id: string; title: string }) {
    this.adhd.playVictoryHarmonic();
    this.adhd.spiteScore.update(s => s + 120);
    this.adhd.procrastinationDebt.update(d => Math.max(0, d - 150));
    
    this.appwrite.addNotification({
      title: '⚡ Task Spite-Completed!',
      message: `You completed "${task.title}" purely to silence BEEP. +120 Spite Points!`,
      type: 'success'
    });
  }

  stakeSpiteCredits() {
    this.adhd.playCrystallineChime();
    this.adhd.spiteScore.update(s => s + 50);
    this.appwrite.addNotification({
      title: '📈 Staked 100 Spite Credits on Focus',
      message: 'If you stay on this workspace for 15 minutes without tab-hopping, you yield +200 Spite Credits.',
      type: 'info'
    });
  }

  formatTimer(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
