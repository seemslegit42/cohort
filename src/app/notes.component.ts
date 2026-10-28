import { 
  Component, 
  ChangeDetectionStrategy, 
  signal, 
  computed, 
  inject, 
  OnInit 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Appwrite } from './appwrite';
import { LeadService } from './lead.service';
import { RichTextEditorComponent } from './rich-text-editor.component';

export interface NoteItem {
  $id: string;
  title: string;
  content: string;
  category?: 'Strategy' | 'Meeting' | 'Architecture' | 'Playbook' | 'Proposal' | 'General' | string;
  date?: string;
  color?: string;
  tags?: string[];
  pinned?: boolean;
  linkedEntityName?: string;
  linkedEntityType?: 'lead' | 'contact' | 'deal' | string;
  linkedEntityId?: string;
  wordCount?: number;
  readTimeMinutes?: number;
  updatedAt?: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
}

@Component({
  selector: 'app-notes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule, ReactiveFormsModule, RichTextEditorComponent],
  template: `
    <div class="max-w-[1600px] mx-auto animate-fade-in px-2 md:px-0 h-full flex flex-col pb-12 relative">
      
      <!-- Header Section -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-2 mb-6">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <mat-icon class="text-amber-400 text-[24px]">description</mat-icon>
            </div>
            <div>
              <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Knowledge Base & Executive Notes
              </h1>
              <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Centralized knowledge repository with AI copilot summaries, RAG search, and Markdown formatting.
              </p>
            </div>
          </div>
        </div>

        <!-- Header Actions -->
        <div class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button 
            type="button"
            (click)="showRagDrawer.set(!showRagDrawer())"
            [class]="showRagDrawer() ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-zinc-900 hover:bg-zinc-800 text-amber-400 border-zinc-800'"
            class="px-3.5 py-2 border rounded-xl transition-all text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer active:scale-95">
            <mat-icon class="text-[16px] text-amber-400">psychology</mat-icon>
            <span>Ask KB AI Assistant</span>
          </button>

          <button 
            type="button"
            (click)="openCreateModal()" 
            class="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 font-bold rounded-xl transition-all text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95">
            <mat-icon class="text-[18px]">add_notes</mat-icon>
            <span>New Knowledge Note</span>
          </button>
        </div>
      </header>

      <!-- KPI Knowledge Summary HUD Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Knowledge Entries</span>
            <span class="text-xl font-bold font-mono text-white mt-1 block">{{ totalNotesCount() }}</span>
          </div>
          <div class="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <mat-icon class="text-[18px]">library_books</mat-icon>
          </div>
        </div>

        <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Pinned Entries</span>
            <span class="text-xl font-bold font-mono text-amber-400 mt-1 block">{{ pinnedNotesCount() }}</span>
          </div>
          <div class="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <mat-icon class="text-[18px]">push_pin</mat-icon>
          </div>
        </div>

        <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Categories / Tags</span>
            <span class="text-xl font-bold font-mono text-teal-400 mt-1 block">{{ allTags().length }}</span>
          </div>
          <div class="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <mat-icon class="text-[18px]">label</mat-icon>
          </div>
        </div>

        <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Documented Words</span>
            <span class="text-xl font-bold font-mono text-purple-400 mt-1 block">{{ totalWordsCount() }}</span>
          </div>
          <div class="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <mat-icon class="text-[18px]">text_fields</mat-icon>
          </div>
        </div>
      </div>

      <!-- AI Knowledge Assistant Drawer (RAG Search) -->
      @if (showRagDrawer()) {
        <div class="bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-5 mb-6 relative overflow-hidden shadow-2xl animate-fade-in">
          <div class="absolute -right-16 -top-16 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full pointer-events-none"></div>
          
          <div class="flex items-center justify-between mb-3 border-b border-zinc-800 pb-3">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <mat-icon class="text-[16px] animate-pulse">auto_awesome</mat-icon>
              </div>
              <h3 class="text-sm font-bold text-white font-display">Ask Knowledge Base AI Copilot</h3>
            </div>
            <button (click)="showRagDrawer.set(false)" class="text-zinc-500 hover:text-white transition-colors">
              <mat-icon class="text-[18px]">close</mat-icon>
            </button>
          </div>

          <p class="text-xs text-zinc-400 mb-4 leading-relaxed">
            Interrogate your entire Knowledge Base repository in natural language. Gemini will analyze all stored entries and provide grounded strategic answers with entry citations.
          </p>

          <div class="flex items-center gap-2 mb-4">
            <div class="relative flex-1">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</mat-icon>
              <input 
                type="text" 
                [(ngModel)]="ragQuery" 
                (keyup.enter)="askKnowledgeBase()" 
                placeholder="Ask e.g.: 'What is our renewal strategy for Salesforce?' or 'Summarize key SLA constraints'"
                class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50" />
            </div>
            <button 
              type="button" 
              (click)="askKnowledgeBase()" 
              [disabled]="isRagSearching() || !ragQuery.trim()" 
              class="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-amber-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer">
              @if (isRagSearching()) {
                <mat-icon class="text-[16px] animate-spin">autorenew</mat-icon>
                <span>Searching KB...</span>
              } @else {
                <mat-icon class="text-[16px]">sparkles</mat-icon>
                <span>Ask AI</span>
              }
            </button>
          </div>

          @if (ragAnswer()) {
            <div class="bg-zinc-950/80 border border-amber-500/20 rounded-xl p-4 space-y-2 text-xs text-zinc-200 animate-fade-in font-sans leading-relaxed">
              <div class="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-800/80 pb-1.5">
                <mat-icon class="text-[14px]">psychology</mat-icon>
                Grounded Knowledge Response
              </div>
              <div class="whitespace-pre-wrap font-sans text-zinc-200 leading-relaxed">{{ ragAnswer() }}</div>
            </div>
          }
        </div>
      }

      <!-- Filter Controls Toolbar -->
      <div class="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center shadow-lg relative z-20">
        
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <mat-icon class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</mat-icon>
          <input 
            type="text" 
            [value]="searchTerm()" 
            (input)="updateSearch($event)" 
            placeholder="Search notes, topics, keywords or tags..." 
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors shadow-inner" />
          @if (searchTerm()) {
            <button (click)="searchTerm.set('')" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <mat-icon class="text-sm">close</mat-icon>
            </button>
          }
        </div>

        <!-- Filter & View Controls -->
        <div class="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          
          <!-- Category Filter -->
          <div class="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1">
            <span class="text-[10px] font-bold uppercase text-zinc-500 mr-1.5">Category:</span>
            <select 
              [value]="selectedCategory()" 
              (change)="selectedCategory.set($any($event.target).value)" 
              class="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer">
              <option value="All" class="bg-zinc-950 text-white">All Categories</option>
              <option value="Strategy" class="bg-zinc-950 text-amber-400 font-bold">Executive Strategy</option>
              <option value="Meeting" class="bg-zinc-950 text-teal-400 font-bold">Meeting Minutes</option>
              <option value="Architecture" class="bg-zinc-950 text-purple-400 font-bold">Technical Specs</option>
              <option value="Playbook" class="bg-zinc-950 text-blue-400 font-bold">Process Playbooks</option>
              <option value="Proposal" class="bg-zinc-950 text-emerald-400 font-bold">Proposals</option>
            </select>
          </div>

          <!-- Tag Pills -->
          @if (allTags().length > 0) {
            <div class="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-xs custom-scrollbar py-0.5">
              <button 
                type="button"
                (click)="selectedTag.set(null)" 
                [class]="selectedTag() === null ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'"
                class="px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer shrink-0">
                All Tags
              </button>
              @for (tag of allTags(); track tag) {
                <button 
                  type="button"
                  (click)="selectedTag.set(selectedTag() === tag ? null : tag)" 
                  [class]="selectedTag() === tag ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'"
                  class="px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer shrink-0 flex items-center gap-1">
                  #{{ tag }}
                </button>
              }
            </div>
          }

          <!-- View Mode Toggle (Masonry Grid vs Table List) -->
          <div class="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1">
            <button 
              type="button"
              (click)="viewMode.set('grid')"
              [class]="viewMode() === 'grid' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-500 hover:text-white'"
              class="p-1 rounded-lg transition-colors cursor-pointer"
              title="Masonry Cards View">
              <mat-icon class="text-sm">grid_view</mat-icon>
            </button>
            <button 
              type="button"
              (click)="viewMode.set('list')"
              [class]="viewMode() === 'list' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-500 hover:text-white'"
              class="p-1 rounded-lg transition-colors cursor-pointer"
              title="List View">
              <mat-icon class="text-sm">table_rows</mat-icon>
            </button>
          </div>

        </div>
      </div>

      <!-- Main Knowledge Display Area -->
      @if (viewMode() === 'grid') {
        <!-- Masonry Cards View -->
        <div class="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
          @for (note of filteredNotes(); track note.$id) {
            <div class="break-inside-avoid bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-800/80 p-5 hover:border-zinc-700 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col justify-between"
                 [ngClass]="getCategoryBorderClass(note)">
              
              <!-- Pinned Badge Indicator -->
              @if (note.pinned) {
                <div class="absolute top-3 right-3 text-amber-400" title="Pinned to Top">
                  <mat-icon class="text-[16px]">push_pin</mat-icon>
                </div>
              }

              <div>
                <!-- Meta Header -->
                <div class="flex items-center justify-between gap-2 mb-3">
                  <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-950 border border-zinc-800 text-zinc-300">
                      {{ note.category || 'General' }}
                    </span>
                    <span class="text-[10px] text-zinc-500 font-mono">{{ note.date || 'Recent' }}</span>
                  </div>

                  <!-- Quick Action Menu -->
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pr-5">
                    <button (click)="togglePin(note)" [title]="note.pinned ? 'Unpin note' : 'Pin note to top'" class="text-zinc-500 hover:text-amber-400 p-1 rounded hover:bg-zinc-800 transition-colors">
                      <mat-icon class="text-[15px]">{{ note.pinned ? 'keep_off' : 'push_pin' }}</mat-icon>
                    </button>
                    <button (click)="summarizeNoteWithAI(note)" title="AI Summarize Note" class="text-zinc-500 hover:text-amber-400 p-1 rounded hover:bg-zinc-800 transition-colors">
                      <mat-icon class="text-[15px]">auto_awesome</mat-icon>
                    </button>
                    <button (click)="copyNote(note)" title="Copy text" class="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors">
                      <mat-icon class="text-[15px]">content_copy</mat-icon>
                    </button>
                    <button (click)="openEditModal(note)" title="Edit note" class="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors">
                      <mat-icon class="text-[15px]">edit</mat-icon>
                    </button>
                    <button (click)="deleteNote(note.$id)" title="Delete note" class="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-zinc-800 transition-colors">
                      <mat-icon class="text-[15px]">delete</mat-icon>
                    </button>
                  </div>
                </div>

                <!-- Title & Body -->
                <h3 class="text-base font-bold text-white mb-2 leading-snug font-display flex items-center gap-2">
                  <span>{{ note.title }}</span>
                </h3>

                <!-- Linked CRM Entity Badge if attached -->
                @if (note.linkedEntityName) {
                  <div class="mb-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-semibold">
                    <mat-icon class="text-[12px]">link</mat-icon>
                    <span>Linked: {{ note.linkedEntityName }}</span>
                  </div>
                }

                <div class="text-xs text-zinc-300 leading-relaxed font-sans mb-3 font-normal space-y-1 overflow-hidden max-h-48" [innerHTML]="renderFormattedContent(note.content)"></div>
              </div>

              <!-- Footer Stats & Tags -->
              <div>
                @if (note.tags && note.tags.length > 0) {
                  <div class="pt-3 border-t border-zinc-800/80 flex flex-wrap gap-1.5">
                    @for (tag of note.tags; track tag) {
                      <button (click)="selectedTag.set(tag)" class="px-2 py-0.5 bg-zinc-950 text-zinc-400 border border-zinc-800 rounded-md text-[10px] font-bold uppercase tracking-wider hover:text-amber-400 hover:border-amber-500/30 cursor-pointer transition-colors">
                        #{{ tag }}
                      </button>
                    }
                  </div>
                }

                <div class="mt-3 pt-2 border-t border-zinc-800/40 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>{{ getWordCount(note.content) }} words</span>
                  <span>{{ getReadTime(note.content) }} min read</span>
                </div>
              </div>

            </div>
          } @empty {
            <div class="col-span-full py-16 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
              <mat-icon class="text-zinc-600 text-4xl mb-2">menu_book</mat-icon>
              <p class="text-zinc-300 font-bold text-sm">No knowledge entries matching your filters</p>
              <p class="text-zinc-500 text-xs mt-1">Try clearing filters or click 'New Knowledge Note' above.</p>
            </div>
          }
        </div>
      } @else {
        <!-- List / Table View -->
        <div class="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-zinc-950 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800 text-[10px]">
              <tr>
                <th class="py-3 px-4">Title & Excerpt</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Linked Entity</th>
                <th class="py-3 px-4">Tags</th>
                <th class="py-3 px-4">Date</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60 text-zinc-200">
              @for (note of filteredNotes(); track note.$id) {
                <tr class="hover:bg-zinc-800/40 transition-colors group">
                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-2">
                      @if (note.pinned) {
                        <mat-icon class="text-amber-400 text-sm">push_pin</mat-icon>
                      }
                      <div>
                        <p class="font-bold text-white text-sm">{{ note.title }}</p>
                        <p class="text-zinc-400 text-xs truncate max-w-md font-sans">{{ stripFormatting(note.content) }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-950 border border-zinc-800 text-zinc-300">
                      {{ note.category || 'General' }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4">
                    @if (note.linkedEntityName) {
                      <span class="text-teal-400 font-medium text-xs">{{ note.linkedEntityName }}</span>
                    } @else {
                      <span class="text-zinc-600 italic">—</span>
                    }
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-1 flex-wrap">
                      @for (tag of note.tags || []; track tag) {
                        <span class="text-[10px] bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400 font-mono">#{{ tag }}</span>
                      }
                    </div>
                  </td>
                  <td class="py-3.5 px-4 text-zinc-400 font-mono text-xs">
                    {{ note.date || 'Recent' }}
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button (click)="summarizeNoteWithAI(note)" class="p-1 text-zinc-400 hover:text-amber-400 rounded hover:bg-zinc-800" title="AI Summarize">
                        <mat-icon class="text-sm">auto_awesome</mat-icon>
                      </button>
                      <button (click)="openEditModal(note)" class="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800" title="Edit">
                        <mat-icon class="text-sm">edit</mat-icon>
                      </button>
                      <button (click)="deleteNote(note.$id)" class="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-zinc-800" title="Delete">
                        <mat-icon class="text-sm">delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-12 text-center text-zinc-500 text-sm">
                    No matching knowledge entries found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Create / Edit Note Split-Screen Modal -->
      @if (isModalOpen()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6" (click)="closeModal()" (keydown.escape)="closeModal()" tabindex="0" role="dialog" aria-modal="true">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 w-full max-w-4xl shadow-2xl animate-fade-in max-h-[92vh] flex flex-col relative overflow-hidden" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
            
            <!-- Modal Header -->
            <div class="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3 shrink-0">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <mat-icon class="text-[18px]">edit_document</mat-icon>
                </div>
                <div>
                  <h2 class="text-base sm:text-lg font-bold text-white font-display">
                    {{ editingNote() ? 'Edit Knowledge Entry' : 'Create Knowledge Note' }}
                  </h2>
                  <p class="text-[11px] text-zinc-400">Compose strategic insights, action items, or technical specifications.</p>
                </div>
              </div>
              <button (click)="closeModal()" class="text-zinc-500 hover:text-white transition-colors">
                <mat-icon class="text-[20px]">close</mat-icon>
              </button>
            </div>

            <!-- Preset Template Selector Buttons -->
            <div class="mb-4 pb-3 border-b border-zinc-800/80 shrink-0">
              <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Load Strategic Template:</span>
              <div class="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                @for (tpl of templates; track tpl.id) {
                  <button 
                    type="button"
                    (click)="applyTemplate(tpl)"
                    class="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/30 text-zinc-300 hover:text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0">
                    <mat-icon class="text-[14px] text-amber-400">{{ tpl.icon }}</mat-icon>
                    <span>{{ tpl.name }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Editor & AI Assistant Action Bar -->
            <div class="flex items-center justify-between gap-2 mb-3 bg-zinc-950 p-2 border border-zinc-800 rounded-xl flex-wrap shrink-0">
              <div class="flex items-center gap-1 text-xs text-zinc-400">
                <span class="font-bold text-[10px] uppercase text-amber-400 tracking-wider mr-1">AI Copilot:</span>
                <button 
                  type="button" 
                  (click)="runAiAssist('summarize')" 
                  [disabled]="isAiWorking()"
                  class="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer">
                  <mat-icon class="text-[13px] text-amber-400">summarize</mat-icon> Summarize
                </button>
                <button 
                  type="button" 
                  (click)="runAiAssist('action_items')" 
                  [disabled]="isAiWorking()"
                  class="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer">
                  <mat-icon class="text-[13px] text-emerald-400">checklist</mat-icon> Action Items
                </button>
                <button 
                  type="button" 
                  (click)="runAiAssist('auto_tag')" 
                  [disabled]="isAiWorking()"
                  class="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer">
                  <mat-icon class="text-[13px] text-teal-400">label</mat-icon> Auto-Tag
                </button>
                <button 
                  type="button" 
                  (click)="runAiAssist('expand')" 
                  [disabled]="isAiWorking()"
                  class="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer">
                  <mat-icon class="text-[13px] text-purple-400">unfold_more</mat-icon> Expand Outline
                </button>
              </div>

              @if (isAiWorking()) {
                <div class="flex items-center gap-1.5 text-xs text-amber-400 font-semibold animate-pulse">
                  <mat-icon class="text-sm animate-spin">autorenew</mat-icon>
                  <span>AI Generating...</span>
                </div>
              }
            </div>

            <!-- Form Content -->
            <div class="space-y-3.5 overflow-y-auto custom-scrollbar flex-1 pr-1">
              
              <!-- Title & Category Row -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="sm:col-span-2 space-y-1">
                  <label for="note-title" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Entry Title *</label>
                  <input 
                    id="note-title" 
                    type="text" 
                    [(ngModel)]="formTitle" 
                    placeholder="E.g., Salesforce Q3 Architecture & SLA Expansion" 
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50" />
                </div>

                <div class="space-y-1">
                  <label for="note-category" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Category</label>
                  <select 
                    id="note-category" 
                    [(ngModel)]="formCategory" 
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50 cursor-pointer">
                    <option value="Strategy">Executive Strategy</option>
                    <option value="Meeting">Meeting Minutes</option>
                    <option value="Architecture">Technical Specs</option>
                    <option value="Playbook">Process Playbook</option>
                    <option value="Proposal">Client Proposal</option>
                    <option value="General">General Notes</option>
                  </select>
                </div>
              </div>

              <!-- Lightweight Rich Text Editor -->
              <div class="space-y-1">
                <span class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Note Body & Rich Formatting *
                </span>
                <app-rich-text-editor
                  [content]="formContent"
                  (contentChange)="formContent = $event"
                  placeholder="Record strategic insights, meeting minutes, decision logs, or checkable tasks..."
                  minHeight="280px">
                </app-rich-text-editor>
              </div>

              <!-- Tags and Linked Entity Row -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label for="note-tags" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tags (comma-separated)</label>
                  <input 
                    id="note-tags" 
                    type="text" 
                    [(ngModel)]="formTags" 
                    placeholder="Strategy, SLA, Security, Q3" 
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50" />
                </div>

                <div class="space-y-1">
                  <label for="note-link" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Link to CRM Account / Contact</label>
                  <select 
                    id="note-link" 
                    [(ngModel)]="formLinkedEntity" 
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50 cursor-pointer">
                    <option value="">Unlinked (Standalone Note)</option>
                    @for (lead of leadService.leads(); track lead.$id) {
                      <option [value]="lead.name">{{ lead.name }} ({{ lead.company || 'Lead' }})</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Accent Color & Pin Row -->
              <div class="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Accent:</span>
                  <div class="flex items-center gap-1.5">
                    @for (c of colorOptions; track c.value) {
                      <button 
                        type="button"
                        (click)="selectedColor.set(c.value)" 
                        [class]="selectedColor() === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : 'opacity-60 hover:opacity-100'"
                        [style.background-color]="c.hex"
                        class="w-5 h-5 rounded-full transition-all cursor-pointer">
                      </button>
                    }
                  </div>
                </div>

                <label class="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="formPinned" class="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-500/50 accent-amber-500" />
                  <span>Pin to Top of Knowledge Base</span>
                </label>
              </div>

            </div>

            <!-- Modal Footer -->
            <div class="mt-4 flex justify-end gap-3 border-t border-zinc-800 pt-3 shrink-0">
              <button (click)="closeModal()" class="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer">Cancel</button>
              <button (click)="submitSaveNote()" [disabled]="!formTitle.trim() || !formContent.trim()" class="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 text-zinc-950 font-bold rounded-xl transition-all text-xs shadow-lg shadow-orange-500/20 cursor-pointer">
                {{ editingNote() ? 'Save Changes' : 'Create Knowledge Note' }}
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(24,24,27,0.5); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(82,82,91,0.5); border-radius: 4px; }
  `]
})
export class NotesComponent implements OnInit {
  appwrite = inject(Appwrite);
  leadService = inject(LeadService);
  private http = inject(HttpClient);

  viewMode = signal<'grid' | 'list'>('grid');
  isModalOpen = signal(false);
  editingNote = signal<NoteItem | null>(null);
  
  searchTerm = signal('');
  selectedTag = signal<string | null>(null);
  selectedCategory = signal<string>('All');

  // AI RAG State
  showRagDrawer = signal(false);
  ragQuery = '';
  ragAnswer = signal('');
  isRagSearching = signal(false);

  // Form State
  formTitle = '';
  formContent = '';
  formCategory = 'Strategy';
  formTags = '';
  formLinkedEntity = '';
  formPinned = false;
  isAiWorking = signal(false);

  colorOptions = [
    { value: 'border-t-amber-500 text-amber-500', hex: '#f59e0b' },
    { value: 'border-t-teal-500 text-teal-500', hex: '#14b8a6' },
    { value: 'border-t-purple-500 text-purple-500', hex: '#a855f7' },
    { value: 'border-t-rose-500 text-rose-500', hex: '#f43f5e' },
    { value: 'border-t-blue-500 text-blue-500', hex: '#3b82f6' }
  ];

  selectedColor = signal('border-t-amber-500 text-amber-500');

  // Pre-configured Strategic Templates
  templates: NoteTemplate[] = [
    {
      id: 'meeting',
      name: 'Meeting Minutes',
      icon: 'groups',
      category: 'Meeting',
      title: 'Executive Sync Minutes & Action Items',
      content: `### Executive Meeting Takeaways\n- **Date**: ${new Date().toLocaleDateString()}\n- **Attendees**: Sarah Jenkins (CTO), Mike Ross (VP Sales)\n\n### Discussion Highlights\n1. Reviewed Q3 SLA targets and multi-tenant security architecture.\n2. Confirmed 99.99% uptime commitment for enterprise accounts.\n\n### Action Items\n- [ ] Issue revised contract addendum to legal counsel\n- [ ] Finalize benchmark performance telemetry report`,
      tags: ['Meeting', 'SLA', 'Executive']
    },
    {
      id: 'playbook',
      name: 'Discovery Playbook',
      icon: 'auto_stories',
      category: 'Playbook',
      title: 'Enterprise Account Discovery Framework',
      content: `### Qualification Questions\n1. What is the single metric that will determine your team's bonus or promotion this year?\n2. What happens if this problem is not solved in the next 90 days?\n\n### Red Flags & Risks\n- Lack of executive budget sponsor\n- Unclear security compliance deadline`,
      tags: ['Playbook', 'Discovery', 'Sales']
    },
    {
      id: 'architecture',
      name: 'Architecture Spec',
      icon: 'dns',
      category: 'Architecture',
      title: 'Multi-Tenant Database & Security Spec',
      content: `### Technical Overview\n- **Isolation Pattern**: Database-per-tenant with LibSQL / SQLite SQLite Edge Replication\n- **Auth Protocol**: JWT bearer token passed to Express SSR backend\n- **Encryption**: AES-256 data at rest with HttpOnly cookie session management`,
      tags: ['Architecture', 'Security', 'Database']
    }
  ];

  // Computed HUD Metrics
  totalNotesCount = computed(() => this.appwrite.notes().length);
  pinnedNotesCount = computed(() => this.appwrite.notes().filter(n => n.pinned).length);
  
  totalWordsCount = computed(() => {
    return this.appwrite.notes().reduce((acc, n) => acc + this.getWordCount(n.content), 0);
  });

  allTags = computed(() => {
    const notes = this.appwrite.notes();
    const tagsSet = new Set<string>();
    notes.forEach(n => (n.tags || []).forEach((t: string) => tagsSet.add(t)));
    return Array.from(tagsSet);
  });

  filteredNotes = computed(() => {
    const query = this.searchTerm().toLowerCase().trim();
    const tag = this.selectedTag();
    const category = this.selectedCategory();
    let list = this.appwrite.notes();

    if (category !== 'All') {
      list = list.filter(n => n.category === category);
    }

    if (tag) {
      list = list.filter(n => (n.tags || []).includes(tag));
    }

    if (query) {
      list = list.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.content.toLowerCase().includes(query) ||
        (n.tags || []).some((t: string) => t.toLowerCase().includes(query)) ||
        (n.linkedEntityName || '').toLowerCase().includes(query)
      );
    }

    // Pinned notes float to top
    return list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  });

  ngOnInit() {
    this.leadService.loadLeads();
  }

  updateSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
  }

  getWordCount(text: string): number {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  }

  getReadTime(text: string): number {
    const words = this.getWordCount(text);
    return Math.max(1, Math.ceil(words / 200));
  }

  getCategoryBorderClass(note: NoteItem): string {
    if (note.color) return note.color;
    switch (note.category) {
      case 'Strategy': return 'border-t-amber-500 text-amber-500';
      case 'Meeting': return 'border-t-teal-500 text-teal-500';
      case 'Architecture': return 'border-t-purple-500 text-purple-500';
      case 'Playbook': return 'border-t-blue-500 text-blue-500';
      case 'Proposal': return 'border-t-emerald-500 text-emerald-500';
      default: return 'border-t-amber-500 text-amber-500';
    }
  }

  openCreateModal() {
    this.editingNote.set(null);
    this.formTitle = '';
    this.formContent = '';
    this.formCategory = 'Strategy';
    this.formTags = '';
    this.formLinkedEntity = '';
    this.formPinned = false;
    this.selectedColor.set('border-t-amber-500 text-amber-500');
    this.isModalOpen.set(true);
  }

  openEditModal(note: NoteItem) {
    this.editingNote.set(note);
    this.formTitle = note.title || '';
    this.formContent = note.content || '';
    this.formCategory = note.category || 'Strategy';
    this.formTags = (note.tags || []).join(', ');
    this.formLinkedEntity = note.linkedEntityName || '';
    this.formPinned = !!note.pinned;
    this.selectedColor.set(note.color || 'border-t-amber-500 text-amber-500');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingNote.set(null);
  }

  renderFormattedContent(content: string): string {
    if (!content) return '';
    let html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="font-bold text-amber-400 text-xs mt-1 mb-0.5">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="font-bold text-white text-sm mt-1 mb-0.5">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="font-bold text-white text-base mt-1 mb-0.5">$1</h1>');

    // Bold & Italic & Strikethrough & Highlight
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-zinc-200">$1</em>');
    html = html.replace(/~~(.*?)~~/g, '<del class="line-through text-zinc-500">$1</del>');
    html = html.replace(/==(.*?)==/g, '<mark class="bg-amber-500/30 text-amber-200 px-1 rounded">$1</mark>');

    // Checkbox Lists
    html = html.replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-1.5 my-0.5 text-zinc-300"><span class="w-3.5 h-3.5 rounded border border-zinc-600 bg-zinc-900 inline-block shrink-0"></span><span>$1</span></div>');
    html = html.replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-1.5 my-0.5 text-zinc-400 line-through"><span class="w-3.5 h-3.5 rounded border border-emerald-500 bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span><span>$1</span></div>');

    // Bullet and Numbered Lists
    html = html.replace(/^- (.*$)/gim, '<li class="list-disc ml-4 my-0.5 text-zinc-300">$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="list-decimal ml-4 my-0.5 text-zinc-300">$1</li>');

    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-2 border-amber-500 pl-2.5 py-0.5 italic text-zinc-300 my-1 bg-zinc-900/50 rounded-r">$1</blockquote>');

    // Code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-zinc-800 text-sky-300 px-1 py-0.5 rounded font-mono text-[11px]">$1</code>');

    // Newlines
    html = html.replace(/\n\n/g, '<br/><br/>');
    html = html.replace(/\n/g, '<br/>');

    return html;
  }

  stripFormatting(text: string): string {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/[*#~`=>-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  applyTemplate(tpl: NoteTemplate) {
    this.formTitle = tpl.title;
    this.formContent = tpl.content;
    this.formCategory = tpl.category;
    this.formTags = tpl.tags.join(', ');
  }

  insertFormatting(prefix: string, suffix: string) {
    this.formContent = `${this.formContent}\n${prefix}Text${suffix}`;
  }

  async runAiAssist(action: 'summarize' | 'action_items' | 'auto_tag' | 'expand') {
    if (!this.formContent.trim()) return;
    this.isAiWorking.set(true);

    this.http.post<{ result?: string; tags?: string[] }>('/api/gemini/notes/ai-assist', {
      action,
      title: this.formTitle,
      content: this.formContent
    }).subscribe({
      next: (res) => {
        this.isAiWorking.set(false);
        if (action === 'auto_tag' && res.tags) {
          const currentTags = this.formTags ? this.formTags.split(',').map(t => t.trim()) : [];
          const combined = Array.from(new Set([...currentTags, ...res.tags]));
          this.formTags = combined.join(', ');
        } else if (res.result) {
          this.formContent = `${this.formContent}\n\n---\n${res.result}`;
        }
      },
      error: () => {
        this.isAiWorking.set(false);
      }
    });
  }

  async summarizeNoteWithAI(note: NoteItem) {
    this.appwrite.addNotification({
      title: 'AI Analysis',
      message: `Analyzing entry "${note.title}"...`,
      type: 'info'
    });

    this.http.post<{ result?: string }>('/api/gemini/notes/ai-assist', {
      action: 'summarize',
      title: note.title,
      content: note.content
    }).subscribe({
      next: (res) => {
        if (res.result) {
          alert(`🤖 AI Summary for "${note.title}":\n\n${res.result}`);
        }
      }
    });
  }

  async askKnowledgeBase() {
    if (!this.ragQuery.trim()) return;
    this.isRagSearching.set(true);
    this.ragAnswer.set('');

    const notes = this.appwrite.notes();

    this.http.post<{ answer?: string }>('/api/gemini/notes/rag-ask', {
      query: this.ragQuery,
      notes
    }).subscribe({
      next: (res) => {
        this.isRagSearching.set(false);
        this.ragAnswer.set(res.answer || 'No specific answer found in knowledge entries.');
      },
      error: () => {
        this.isRagSearching.set(false);
        this.ragAnswer.set('Error querying Knowledge Base copilot.');
      }
    });
  }

  async togglePin(note: NoteItem) {
    const updatedPinned = !note.pinned;
    await this.appwrite.updateNote(note.$id, { pinned: updatedPinned });
    this.appwrite.addNotification({
      title: updatedPinned ? 'Note Pinned' : 'Note Unpinned',
      message: updatedPinned ? `Pinned "${note.title}" to top of Knowledge Base.` : `Unpinned "${note.title}".`,
      type: 'info'
    });
  }

  async submitSaveNote() {
    if (!this.formTitle.trim() || !this.formContent.trim()) return;

    const tags = this.formTags
      ? this.formTags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const noteData = {
      title: this.formTitle,
      content: this.formContent,
      category: this.formCategory,
      tags,
      pinned: this.formPinned,
      color: this.selectedColor(),
      linkedEntityName: this.formLinkedEntity || undefined,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const editing = this.editingNote();
    if (editing) {
      await this.appwrite.updateNote(editing.$id, noteData);
      this.appwrite.addNotification({
        title: 'Entry Saved',
        message: `Saved changes to "${this.formTitle}".`,
        type: 'info'
      });
    } else {
      await this.appwrite.addNote(noteData);
      this.appwrite.addNotification({
        title: 'Entry Created',
        message: `Created new Knowledge Base entry "${this.formTitle}".`,
        type: 'success'
      });
    }

    this.closeModal();
  }

  async copyNote(note: NoteItem) {
    try {
      await navigator.clipboard.writeText(`# ${note.title}\n\n${note.content}`);
      this.appwrite.addNotification({
        title: 'Copied to Clipboard',
        message: `Copied note "${note.title}" in Markdown format.`,
        type: 'info'
      });
    } catch {
      // Clipboard fallback
    }
  }

  async deleteNote(id: string) {
    if (confirm('Are you sure you wish to delete this knowledge entry?')) {
      await this.appwrite.deleteNote(id);
      this.appwrite.addNotification({
        title: 'Entry Purged',
        message: 'Knowledge entry removed from database.',
        type: 'warning'
      });
    }
  }
}
