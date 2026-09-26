import { Injectable, signal } from '@angular/core';

export type SalesPersonaKey = 'reluctant_saviour' | 'empathetic_strategist' | 'challenger_oracle' | 'zen_closer';

export type InteractionType = 'call_prep' | 'email_outreach' | 'objection_response' | 'live_drill' | 'cringe_check' | 'closing_move';

export interface CoachingResponse {
  id: string;
  persona: SalesPersonaKey;
  interactionType: InteractionType;
  coachingTip: string;
  wittyRetort: string;
  psychologicalInsight: string;
  cringeScore: number;
  flaggedCliches: string[];
  beepCommentary: string;
  humanCentricRewrite: string;
  lead?: {
    name: string;
    company: string;
    value: string;
  };
}

export interface CringeAuditResult {
  cringeScore: number;
  verdict: string;
  flaggedPhrases: string[];
  rewrite: string;
  roast: string;
}

export interface CoachingLogItem {
  id: string;
  lead_id: string;
  lead_name: string;
  persona: string;
  interaction_type: string;
  user_input: string | null;
  coaching_tip: string;
  witty_retort: string | null;
  psychological_insight: string | null;
  cringe_score: number;
  flagged_cliches: string | null;
  beep_commentary: string | null;
  feedback_rating: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalesPersonalityService {
  readonly activePersona = signal<SalesPersonaKey>('reluctant_saviour');
  readonly currentTip = signal<CoachingResponse | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorState = signal<string | null>(null);
  readonly recentLogs = signal<CoachingLogItem[]>([]);
  readonly soundFxEnabled = signal<boolean>(true);

  readonly personas = [
    {
      key: 'reluctant_saviour' as SalesPersonaKey,
      name: 'The Reluctant Saviour (BEEP v2.0)',
      tagline: 'Ruthless sarcasm, cosmic sales intelligence & deadpan tough love',
      accentColor: '#6A0DAD',
      icon: 'psychology'
    },
    {
      key: 'empathetic_strategist' as SalesPersonaKey,
      name: 'The Empathetic Strategist',
      tagline: 'High-EQ trust architecture & unmasking customer anxiety',
      accentColor: '#3EB991',
      icon: 'favorite'
    },
    {
      key: 'challenger_oracle' as SalesPersonaKey,
      name: 'The Challenger Oracle',
      tagline: 'Reframes status-quo assumptions with bold authority',
      accentColor: '#20B2AA',
      icon: 'military_tech'
    },
    {
      key: 'zen_closer' as SalesPersonaKey,
      name: 'The Zen Closer',
      tagline: 'Non-needy detachment, high leverage & sovereign silence',
      accentColor: '#FFD700',
      icon: 'self_improvement'
    }
  ];

  async getCoachingTip(
    lead: Record<string, unknown>,
    interactionType: InteractionType,
    userInput = '',
    persona?: SalesPersonaKey
  ): Promise<CoachingResponse | null> {
    const selectedPersona = persona || this.activePersona();
    this.isLoading.set(true);
    this.errorState.set(null);

    try {
      const response = await fetch('/api/gemini/sales-personality/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          interactionType,
          userInput,
          persona: selectedPersona,
          tenantKey: 'default'
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data: CoachingResponse = await response.json();
      this.currentTip.set(data);
      this.playCrystallineChime();
      await this.loadRecentLogs();
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to consult sales personality';
      this.errorState.set(msg);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  async auditCringe(text: string, leadContext = ''): Promise<CringeAuditResult | null> {
    this.isLoading.set(true);
    this.errorState.set(null);

    try {
      const response = await fetch('/api/gemini/sales-personality/cringe-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, leadContext })
      });

      if (!response.ok) {
        throw new Error(`Audit failed with status ${response.status}`);
      }

      const data: CringeAuditResult = await response.json();
      this.playCrystallineChime();
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to audit cringe';
      this.errorState.set(msg);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadRecentLogs(): Promise<void> {
    try {
      const res = await fetch('/api/agent/coaching-logs?tenant=default&limit=15');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.logs)) {
          this.recentLogs.set(json.logs);
        }
      }
    } catch (err) {
      console.warn('Could not load Turso coaching logs:', err);
    }
  }

  async rateLog(id: string, rating: number): Promise<void> {
    try {
      await fetch(`/api/agent/coaching-logs/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, tenantKey: 'default' })
      });
      // Update local signal state
      this.recentLogs.update(logs =>
        logs.map(item => item.id === id ? { ...item, feedback_rating: rating } : item)
      );
    } catch (err) {
      console.warn('Failed to submit feedback rating to Turso:', err);
    }
  }

  playCrystallineChime(): void {
    if (!this.soundFxEnabled() || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Ascending two-note harmonic crystalline chime
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // Audio context might be restricted before user gesture, fail gracefully
    }
  }
}
