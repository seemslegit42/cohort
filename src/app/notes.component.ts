import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
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
            Knowledge Base
          </h1>
          <p class="text-sm text-zinc-400 mt-2">
            Capture executive summaries, meeting takeaways, and unstructured insights.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative hidden sm:block">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</mat-icon>
            <input type="text" placeholder="Search notes..." class="w-64 bg-zinc-900/60 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors" />
          </div>
          <button (click)="openCreateModal()" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20">
            <mat-icon class="text-[18px]">edit_document</mat-icon>
            New Note
          </button>
        </div>
      </header>

      <div class="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        @for (note of appwrite.notes(); track note.$id) {
          <div class="break-inside-avoid bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-800/80 p-5 hover:border-zinc-700 hover:shadow-xl transition-all group relative overflow-hidden" [ngClass]="note.color || 'border-t-zinc-500 text-zinc-500'">
            <div class="absolute top-0 left-0 right-0 h-1 opacity-50 bg-gradient-to-r from-transparent via-current to-transparent"></div>
            
            <div class="flex justify-between items-start mb-3">
              <span class="text-xs font-semibold text-zinc-500">{{ note.date }}</span>
              <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button (click)="openEditModal(note)" class="text-zinc-600 hover:text-white"><mat-icon class="text-[16px]">edit</mat-icon></button>
                <button (click)="deleteNote(note.$id)" class="text-zinc-600 hover:text-rose-400"><mat-icon class="text-[16px]">delete</mat-icon></button>
              </div>
            </div>
            
            <h3 class="text-lg font-bold text-zinc-100 mb-2 leading-snug">{{ note.title }}</h3>
            <p class="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{{ note.content }}</p>
            
            <div class="mt-5 flex flex-wrap gap-2">
              @for (tag of note.tags || []; track tag) {
                <span class="px-2 py-1 bg-zinc-950/80 text-zinc-300 border border-zinc-800/80 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  {{ tag }}
                </span>
              }
            </div>
          </div>
        }
      </div>

      <!-- Add/Edit Modal -->
      @if (isModalOpen()) {
        <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
            <h2 class="text-xl font-bold text-white mb-4">{{ editingNote() ? 'Edit Note' : 'New Note' }}</h2>
            <div class="space-y-4">
              <div>
                <label for="note-title-input" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Title</label>
                <input id="note-title-input" type="text" #titleInput [value]="editingNote()?.title || ''" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
              </div>
              <div>
                <label for="note-content-input" class="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Content</label>
                <textarea id="note-content-input" #contentInput rows="6" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 custom-scrollbar">{{ editingNote()?.content || '' }}</textarea>
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
              <button (click)="closeModal()" class="px-4 py-2 rounded-lg font-bold text-zinc-400 hover:text-white transition-colors text-sm">Cancel</button>
              <button (click)="saveNote(titleInput.value, contentInput.value)" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-lg transition-colors text-sm">
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
    /* Dynamic colored lines at top of cards via class */
    .border-t-rose-500 { border-top-color: rgba(244, 63, 94, 0.5) !important; text-decoration-color: #f43f5e; }
    .border-t-amber-500 { border-top-color: rgba(245, 158, 11, 0.5) !important; text-decoration-color: #f59e0b; }
    .border-t-teal-500 { border-top-color: rgba(20, 184, 166, 0.5) !important; text-decoration-color: #14b8a6; }
    .border-t-purple-500 { border-top-color: rgba(168, 85, 247, 0.5) !important; text-decoration-color: #a855f7; }
    .border-t-blue-500 { border-top-color: rgba(59, 130, 246, 0.5) !important; text-decoration-color: #3b82f6; }
    .border-t-zinc-500 { border-top-color: rgba(113, 113, 122, 0.5) !important; text-decoration-color: #71717a; }
    
    .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(24,24,27,0.5); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(82,82,91,0.5); border-radius: 4px; }
  `]
})
export class NotesComponent {
  appwrite = inject(Appwrite);
  
  isModalOpen = signal(false);
  editingNote = signal<NoteItem | null>(null);

  openCreateModal() {
    this.editingNote.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(note: NoteItem) {
    this.editingNote.set(note);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingNote.set(null);
  }

  async saveNote(title: string, content: string) {
    if (!title.trim() || !content.trim()) return;
    
    const note = this.editingNote();
    if (note) {
      await this.appwrite.updateNote(note.$id, { title, content });
    } else {
      const colors = ['border-t-rose-500 text-rose-500', 'border-t-teal-500 text-teal-500', 'border-t-purple-500 text-purple-500', 'border-t-amber-500 text-amber-500', 'border-t-blue-500 text-blue-500'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      await this.appwrite.addNote({ title, content, color, date: 'Just now', tags: [] });
    }
    this.closeModal();
  }

  async deleteNote(id: string) {
    if (confirm('Are you sure you want to delete this note?')) {
      await this.appwrite.deleteNote(id);
    }
  }
}
