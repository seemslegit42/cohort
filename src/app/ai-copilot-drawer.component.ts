import { Component, ChangeDetectionStrategy, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { LeadService } from './lead.service';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isGrounded?: boolean;
  citations?: { title: string; uri: string }[];
}

@Component({
  selector: 'app-ai-copilot-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <!-- Backdrop Overlay -->
    @if (isOpen()) {
      <div 
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        (click)="closeDrawer()"
        role="button"
        tabindex="0"
        (keydown.escape)="closeDrawer()">
      </div>
    }

    <!-- Glassmorphic AI Copilot Drawer -->
    <div 
      class="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-zinc-950/95 backdrop-blur-2xl border-l border-purple-900/30 shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] transform"
      [class.translate-x-0]="isOpen()"
      [class.translate-x-full]="!isOpen()">
      
      <!-- Top Neon Purple Glowing Accent -->
      <div class="h-[2px] w-full bg-gradient-to-r from-purple-500 via-[#6A0DAD] to-indigo-500"></div>

      <!-- Drawer Header -->
      <div class="p-5 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-950/40">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)] animate-pulse">
            <mat-icon class="text-xl">auto_awesome</mat-icon>
          </div>
          <div>
            <h2 class="font-logo font-bold text-base text-white leading-tight">AI Sentinel Copilot</h2>
            <p class="text-[10px] font-sans text-purple-400 uppercase tracking-widest mt-0.5">Dual-Engine Intel Core</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            (click)="clearChat()" 
            class="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-400 hover:text-white transition-all text-xs flex items-center gap-1.5"
            title="Reset Chat">
            <mat-icon class="text-sm">delete_outline</mat-icon>
            <span class="hidden sm:inline">Clear</span>
          </button>
          <button 
            (click)="closeDrawer()"
            class="w-9 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer">
            <mat-icon class="text-sm">close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Active Mode Info Strip -->
      <div class="px-5 py-3.5 bg-zinc-900/35 border-b border-zinc-800/50 flex items-center justify-between text-xs">
        <span class="text-zinc-500 font-medium">Selected engine:</span>
        <div class="flex items-center gap-2">
          <button 
            (click)="searchMode.set(false)"
            class="px-2.5 py-1 rounded-md transition-all font-semibold text-[10px] uppercase tracking-wide border"
            [class.bg-purple-500/10]="!searchMode()"
            [class.text-purple-400]="!searchMode()"
            [class.border-purple-500/20]="!searchMode()"
            [class.bg-transparent]="searchMode()"
            [class.text-zinc-500]="searchMode()"
            [class.border-transparent]="searchMode()">
            Low Latency (lite)
          </button>
          <button 
            (click)="searchMode.set(true)"
            class="px-2.5 py-1 rounded-md transition-all font-semibold text-[10px] uppercase tracking-wide border flex items-center gap-1"
            [class.bg-teal-500/10]="searchMode()"
            [class.text-teal-400]="searchMode()"
            [class.border-teal-500/20]="searchMode()"
            [class.bg-transparent]="!searchMode()"
            [class.text-zinc-500]="!searchMode()"
            [class.border-transparent]="!searchMode()">
            <mat-icon class="text-[12px] h-[12px] w-[12px]">search</mat-icon>
            Search Grounded
          </button>
        </div>
      </div>

      <!-- Chat Messages Container -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-zinc-950/20">
        @for (msg of messages(); track msg.id) {
          <div class="flex flex-col gap-1" [class.items-end]="msg.sender === 'user'" [class.items-start]="msg.sender === 'assistant'">
            <span class="text-[9px] font-bold uppercase tracking-wider text-zinc-500 px-1">
              {{ msg.sender === 'user' ? 'Sales Agent' : 'Sentinel Copilot' }} 
              @if (msg.isGrounded) {
                <span class="text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded px-1 py-0.5 ml-1 text-[8px] tracking-normal uppercase">Grounded search</span>
              }
            </span>
            <div 
              class="max-w-[88%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap select-text transition-all"
              [class.bg-purple-600]="msg.sender === 'user'"
              [class.text-zinc-950]="msg.sender === 'user'"
              [class.font-semibold]="msg.sender === 'user'"
              [class.bg-zinc-900]="msg.sender === 'assistant'"
              [class.text-zinc-100]="msg.sender === 'assistant'"
              [class.border]="msg.sender === 'assistant'"
              [class.border-zinc-800]="msg.sender === 'assistant' && !msg.isGrounded"
              [class.border-teal-900/50]="msg.sender === 'assistant' && msg.isGrounded">
              {{ msg.text }}

              <!-- Grounded search Citations Display -->
              @if (msg.citations && msg.citations.length > 0) {
                <div class="mt-3.5 pt-2.5 border-t border-zinc-800/80 space-y-1.5">
                  <p class="text-[10px] font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1 select-none">
                    <mat-icon class="text-[12px]">bookmark</mat-icon>
                    Verified Sources
                  </p>
                  <div class="flex flex-wrap gap-2 pt-1">
                    @for (cite of msg.citations; track cite.uri) {
                      <a 
                        [href]="cite.uri" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class="bg-zinc-950 border border-zinc-800 hover:border-teal-500/40 px-2 py-1 rounded text-[10px] text-teal-400/90 font-medium hover:text-white transition-all flex items-center gap-1 shadow-sm shrink-0">
                        <mat-icon class="text-[11px] h-[11px] w-[11px]">launch</mat-icon>
                        {{ cite.title | slice:0:30 }}{{ cite.title.length > 30 ? '...' : '' }}
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        } @empty {
          <!-- Empty Slate with smart quick shortcuts -->
          <div class="h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <div class="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-5 text-purple-400 shadow-lg shadow-purple-500/5">
              <mat-icon class="text-2xl animate-bounce">auto_awesome</mat-icon>
            </div>
            <h3 class="text-white font-bold text-sm">How can I accelerate your sales?</h3>
            <p class="text-zinc-400 text-xs mt-2 max-w-[280px] leading-relaxed">
              Synthesize pipeline data, run grounded web intelligence on target companies, or draft outbound proposals instantly.
            </p>

            <!-- Quick Action Shortcut Buttons -->
            <div class="mt-8 w-full space-y-2 max-w-sm">
              <p class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-left px-1">Suggested Pipelines</p>
              
              <button 
                (click)="runPipelineSummary()" 
                class="w-full text-left p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 rounded-xl transition-all flex items-center justify-between group">
                <div class="flex items-center gap-2.5 min-w-0">
                  <mat-icon class="text-purple-400 text-sm">analytics</mat-icon>
                  <div class="truncate">
                    <p class="text-[11px] font-bold text-zinc-200">Summarize Active CRM Pipeline</p>
                    <p class="text-[9px] text-zinc-500 truncate">Synthesize values, stages, and top opportunities</p>
                  </div>
                </div>
                <mat-icon class="text-zinc-600 group-hover:text-purple-400 text-sm group-hover:translate-x-1 transition-all">chevron_right</mat-icon>
              </button>

              <button 
                (click)="triggerGroundedSearchPrompt()" 
                class="w-full text-left p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 rounded-xl transition-all flex items-center justify-between group">
                <div class="flex items-center gap-2.5 min-w-0">
                  <mat-icon class="text-teal-400 text-sm">search</mat-icon>
                  <div class="truncate">
                    <p class="text-[11px] font-bold text-zinc-200">Prospect Intelligence Search</p>
                    <p class="text-[9px] text-zinc-500 truncate font-sans">Run live web-grounded research on any lead</p>
                  </div>
                </div>
                <mat-icon class="text-zinc-600 group-hover:text-teal-400 text-sm group-hover:translate-x-1 transition-all">chevron_right</mat-icon>
              </button>

              <button 
                (click)="suggestSalesStrategies()" 
                class="w-full text-left p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 rounded-xl transition-all flex items-center justify-between group">
                <div class="flex items-center gap-2.5 min-w-0">
                  <mat-icon class="text-amber-400 text-sm">insights</mat-icon>
                  <div class="truncate">
                    <p class="text-[11px] font-bold text-zinc-200">Suggest 3 Win Strategies</p>
                    <p class="text-[9px] text-zinc-500 truncate">Immediate low-latency conversion tips</p>
                  </div>
                </div>
                <mat-icon class="text-zinc-600 group-hover:text-amber-400 text-sm group-hover:translate-x-1 transition-all">chevron_right</mat-icon>
              </button>
            </div>
          </div>
        }

        <!-- Streaming/Typing indicator -->
        @if (isGenerating()) {
          <div class="flex flex-col gap-1 items-start">
            <span class="text-[9px] font-bold uppercase tracking-wider text-zinc-500 px-1">Sentinel Copilot</span>
            <div class="bg-zinc-900 border border-zinc-850 rounded-2xl p-4 flex items-center gap-2">
              <span class="flex h-2 w-2 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span class="text-xs text-zinc-400 italic">Thinking and synthesizing core response...</span>
            </div>
          </div>
        }
      </div>

      <!-- Footer Input Area -->
      <div class="p-4 border-t border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <form (ngSubmit)="sendMessage()" class="flex items-center gap-2 relative">
          <input 
            type="text" 
            [(ngModel)]="userInput" 
            [ngModelOptions]="{standalone: true}"
            [disabled]="isGenerating()"
            [placeholder]="searchMode() ? 'Search fresh prospect data (e.g. Stark Industries latest news)...' : 'Type a question for low-latency strategy assistance...'" 
            class="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-3 pr-10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/40 transition-all" />
          
          <button 
            type="submit" 
            [disabled]="!userInput.trim() || isGenerating()"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            [class.bg-purple-500]="!searchMode() && userInput.trim() && !isGenerating()"
            [class.text-zinc-950]="!searchMode() && userInput.trim() && !isGenerating()"
            [class.bg-teal-500]="searchMode() && userInput.trim() && !isGenerating()"
            [class.text-zinc-950]="searchMode() && userInput.trim() && !isGenerating()"
            [class.bg-zinc-800]="!userInput.trim() || isGenerating()"
            [class.text-zinc-600]="!userInput.trim() || isGenerating()"
            title="Dispatch prompt">
            <mat-icon class="text-sm">send</mat-icon>
          </button>
        </form>
        <p class="text-[9px] text-zinc-600 text-center mt-2 font-sans select-none">
          Powered by Gemini Dual-Engine Core &bull; Secured with ΛΞVOS Privacy standards
        </p>
      </div>

    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #3e3e42; }
  `]
})
export class AICopilotDrawerComponent {
  isOpen = input<boolean>(false);
  drawerClose = output<void>();

  leadService = inject(LeadService);

  userInput = '';
  searchMode = signal<boolean>(false); // False = low latency lite, True = Grounded search
  isGenerating = signal<boolean>(false);

  messages = signal<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Greetings Sales Agent. I am your automated Sentinel Copilot. I can run real-time grounded search intelligence on companies to find key decision makers, draft ultra-personalized outbound sequences, or run deep pipeline health diagnostics.\n\nSelect "Search Grounded" above to run live intelligence on the web, or use "Low Latency" for direct strategy drafting.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open && typeof window !== 'undefined') {
        const win = window as unknown as Record<string, unknown>;
        if (win['_aiCopilotQuery'] && typeof win['_aiCopilotQuery'] === 'string') {
          const query = win['_aiCopilotQuery'];
          delete win['_aiCopilotQuery'];
          
          // Wait briefly for drawer to transition in, then populate and trigger search mode!
          setTimeout(() => {
            this.searchMode.set(true);
            this.userInput = query;
            this.sendMessage();
          }, 100);
        }
      }
    });
  }

  closeDrawer() {
    this.drawerClose.emit();
  }

  clearChat() {
    this.messages.set([]);
    this.userInput = '';
  }

  async sendMessage() {
    if (!this.userInput.trim() || this.isGenerating()) return;

    const userText = this.userInput;
    this.userInput = '';
    this.isGenerating.set(true);

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString()
    };

    this.messages.update(msgs => [...msgs, newMsg]);

    const isSearch = this.searchMode();
    const endpoint = isSearch ? '/api/gemini/generate-search' : '/api/gemini/generate-lite';
    const systemInstruction = isSearch
      ? 'You are a highly efficient sales intelligence officer. Perform accurate search grounding on companies, competitors, and trends. Include the actual name of prospects, current industry news, and structure your insights with bullet points. Be precise and professional.'
      : 'You are an elite enterprise sales copilot. Generate creative, persuasive, direct outreach copies, negotiation playbooks, or pipeline reviews. Keep your advice highly actionable and structured.';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          systemInstruction
        })
      });

      if (!response.ok) {
        throw new Error('Gemini API communication failure.');
      }

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: 'reply-' + Date.now(),
        sender: 'assistant',
        text: data.text || 'I analyzed the prompt but returned no response data.',
        timestamp: new Date().toLocaleTimeString(),
        isGrounded: isSearch,
        citations: data.citations || []
      };

      this.messages.update(msgs => [...msgs, assistantMsg]);
    } catch (e) {
      console.error(e);
      this.messages.update(msgs => [
        ...msgs,
        {
          id: 'error-' + Date.now(),
          sender: 'assistant',
          text: 'Oops! I encountered an error communicating with the Gemini Sentinel system. Please make sure your server is online or try again.',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      this.isGenerating.set(false);
    }
  }

  // Action: Summarize CRM pipeline
  runPipelineSummary() {
    const leads = this.leadService.leads();
    const summaryPrompt = `Based on our current CRM pipeline data: ${JSON.stringify(leads)}, generate a comprehensive and highly polished executive CRM health summary. Include total pipeline value, a breakdown of stages, top 2 high-value opportunities, and concrete, next recommended actions to accelerate our closed-won deals.`;
    this.searchMode.set(false);
    this.userInput = summaryPrompt;
    this.sendMessage();
  }

  // Action: Setup grounded search trigger
  triggerGroundedSearchPrompt() {
    this.searchMode.set(true);
    this.userInput = 'Find the latest news, market shifts, and key executive contact patterns for Stark Industries to help our sales team position a custom CRM solution.';
  }

  // Action: Suggest 3 win strategies
  suggestSalesStrategies() {
    this.searchMode.set(false);
    this.userInput = 'Analyze our CRM sales operations and provide 3 immediate, high-impact conversion playbooks for qualified deals in the pipeline.';
    this.sendMessage();
  }
}
