import { Component, ChangeDetectionStrategy, signal, computed, inject, ElementRef, ViewChild, HostListener, input, output, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { LeadService } from './lead.service';
import { Appwrite } from './appwrite';

export interface CommandItem {
  id: string;
  category: 'Actions' | 'Navigation' | 'Search Results';
  title: string;
  subtitle?: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  shortcut?: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    @if (isOpen()) {
      <div 
        class="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-start justify-center pt-[8vh] sm:pt-[12vh] p-4 animate-fade-in select-none"
        (click)="close()"
        (keydown.escape)="close()"
        tabindex="0"
        role="dialog"
        aria-modal="true"
        aria-label="CRM Command Palette">
        
        <div 
          class="bg-zinc-950/95 border border-zinc-800/90 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-zinc-100 flex flex-col max-h-[85vh] relative animate-scale-up"
          (click)="$event.stopPropagation()"
          (keydown)="handleModalKeyDown($event)"
          tabindex="-1">
          
          <!-- Subtle top gradient bar -->
          <div class="h-1 w-full bg-gradient-to-r from-teal-500 via-rose-500 to-emerald-500"></div>

          <!-- Input Header -->
          <div class="p-4 border-b border-zinc-800/80 flex items-center gap-3 bg-zinc-900/50">
            <div class="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
              <mat-icon class="text-teal-400 text-lg">terminal</mat-icon>
            </div>
            
            <input 
              #commandInput
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onSearchChange()"
              (keydown)="handleInputKeyDown($event)"
              placeholder="Type a command or search leads, tasks, actions..." 
              role="combobox"
              aria-autocomplete="list"
              aria-controls="cmd-listbox"
              [attr.aria-expanded]="isOpen()"
              [attr.aria-activedescendant]="'cmd-item-' + selectedIndex()"
              class="w-full bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none font-medium"
            />

            <!-- Voice Memo Button in Header -->
            <button 
              (click)="startVoiceMemo()" 
              [title]="isRecording() ? 'Voice Recording Active' : 'Dictate Voice Memo (Shift+V)'"
              [class]="isRecording() ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse' : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800/80 bg-zinc-900/60'"
              class="px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 shrink-0 text-xs font-semibold">
              <mat-icon class="text-rose-400 text-sm">mic</mat-icon>
              <span class="hidden sm:inline text-[11px] text-zinc-300">Voice Memo</span>
            </button>

            @if (searchQuery()) {
              <button 
                (click)="searchQuery.set(''); selectedIndex.set(0)" 
                class="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            }

            <span class="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md">
              ESC
            </span>
          </div>

          <!-- Voice Memo Workspace Drawer (when active) -->
          @if (isVoiceMode()) {
            <div class="p-5 space-y-4 bg-zinc-900/80 border-b border-zinc-800/90 animate-fade-in">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div [class]="isRecording() ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' : 'bg-zinc-800 text-zinc-400 border-zinc-700'" class="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0">
                    <mat-icon class="text-xl">mic</mat-icon>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-sm font-bold text-white font-display">Voice Memo Dictation</h3>
                      @if (isRecording()) {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                          RECORDING
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          PAUSED
                        </span>
                      }
                    </div>
                    <p class="text-xs text-zinc-400 mt-0.5">
                      {{ isRecording() ? 'Listening... Speak into your microphone to dictate note content.' : 'Dictation ready or paused.' }}
                    </p>
                  </div>
                </div>

                <button 
                  (click)="cancelVoiceMemo()" 
                  class="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                  title="Close Voice Memo">
                  <mat-icon class="text-sm">close</mat-icon>
                </button>
              </div>

              @if (speechError()) {
                <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                  <mat-icon class="text-amber-400 text-sm">warning</mat-icon>
                  <span>{{ speechError() }}</span>
                </div>
              }

              <!-- Note Title Input -->
              <div>
                <label for="voiceTitle" class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Note Title</label>
                <input 
                  id="voiceTitle"
                  type="text" 
                  [value]="voiceTitle()" 
                  (input)="voiceTitle.set($any($event.target).value)" 
                  placeholder="e.g. Executive Client Call Takeaways..." 
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500/50 font-medium"
                />
              </div>

              <!-- Dictated Text Output -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label for="voiceTranscript" class="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Live Dictated Content</label>
                  <span class="text-[10px] text-zinc-500 font-mono">{{ voiceTranscript().length }} characters</span>
                </div>
                <textarea 
                  id="voiceTranscript"
                  rows="4"
                  [value]="voiceTranscript()" 
                  (input)="voiceTranscript.set($any($event.target).value)" 
                  placeholder="Speak into your mic... dictated notes will appear here in real time. You can also edit text manually." 
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-rose-500/50 leading-relaxed font-sans custom-scrollbar resize-none"
                ></textarea>
              </div>

              <!-- Animated Waveform when recording -->
              @if (isRecording()) {
                <div class="flex items-center justify-center gap-1.5 py-1">
                  <span class="w-1 h-4 bg-rose-500/80 rounded-full animate-bounce [animation-delay:-0.4s]"></span>
                  <span class="w-1 h-6 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                  <span class="w-1 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span class="w-1 h-8 bg-rose-400 rounded-full animate-bounce"></span>
                  <span class="w-1 h-5 bg-rose-500/80 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                  <span class="w-1 h-3 bg-rose-400/80 rounded-full animate-bounce [animation-delay:-0.35s]"></span>
                </div>
              }

              <!-- Controls Bar -->
              <div class="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <div class="flex items-center gap-2">
                  <button 
                    (click)="toggleVoiceRecording()" 
                    [class]="isRecording() ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30' : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700'"
                    class="px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5">
                    <mat-icon class="text-sm">{{ isRecording() ? 'pause' : 'mic' }}</mat-icon>
                    <span>{{ isRecording() ? 'Pause Recording' : 'Resume Mic' }}</span>
                  </button>

                  @if (voiceTranscript()) {
                    <button 
                      (click)="voiceTranscript.set('')" 
                      class="px-2.5 py-1.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs transition-colors">
                      Clear Text
                    </button>
                  }
                </div>

                <div class="flex items-center gap-2">
                  <button 
                    (click)="cancelVoiceMemo()" 
                    class="px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button 
                    (click)="saveVoiceMemoToDatabase()" 
                    [disabled]="!voiceTranscript().trim()"
                    class="px-4 py-1.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-bold rounded-xl transition-all text-xs shadow-lg shadow-rose-500/20 flex items-center gap-1.5">
                    <mat-icon class="text-sm">save</mat-icon>
                    <span>Save Note to Database</span>
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- List Content -->
          <div id="cmd-listbox" role="listbox" class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
            
            @if (filteredItems().length === 0) {
              <div class="p-12 text-center flex flex-col items-center justify-center">
                <div class="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                  <mat-icon class="text-zinc-600 text-2xl">search_off</mat-icon>
                </div>
                <p class="text-zinc-400 text-sm font-semibold">No commands or records found</p>
                <p class="text-zinc-600 text-xs mt-1">Try searching for "voice memo", "lead", "meeting", "task", or "dashboard"</p>
              </div>
            } @else {
              
              <!-- Render Categories -->
              @for (category of categories(); track category) {
                @let itemsInCategory = getItemsByCategory(category);
                @if (itemsInCategory.length > 0) {
                  <div>
                    <div class="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      @if (category === 'Actions') {
                        <mat-icon class="text-teal-400 text-[14px]">bolt</mat-icon>
                      } @else if (category === 'Navigation') {
                        <mat-icon class="text-purple-400 text-[14px]">explore</mat-icon>
                      } @else {
                        <mat-icon class="text-emerald-400 text-[14px]">search</mat-icon>
                      }
                      {{ category }}
                    </div>

                    <div class="space-y-0.5 mt-1">
                      @for (item of itemsInCategory; track item.id; let idx = $index) {
                        @let globalIndex = getGlobalIndex(item);
                        <button 
                          [id]="'cmd-item-' + globalIndex"
                          (click)="executeCommand(item)"
                          (mouseenter)="selectedIndex.set(globalIndex)"
                          role="option"
                          [attr.aria-selected]="selectedIndex() === globalIndex"
                          [ngClass]="selectedIndex() === globalIndex ? 'bg-teal-500/15 border-teal-500/40 text-white shadow-[0_0_15px_rgba(20,184,166,0.15)] ring-1 ring-teal-500/30' : 'border-transparent text-zinc-300 hover:text-white'"
                          class="w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer">
                          
                          <div class="flex items-center gap-3 min-w-0">
                            <div [class]="item.iconBg + ' w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5'">
                              <mat-icon [class]="item.iconColor + ' text-[18px]'">{{ item.icon }}</mat-icon>
                            </div>
                            <div class="min-w-0">
                              <div class="text-xs font-semibold text-zinc-200 group-hover:text-white flex items-center gap-2">
                                <span>{{ item.title }}</span>
                              </div>
                              @if (item.subtitle) {
                                <div class="text-[11px] text-zinc-500 truncate mt-0.5">{{ item.subtitle }}</div>
                              }
                            </div>
                          </div>

                          <div class="flex items-center gap-2 shrink-0">
                            @if (item.shortcut) {
                              <span class="px-2 py-0.5 text-[9px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md">
                                {{ item.shortcut }}
                              </span>
                            }
                            <mat-icon 
                              [class.opacity-100]="selectedIndex() === globalIndex"
                              class="text-teal-400 text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">
                              subdirectory_arrow_left
                            </mat-icon>
                          </div>
                        </button>
                      }
                    </div>
                  </div>
                }
              }
            }

          </div>

          <!-- Footer Shortcut Bar -->
          <div class="p-3 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-bold">↑</kbd>
                <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-bold">↓</kbd>
                <span>Navigate</span>
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-bold">↵</kbd>
                <span>Select</span>
              </span>
              <span class="flex items-center gap-1 hidden sm:inline-flex">
                <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-bold">⌘K</kbd>
                <span>Toggle</span>
              </span>
              <span class="flex items-center gap-1 hidden sm:inline-flex">
                <kbd class="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 font-bold">Shift+V</kbd>
                <span>Voice Memo</span>
              </span>
            </div>
            
            <div class="flex items-center gap-1.5 text-teal-400/80 text-[10px] font-bold">
              <span class="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              <span>ΛΞVOS COMMAND ENGINE</span>
            </div>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 5px; }
    .animate-scale-up {
      animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-fade-in {
      animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes scaleUp {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CommandPaletteComponent implements OnDestroy {
  isOpen = input<boolean>(false);
  paletteClose = output<void>();
  openCopilot = output<void>();
  openNotifications = output<void>();

  @ViewChild('commandInput') commandInput?: ElementRef<HTMLInputElement>;

  router = inject(Router);
  leadService = inject(LeadService);
  appwrite = inject(Appwrite);

  searchQuery = signal<string>('');
  selectedIndex = signal<number>(0);

  // Voice Memo Dictation signals
  isVoiceMode = signal<boolean>(false);
  isRecording = signal<boolean>(false);
  voiceTranscript = signal<string>('');
  voiceTitle = signal<string>('');
  speechError = signal<string | null>(null);
  isSpeechSupported = signal<boolean>(true);

  private recognitionInstance: {
    stop: () => void;
    start: () => void;
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onresult: ((event: unknown) => void) | null;
    onerror: ((event: unknown) => void) | null;
    onend: (() => void) | null;
  } | null = null;

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        setTimeout(() => {
          this.commandInput?.nativeElement?.focus();
        }, 50);
      } else {
        this.stopVoiceMemo();
      }
    });
  }

  ngOnDestroy() {
    this.stopVoiceMemo();
  }

  onSearchChange() {
    this.selectedIndex.set(0);
    this.scrollToSelected();
  }

  handleInputKeyDown(event: KeyboardEvent) {
    if (this.isVoiceMode()) {
      return;
    }

    const items = this.filteredItems();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      if (items.length > 0) {
        this.selectedIndex.update(i => (i + 1) % items.length);
        this.scrollToSelected();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      if (items.length > 0) {
        this.selectedIndex.update(i => (i - 1 + items.length) % items.length);
        this.scrollToSelected();
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      if (items.length > 0) {
        const selectedItem = items[this.selectedIndex()];
        if (selectedItem) {
          this.executeCommand(selectedItem);
        }
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  }

  handleModalKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === 'Escape') {
      this.handleInputKeyDown(event);
    } else {
      event.stopPropagation();
    }
  }

  scrollToSelected() {
    setTimeout(() => {
      const idx = this.selectedIndex();
      const el = document.getElementById(`cmd-item-${idx}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Cmd+K or Ctrl+K toggle
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.isOpen()) {
        this.close();
      } else {
        this.paletteClose.emit(); // toggle state in parent
      }
      return;
    }

    // Shift+V shortcut to dictate voice memo
    if (event.shiftKey && event.key.toUpperCase() === 'V') {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isEditable = document.activeElement?.getAttribute('contenteditable') === 'true';
      if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select' && !isEditable) {
        event.preventDefault();
        if (!this.isOpen()) {
          this.paletteClose.emit();
        }
        this.startVoiceMemo();
        return;
      }
    }

    // '/' key opens search when not typing in form controls
    if (event.key === '/' && !this.isOpen()) {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isEditable = document.activeElement?.getAttribute('contenteditable') === 'true';
      if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select' && !isEditable) {
        event.preventDefault();
        this.paletteClose.emit();
        return;
      }
    }

    if (!this.isOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    const items = this.filteredItems();
    if (items.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex.update(i => (i + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex.update(i => (i - 1 + items.length) % items.length);
    } else if (event.key === 'Enter' && !this.isVoiceMode()) {
      event.preventDefault();
      const selectedItem = items[this.selectedIndex()];
      if (selectedItem) {
        this.executeCommand(selectedItem);
      }
    }
  }

  // --- Web Speech API Methods ---

  checkSpeechSupport(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as Record<string, unknown>;
    const SpeechRecognition = win['SpeechRecognition'] || win['webkitSpeechRecognition'];
    return !!SpeechRecognition;
  }

  startVoiceMemo() {
    this.isVoiceMode.set(true);
    this.speechError.set(null);

    if (!this.voiceTitle()) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
      this.voiceTitle.set(`Voice Memo (${dateStr}, ${timeStr})`);
    }

    if (!this.checkSpeechSupport()) {
      this.isSpeechSupported.set(false);
      this.speechError.set('Web Speech API is not supported in this browser window. You can type your voice note text manually below.');
      return;
    }

    this.isSpeechSupported.set(true);

    try {
      const win = window as unknown as Record<string, unknown>;
      const SpeechRecognition = (win['SpeechRecognition'] || win['webkitSpeechRecognition']) as new () => {
        stop: () => void;
        start: () => void;
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onstart: (() => void) | null;
        onresult: ((event: unknown) => void) | null;
        onerror: ((event: unknown) => void) | null;
        onend: (() => void) | null;
      };
      this.recognitionInstance = new SpeechRecognition();
      this.recognitionInstance.continuous = true;
      this.recognitionInstance.interimResults = true;
      this.recognitionInstance.lang = 'en-US';

      this.recognitionInstance.onstart = () => {
        this.isRecording.set(true);
      };

      this.recognitionInstance.onresult = (event: unknown) => {
        let currentTranscript = '';
        const ev = event as { results: ({ transcript: string }[])[] };
        for (const res of Array.from(ev.results)) {
          currentTranscript += res[0].transcript;
        }
        this.voiceTranscript.set(currentTranscript);
      };

      this.recognitionInstance.onerror = (event: unknown) => {
        const ev = event as { error: string };
        console.warn('Speech recognition event error:', ev.error);
        if (ev.error !== 'no-speech') {
          this.speechError.set(`Speech recognition status: ${ev.error}. You can still edit or type text manually.`);
        }
        this.isRecording.set(false);
      };

      this.recognitionInstance.onend = () => {
        this.isRecording.set(false);
      };

      this.recognitionInstance.start();
    } catch (err: unknown) {
      console.error('Failed starting speech recognition:', err);
      const errMsg = err instanceof Error ? err.message : 'Microphone access unavailable. You can type text manually below.';
      this.speechError.set(errMsg);
      this.isRecording.set(false);
    }
  }

  stopVoiceMemo() {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {
        // Safe catch if already stopped
      }
      this.recognitionInstance = null;
    }
    this.isRecording.set(false);
  }

  toggleVoiceRecording() {
    if (this.isRecording()) {
      this.stopVoiceMemo();
    } else {
      this.startVoiceMemo();
    }
  }

  async saveVoiceMemoToDatabase() {
    this.stopVoiceMemo();
    const transcript = this.voiceTranscript().trim();
    const title = this.voiceTitle().trim() || 'Voice Memo Note';

    if (!transcript) {
      this.appwrite.addNotification({
        title: 'Voice Memo Empty',
        message: 'Please dictate or type text before saving to database.',
        type: 'warning'
      });
      return;
    }

    try {
      await this.appwrite.addNote({
        title: title,
        content: transcript,
        color: 'border-t-rose-500 text-rose-500',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        tags: ['VoiceMemo', 'Dictated']
      });

      this.appwrite.addNotification({
        title: 'Voice Memo Saved',
        message: `Saved note "${title}" directly to database.`,
        type: 'success'
      });

      this.cancelVoiceMemo();
      this.close();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error saving note to database.';
      this.appwrite.addNotification({
        title: 'Save Failed',
        message: errMsg,
        type: 'error'
      });
    }
  }

  cancelVoiceMemo() {
    this.stopVoiceMemo();
    this.isVoiceMode.set(false);
    this.voiceTranscript.set('');
    this.voiceTitle.set('');
    this.speechError.set(null);
  }

  // Pre-defined static actions and navigation options
  private staticActions = computed<CommandItem[]>(() => [
    {
      id: 'act-voice-memo',
      category: 'Actions',
      title: 'Dictate Voice Memo Note',
      subtitle: 'Record voice note via Web Speech API & save directly to database',
      icon: 'mic',
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-400',
      shortcut: 'Shift+V',
      action: () => {
        this.startVoiceMemo();
      }
    },
    {
      id: 'act-new-lead',
      category: 'Actions',
      title: 'Create New Lead / Prospect',
      subtitle: 'Initialize a new account in the pipeline',
      icon: 'person_add',
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-400',
      shortcut: 'Shift+L',
      action: () => {
        this.router.navigate(['/leads'], { queryParams: { action: 'create' } });
      }
    },
    {
      id: 'act-deal-room',
      category: 'Actions',
      title: 'Open Deal War-Room & Buying Committee',
      subtitle: 'Simulate objections, mutual action plans & stakeholder buying authority',
      icon: 'meeting_room',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      action: () => {
        this.router.navigate(['/deal-rooms']);
      }
    },
    {
      id: 'act-revops-sim',
      category: 'Actions',
      title: 'Run RevOps Monte Carlo Simulation',
      subtitle: 'Run 1,000 statistical iterations on pipeline attainment & AE capacity',
      icon: 'query_stats',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      action: () => {
        this.router.navigate(['/revops-simulator']);
      }
    },
    {
      id: 'act-outbound-cadence',
      category: 'Actions',
      title: 'Launch Outbound Multi-Touch Cadence',
      subtitle: 'Orchestrate email, LinkedIn, and phone touchpoints with Liquid syntax',
      icon: 'alt_route',
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
      action: () => {
        this.router.navigate(['/cadences']);
      }
    },
    {
      id: 'act-legal-vault',
      category: 'Actions',
      title: 'Generate Legal Contract & Seal',
      subtitle: 'Draft MSA/NDA agreements with SHA-256 seal & digital signature',
      icon: 'gavel',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      action: () => {
        this.router.navigate(['/contracts']);
      }
    },
    {
      id: 'act-schedule-meeting',
      category: 'Actions',
      title: 'Schedule Discovery Call',
      subtitle: 'Open the Nextcloud/CalDAV booking calendar',
      icon: 'calendar_month',
      iconBg: 'bg-teal-500/10',
      iconColor: 'text-teal-400',
      shortcut: 'Shift+M',
      action: () => {
        this.router.navigate(['/scheduler']);
      }
    },
    {
      id: 'act-new-task',
      category: 'Actions',
      title: 'Log New Strategic Objective',
      subtitle: 'Add a task to the action items backlog',
      icon: 'add_task',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      shortcut: 'Shift+T',
      action: () => {
        this.router.navigate(['/tasks'], { queryParams: { action: 'create' } });
      }
    },
    {
      id: 'act-send-email',
      category: 'Actions',
      title: 'Compose & Send Email',
      subtitle: 'Send client follow-ups via email engine',
      icon: 'email',
      iconBg: 'bg-sky-500/10',
      iconColor: 'text-sky-400',
      action: () => {
        this.router.navigate(['/emails']);
      }
    },
    {
      id: 'act-ai-copilot',
      category: 'Actions',
      title: 'Launch AI Sentinel Copilot',
      subtitle: 'Query AI assistant for deal recommendations',
      icon: 'auto_awesome',
      iconBg: 'bg-purple-500/15',
      iconColor: 'text-purple-300',
      shortcut: 'Shift+A',
      action: () => {
        this.openCopilot.emit();
      }
    },
    {
      id: 'act-notifications',
      category: 'Actions',
      title: 'View Sentinel Updates & Activity',
      subtitle: 'Inspect real-time system notifications',
      icon: 'notifications',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      action: () => {
        this.openNotifications.emit();
      }
    },
    // Navigation Items
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      title: 'Go to Executive Dashboard',
      subtitle: 'Overview of total pipeline, ARR, and KPIs',
      icon: 'dashboard',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-zinc-300',
      action: () => { this.router.navigate(['/']); }
    },
    {
      id: 'nav-deal-rooms',
      category: 'Navigation',
      title: 'Go to Deal Rooms & Buying Committees',
      subtitle: 'Enterprise war-rooms, MAPs, and objection simulation',
      icon: 'meeting_room',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-purple-400',
      action: () => { this.router.navigate(['/deal-rooms']); }
    },
    {
      id: 'nav-cadences',
      category: 'Navigation',
      title: 'Go to Outbound Cadence Studio',
      subtitle: 'Omnichannel multi-touch sequences & step analytics',
      icon: 'alt_route',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-cyan-400',
      action: () => { this.router.navigate(['/cadences']); }
    },
    {
      id: 'nav-revops',
      category: 'Navigation',
      title: 'Go to RevOps Simulator Engine',
      subtitle: 'Monte Carlo ARR model, capacity planner, and accelerators',
      icon: 'query_stats',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-emerald-400',
      action: () => { this.router.navigate(['/revops-simulator']); }
    },
    {
      id: 'nav-contracts',
      category: 'Navigation',
      title: 'Go to Legal & Contract Vault',
      subtitle: 'MSA/NDA generator, cryptographic seal & Appwrite vault',
      icon: 'gavel',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-amber-400',
      action: () => { this.router.navigate(['/contracts']); }
    },
    {
      id: 'nav-mcp-server',
      category: 'Navigation',
      title: 'Go to MCP Server Console',
      subtitle: 'Inspect Model Context Protocol tools, resources, and client connections',
      icon: 'hub',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-teal-400',
      action: () => { this.router.navigate(['/mcp-server']); }
    },
    {
      id: 'nav-notes',
      category: 'Navigation',
      title: 'Go to Knowledge Base & Notes',
      subtitle: 'View saved notes, voice memos, and documentation',
      icon: 'description',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-amber-400',
      action: () => { this.router.navigate(['/notes']); }
    },
    {
      id: 'nav-leads',
      category: 'Navigation',
      title: 'Go to Leads Pipeline',
      subtitle: 'Kanban board, list view, and prospect maps',
      icon: 'filter_alt',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-orange-400',
      action: () => { this.router.navigate(['/leads']); }
    },
    {
      id: 'nav-clients',
      category: 'Navigation',
      title: 'Go to Clients Directory',
      subtitle: 'Active customer accounts and ARR health',
      icon: 'groups',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-emerald-400',
      action: () => { this.router.navigate(['/clients']); }
    },
    {
      id: 'nav-forecast',
      category: 'Navigation',
      title: 'Go to Revenue Forecast',
      subtitle: 'Monte Carlo simulations and scenario projections',
      icon: 'insights',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-purple-400',
      action: () => { this.router.navigate(['/forecast']); }
    },
    {
      id: 'nav-automations',
      category: 'Navigation',
      title: 'Go to System Automations',
      subtitle: 'Trigger rules, webhook weblogs, and integrations',
      icon: 'precision_manufacturing',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-sky-400',
      action: () => { this.router.navigate(['/automations']); }
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      title: 'Go to CRM Settings',
      subtitle: 'Manage team access, API keys, and workspace options',
      icon: 'settings',
      iconBg: 'bg-zinc-800',
      iconColor: 'text-zinc-400',
      action: () => { this.router.navigate(['/settings']); }
    }
  ]);

  // Combined item list with dynamic search query filtering
  filteredItems = computed<CommandItem[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const staticList = this.staticActions();

    if (!query) {
      return staticList;
    }

    // Filter static commands
    const matchedStatic = staticList.filter(item => 
      item.title.toLowerCase().includes(query) || 
      (item.subtitle && item.subtitle.toLowerCase().includes(query)) ||
      item.category.toLowerCase().includes(query)
    );

    // Dynamic Search Results from Leads
    const dynamicSearchResults: CommandItem[] = [];

    this.leadService.leads().forEach(lead => {
      if (lead.name.toLowerCase().includes(query) || lead.email.toLowerCase().includes(query) || (lead.industry && lead.industry.toLowerCase().includes(query))) {
        dynamicSearchResults.push({
          id: `lead-${lead.$id}`,
          category: 'Search Results',
          title: lead.name,
          subtitle: `${lead.email} • ${lead.status} • $${lead.value?.toLocaleString() || 0}`,
          icon: 'person',
          iconBg: 'bg-orange-500/10',
          iconColor: 'text-orange-400',
          action: () => {
            this.router.navigate(['/leads'], { queryParams: { search: lead.name } });
            this.appwrite.addNotification({
              title: 'Prospect Selected',
              message: `Opened pipeline lead for "${lead.name}".`,
              type: 'info'
            });
          }
        });
      }
    });

    // Dynamic Search Results from Tasks
    this.appwrite.tasks().forEach(task => {
      if (task.title.toLowerCase().includes(query)) {
        dynamicSearchResults.push({
          id: `task-${task.$id}`,
          category: 'Search Results',
          title: task.title,
          subtitle: `Task Category: ${task.category} • Status: ${task.status}`,
          icon: 'task_alt',
          iconBg: 'bg-purple-500/10',
          iconColor: 'text-purple-400',
          action: () => {
            this.router.navigate(['/tasks'], { queryParams: { search: task.title } });
            this.appwrite.addNotification({
              title: 'Task Selected',
              message: `Opened task "${task.title}".`,
              type: 'info'
            });
          }
        });
      }
    });

    if (query && dynamicSearchResults.length > 0) {
      return [...dynamicSearchResults.slice(0, 8), ...matchedStatic];
    }

    return [...matchedStatic, ...dynamicSearchResults.slice(0, 5)];
  });

  categories = computed<('Actions' | 'Navigation' | 'Search Results')[]>(() => {
    const query = this.searchQuery().trim();
    const categoriesPresent = new Set(this.filteredItems().map(i => i.category));
    const order: ('Actions' | 'Navigation' | 'Search Results')[] = query
      ? ['Search Results', 'Actions', 'Navigation']
      : ['Actions', 'Navigation', 'Search Results'];
    return order.filter(c => categoriesPresent.has(c));
  });

  getItemsByCategory(category: 'Actions' | 'Navigation' | 'Search Results'): CommandItem[] {
    return this.filteredItems().filter(i => i.category === category);
  }

  getGlobalIndex(targetItem: CommandItem): number {
    return this.filteredItems().findIndex(i => i.id === targetItem.id);
  }

  executeCommand(item: CommandItem) {
    this.close();
    item.action();
  }

  close() {
    this.cancelVoiceMemo();
    this.searchQuery.set('');
    this.selectedIndex.set(0);
    this.paletteClose.emit();
  }
}

