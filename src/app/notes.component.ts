import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Appwrite } from './appwrite';

export interface NoteItem {
  $id: string;
  title: string;
  content: string;
  date?: string;
  color?: string;
  tags?: string[];
}

@Component({
  selector: 'app-notes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="max-w-[1400px] mx-auto animate-fade-in px-2 md:px-0 h-full flex flex-col pb-12 relative">
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-8">
        <div>
          <h1 class="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <mat-icon class="text-amber-400 text-[24px]">description</mat-icon>
            </div>
            Knowledge Base & Notes
          </h1>
          <p class="text-sm text-zinc-400 mt-2">
            Capture executive summaries, meeting takeaways, and unstructured strategic insights.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</mat-icon>
            <input 
              type="text" 
              [value]="searchTerm()" 
              (input)="updateSearch($event)" 
              placeholder="Search notes or tags..." 
              class="w-48 sm:w-64 bg-zinc-900/60 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors font-medium" />
          </div>
          <button (click)="openCreateModal()" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 shrink-0">
            <mat-icon class="text-[18px]">edit_document</mat-icon>
            New Note
          </button>
        </div>
      </header>

      <!-- Tag Filter Pills -->
      @if (allTags().length > 0) {
        <div class="flex items-center gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
          <span class="text-xs font-bold text-zinc-500 uppercase tracking-widest mr-1">Filter Tag:</span>
          <button 
            (click)="selectedTag.set(null)" 
            [class]="selectedTag() === null ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'"
            class="px-3 py-1 rounded-lg border text-xs transition-all">
            All
          </button>
          @for (tag of allTags(); track tag) {
            <button 
              (click)="selectedTag.set(selectedTag() === tag ? null : tag)" 
              [class]="selectedTag() === tag ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'"
              class="px-3 py-1 rounded-lg border text-xs transition-all flex items-center gap-1">
              #{{ tag }}
            </button>
          }
        </div>
      }

      <!-- Notes Grid -->
      <div class="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        @for (note of filteredNotes(); track note.$id) {
          <div class="break-inside-avoid bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800/80 p-5 hover:border-zinc-700 hover:shadow-xl transition-all group relative overflow-hidden" [ngClass]="note.color || 'border-t-zinc-500 text-zinc-500'">
            <div class="absolute top-0 left-0 right-0 h-1 opacity-60 bg-gradient-to-r from-transparent via-current to-transparent"></div>
            
            <div class="flex justify-between items-start mb-3">
              <span class="text-[11px] font-semibold text-zinc-500 font-mono">{{ note.date }}</span>
              <div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                <button (click)="copyNote(note)" title="Copy note text" class="text-zinc-500 hover:text-amber-400 p-1 rounded hover:bg-zinc-800 transition-colors">
                  <mat-icon class="text-[16px]">content_copy</mat-icon>
                </button>
                <button (click)="openEditModal(note)" title="Edit note" class="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors">
                  <mat-icon class="text-[16px]">edit</mat-icon>
                </button>
                <button (click)="deleteNote(note.$id)" title="Delete note" class="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-zinc-800 transition-colors">
                  <mat-icon class="text-[16px]">delete</mat-icon>
                </button>
              </div>
            </div>
            
            <h3 class="text-base font-bold text-zinc-100 mb-2 leading-snug font-display">{{ note.title }}</h3>
            <p class="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">{{ note.content }}</p>
            
            @if (note.tags && note.tags.length > 0) {
              <div class="mt-4 pt-3 border-t border-zinc-800/60 flex flex-wrap gap-1.5">
                @for (tag of note.tags; track tag) {
                  <button (click)="selectedTag.set(tag)" class="px-2 py-0.5 bg-zinc-950/80 text-zinc-400 border border-zinc-800 rounded-md text-[10px] font-bold uppercase tracking-wider hover:text-amber-400 hover:border-amber-500/30 cursor-pointer transition-colors">
                    #{{ tag }}
                  </button>
                }
              </div>
            }
          </div>
        } @empty {
          <div class="col-span-full py-16 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
            <mat-icon class="text-zinc-600 text-4xl mb-2">description</mat-icon>
            <p class="text-zinc-400 font-bold text-sm">No notes matching your search criteria</p>
            <p class="text-zinc-600 text-xs mt-1">Try clearing filters or add a new knowledge note above.</p>
          </div>
        }
      </div>

      <!-- Add/Edit Modal -->
      @if (isModalOpen()) {
        <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" (click)="closeModal()" (keydown.escape)="closeModal()" tabindex="0" role="dialog" aria-modal="true">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
            <div class="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
              <h2 class="text-lg font-bold text-white font-display">{{ editingNote() ? 'Edit Note' : 'Create Knowledge Note' }}</h2>
              <button (click)="closeModal()" class="text-zinc-500 hover:text-zinc-300">
                <mat-icon class="text-[20px]">close</mat-icon>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label for="note-title-input" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Title *</label>
                <input id="note-title-input" type="text" #titleInput [value]="editingNote()?.title || ''" placeholder="e.g. Q3 Strategic Retrospective & SLA Roadmap" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50">
              </div>

              <div>
                <label for="note-content-input" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Note Body *</label>
                <textarea id="note-content-input" #contentInput rows="6" placeholder="Record key takeaways, decision frameworks, or meeting action items..." class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 custom-scrollbar resize-none">{{ editingNote()?.content || '' }}</textarea>
              </div>

              <div>
                <label for="note-tags-input" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Tags (comma-separated)</label>
                <input id="note-tags-input" type="text" #tagsInput [value]="(editingNote()?.tags || []).join(', ')" placeholder="e.g. Executive, Product, Roadmap" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50">
              </div>

              <div>
                <span class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Accent Color</span>
                <div class="flex items-center gap-2">
                  @for (c of colorOptions; track c.value) {
                    <button 
                      type="button"
                      (click)="selectedColor.set(c.value)" 
                      [class]="selectedColor() === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : 'opacity-60 hover:opacity-100'"
                      [style.background-color]="c.hex"
                      class="w-6 h-6 rounded-full transition-all">
                    </button>
                  }
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3 border-t border-zinc-800/80 pt-4">
              <button (click)="closeModal()" class="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">Cancel</button>
              <button (click)="saveNote(titleInput.value, contentInput.value, tagsInput.value)" class="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold rounded-xl transition-all text-xs shadow-lg shadow-orange-500/20">
                {{ editingNote() ? 'Save Changes' : 'Create Note' }}
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .border-t-rose-500 { border-top-color: rgba(244, 63, 94, 0.7) !important; text-decoration-color: #f43f5e; }
    .border-t-amber-500 { border-top-color: rgba(245, 158, 11, 0.7) !important; text-decoration-color: #f59e0b; }
    .border-t-teal-500 { border-top-color: rgba(20, 184, 166, 0.7) !important; text-decoration-color: #14b8a6; }
    .border-t-purple-500 { border-top-color: rgba(168, 85, 247, 0.7) !important; text-decoration-color: #a855f7; }
    .border-t-blue-500 { border-top-color: rgba(59, 130, 246, 0.7) !important; text-decoration-color: #3b82f6; }
    .border-t-zinc-500 { border-top-color: rgba(113, 113, 122, 0.7) !important; text-decoration-color: #71717a; }
    
    .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(24,24,27,0.5); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(82,82,91,0.5); border-radius: 4px; }
  `]
})
export class NotesComponent {
  appwrite = inject(Appwrite);
  
  isModalOpen = signal(false);
  editingNote = signal<NoteItem | null>(null);
  searchTerm = signal('');
  selectedTag = signal<string | null>(null);

  colorOptions = [
    { value: 'border-t-amber-500 text-amber-500', hex: '#f59e0b' },
    { value: 'border-t-teal-500 text-teal-500', hex: '#14b8a6' },
    { value: 'border-t-purple-500 text-purple-500', hex: '#a855f7' },
    { value: 'border-t-rose-500 text-rose-500', hex: '#f43f5e' },
    { value: 'border-t-blue-500 text-blue-500', hex: '#3b82f6' }
  ];

  selectedColor = signal('border-t-amber-500 text-amber-500');

  allTags = computed(() => {
    const notes = this.appwrite.notes();
    const tagsSet = new Set<string>();
    notes.forEach(n => (n.tags || []).forEach((t: string) => tagsSet.add(t)));
    return Array.from(tagsSet);
  });

  filteredNotes = computed(() => {
    const query = this.searchTerm().toLowerCase().trim();
    const tag = this.selectedTag();
    let list = this.appwrite.notes();

    if (tag) {
      list = list.filter(n => (n.tags || []).includes(tag));
    }

    if (query) {
      list = list.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.content.toLowerCase().includes(query) ||
        (n.tags || []).some((t: string) => t.toLowerCase().includes(query))
      );
    }

    return list;
  });

  updateSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
  }

  openCreateModal() {
    this.editingNote.set(null);
    this.selectedColor.set('border-t-amber-500 text-amber-500');
    this.isModalOpen.set(true);
  }

  openEditModal(note: NoteItem) {
    this.editingNote.set(note);
    this.selectedColor.set(note.color || 'border-t-amber-500 text-amber-500');
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingNote.set(null);
  }

  async saveNote(title: string, content: string, tagsRaw: string) {
    if (!title.trim() || !content.trim()) return;
    
    const tags = tagsRaw
      ? tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

    const note = this.editingNote();
    if (note) {
      await this.appwrite.updateNote(note.$id, { 
        title, 
        content, 
        tags, 
        color: this.selectedColor() 
      });
      this.appwrite.addNotification({
        title: 'Note Updated',
        message: `Saved changes to "${title}".`,
        type: 'info'
      });
    } else {
      await this.appwrite.addNote({ 
        title, 
        content, 
        color: this.selectedColor(), 
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 
        tags 
      });
      this.appwrite.addNotification({
        title: 'Note Created',
        message: `Successfully created knowledge entry "${title}".`,
        type: 'success'
      });
    }
    this.closeModal();
  }

  async copyNote(note: NoteItem) {
    try {
      await navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
      this.appwrite.addNotification({
        title: 'Copied to Clipboard',
        message: `Copied note "${note.title}" text.`,
        type: 'info'
      });
    } catch {
      // Fallback
    }
  }

  async deleteNote(id: string) {
    if (confirm('Are you sure you want to delete this note?')) {
      await this.appwrite.deleteNote(id);
      this.appwrite.addNotification({
        title: 'Note Removed',
        message: 'Knowledge note was removed.',
        type: 'warning'
      });
    }
  }
}
