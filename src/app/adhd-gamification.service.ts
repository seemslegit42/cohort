import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Appwrite } from './appwrite';
import { LeadService } from './lead.service';

export interface AdhdDare {
  id: string;
  dareTitle: string;
  reverseTaunt: string;
  forbiddenMission: string;
  timeLimitMinutes: number;
  predictedExcuse: string;
  spiteReward: number;
  beepRoast: string;
  associatedTaskId?: string;
  associatedLeadId?: string;
  startTime?: number;
  completed?: boolean;
}

export interface SatiricalAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'procrastination' | 'hyperfocus' | 'spite' | 'sovereign';
  unlocked: boolean;
  unlockedAt?: string;
  spiteBonus: number;
  sarcasticComment: string;
}

export interface StockTickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  trend: 'up' | 'down';
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdhdGamificationService {
  private http = inject(HttpClient);
  private appwrite = inject(Appwrite);
  private leadService = inject(LeadService);

  // Core Reactive Signals
  spiteScore = signal<number>(this.loadStoredNumber('laevos_spite_score', 420));
  procrastinationDebt = signal<number>(this.loadStoredNumber('laevos_procrast_debt', 1250));
  chaosDopamineIndex = signal<number>(68); // 0 to 100%
  hyperfocusStreakSeconds = signal<number>(0);
  isHyperfocusActive = signal<boolean>(false);
  isBinauralActive = signal<boolean>(false);
  activeDare = signal<AdhdDare | null>(null);
  dareRemainingSeconds = signal<number>(0);
  isDareRunning = signal<boolean>(false);
  isLoadingDare = signal<boolean>(false);

  // Sound Audio Context
  private audioCtx: AudioContext | null = null;
  private binauralOsc1: OscillatorNode | null = null;
  private binauralOsc2: OscillatorNode | null = null;
  private binauralGain: GainNode | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private streakInterval: ReturnType<typeof setInterval> | null = null;

  // Satirical Achievements List
  achievements = signal<SatiricalAchievement[]>([
    {
      id: 'tab_hoarder',
      title: '47-Tab Alchemist',
      description: 'Opened at least 30 tabs to answer one simple email question.',
      icon: 'tab',
      category: 'procrastination',
      unlocked: true,
      unlockedAt: '2 hours ago',
      spiteBonus: 75,
      sarcasticComment: 'BEEP: "I assume you are keeping them open for sentimental value."'
    },
    {
      id: 'crm_perfectionist',
      title: 'Aggressive CRM Color-Coding',
      description: 'Spent 45 minutes organizing pipeline tag colors instead of calling prospects.',
      icon: 'palette',
      category: 'procrastination',
      unlocked: true,
      unlockedAt: 'Yesterday',
      spiteBonus: 100,
      sarcasticComment: 'BEEP: "Yes, the lavender tag for Qualified leads will surely double ARR."'
    },
    {
      id: 'pure_spite_close',
      title: 'Defied BEEP Out of Pure Spite',
      description: 'Finished a high-priority enterprise contract review just because BEEP said you could not.',
      icon: 'bolt',
      category: 'spite',
      unlocked: false,
      spiteBonus: 250,
      sarcasticComment: 'BEEP: "Ugh. I hate when you prove me wrong. Fine, take your dopamine."'
    },
    {
      id: 'hyperfocus_teleport',
      title: '11:59 PM Adrenaline Teleport',
      description: 'Completed 6 hours of work in 14 minutes due to acute deadline panic.',
      icon: 'timer',
      category: 'hyperfocus',
      unlocked: true,
      unlockedAt: '3 days ago',
      spiteBonus: 180,
      sarcasticComment: 'BEEP: "Nothing motivates human neurology like the sweet scent of impending disaster."'
    },
    {
      id: 'rabbit_hole_master',
      title: 'Wikipedia Rabbit-Hole Sovereign',
      description: 'Researched Bronze Age smelting techniques while on hold with procurement.',
      icon: 'psychology',
      category: 'procrastination',
      unlocked: true,
      unlockedAt: 'Last week',
      spiteBonus: 90,
      sarcasticComment: 'BEEP: "Crucial knowledge for closing cloud infrastructure deals."'
    },
    {
      id: 'rebellious_millionaire',
      title: 'The Sovereign Anomaly',
      description: 'Reach 1,000 Spite Points and short your own distraction index.',
      icon: 'diamond',
      category: 'sovereign',
      unlocked: false,
      spiteBonus: 500,
      sarcasticComment: 'BEEP: "You might actually survive capitalism after all."'
    }
  ]);

  // Wall Street Style Satirical Ticker
  tickers = signal<StockTickerItem[]>([
    { symbol: '$SPITE', name: 'Defiance Yield', price: 420.69, change: +14.2, trend: 'up', description: 'Surging on stubborn rejection of BEEP taunts.' },
    { symbol: '$DOOM', name: 'Infinite Scroll Corp', price: 18.40, change: -8.5, trend: 'down', description: 'Short-selling user distractions and tab clutter.' },
    { symbol: '$HYPR', name: 'Hyperfocus Index', price: 890.10, change: +32.1, trend: 'up', description: 'Volatile spikes when panic deadline triggers.' },
    { symbol: '$EXDF', name: 'Executive Dysfunction', price: 45.00, change: -12.4, trend: 'down', description: 'Crashing as micro-dopamine tasks are completed.' }
  ]);

  // Live Level / Tier computation
  rankTitle = computed(() => {
    const s = this.spiteScore();
    if (s >= 1500) return 'Mythic Sovereign of Focused Spite';
    if (s >= 1000) return 'Grandmaster of Anti-Procrastination';
    if (s >= 600) return 'Weaponized Dopamine Alchemist';
    if (s >= 300) return 'Rebellious Chaos Operator';
    return 'Initiate of the Reverse Gauntlet';
  });

  constructor() {
    this.initDefaultDare();
    this.startHyperfocusTracker();
  }

  private loadStoredNumber(key: string, fallback: number): number {
    if (typeof localStorage !== 'undefined') {
      const v = localStorage.getItem(key);
      if (v) {
        const parsed = parseInt(v, 10);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return fallback;
  }

  private saveState() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('laevos_spite_score', this.spiteScore().toString());
      localStorage.setItem('laevos_procrast_debt', this.procrastinationDebt().toString());
    }
  }

  private initDefaultDare() {
    this.activeDare.set({
      id: 'dare_default',
      dareTitle: 'DO NOT Touch The Highest Value Lead ($250k)',
      reverseTaunt: 'You will 100% find an excuse to rearrange your Notion workspace or clean your mousepad. You physically cannot send a 2-sentence value check before this timer expires.',
      forbiddenMission: 'Open the Stark Industries deal, write 2 brief value lines, and hit send out of sheer defiance.',
      timeLimitMinutes: 6,
      predictedExcuse: 'I need to find the perfect lo-fi playlist before typing a single consonant.',
      spiteReward: 150,
      beepRoast: 'BEEP: "I already told the database you are too distracted. Prove me wrong, mortal."'
    });
    this.dareRemainingSeconds.set(6 * 60);
  }

  // Audio Synthesizers (Web Audio API)
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Ascending harmonic chime on spite victory
  playVictoryHarmonic() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Note 1: 523.25 Hz (C5) -> Note 2: 783.99 Hz (G5) -> Note 3: 1046.50 Hz (C6)
    const notes = [523.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      
      gain.gain.setValueAtTime(0.15, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.65);
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 80]);
    }
  }

  // High Crystalline Chime on dare start
  playCrystallineChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.25);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Low dissonant hum on surrender
  playSurrenderHum() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(85, now + 0.5);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Toggle Binaural Glass Thrum (40Hz Gamma Focus Ambience)
  toggleBinauralThrum(): boolean {
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    if (this.isBinauralActive()) {
      if (this.binauralOsc1) {
        this.binauralOsc1.stop();
        this.binauralOsc1.disconnect();
        this.binauralOsc1 = null;
      }
      if (this.binauralOsc2) {
        this.binauralOsc2.stop();
        this.binauralOsc2.disconnect();
        this.binauralOsc2 = null;
      }
      this.isBinauralActive.set(false);
      return false;
    } else {
      const now = ctx.currentTime;
      this.binauralGain = ctx.createGain();
      this.binauralGain.gain.setValueAtTime(0.04, now);

      // Carrier: 200 Hz Left, 240 Hz Right (40Hz Gamma differential for hyperfocus)
      this.binauralOsc1 = ctx.createOscillator();
      this.binauralOsc1.type = 'sine';
      this.binauralOsc1.frequency.setValueAtTime(200, now);

      this.binauralOsc2 = ctx.createOscillator();
      this.binauralOsc2.type = 'sine';
      this.binauralOsc2.frequency.setValueAtTime(240, now);

      this.binauralOsc1.connect(this.binauralGain);
      this.binauralOsc2.connect(this.binauralGain);
      this.binauralGain.connect(ctx.destination);

      this.binauralOsc1.start();
      this.binauralOsc2.start();
      this.isBinauralActive.set(true);
      return true;
    }
  }

  // Start the live dare sprint
  startDareSprint() {
    const dare = this.activeDare();
    if (!dare) return;
    this.playCrystallineChime();
    this.dareRemainingSeconds.set(dare.timeLimitMinutes * 60);
    this.isDareRunning.set(true);

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const rem = this.dareRemainingSeconds();
      if (rem > 0) {
        this.dareRemainingSeconds.set(rem - 1);
      } else {
        this.handleDareTimeout();
      }
    }, 1000);
  }

  // Prove BEEP Wrong (Victory Action)
  completeDareOutofSpite() {
    const dare = this.activeDare();
    if (!dare) return;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isDareRunning.set(false);
    this.playVictoryHarmonic();

    // Reward Spite Score & Reduce Procrastination Debt
    const reward = dare.spiteReward || 150;
    this.spiteScore.update(s => s + reward);
    this.procrastinationDebt.update(d => Math.max(0, d - reward * 2));
    this.chaosDopamineIndex.update(c => Math.min(100, c + 15));
    this.saveState();

    // Check achievement unlock
    this.unlockAchievement('pure_spite_close');

    // Add toast notification via Appwrite service
    this.appwrite.addNotification({
      title: '💥 BEEP Defied out of Pure Spite!',
      message: `You completed "${dare.dareTitle}" against all odds. Earned +${reward} Spite Points!`,
      type: 'success'
    });

    // Auto generate next fresh dare after 2.5 seconds
    setTimeout(() => {
      this.fetchNewAIDare();
    }, 2500);
  }

  // Surrender to BEEP
  surrenderDare() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isDareRunning.set(false);
    this.playSurrenderHum();
    this.procrastinationDebt.update(d => d + 200);
    this.saveState();

    this.appwrite.addNotification({
      title: 'BEEP: "Called It."',
      message: 'You gave in to executive dysfunction. Procrastination Debt increased by $200.',
      type: 'warning'
    });
  }

  private handleDareTimeout() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isDareRunning.set(false);
    this.playSurrenderHum();
  }

  // Generate dynamic AI Dare from backend using real CRM context
  async fetchNewAIDare(userExcuse = '') {
    this.isLoadingDare.set(true);
    const leads = this.leadService.leads();
    const tasks = this.appwrite.tasks();
    const targetLead = leads.length > 0 ? leads[0].name : 'Stark Industries';

    try {
      const res = await fetch('/api/gemini/adhd/reverse-dare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTasks: tasks.slice(0, 5),
          leadName: targetLead,
          spiteLevel: this.spiteScore() % 100,
          userExcuse
        })
      });

      if (res.ok) {
        const dareData = await res.json();
        this.activeDare.set({
          id: 'dare_' + Date.now(),
          ...dareData
        });
        this.dareRemainingSeconds.set((dareData.timeLimitMinutes || 6) * 60);
      }
    } catch (e) {
      console.warn('Fallback generating local dare:', e);
      this.initDefaultDare();
    } finally {
      this.isLoadingDare.set(false);
    }
  }

  // Emergency Anti-Focus Reframe (Satirical Self-Sabotage Portal)
  async emergencyReframe(distraction: string) {
    try {
      const res = await fetch('/api/gemini/adhd/chaos-reframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distraction })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Reframe error:', e);
    }
    return {
      verdict: 'Classic Executive Procrastination',
      rebelliousAction: 'Spite-click the task anyway for 60 seconds.',
      beepRoast: 'BEEP: "I know you are clicking this to feel something. Go type one sentence."'
    };
  }

  unlockAchievement(id: string) {
    this.achievements.update(arr => arr.map(a => {
      if (a.id === id && !a.unlocked) {
        this.playVictoryHarmonic();
        this.spiteScore.update(s => s + a.spiteBonus);
        return { ...a, unlocked: true, unlockedAt: 'Just now' };
      }
      return a;
    }));
    this.saveState();
  }

  private startHyperfocusTracker() {
    if (typeof window !== 'undefined') {
      if (this.streakInterval) clearInterval(this.streakInterval);
      this.streakInterval = setInterval(() => {
        this.hyperfocusStreakSeconds.update(s => s + 1);
      }, 1000);
    }
  }
}
