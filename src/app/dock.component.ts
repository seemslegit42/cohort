import { Component, ChangeDetectionStrategy, signal, ElementRef, ViewChild, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LeadService } from './lead.service';
import { Appwrite } from './appwrite';

interface DockNavItem {
  id: string;
  path: string;
  label: string;
  icon: string;
  shortcut: string;
  title: string;
  gnoseologyQuote: string;
  exact?: boolean;
}

@Component({
  selector: 'app-dock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, RouterModule, ReactiveFormsModule],
  template: `
    <!-- Floating Universal Flexbox Bottom Dock Bar (Mobile + Tablet + Desktop) -->
    <nav 
      class="fixed bottom-2 sm:bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[96vw] sm:w-auto max-w-[98vw] flex flex-col items-center p-1 sm:p-2 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800/85 rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.9)] transition-all duration-300 hover:border-zinc-700/80 select-none overflow-x-auto no-scrollbar pb-[env(safe-area-inset-bottom,0.25rem)]"
      role="toolbar" 
      aria-label="Universal System Navigation and Action Dock">
      
      <!-- Mobile Swipe/Grab Indicator Pill -->
      <div class="sm:hidden w-8 h-1 bg-zinc-700/60 rounded-full mb-1"></div>

      <div class="flex items-center justify-between sm:justify-center gap-0.5 sm:gap-1.5 w-full">
      <!-- Action Cluster (Flex Container) -->
      <div class="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
        
        <!-- Quick Add Trigger Button with Tooltip -->
        <div class="relative group">
          <button 
            type="button"
            (click)="triggerHaptic(); openQuickAdd('lead')" 
            class="h-11 sm:h-12 md:h-13 min-w-[44px] sm:min-w-[48px] md:min-w-[54px] px-1.5 sm:px-2.5 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 shadow-md shadow-orange-500/20 active:scale-[0.95] sm:hover:scale-[1.03] transition-all font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
            aria-label="Quick Add Record (Hotkey: Q)"
            aria-haspopup="dialog">
            <i class="ti ti-plus text-[18px] sm:text-[20px] leading-none"></i>
            <span class="text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-tight uppercase leading-none whitespace-nowrap">Create</span>
          </button>

          <!-- Irreverent Stoic Tooltip (Desktop & Focus) -->
          <div 
            class="hidden sm:flex absolute -top-18 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 z-50 flex-col items-center"
            role="tooltip">
            <div class="bg-zinc-950/95 border border-amber-500/40 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-xl whitespace-nowrap flex flex-col items-center gap-0.5 text-center">
              <div class="flex items-center gap-1.5 text-amber-300 text-[11px] font-bold">
                <span>Manifest Entity</span>
                <kbd class="bg-zinc-800 text-amber-200 px-1.5 py-0.5 rounded text-[9px] font-mono border border-zinc-700">Q</kbd>
              </div>
              <p class="text-[10px] text-zinc-400 italic">Inject pipeline entropy. Deals won't close themselves in the void.</p>
            </div>
            <div class="w-2 h-2 bg-zinc-950 border-r border-b border-amber-500/40 transform rotate-45 -mt-1"></div>
          </div>
        </div>

        <!-- Expandable Search Form & Trigger (Flex Row) -->
        <div class="relative flex items-center">
          <div 
            class="relative overflow-hidden transition-all duration-300 ease-out flex items-center" 
            [class.w-36]="isSearchOpen() && isMobileViewport()"
            [class.w-56]="isSearchOpen() && !isMobileViewport()" 
            [class.w-0]="!isSearchOpen()" 
            [class.opacity-100]="isSearchOpen()" 
            [class.opacity-0]="!isSearchOpen()" 
            [class.mr-1]="isSearchOpen()">
            <i class="ti ti-search absolute left-2 text-zinc-400 text-[16px] sm:text-[18px]"></i>
            <input 
              #searchInput 
              type="text" 
              placeholder="Search pipeline..." 
              (keydown.enter)="executeSearch(searchInput.value)"
              (keydown.escape)="closeSearch()"
              class="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl py-1 pl-7 pr-2 text-[11px] sm:text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-medium"
            />
          </div>

          <!-- Search Button with Tooltip -->
          <div class="relative group">
            <button 
              type="button"
              (click)="toggleSearch()" 
              class="h-11 sm:h-12 md:h-13 min-w-[38px] sm:min-w-[46px] md:min-w-[50px] px-1 sm:px-2 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-zinc-400 hover:text-teal-300 hover:bg-zinc-900/80 border border-transparent hover:border-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 cursor-pointer"
              [class.bg-zinc-900]="isSearchOpen()"
              [class.text-teal-400]="isSearchOpen()"
              [class.border-zinc-700]="isSearchOpen()"
              aria-label="Toggle pipeline search (Hotkey: /)">
              <i class="ti ti-search text-[18px] sm:text-[20px] leading-none"></i>
              <span class="text-[8px] sm:text-[9px] md:text-[10px] font-medium tracking-tight leading-none whitespace-nowrap">Search</span>
            </button>

            <!-- Search Tooltip -->
            <div 
              class="hidden sm:flex absolute -top-18 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 z-50 flex-col items-center"
              role="tooltip">
              <div class="bg-zinc-950/95 border border-teal-500/30 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-xl whitespace-nowrap flex flex-col items-center gap-0.5 text-center">
                <div class="flex items-center gap-1.5 text-teal-300 text-[11px] font-bold">
                  <span>Gnoseological Inquiry</span>
                  <kbd class="bg-zinc-800 text-teal-200 px-1.5 py-0.5 rounded text-[9px] font-mono border border-zinc-700">/</kbd>
                </div>
                <p class="text-[10px] text-zinc-400 italic">Filter deterministic records from the eternal sea of leads.</p>
              </div>
              <div class="w-2 h-2 bg-zinc-950 border-r border-b border-teal-500/30 transform rotate-45 -mt-1"></div>
            </div>
          </div>
        </div>

      </div>

      <!-- Subtle Vertical Divider (Responsive) -->
      <div class="hidden sm:block w-px h-6 sm:h-8 bg-zinc-800/80 mx-0.5 shrink-0" aria-hidden="true"></div>

      <!-- Main Navigation Items (Flex Row) -->
      <div class="flex items-center gap-0.5 sm:gap-1 shrink-0" role="navigation" aria-label="Primary application views">
        @for (item of navItems; track item.id) {
          <div class="relative group">
            <a 
              [routerLink]="item.path" 
              routerLinkActive="bg-zinc-900 text-teal-400 border-teal-500/40 shadow-[0_0_12px_rgba(20,184,166,0.14)] font-semibold" 
              [routerLinkActiveOptions]="{ exact: !!item.exact }" 
              class="h-11 sm:h-12 md:h-13 min-w-[38px] sm:min-w-[48px] md:min-w-[54px] px-1 sm:px-2 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 group cursor-pointer"
              [attr.aria-label]="item.title + ' view shortcut ' + item.shortcut">
              <i class="ti {{ item.icon }} text-[18px] sm:text-[20px] leading-none transition-transform group-hover:-translate-y-0.5"></i>
              <span class="text-[8px] sm:text-[9px] md:text-[10px] tracking-tight leading-none whitespace-nowrap">{{ item.label }}</span>
            </a>

            <!-- Philosophical Tooltip (Desktop & Focus) -->
            <div 
              class="hidden sm:flex absolute -top-18 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 z-50 flex-col items-center"
              role="tooltip">
              <div class="bg-zinc-950/95 border border-zinc-700/80 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-xl whitespace-nowrap flex flex-col items-center gap-0.5 text-center">
                <div class="flex items-center gap-1.5 text-zinc-100 text-[11px] font-bold">
                  <span>{{ item.title }}</span>
                  <kbd class="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-[9px] font-mono border border-zinc-700">{{ item.shortcut }}</kbd>
                </div>
                <p class="text-[10px] text-zinc-400 italic max-w-[200px] truncate">{{ item.gnoseologyQuote }}</p>
              </div>
              <div class="w-2 h-2 bg-zinc-950 border-r border-b border-zinc-700/80 transform rotate-45 -mt-1"></div>
            </div>
          </div>
        }
      </div>

      <!-- Subtle Vertical Divider (Responsive) -->
      <div class="hidden sm:block w-px h-6 sm:h-8 bg-zinc-800/80 mx-0.5 shrink-0" aria-hidden="true"></div>

      <!-- Stoic Nihilism Gnosis Indicator & Aphorism Oracle -->
      <div class="relative group shrink-0">
        <button 
          type="button"
          (click)="cycleGnosisQuote()" 
          class="h-11 sm:h-12 md:h-13 min-w-[38px] sm:min-w-[46px] md:min-w-[50px] px-1 sm:px-2 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-zinc-400 hover:text-purple-300 hover:bg-purple-950/20 border border-transparent hover:border-purple-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 cursor-pointer"
          aria-label="Draw a stoic nihilistic aphorism (Hotkey: G)">
          <div class="relative flex items-center justify-center">
            <i class="ti ti-brain text-[17px] sm:text-[19px] leading-none text-purple-400"></i>
            <span class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
          </div>
          <span class="text-[8px] sm:text-[9px] md:text-[10px] font-medium tracking-tight text-purple-300/80 leading-none whitespace-nowrap">Gnosis</span>
        </button>

        <!-- Tooltip for Gnosis Oracle -->
        <div 
          class="hidden sm:flex absolute -top-20 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 z-50 flex-col items-center"
          role="tooltip">
          <div class="bg-zinc-950/95 border border-purple-500/40 rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-xl whitespace-nowrap flex flex-col items-center gap-0.5 text-center">
            <div class="flex items-center gap-1.5 text-purple-300 text-[11px] font-bold">
              <span>Stoic Episteme Oracle</span>
              <kbd class="bg-zinc-800 text-purple-200 px-1.5 py-0.5 rounded text-[9px] font-mono border border-zinc-700">G</kbd>
            </div>
            <p class="text-[10px] text-zinc-400 italic">Summon serene clarity on mortal revenue pursuits.</p>
          </div>
          <div class="w-2 h-2 bg-zinc-950 border-r border-b border-purple-500/40 transform rotate-45 -mt-1"></div>
        </div>
      </div>
      </div>

    </nav>

    <!-- Epistemic Clarity Stoic Banner Toast (appears on Gnosis trigger or mobile tap) -->
    @if (activeGnosisToast()) {
      <div 
        class="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92vw] sm:w-auto bg-zinc-950/95 border border-purple-500/40 rounded-2xl p-3.5 shadow-[0_10px_35px_rgba(168,85,247,0.3)] backdrop-blur-2xl text-zinc-100 flex items-start gap-3 animate-fade-in"
        role="alert">
        <div class="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400 mt-0.5">
          <i class="ti ti-book text-[18px]"></i>
        </div>
        <div class="flex-1 min-w-0 pr-2">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-400">Stoic Gnoseology Reflection</span>
            <span class="text-[9px] font-mono text-zinc-500">Axiom #{{ gnosisIndex() + 1 }}</span>
          </div>
          <p class="text-xs text-zinc-300 italic leading-relaxed">"{{ activeGnosisToast()?.quote }}"</p>
          <div class="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
            <span>— {{ activeGnosisToast()?.philosopher }}</span>
            <span class="text-zinc-600 font-mono">Certainty: {{ activeGnosisToast()?.certainty }}%</span>
          </div>
        </div>
        <button 
          (click)="activeGnosisToast.set(null)" 
          class="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
          aria-label="Dismiss gnoseological reflection">
          <i class="ti ti-x text-[16px]"></i>
        </button>
      </div>
    }

    <!-- Quick Add Modal Overlay (Responsive for Mobile & Desktop) -->
    @if (isQuickAddOpen()) {
      <div 
        class="fixed inset-0 z-[100] bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto" 
        tabindex="0" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="quick-add-title"
        (click)="closeQuickAddOnBackdrop($event)" 
        (keydown.escape)="closeQuickAdd()">
        <div 
          class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]" 
          tabindex="-1" 
          (click)="$event.stopPropagation()" 
          (keydown)="$event.stopPropagation()">
          
          <!-- Modal Header -->
          <div class="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-zinc-950 font-bold">
                <i class="ti ti-plus text-[18px]"></i>
              </div>
              <div>
                <h3 id="quick-add-title" class="text-xs sm:text-sm font-bold text-white font-display">Record Pipeline Entity</h3>
                <p class="text-[10px] sm:text-[11px] text-zinc-400">Capturing transient commercial intentions with stoic rigor</p>
              </div>
            </div>

            <button 
              (click)="closeQuickAdd()" 
              class="text-zinc-500 hover:text-zinc-300 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="Close dialog">
              <i class="ti ti-x text-[20px]"></i>
            </button>
          </div>

          <!-- Type Switcher Tabs (Flexbox) -->
          <div class="px-4 sm:px-5 pt-3 sm:pt-4 flex gap-2 shrink-0">
            <button 
              type="button"
              (click)="quickAddTab.set('lead')"
              [class]="quickAddTab() === 'lead' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:text-zinc-200'"
              class="flex-1 py-2 px-3 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer">
              <i class="ti ti-user-plus text-[16px]"></i> <span>New Prospect</span>
            </button>
            
            <button 
              type="button"
              (click)="quickAddTab.set('task')"
              [class]="quickAddTab() === 'task' ? 'bg-teal-500/10 text-teal-400 border-teal-500/30 font-bold' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:text-zinc-200'"
              class="flex-1 py-2 px-3 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 cursor-pointer">
              <i class="ti ti-file-plus text-[16px]"></i> <span>New Action Item</span>
            </button>
          </div>

          <!-- Scrollable Form Container -->
          <div class="overflow-y-auto p-4 sm:p-5 flex-1">
            <!-- Lead Form -->
            @if (quickAddTab() === 'lead') {
              <form [formGroup]="leadForm" (ngSubmit)="submitLead()" class="space-y-3.5">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  <div class="space-y-1 col-span-1 sm:col-span-2">
                    <div class="text-[11px] font-semibold text-zinc-400">Smart Voice Capture</div>
                    <div class="flex items-center gap-2">
                      <button type="button" (click)="simulateVoiceCapture()" [class.bg-rose-500]="isListening()" [class.animate-pulse]="isListening()" class="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors shrink-0">
                        <i class="ti ti-microphone text-[18px]"></i>
                      </button>
                      <input type="text" [value]="voiceInputText()" readonly placeholder="Tap mic and say: 'John Doe from Acme Corp, john@acme.com'" class="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none" />
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label for="quick-lead-name" class="text-[11px] font-semibold text-zinc-400">Full Name *</label>
                    <input id="quick-lead-name" formControlName="name" type="text" placeholder="e.g. Sarah Jenkins" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                  </div>

                  <div class="space-y-1">
                    <label for="quick-lead-company" class="text-[11px] font-semibold text-zinc-400">Company</label>
                    <input id="quick-lead-company" formControlName="company" type="text" placeholder="e.g. Acme Corp" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                  </div>

                  <div class="space-y-1 col-span-1 sm:col-span-2">
                    <label for="quick-lead-email" class="text-[11px] font-semibold text-zinc-400">Work Email *</label>
                    <input id="quick-lead-email" formControlName="email" type="email" placeholder="sarah@acmecorp.com" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                  </div>

                  <div class="space-y-1">
                    <label for="quick-lead-value" class="text-[11px] font-semibold text-zinc-400">Estimated Value ($)</label>
                    <input id="quick-lead-value" formControlName="value" type="number" placeholder="25000" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500" />
                  </div>

                  <div class="space-y-1">
                    <label for="quick-lead-status" class="text-[11px] font-semibold text-zinc-400">Pipeline Stage</label>
                    <select id="quick-lead-status" formControlName="status" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                      <option value="New">New (Unexamined)</option>
                      <option value="Contacted">Contacted (Epistemic Dialectic)</option>
                      <option value="Qualified">Qualified (Empirically Sound)</option>
                      <option value="Closed">Closed (Ontological Truth)</option>
                    </select>
                  </div>

                  <div class="space-y-1">
                    <label for="quick-lead-source" class="text-[11px] font-semibold text-zinc-400">Source Channel</label>
                    <select id="quick-lead-source" formControlName="source" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                      <option value="Inbound Website">Inbound Portal</option>
                      <option value="Outbound SDR">Outbound Dialectic</option>
                      <option value="LinkedIn Cold">Cold Outreach</option>
                      <option value="Partner Referral">Trusted Counterparty</option>
                      <option value="Event / Conference">Physical Gathering</option>
                    </select>
                  </div>

                  <div class="space-y-1">
                    <label for="quick-lead-priority" class="text-[11px] font-semibold text-zinc-400">Priority</label>
                    <select id="quick-lead-priority" formControlName="priority" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                      <option value="High">High Urgency</option>
                      <option value="Medium">Medium Equanimity</option>
                      <option value="Low">Low Indifference</option>
                    </select>
                  </div>

                </div>

                <div class="pt-3 flex justify-end gap-2 border-t border-zinc-800/60">
                  <button type="button" (click)="closeQuickAdd()" class="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">Cancel</button>
                  <button type="submit" [disabled]="leadForm.invalid || isSubmitting()" class="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer">
                    <i class="ti ti-check text-[16px]"></i> Affirm Prospect
                  </button>
                </div>
              </form>
            }

            <!-- Task Form -->
            @if (quickAddTab() === 'task') {
              <form [formGroup]="taskForm" (ngSubmit)="submitTask()" class="space-y-3.5">
                <div class="space-y-3">
                  
                  <div class="space-y-1">
                    <label for="quick-task-title" class="text-[11px] font-semibold text-zinc-400">Action Item Summary *</label>
                    <input id="quick-task-title" formControlName="title" type="text" placeholder="e.g. Roll the follow-up stone up the hill for Sarah" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500" />
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <label for="quick-task-category" class="text-[11px] font-semibold text-zinc-400">Category Tag</label>
                      <select id="quick-task-category" formControlName="category" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
                        <option value="SDR Follow-up">SDR Follow-up</option>
                        <option value="Legal Review">Legal Hermeneutics</option>
                        <option value="Client Onboarding">Client Onboarding</option>
                        <option value="Deal Close">Final Agreement</option>
                        <option value="General">Stoic Maintenance</option>
                      </select>
                    </div>

                    <div class="space-y-1">
                      <label for="quick-task-priority" class="text-[11px] font-semibold text-zinc-400">Urgency Level</label>
                      <select id="quick-task-priority" formControlName="priority" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
                        <option value="High">Immediate Action</option>
                        <option value="Medium">Calculated Patience</option>
                        <option value="Low">Cosmic Indifference</option>
                      </select>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label for="quick-task-duedate" class="text-[11px] font-semibold text-zinc-400">Temporal Horizon (Due Date)</label>
                    <input id="quick-task-duedate" formControlName="dueDate" type="date" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500" />
                  </div>

                  <div class="space-y-1">
                    <label for="quick-task-desc" class="text-[11px] font-semibold text-zinc-400">Pragmatic Notes</label>
                    <textarea id="quick-task-desc" formControlName="description" rows="2" placeholder="Action item details..." class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 resize-none"></textarea>
                  </div>

                </div>

                <div class="pt-3 flex justify-end gap-2 border-t border-zinc-800/60">
                  <button type="button" (click)="closeQuickAdd()" class="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">Cancel</button>
                  <button type="submit" [disabled]="taskForm.invalid || isSubmitting()" class="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-teal-500/20 disabled:opacity-50 cursor-pointer">
                    <i class="ti ti-check text-[16px]"></i> Commit Task
                  </button>
                </div>
              </form>
            }
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class DockComponent {
  private fb = inject(FormBuilder);
  private leadService = inject(LeadService);
  private appwrite = inject(Appwrite);
  private router = inject(Router);

  isSearchOpen = signal(false);
  isQuickAddOpen = signal(false);
  quickAddTab = signal<'lead' | 'task'>('lead');
  isSubmitting = signal(false);

  gnosisIndex = signal(0);
  activeGnosisToast = signal<{ quote: string; philosopher: string; certainty: number } | null>(null);

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  navItems: DockNavItem[] = [
    {
      id: 'dashboard',
      path: '/',
      label: 'Home',
      icon: 'ti-home',
      shortcut: '1',
      title: 'Metrics Dashboard',
      gnoseologyQuote: 'Empirical metrics to soothe the mortal intellect.',
      exact: true
    },
    {
      id: 'leads',
      path: '/leads',
      label: 'Clients',
      icon: 'ti-users',
      shortcut: '2',
      title: 'Client Management',
      gnoseologyQuote: 'Ephemeral souls yearning for SaaS commitments.'
    },
    {
      id: 'deal-rooms',
      path: '/deal-rooms',
      label: 'Pipeline',
      icon: 'ti-layout-kanban',
      shortcut: '3',
      title: 'Deal Tracking',
      gnoseologyQuote: 'Dissect stakeholder buying committee dialectics.'
    },
    {
      id: 'tasks',
      path: '/tasks',
      label: 'Activity',
      icon: 'ti-list-check',
      shortcut: '4',
      title: 'Task & Activity Ledger',
      gnoseologyQuote: 'Sisyphus rolleth the Kanban stone once more.'
    },
    {
      id: 'sales-personality',
      path: '/sales-personality',
      label: 'Coach',
      icon: 'ti-brain',
      shortcut: '5',
      title: 'Sales Personality (BEEP)',
      gnoseologyQuote: 'BEEP v2.0 intervenes to eradicate desperate corporate cringe.'
    },
    {
      id: 'reverse-gauntlet',
      path: '/reverse-gauntlet',
      label: 'Spite',
      icon: 'ti-bolt',
      shortcut: '6',
      title: 'ADHD Reverse Gauntlet',
      gnoseologyQuote: 'Weaponize pure defiance against executive dysfunction.'
    }
  ];

  private gnosisAphorisms = [
    {
      quote: 'We suffer more often in pipeline forecasting than in actual contract negotiations.',
      philosopher: 'Epictetus, SDR Emeritus',
      certainty: 88
    },
    {
      quote: 'All deals fade into the cosmic backlog. Follow up with serene deliberate precision nonetheless.',
      philosopher: 'Marcus Aurelius, RevOps Emperor',
      certainty: 94
    },
    {
      quote: 'To know that you close nothing by yourself is the beginning of true quota attainment.',
      philosopher: 'Socrates, Senior Solution Architect',
      certainty: 99
    },
    {
      quote: 'The deal cycle is neither inherently good nor bad; mortal expectation maketh it so.',
      philosopher: 'Seneca, VP of Strategic Accounts',
      certainty: 76
    },
    {
      quote: 'Entropy governs the stars, yet our Q3 SLA shall remain mathematically unyielding.',
      philosopher: 'Cosmic Gnosis Dispatch',
      certainty: 95
    },
    {
      quote: 'True epistemic wisdom is knowing the client will request an enterprise amendment at 11:59 PM.',
      philosopher: 'Axiom of Digital Equanimity',
      certainty: 99
    }
  ];

  isListening = signal(false);
  voiceInputText = signal('');

  leadForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    company: [''],
    email: ['', [Validators.required, Validators.email]],
    value: [25000, [Validators.required, Validators.min(0)]],
    status: ['New', Validators.required],
    source: ['Inbound Website', Validators.required],
    priority: ['High', Validators.required]
  });

  taskForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    category: ['SDR Follow-up', Validators.required],
    priority: ['High', Validators.required],
    dueDate: [new Date(Date.now() + 86400000).toISOString().slice(0, 10)],
    description: ['']
  });

  triggerHaptic(duration = 10) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Safe fallback if unsupported or blocked
      }
    }
  }

  isMobileViewport(): boolean {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

    if (isTyping) {
      if (event.key === 'Escape') {
        if (this.isSearchOpen()) this.closeSearch();
        if (this.isQuickAddOpen()) this.closeQuickAdd();
      }
      return;
    }

    // Hotkeys when not typing
    if (event.key.toLowerCase() === 'q') {
      event.preventDefault();
      this.openQuickAdd('lead');
    } else if (event.key === '/') {
      event.preventDefault();
      this.toggleSearch();
    } else if (event.key.toLowerCase() === 'g') {
      event.preventDefault();
      this.cycleGnosisQuote();
    } else if (['1', '2', '3', '4', '5', '6', '7'].includes(event.key)) {
      const idx = parseInt(event.key) - 1;
      if (this.navItems[idx]) {
        event.preventDefault();
        this.router.navigateByUrl(this.navItems[idx].path);
      }
    }
  }

  toggleSearch() {
    this.isSearchOpen.update(v => !v);
    if (this.isSearchOpen()) {
      setTimeout(() => this.searchInput?.nativeElement.focus(), 80);
    }
  }

  closeSearch() {
    this.isSearchOpen.set(false);
  }

  executeSearch(query: string) {
    const trimmed = query.trim();
    if (trimmed) {
      this.router.navigate(['/leads'], { queryParams: { q: trimmed } });
      this.closeSearch();
      this.appwrite.addNotification({
        title: 'Query Dispatched',
        message: `Searching pipeline for "${trimmed}" across active records.`,
        type: 'info'
      });
    }
  }

  cycleGnosisQuote() {
    const nextIdx = (this.gnosisIndex() + 1) % this.gnosisAphorisms.length;
    this.gnosisIndex.set(nextIdx);
    this.activeGnosisToast.set(this.gnosisAphorisms[nextIdx]);

    setTimeout(() => {
      if (this.activeGnosisToast() === this.gnosisAphorisms[nextIdx]) {
        this.activeGnosisToast.set(null);
      }
    }, 6500);
  }

  openQuickAdd(type: 'lead' | 'task' = 'lead') {
    this.quickAddTab.set(type);
    this.isQuickAddOpen.set(true);
  }

  closeQuickAdd() {
    this.isQuickAddOpen.set(false);
    this.isListening.set(false);
    this.voiceInputText.set('');
    this.leadForm.reset({
      name: '',
      company: '',
      email: '',
      value: 25000,
      status: 'New',
      source: 'Inbound Website',
      priority: 'High'
    });
    this.taskForm.reset({
      title: '',
      category: 'SDR Follow-up',
      priority: 'High',
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      description: ''
    });
  }

  closeQuickAddOnBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeQuickAdd();
    }
  }

  simulateVoiceCapture() {
    if (this.isListening()) return;
    this.isListening.set(true);
    this.voiceInputText.set('Listening...');
    
    // Simulate AI parsing voice input
    setTimeout(() => {
      this.voiceInputText.set('Processing: "Add John Doe from Acme Corp..."');
      setTimeout(() => {
        this.leadForm.patchValue({
          name: 'John Doe',
          company: 'Acme Corp',
          email: 'john@acmecorp.com'
        });
        this.isListening.set(false);
        this.voiceInputText.set('Extracted: John Doe, Acme Corp');
        this.appwrite.addNotification({
          title: 'Voice Capture Complete',
          message: 'Smart fields populated from speech.',
          type: 'success'
        });
      }, 800);
    }, 1500);
  }

  async submitLead() {
    if (this.leadForm.invalid) return;
    this.isSubmitting.set(true);
    try {
      const val = this.leadForm.value;
      await this.leadService.createLead({
        name: val.name,
        email: val.email,
        company: val.company,
        value: Number(val.value) || 0,
        status: val.status,
        source: val.source,
        priority: val.priority,
        industry: 'Software / Technology',
        expectedCloseDate: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10)
      });

      this.appwrite.addNotification({
        title: 'Prospect Affirmed',
        message: `Successfully manifested lead record for "${val.name}" into pipeline reality.`,
        type: 'success'
      });

      this.closeQuickAdd();
    } catch (e: unknown) {
      const err = e as Error;
      this.appwrite.addNotification({
        title: 'Failed to create lead',
        message: err.message || 'Error occurred while saving lead',
        type: 'warning'
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async submitTask() {
    if (this.taskForm.invalid) return;
    this.isSubmitting.set(true);
    try {
      const val = this.taskForm.value;
      await this.appwrite.addTask({
        title: val.title,
        category: val.category,
        priority: val.priority,
        dueDate: val.dueDate,
        description: val.description,
        status: 'Pending'
      });

      this.appwrite.addNotification({
        title: 'Task Registered',
        message: `Action item "${val.title}" assigned to the Sisyphus ledger.`,
        type: 'success'
      });

      this.closeQuickAdd();
    } catch (e: unknown) {
      const err = e as Error;
      this.appwrite.addNotification({
        title: 'Failed to create task',
        message: err.message || 'Error occurred while creating task',
        type: 'warning'
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
