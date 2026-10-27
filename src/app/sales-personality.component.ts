import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SalesPersonalityService, type SalesPersonaKey, type InteractionType } from './sales-personality.service';
import { LeadService, type Lead } from './lead.service';
import type { CringeAuditResult } from './sales-personality.service';

interface ObjectionPreset {
  id: string;
  label: string;
  prospectQuote: string;
  scenario: string;
}

@Component({
  selector: 'app-sales-personality',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  template: `
    <div class="min-h-screen text-[#F5FFFA] p-4 md:p-8 relative overflow-hidden" style="background: radial-gradient(circle at top right, rgba(106, 13, 173, 0.25) 0%, rgba(28, 25, 52, 0.95) 45%, #1C1934 100%);">
      
      <!-- Bio-Digital Living Vein (System Health & Engagement Pulse) -->
      <div class="absolute top-0 left-0 right-0 h-16 pointer-events-none opacity-40 overflow-hidden" aria-hidden="true">
        <svg class="w-full h-full" viewBox="0 0 1200 60" preserveAspectRatio="none">
          <path
            d="M0,30 Q150,5 300,30 T600,30 T900,30 T1200,30"
            fill="none"
            [attr.stroke]="veinColor()"
            stroke-width="2"
            class="transition-all duration-700"
            [class.animate-pulse]="personalityService.isLoading()"
          />
        </svg>
      </div>

      <!-- Header Section -->
      <header class="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-[#20B2AA]/20 border border-[#20B2AA]/40 shadow-sm text-[#20B2AA]">
              <mat-icon>psychology</mat-icon>
            </div>
            <div>
              <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-[#F5FFFA]" style="font-family: 'Comfortaa', sans-serif;">
                Sales Personality Sanctum
              </h1>
              <p class="text-xs md:text-sm text-[#8C94A8]" style="font-family: 'Lexend', sans-serif;">
                Context-aware sales coaching · Gemini 3.8 Flash · AgentFS LibSQL (.agentfs per team)
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Audio Chime Toggle -->
          <button
            type="button"
            (click)="toggleSound()"
            [attr.aria-label]="personalityService.soundFxEnabled() ? 'Mute crystalline audio chimes' : 'Enable crystalline audio chimes'"
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-[#F5FFFA] transition-all cursor-pointer"
          >
            <mat-icon class="text-sm scale-90">{{ personalityService.soundFxEnabled() ? 'volume_up' : 'volume_off' }}</mat-icon>
            <span>{{ personalityService.soundFxEnabled() ? 'Chimes Active' : 'Chimes Muted' }}</span>
          </button>

          <!-- Back to Leads Link -->
          <a
            routerLink="/leads"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-[#20B2AA]/40 bg-[#20B2AA]/20 hover:bg-[#20B2AA]/30 text-[#F5FFFA] transition-all cursor-pointer shadow-sm"
          >
            <mat-icon class="text-sm scale-90">arrow_back</mat-icon>
            <span>Return to Leads</span>
          </a>
        </div>
      </header>

      <main class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">

        <!-- Left Column: Persona Selector & Active Lead Context (4 cols) -->
        <section class="lg:col-span-4 flex flex-col gap-6" aria-label="Persona and Context Settings">
          
          <!-- Persona Selector Card -->
          <div class="rounded-2xl p-5 border border-white/15 backdrop-blur-xl shadow-lg relative overflow-hidden" style="background: rgba(245, 255, 250, 0.08);">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-semibold tracking-wide uppercase text-[#3EB991] flex items-center gap-2">
                <mat-icon class="text-base">tune</mat-icon>
                <span>Sales Persona Archetype</span>
              </h2>
              <span class="text-[10px] text-[#8C94A8]">Select Active Voice</span>
            </div>

            <div class="space-y-3" role="radiogroup" aria-label="Sales Persona Selection">
              @for (p of personalityService.personas; track p.key) {
                <button
                  type="button"
                  (click)="selectPersona(p.key)"
                  role="radio"
                  [attr.aria-checked]="personalityService.activePersona() === p.key"
                  class="w-full text-left p-3 rounded-xl border transition-all cursor-pointer relative"
                  [class.border-[#20B2AA]]="personalityService.activePersona() === p.key"
                  [class.bg-[#20B2AA]/15]="personalityService.activePersona() === p.key"
                  [class.border-white/10]="personalityService.activePersona() !== p.key"
                  [class.bg-white/[0.03]]="personalityService.activePersona() !== p.key"
                  [class.hover:bg-white/[0.07]]="personalityService.activePersona() !== p.key"
                >
                  <div class="flex items-start gap-3">
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      [style.background]="p.accentColor + '25'"
                      [style.color]="p.accentColor"
                    >
                      <mat-icon class="text-lg">{{ p.icon }}</mat-icon>
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-[#F5FFFA]">{{ p.name }}</span>
                        @if (personalityService.activePersona() === p.key) {
                          <span class="text-[10px] px-1.5 py-0.5 rounded bg-[#3EB991]/20 text-[#3EB991] font-mono">ACTIVE</span>
                        }
                      </div>
                      <p class="text-xs text-[#8C94A8] mt-0.5 leading-relaxed">{{ p.tagline }}</p>
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>

          <!-- Active Lead Context Card -->
          <div class="rounded-2xl p-5 border border-white/15 backdrop-blur-xl shadow-lg relative" style="background: rgba(245, 255, 250, 0.08);">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-semibold tracking-wide uppercase text-[#20B2AA] flex items-center gap-2">
                <mat-icon class="text-base">person_search</mat-icon>
                <span>Active Target Lead</span>
              </h2>
              <span class="text-[10px] text-[#8C94A8]">Context Injection</span>
            </div>

            <!-- Lead Select Dropdown -->
            <div class="mb-4">
              <label for="leadSelect" class="block text-xs text-[#8C94A8] mb-1.5">Choose Lead from CRM Pipeline</label>
              <select
                id="leadSelect"
                [value]="selectedLeadId()"
                (change)="onLeadChange($event)"
                class="w-full bg-[#1C1934]/80 border border-white/20 rounded-xl px-3 py-2 text-sm text-[#F5FFFA] focus:outline-none focus:border-[#20B2AA] transition-colors cursor-pointer"
              >
                <option value="custom">-- Custom / Unlisted Prospect --</option>
                @for (lead of availableLeads(); track lead.$id) {
                  <option [value]="lead.$id">
                    {{ lead.name }} ({{ lead.company || lead.industry || 'Lead' }}) · \${{ lead.value | number }}
                  </option>
                }
              </select>
            </div>

            <!-- Active Lead Summary Display -->
            @if (currentLeadData(); as activeLead) {
              <div class="p-3.5 rounded-xl border border-white/10 bg-white/[0.04] space-y-2 text-xs">
                <div class="flex justify-between items-center">
                  <span class="font-medium text-[#F5FFFA] text-sm">{{ activeLead.name }}</span>
                  <span class="text-[#3EB991] font-mono">\${{ activeLead.value | number }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-[#8C94A8] pt-1 border-t border-white/5">
                  <div>Company: <span class="text-[#F5FFFA]">{{ activeLead.company || activeLead.name }}</span></div>
                  <div>Industry: <span class="text-[#F5FFFA]">{{ activeLead.industry || 'Tech' }}</span></div>
                  <div>Title: <span class="text-[#F5FFFA]">{{ activeLead.jobTitle || 'Decision Maker' }}</span></div>
                  <div>Status: <span class="text-[#20B2AA]">{{ activeLead.status || 'Active' }}</span></div>
                </div>
              </div>
            }

            <!-- BEEP's Sassy Micro-Status -->
            <div class="mt-4 p-3 rounded-xl border border-[#6A0DAD]/30 bg-[#6A0DAD]/10 flex items-start gap-2.5">
              <span class="text-xl shrink-0" role="img" aria-label="BEEP Mascot">🤖</span>
              <div>
                <div class="text-[11px] font-semibold text-[#F5FFFA] flex items-center gap-1.5">
                  <span>BEEP v2.0 Live Sensor</span>
                  <span class="w-1.5 h-1.5 rounded-full bg-[#3EB991] animate-ping"></span>
                </div>
                <p class="text-[11px] text-[#8C94A8] mt-0.5 leading-snug">
                  "I am actively monitoring your draft. Resist the urge to write 'touching base' or I will simulate a kernel panic."
                </p>
              </div>
            </div>
          </div>

          <!-- Turso libSQL Agent Activity Ledger -->
          <div class="rounded-2xl p-5 border border-white/15 backdrop-blur-xl shadow-lg" style="background: rgba(245, 255, 250, 0.08);">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-xs font-semibold tracking-wide uppercase text-[#8C94A8] flex items-center gap-2">
                <mat-icon class="text-sm">storage</mat-icon>
                <span>Turso AI Agent Ledger</span>
              </h2>
              <span class="text-[10px] text-[#3EB991] font-mono">LibSQL Edge Sync</span>
            </div>

            <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
              @for (log of personalityService.recentLogs(); track log.id) {
                <div class="p-2.5 rounded-lg border border-white/5 bg-white/[0.02] text-[11px] flex flex-col gap-1">
                  <div class="flex justify-between items-center text-[#8C94A8]">
                    <span class="font-medium text-[#F5FFFA] truncate max-w-[140px]">{{ log.lead_name }}</span>
                    <span class="text-[9px] font-mono">{{ log.created_at | date:'shortTime' }}</span>
                  </div>
                  <p class="text-[#8C94A8] line-clamp-1 italic">"{{ log.coaching_tip }}"</p>
                  <div class="flex items-center justify-between pt-1 border-t border-white/5">
                    <span class="text-[9px] text-[#20B2AA] uppercase tracking-wider">{{ log.interaction_type }}</span>
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        (click)="rateLog(log.id, 1)"
                        [attr.aria-label]="'Helpful tip for ' + log.lead_name"
                        class="p-0.5 hover:text-[#3EB991] transition-colors cursor-pointer"
                        [class.text-[#3EB991]]="log.feedback_rating === 1"
                      >
                        <mat-icon class="text-xs scale-75">thumb_up</mat-icon>
                      </button>
                      <button
                        type="button"
                        (click)="rateLog(log.id, -1)"
                        [attr.aria-label]="'Unhelpful tip for ' + log.lead_name"
                        class="p-0.5 hover:text-rose-400 transition-colors cursor-pointer"
                        [class.text-rose-400]]="log.feedback_rating === -1"
                      >
                        <mat-icon class="text-xs scale-75">thumb_down</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="p-4 text-center text-xs text-[#8C94A8] border border-dashed border-white/10 rounded-xl">
                  No previous coaching logs recorded in this tenant yet.
                </div>
              }
            </div>
          </div>

        </section>

        <!-- Right Column: Interactive Coaching Canvas & Tool Modes (8 cols) -->
        <section class="lg:col-span-8 flex flex-col gap-6" aria-label="Interactive Sales Coaching Studio">
          
          <!-- Mode Tabs (Zero-Pill, Tactile Glass Buttons) -->
          <div class="rounded-2xl p-2 border border-white/15 backdrop-blur-xl flex flex-wrap gap-2" style="background: rgba(245, 255, 250, 0.08);">
            @for (mode of interactionModes; track mode.id) {
              <button
                type="button"
                (click)="setInteractionType(mode.id)"
                class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer"
                [class.bg-[#20B2AA]/25]="currentInteractionType() === mode.id"
                [class.text-[#F5FFFA]]="currentInteractionType() === mode.id"
                [class.border]="currentInteractionType() === mode.id"
                [class.border-[#20B2AA]/50]="currentInteractionType() === mode.id"
                [class.text-[#8C94A8]]="currentInteractionType() !== mode.id"
                [class.hover:text-[#F5FFFA]]="currentInteractionType() !== mode.id"
                [class.hover:bg-white/[0.05]]="currentInteractionType() !== mode.id"
              >
                <mat-icon class="text-sm scale-90">{{ mode.icon }}</mat-icon>
                <span>{{ mode.label }}</span>
              </button>
            }
          </div>

          <!-- Main Interactive Card -->
          <div class="rounded-2xl p-6 border border-white/15 backdrop-blur-xl shadow-2xl relative overflow-hidden" style="background: rgba(245, 255, 250, 0.08);">
            
            <!-- Bio-Digital Fluid Waves Indicator -->
            <div class="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none opacity-20 blur-3xl" [style.background]="personaAccentColor()" aria-hidden="true"></div>

            <div class="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div>
                <h2 class="text-lg font-bold text-[#F5FFFA]" style="font-family: 'Comfortaa', sans-serif;">
                  {{ activeModeTitle() }}
                </h2>
                <p class="text-xs text-[#8C94A8] mt-0.5">
                  {{ activeModeDescription() }}
                </p>
              </div>

              <!-- Quick Action Presets Trigger -->
              @if (currentInteractionType() === 'objection_response') {
                <span class="text-[10px] px-2 py-1 rounded bg-[#20B2AA]/20 text-[#20B2AA] font-mono uppercase">
                  Objection Mode
                </span>
              } @else if (currentInteractionType() === 'cringe_check') {
                <span class="text-[10px] px-2 py-1 rounded bg-[#6A0DAD]/30 text-purple-200 font-mono uppercase">
                  Anti-Slop Audit
                </span>
              } @else if (currentInteractionType() === 'live_drill') {
                <span class="text-[10px] px-2 py-1 rounded bg-[#FFD700]/20 text-[#FFD700] font-mono uppercase">
                  Arena Simulation
                </span>
              }
            </div>

            <!-- Objection Quick Chips (If Objection Mode) -->
            @if (currentInteractionType() === 'objection_response') {
              <div class="mb-4">
                <span class="text-xs text-[#8C94A8] block mb-2 font-medium">Common Tactical Objections:</span>
                <div class="flex flex-wrap gap-2">
                  @for (obj of objectionPresets; track obj.id) {
                    <button
                      type="button"
                      (click)="applyObjectionPreset(obj)"
                      class="px-2.5 py-1.5 rounded-lg text-xs border border-white/10 bg-white/[0.03] hover:bg-[#20B2AA]/20 hover:border-[#20B2AA]/40 text-[#F5FFFA] transition-all cursor-pointer text-left"
                    >
                      {{ obj.label }}
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Reactive Form Input -->
            <form [formGroup]="coachingForm" (ngSubmit)="consultPersonality()" class="space-y-4">
              <div>
                <label for="prospectContextInput" class="block text-xs text-[#8C94A8] mb-1.5 font-medium">
                  {{ inputFieldLabel() }}
                </label>
                <textarea
                  id="prospectContextInput"
                  formControlName="inputContent"
                  rows="3"
                  [placeholder]="inputFieldPlaceholder()"
                  class="w-full bg-[#1C1934]/90 border border-white/20 rounded-xl p-3.5 text-sm text-[#F5FFFA] placeholder:text-[#8C94A8]/60 focus:outline-none focus:border-[#20B2AA] focus:ring-1 focus:ring-[#20B2AA] transition-all"
                ></textarea>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div class="flex items-center gap-2 text-xs text-[#8C94A8]">
                  <mat-icon class="text-sm scale-90 text-[#3EB991]">verified</mat-icon>
                  <span>Human-centric augmentation · Zero robotic fluff</span>
                </div>

                <div class="flex items-center gap-3">
                  @if (currentInteractionType() === 'cringe_check') {
                    <button
                      type="button"
                      (click)="runCringeAudit()"
                      [disabled]="personalityService.isLoading() || !coachingForm.value.inputContent"
                      class="px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[#6A0DAD] hover:bg-[#6A0DAD]/80 text-[#F5FFFA] border border-[#6A0DAD] transition-all disabled:opacity-50 cursor-pointer shadow-lg flex items-center gap-2"
                    >
                      <mat-icon class="text-sm scale-90">local_fire_department</mat-icon>
                      <span>{{ personalityService.isLoading() ? 'Auditing Tone...' : 'Detect Cringe' }}</span>
                    </button>
                  } @else {
                    <button
                      type="submit"
                      [disabled]="personalityService.isLoading()"
                      class="px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[#20B2AA] hover:bg-[#20B2AA]/80 text-[#1C1934] font-bold border border-[#20B2AA] transition-all disabled:opacity-50 cursor-pointer shadow-lg flex items-center gap-2"
                    >
                      <mat-icon class="text-sm scale-90">auto_awesome</mat-icon>
                      <span>{{ personalityService.isLoading() ? 'Consulting Coach...' : 'Summon Coaching' }}</span>
                    </button>
                  }
                </div>
              </div>
            </form>

            <!-- Loading Skeleton / Animation -->
            @if (personalityService.isLoading()) {
              <div class="mt-6 p-6 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-3 animate-pulse">
                <div class="w-8 h-8 rounded-full border-2 border-[#20B2AA] border-t-transparent animate-spin"></div>
                <p class="text-xs text-[#8C94A8] font-mono">BEEP is analyzing the psychological currents...</p>
              </div>
            }

            <!-- Cringe Audit Results Display -->
            @if (cringeAuditResult(); as audit) {
              <div class="mt-6 p-5 rounded-xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-md space-y-4">
                <div class="flex items-center justify-between border-b border-purple-500/20 pb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">🔥</span>
                    <h3 class="text-sm font-bold text-purple-200 uppercase tracking-wide">Cringe Audit Breakdown</h3>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-[#8C94A8]">Cringe Rating:</span>
                    <span
                      class="text-sm font-mono font-bold px-2 py-0.5 rounded"
                      [class.bg-emerald-500/20]="audit.cringeScore < 30"
                      [class.text-emerald-400]="audit.cringeScore < 30"
                      [class.bg-amber-500/20]="audit.cringeScore >= 30 && audit.cringeScore < 60"
                      [class.text-amber-400]="audit.cringeScore >= 30 && audit.cringeScore < 60"
                      [class.bg-rose-500/20]="audit.cringeScore >= 60"
                      [class.text-rose-400]="audit.cringeScore >= 60"
                    >
                      {{ audit.cringeScore }}%
                    </span>
                  </div>
                </div>

                <div class="p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-[#F5FFFA] leading-relaxed italic">
                  {{ audit.roast }}
                </div>

                @if (audit.flaggedPhrases && audit.flaggedPhrases.length > 0) {
                  <div>
                    <span class="text-[11px] uppercase tracking-wider text-rose-300 font-semibold block mb-1.5">Flagged Corporate Robotic Cliches:</span>
                    <div class="flex flex-wrap gap-1.5">
                      @for (phrase of audit.flaggedPhrases; track phrase) {
                        <span class="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono">
                          ✕ "{{ phrase }}"
                        </span>
                      }
                    </div>
                  </div>
                }

                <div class="p-4 rounded-xl bg-[#20B2AA]/10 border border-[#20B2AA]/30 space-y-1.5">
                  <span class="text-[11px] uppercase tracking-wider text-[#20B2AA] font-bold block">Authentic Human Rewrite:</span>
                  <p class="text-sm text-[#F5FFFA] leading-relaxed font-sans">{{ audit.rewrite }}</p>
                  <button
                    type="button"
                    (click)="copyToClipboard(audit.rewrite)"
                    class="mt-2 text-xs text-[#20B2AA] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <mat-icon class="text-xs scale-75">content_copy</mat-icon>
                    <span>Copy to clipboard</span>
                  </button>
                </div>
              </div>
            }

            <!-- Active Coaching Tip Display (Main Output) -->
            @if (personalityService.currentTip(); as tip) {
              <div class="mt-6 space-y-4">
                
                <!-- BEEP's Sarcastic Scribe Box -->
                <div class="p-4 rounded-xl border border-[#6A0DAD]/40 bg-[#6A0DAD]/15 backdrop-blur-md relative overflow-hidden">
                  <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#6A0DAD]/30 border border-[#6A0DAD]/50 flex items-center justify-center shrink-0 text-xl shadow-sm">
                      🤖
                    </div>
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold uppercase tracking-wider text-purple-200">BEEP's Deadpan Diagnosis</span>
                        <span class="text-[10px] text-[#8C94A8] font-mono">Sovereign Codex Protocol</span>
                      </div>
                      <p class="text-xs md:text-sm text-[#F5FFFA] leading-relaxed italic">
                        "{{ tip.beepCommentary }}"
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Tactical Grid: The Tip & The Witty Retort -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <!-- Tactical Coaching Tip -->
                  <div class="p-4 rounded-xl border border-[#3EB991]/30 bg-[#3EB991]/10 space-y-2">
                    <div class="flex items-center gap-2 text-[#3EB991]">
                      <mat-icon class="text-sm">lightbulb</mat-icon>
                      <h3 class="text-xs font-bold uppercase tracking-wider">Tactical Move</h3>
                    </div>
                    <p class="text-xs md:text-sm text-[#F5FFFA] leading-relaxed">
                      {{ tip.coachingTip }}
                    </p>
                  </div>

                  <!-- Witty Disarming Retort -->
                  <div class="p-4 rounded-xl border border-[#20B2AA]/30 bg-[#20B2AA]/10 space-y-2">
                    <div class="flex items-center gap-2 text-[#20B2AA]">
                      <mat-icon class="text-sm">chat_bubble</mat-icon>
                      <h3 class="text-xs font-bold uppercase tracking-wider">What to Say / Send</h3>
                    </div>
                    <p class="text-xs md:text-sm text-[#F5FFFA] font-medium leading-relaxed">
                      {{ tip.wittyRetort }}
                    </p>
                    <button
                      type="button"
                      (click)="copyToClipboard(tip.wittyRetort)"
                      class="text-xs text-[#20B2AA] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <mat-icon class="text-xs scale-75">content_copy</mat-icon>
                      <span>Copy reply</span>
                    </button>
                  </div>
                </div>

                <!-- Psychological Insight & Human Rewrite -->
                <div class="p-4 rounded-xl border border-white/10 bg-white/[0.03] space-y-3">
                  <div>
                    <div class="flex items-center gap-2 text-[#FFD700] mb-1">
                      <mat-icon class="text-sm">visibility</mat-icon>
                      <h3 class="text-xs font-bold uppercase tracking-wider">The Hidden Psychology</h3>
                    </div>
                    <p class="text-xs text-[#8C94A8] leading-relaxed">
                      {{ tip.psychologicalInsight }}
                    </p>
                  </div>

                  <div class="pt-2 border-t border-white/5">
                    <span class="text-[11px] font-bold text-[#F5FFFA] uppercase tracking-wider block mb-1">Human-Centric Full Script:</span>
                    <p class="text-xs md:text-sm text-[#F5FFFA] leading-relaxed bg-black/30 p-3 rounded-lg font-mono">
                      {{ tip.humanCentricRewrite }}
                    </p>
                  </div>
                </div>

              </div>
            }

          </div>

        </section>

      </main>

      <!-- Mandatory Brand Signature (The Sovereign Codex Prime Canon) -->
      <footer class="fixed bottom-3 left-4 z-50 pointer-events-none opacity-40 mix-blend-overlay">
        <div class="text-[10px] font-bold tracking-normal" style="font-family: 'Comfortaa', sans-serif;">
          ΛΞV Inc
        </div>
        <div class="text-[8px] font-thin tracking-[0.2em]" style="font-family: 'Lexend', sans-serif;">
          The Future Needs Context · Innovate, Automate, Dominate
        </div>
      </footer>

    </div>
  `
})
export class SalesPersonalityComponent implements OnInit {
  readonly personalityService = inject(SalesPersonalityService);
  readonly leadService = inject(LeadService);

  readonly selectedLeadId = signal<string>('custom');
  readonly currentInteractionType = signal<InteractionType>('call_prep');
  readonly cringeAuditResult = signal<CringeAuditResult | null>(null);

  readonly coachingForm = new FormGroup({
    inputContent: new FormControl('', [Validators.maxLength(4000)])
  });

  readonly availableLeads = computed(() => this.leadService.leads());

  readonly currentLeadData = computed<Lead | null>(() => {
    const id = this.selectedLeadId();
    if (id === 'custom') {
      const first = this.availableLeads()[0];
      return first || null;
    }
    return this.availableLeads().find(l => l.$id === id) || null;
  });

  readonly personaAccentColor = computed(() => {
    const active = this.personalityService.activePersona();
    const found = this.personalityService.personas.find(p => p.key === active);
    return found?.accentColor || '#6A0DAD';
  });

  readonly veinColor = computed(() => {
    return this.personalityService.isLoading() ? '#6A0DAD' : '#3EB991';
  });

  readonly interactionModes: { id: InteractionType; label: string; icon: string }[] = [
    { id: 'call_prep', label: 'Call & Meeting Prep', icon: 'phone_in_talk' },
    { id: 'objection_response', label: 'Objection Annihilation', icon: 'shield' },
    { id: 'live_drill', label: 'Arena Roleplay Drill', icon: 'sports_kabaddi' },
    { id: 'cringe_check', label: 'Anti-Slop Cringe Audit', icon: 'cleaning_services' },
    { id: 'closing_move', label: 'High-Stakes Closing', icon: 'handshake' }
  ];

  readonly objectionPresets: ObjectionPreset[] = [
    {
      id: 'price',
      label: '💰 "Your price is 3x our budget"',
      prospectQuote: 'We really like what you built, but your price is 3x what we budgeted for this.',
      scenario: 'Budget objection on proposal presentation'
    },
    {
      id: 'spreadsheet',
      label: '📊 "We already use Excel/Slack"',
      prospectQuote: 'Our current internal spreadsheet system works fine for our team right now.',
      scenario: 'Status-quo inertia and fear of change'
    },
    {
      id: 'send_deck',
      label: '📑 "Just email me a deck"',
      prospectQuote: 'Can you just send me a brochure or slide deck so I can look it over later?',
      scenario: 'Brush-off avoidance tactic'
    },
    {
      id: 'ghosting',
      label: '👻 Ghosted for 2 weeks after demo',
      prospectQuote: 'No response to previous 2 follow-ups after enthusiastic demo call.',
      scenario: 'Break silence without sounding desperate'
    }
  ];

  ngOnInit(): void {
    this.personalityService.loadRecentLogs();
  }

  selectPersona(key: SalesPersonaKey): void {
    this.personalityService.activePersona.set(key);
    this.personalityService.playCrystallineChime();
  }

  setInteractionType(type: InteractionType): void {
    this.currentInteractionType.set(type);
    this.cringeAuditResult.set(null);
  }

  toggleSound(): void {
    this.personalityService.soundFxEnabled.update(v => !v);
  }

  onLeadChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedLeadId.set(target.value);
  }

  applyObjectionPreset(preset: ObjectionPreset): void {
    this.coachingForm.patchValue({
      inputContent: preset.prospectQuote
    });
  }

  activeModeTitle(): string {
    switch (this.currentInteractionType()) {
      case 'call_prep': return 'Pre-Call Strategy & Opening Disarm';
      case 'objection_response': return 'Objection Annihilation Matrix';
      case 'live_drill': return 'Arena Roleplay & Pitch Drill';
      case 'cringe_check': return 'Cringe Detector & Corporate Anti-Slop Audit';
      case 'closing_move': return 'High-Stakes Pacing & Sovereign Closing';
      default: return 'Sales Personality Guidance';
    }
  }

  activeModeDescription(): string {
    switch (this.currentInteractionType()) {
      case 'call_prep': return 'Tailor your opening move and uncover unstated anxieties before you dial.';
      case 'objection_response': return 'Disarming, high-status responses that dismantle prospect defensiveness.';
      case 'live_drill': return 'Test your pitch in real-time against BEEP and get an immediate psychological grade.';
      case 'cringe_check': return 'Paste any email draft or LinkedIn DM to incinerate desperate robotic jargon.';
      case 'closing_move': return 'Secure commitment without discounting or sounding needy.';
      default: return 'Active lead coaching.';
    }
  }

  inputFieldLabel(): string {
    switch (this.currentInteractionType()) {
      case 'objection_response': return 'Prospect Objection or Hesitation:';
      case 'cringe_check': return 'Your Email Draft or Pitch Message to Audit:';
      case 'live_drill': return 'What you plan to say to the prospect:';
      default: return 'Interaction Context or Specific Question for Coach:';
    }
  }

  inputFieldPlaceholder(): string {
    switch (this.currentInteractionType()) {
      case 'objection_response': return 'e.g. "We are already committed to another vendor through next year..."';
      case 'cringe_check': return 'Paste your draft here: "Hi John, just wanted to circle back and touch base on synergy..."';
      case 'live_drill': return 'e.g. "I noticed your team struggled with lead cycle times, so I wanted to share..."';
      default: return 'Optional: Describe what you want to achieve or paste prospect notes...';
    }
  }

  async consultPersonality(): Promise<void> {
    const lead = this.currentLeadData() || {
      name: 'Key Enterprise Prospect',
      company: 'Apex Logistics',
      value: 65000,
      industry: 'Enterprise Software'
    };

    const userInput = this.coachingForm.value.inputContent || '';
    await this.personalityService.getCoachingTip(
      lead as unknown as Record<string, unknown>,
      this.currentInteractionType(),
      userInput
    );
  }

  async runCringeAudit(): Promise<void> {
    const text = this.coachingForm.value.inputContent || '';
    if (!text.trim()) return;

    const lead = this.currentLeadData();
    const leadContext = lead ? `${lead.name} at ${lead.company}` : '';

    const result = await this.personalityService.auditCringe(text, leadContext);
    this.cringeAuditResult.set(result);
  }

  async rateLog(id: string, rating: number): Promise<void> {
    await this.personalityService.rateLog(id, rating);
  }

  copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.personalityService.playCrystallineChime();
    }
  }
}
