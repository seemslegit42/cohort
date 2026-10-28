import { 
  Component, 
  ChangeDetectionStrategy, 
  input, 
  output, 
  signal, 
  computed, 
  viewChild, 
  ElementRef, 
  effect, 
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

export type EditorMode = 'wysiwyg' | 'markdown' | 'split';

export interface ActiveFormats {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
}

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div 
      [class.fixed]="isFullScreen()" 
      [class.inset-4]="isFullScreen()" 
      [class.z-50]="isFullScreen()"
      [class.flex-col]="isFullScreen()"
      class="flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-xl transition-all font-sans relative">
      
      <!-- Toolbar Header -->
      <div class="flex items-center justify-between flex-wrap gap-2 p-2 bg-zinc-900 border-b border-zinc-800/90 shrink-0 select-none">
        
        <!-- Primary Formatting Group -->
        <div class="flex items-center gap-1 flex-wrap">
          
          <!-- Mode Selector Tabs -->
          <div class="flex items-center bg-zinc-950 p-0.5 border border-zinc-800/80 rounded-lg mr-2">
            <button 
              type="button" 
              (click)="setMode('wysiwyg')"
              [class]="mode() === 'wysiwyg' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shadow-sm' : 'text-zinc-400 hover:text-white'"
              class="px-2.5 py-1 rounded-md text-[11px] transition-all flex items-center gap-1 cursor-pointer">
              <mat-icon class="text-[14px]">auto_fix_high</mat-icon>
              <span class="hidden sm:inline">Visual</span> Editor
            </button>
            <button 
              type="button" 
              (click)="setMode('markdown')"
              [class]="mode() === 'markdown' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shadow-sm' : 'text-zinc-400 hover:text-white'"
              class="px-2.5 py-1 rounded-md text-[11px] transition-all flex items-center gap-1 cursor-pointer">
              <mat-icon class="text-[14px]">code</mat-icon>
              <span>Markdown</span>
            </button>
            <button 
              type="button" 
              (click)="setMode('split')"
              [class]="mode() === 'split' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shadow-sm' : 'text-zinc-400 hover:text-white'"
              class="px-2.5 py-1 rounded-md text-[11px] transition-all flex items-center gap-1 cursor-pointer">
              <mat-icon class="text-[14px]">vertical_split</mat-icon>
              <span class="hidden sm:inline">Live</span> Split
            </button>
          </div>

          <div class="w-px h-5 bg-zinc-800 mx-0.5"></div>

          <!-- Bold -->
          <button 
            type="button" 
            (click)="applyFormat('bold')"
            [class]="activeFormats().bold ? 'bg-zinc-800 text-amber-400 border-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'"
            class="p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center border border-transparent"
            title="Bold (Ctrl+B)">
            <mat-icon class="text-[16px]">format_bold</mat-icon>
          </button>

          <!-- Italic -->
          <button 
            type="button" 
            (click)="applyFormat('italic')"
            [class]="activeFormats().italic ? 'bg-zinc-800 text-amber-400 border-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'"
            class="p-1.5 rounded-lg text-xs italic transition-colors cursor-pointer flex items-center justify-center border border-transparent"
            title="Italic (Ctrl+I)">
            <mat-icon class="text-[16px]">format_italic</mat-icon>
          </button>

          <!-- Strikethrough -->
          <button 
            type="button" 
            (click)="applyFormat('strikethrough')"
            [class]="activeFormats().strikethrough ? 'bg-zinc-800 text-amber-400 border-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'"
            class="p-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center border border-transparent"
            title="Strikethrough">
            <mat-icon class="text-[16px]">strikethrough_s</mat-icon>
          </button>

          <!-- Heading H1, H2, H3 -->
          <button 
            type="button" 
            (click)="applyFormat('h1')"
            class="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg text-[11px] font-bold font-mono transition-colors cursor-pointer border border-transparent"
            title="Heading 1">
            H1
          </button>
          <button 
            type="button" 
            (click)="applyFormat('h2')"
            class="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg text-[11px] font-bold font-mono transition-colors cursor-pointer border border-transparent"
            title="Heading 2">
            H2
          </button>
          <button 
            type="button" 
            (click)="applyFormat('h3')"
            class="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg text-[11px] font-bold font-mono transition-colors cursor-pointer border border-transparent"
            title="Heading 3">
            H3
          </button>

          <div class="w-px h-5 bg-zinc-800 mx-0.5"></div>

          <!-- Bullet List -->
          <button 
            type="button" 
            (click)="applyFormat('bulletList')"
            class="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer border border-transparent"
            title="Bullet List">
            <mat-icon class="text-[16px]">format_list_bulleted</mat-icon>
          </button>

          <!-- Numbered List -->
          <button 
            type="button" 
            (click)="applyFormat('numberedList')"
            class="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer border border-transparent"
            title="Numbered List">
            <mat-icon class="text-[16px]">format_list_numbered</mat-icon>
          </button>

          <!-- Checklist / Tasks -->
          <button 
            type="button" 
            (click)="applyFormat('checklist')"
            class="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer border border-transparent"
            title="Task Checklist">
            <mat-icon class="text-[16px]">checklist</mat-icon>
          </button>

          <div class="w-px h-5 bg-zinc-800 mx-0.5"></div>

          <!-- Quote -->
          <button 
            type="button" 
            (click)="applyFormat('blockquote')"
            class="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer border border-transparent"
            title="Blockquote">
            <mat-icon class="text-[16px]">format_quote</mat-icon>
          </button>

          <!-- Code Snippet -->
          <button 
            type="button" 
            (click)="applyFormat('codeBlock')"
            class="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer border border-transparent font-mono"
            title="Code Block">
            <mat-icon class="text-[16px]">code</mat-icon>
          </button>

          <!-- Highlight -->
          <button 
            type="button" 
            (click)="applyFormat('highlight')"
            class="p-1.5 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer border border-transparent"
            title="Highlight Text">
            <mat-icon class="text-[16px]">border_color</mat-icon>
          </button>

          <!-- Link -->
          <button 
            type="button" 
            (click)="insertLink()"
            class="p-1.5 text-zinc-400 hover:text-teal-300 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer border border-transparent"
            title="Insert Hyperlink">
            <mat-icon class="text-[16px]">link</mat-icon>
          </button>

          <!-- Horizontal Divider -->
          <button 
            type="button" 
            (click)="applyFormat('hr')"
            class="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer border border-transparent"
            title="Horizontal Divider Line">
            <mat-icon class="text-[16px]">horizontal_rule</mat-icon>
          </button>

        </div>

        <!-- Right Utilities Group (Fullscreen, Clear, Stats) -->
        <div class="flex items-center gap-2">
          
          <!-- Clear Formatting / Reset -->
          <button 
            type="button" 
            (click)="clearContent()"
            class="px-2 py-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/60 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
            title="Clear All Text">
            Clear
          </button>

          <div class="w-px h-4 bg-zinc-800"></div>

          <!-- Fullscreen Toggle -->
          <button 
            type="button" 
            (click)="toggleFullScreen()"
            class="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer"
            [title]="isFullScreen() ? 'Exit Fullscreen' : 'Fullscreen Focus Mode'">
            <mat-icon class="text-[16px]">{{ isFullScreen() ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
          </button>

        </div>

      </div>

      <!-- Editor Content Area Container -->
      <div 
        class="flex-1 flex min-h-[220px] max-h-[600px] overflow-hidden relative"
        [style.height]="isFullScreen() ? 'calc(100vh - 120px)' : (minHeight() || '260px')">
        
        <!-- Mode 1: Visual WYSIWYG Contenteditable Editor -->
        @if (mode() === 'wysiwyg' || mode() === 'split') {
          <div 
            [class.w-1/2]="mode() === 'split'"
            [class.border-r]="mode() === 'split'"
            [class.border-zinc-800]="mode() === 'split'"
            class="flex-1 flex flex-col relative overflow-hidden bg-zinc-950">
            
            <div 
              #wysiwygRef
              contenteditable="true"
              (input)="onWysiwygInput()"
              (selectionchange)="checkActiveFormats()"
              (keydown)="onKeyDown($event)"
              class="w-full h-full p-4 text-xs text-zinc-100 focus:outline-none overflow-y-auto custom-scrollbar prose prose-invert max-w-none font-sans leading-relaxed selection:bg-amber-500/30"
              [attr.data-placeholder]="placeholder()">
            </div>

          </div>
        }

        <!-- Mode 2: Markdown Code Textarea -->
        @if (mode() === 'markdown' || mode() === 'split') {
          <div 
            [class.w-1/2]="mode() === 'split'"
            class="flex-1 flex flex-col relative bg-zinc-950">
            
            <textarea 
              #textareaRef
              [value]="rawMarkdown()"
              (input)="onMarkdownInput($any($event.target).value)"
              (keydown)="onKeyDown($event)"
              [placeholder]="placeholder()"
              class="w-full h-full p-4 bg-zinc-950 text-xs font-mono text-zinc-200 placeholder-zinc-600 border-none focus:outline-none custom-scrollbar resize-none leading-relaxed">
            </textarea>

          </div>
        }

        <!-- Split Preview Column when in 'split' mode -->
        @if (mode() === 'split') {
          <!-- Hidden visual indicator -->
        }

      </div>

      <!-- Footer HUD Bar (Word count, char count, read time) -->
      <div class="px-3 py-1.5 bg-zinc-900 border-t border-zinc-800/90 flex items-center justify-between text-[10px] text-zinc-400 font-mono shrink-0">
        <div class="flex items-center gap-3">
          <span><strong class="text-white">{{ wordCount() }}</strong> words</span>
          <span>·</span>
          <span><strong class="text-zinc-300">{{ charCount() }}</strong> characters</span>
          <span>·</span>
          <span class="text-amber-400 font-semibold">{{ readTimeMinutes() }} min read</span>
        </div>

        <div class="flex items-center gap-2 text-zinc-500">
          <span class="inline-flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Rich Text Engine
          </span>
          <span class="hidden sm:inline">| Press Ctrl+B (Bold) / Ctrl+I (Italic)</span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    [contenteditable]:empty:before {
      content: attr(data-placeholder);
      color: #52525b;
      pointer-events: none;
      display: block;
    }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(24,24,27,0.5); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(82,82,91,0.5); border-radius: 4px; }
    
    /* Styled content inside visual editor */
    :host ::ng-deep h1 { font-size: 1.25rem; font-weight: 700; color: #f4f4f5; margin-top: 0.75rem; margin-bottom: 0.5rem; }
    :host ::ng-deep h2 { font-size: 1.1rem; font-weight: 700; color: #f4f4f5; margin-top: 0.5rem; margin-bottom: 0.25rem; }
    :host ::ng-deep h3 { font-size: 0.95rem; font-weight: 700; color: #f59e0b; margin-top: 0.5rem; margin-bottom: 0.25rem; }
    :host ::ng-deep blockquote { border-left: 3px solid #f59e0b; padding-left: 0.75rem; font-style: italic; color: #d4d4d8; margin: 0.5rem 0; }
    :host ::ng-deep ul { list-style-type: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
    :host ::ng-deep ol { list-style-type: decimal; padding-left: 1.25rem; margin: 0.5rem 0; }
    :host ::ng-deep code { background: rgba(39, 39, 42, 0.8); border: 1px solid #3f3f46; padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-family: monospace; color: #38bdf8; }
    :host ::ng-deep mark { background-color: rgba(245, 158, 11, 0.3); color: #fef08a; padding: 0 0.2rem; border-radius: 0.2rem; }
  `]
})
export class RichTextEditorComponent implements OnInit {
  // Inputs
  content = input<string>('');
  placeholder = input<string>('Write strategic insights, meeting notes, or task lists...');
  minHeight = input<string>('260px');

  // Outputs
  contentChange = output<string>();
  wordCountChange = output<number>();

  // Element Refs
  wysiwygRef = viewChild<ElementRef<HTMLDivElement>>('wysiwygRef');
  textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textareaRef');

  // Internal Signals
  mode = signal<EditorMode>('wysiwyg');
  rawMarkdown = signal<string>('');
  isFullScreen = signal<boolean>(false);
  activeFormats = signal<ActiveFormats>({});

  // Computed stats
  charCount = computed(() => this.rawMarkdown().length);
  wordCount = computed(() => {
    const text = this.rawMarkdown().replace(/<[^>]*>/g, ' ').trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  });
  readTimeMinutes = computed(() => Math.max(1, Math.ceil(this.wordCount() / 200)));

  constructor() {
    // Sync initial content
    effect(() => {
      const initVal = this.content() || '';
      if (initVal !== this.rawMarkdown()) {
        this.rawMarkdown.set(initVal);
        this.updateWysiwygHtmlFromMarkdown(initVal);
      }
    });
  }

  ngOnInit() {
    const initVal = this.content() || '';
    this.rawMarkdown.set(initVal);
    setTimeout(() => {
      this.updateWysiwygHtmlFromMarkdown(initVal);
    }, 50);
  }

  setMode(m: EditorMode) {
    this.mode.set(m);
    if (m === 'wysiwyg' || m === 'split') {
      setTimeout(() => {
        this.updateWysiwygHtmlFromMarkdown(this.rawMarkdown());
      }, 30);
    }
  }

  toggleFullScreen() {
    this.isFullScreen.update(v => !v);
  }

  clearContent() {
    if (confirm('Clear all note content?')) {
      this.rawMarkdown.set('');
      const el = this.wysiwygRef()?.nativeElement;
      if (el) el.innerHTML = '';
      this.emitChange('');
    }
  }

  onWysiwygInput() {
    const el = this.wysiwygRef()?.nativeElement;
    if (!el) return;
    const html = el.innerHTML;
    const md = this.htmlToMarkdown(html);
    this.rawMarkdown.set(md);
    this.emitChange(md);
  }

  onMarkdownInput(val: string) {
    this.rawMarkdown.set(val);
    this.emitChange(val);
    this.updateWysiwygHtmlFromMarkdown(val);
  }

  private emitChange(md: string) {
    this.contentChange.emit(md);
    this.wordCountChange.emit(this.wordCount());
  }

  checkActiveFormats() {
    if (typeof document === 'undefined') return;
    this.activeFormats.set({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      strikethrough: document.queryCommandState('strikethrough'),
      underline: document.queryCommandState('underline')
    });
  }

  onKeyDown(event: KeyboardEvent) {
    // Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'b' || event.key === 'B') {
        event.preventDefault();
        this.applyFormat('bold');
      } else if (event.key === 'i' || event.key === 'I') {
        event.preventDefault();
        this.applyFormat('italic');
      } else if (event.key === 'u' || event.key === 'U') {
        event.preventDefault();
        this.applyFormat('underline');
      }
    }
  }

  applyFormat(type: string) {
    if (this.mode() === 'markdown') {
      this.applyMarkdownFormatting(type);
      return;
    }

    const wysiwyg = this.wysiwygRef()?.nativeElement;
    if (wysiwyg) {
      wysiwyg.focus();
    }

    switch (type) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'strikethrough':
        document.execCommand('strikethrough', false);
        break;
      case 'underline':
        document.execCommand('underline', false);
        break;
      case 'h1':
        document.execCommand('formatBlock', false, '<h1>');
        break;
      case 'h2':
        document.execCommand('formatBlock', false, '<h2>');
        break;
      case 'h3':
        document.execCommand('formatBlock', false, '<h3>');
        break;
      case 'bulletList':
        document.execCommand('insertUnorderedList', false);
        break;
      case 'numberedList':
        document.execCommand('insertOrderedList', false);
        break;
      case 'checklist':
        document.execCommand('insertHTML', false, '<div><input type="checkbox" style="margin-right: 6px;" /> Task item</div>');
        break;
      case 'blockquote':
        document.execCommand('formatBlock', false, '<blockquote>');
        break;
      case 'codeBlock':
        document.execCommand('formatBlock', false, '<pre>');
        break;
      case 'highlight':
        document.execCommand('hiliteColor', false, 'rgba(245,158,11,0.3)');
        break;
      case 'hr':
        document.execCommand('insertHorizontalRule', false);
        break;
    }

    this.onWysiwygInput();
    this.checkActiveFormats();
  }

  insertLink() {
    const url = prompt('Enter website URL for hyperlink:', 'https://');
    if (!url) return;
    if (this.mode() === 'markdown') {
      this.insertMarkdownSyntax(`[Link](${url})`);
    } else {
      document.execCommand('createLink', false, url);
      this.onWysiwygInput();
    }
  }

  private applyMarkdownFormatting(type: string) {
    const textarea = this.textareaRef()?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = this.rawMarkdown();
    const selected = val.substring(start, end) || 'text';

    let prefix = '';
    let suffix = '';

    switch (type) {
      case 'bold': prefix = '**'; suffix = '**'; break;
      case 'italic': prefix = '*'; suffix = '*'; break;
      case 'strikethrough': prefix = '~~'; suffix = '~~'; break;
      case 'h1': prefix = '# '; break;
      case 'h2': prefix = '## '; break;
      case 'h3': prefix = '### '; break;
      case 'bulletList': prefix = '- '; break;
      case 'numberedList': prefix = '1. '; break;
      case 'checklist': prefix = '- [ ] '; break;
      case 'blockquote': prefix = '> '; break;
      case 'codeBlock': prefix = '```\n'; suffix = '\n```'; break;
      case 'highlight': prefix = '=='; suffix = '=='; break;
      case 'hr': prefix = '\n---\n'; break;
    }

    const replacement = `${prefix}${selected}${suffix}`;
    const newVal = val.substring(0, start) + replacement + val.substring(end);
    this.onMarkdownInput(newVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  }

  private insertMarkdownSyntax(syntax: string) {
    const val = this.rawMarkdown();
    const newVal = val ? `${val}\n${syntax}` : syntax;
    this.onMarkdownInput(newVal);
  }

  private updateWysiwygHtmlFromMarkdown(md: string) {
    const el = this.wysiwygRef()?.nativeElement;
    if (!el) return;
    // Simple markdown-to-html converter for editor display
    el.innerHTML = this.markdownToHtml(md);
  }

  private markdownToHtml(md: string): string {
    if (!md) return '';
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold, Italic, Strikethrough
    html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
    html = html.replace(/==(.*?)==/g, '<mark>$1</mark>');

    // Blockquote
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Checklist
    html = html.replace(/^- \[ \] (.*$)/gim, '<div><input type="checkbox" style="margin-right: 6px;" /> $1</div>');
    html = html.replace(/^- \[x\] (.*$)/gim, '<div><input type="checkbox" checked style="margin-right: 6px;" /> <del>$1</del></div>');

    // Bullet lists
    html = html.replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Numbered lists
    html = html.replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>');
    html = html.replace(/<\/ol>\s*<ol>/g, '');

    // Code blocks & inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Paragraph breaks
    html = html.replace(/\n\n/g, '<br/><br/>');

    return html;
  }

  private htmlToMarkdown(html: string): string {
    if (!html) return '';
    let text = html;

    // Convert basic tags to Markdown
    text = text.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n');
    text = text.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n');
    text = text.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n');
    text = text.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<i>(.*?)<\/i>/gi, '*$1*');
    text = text.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    text = text.replace(/<del>(.*?)<\/del>/gi, '~~$1~~');
    text = text.replace(/<mark>(.*?)<\/mark>/gi, '==$1==');
    text = text.replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n');
    text = text.replace(/<code>(.*?)<\/code>/gi, '`$1`');
    text = text.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<div><input[^>]*checked[^>]*>\s*(.*?)<\/div>/gi, '- [x] $1\n');
    text = text.replace(/<div><input[^>]*>\s*(.*?)<\/div>/gi, '- [ ] $1\n');
    text = text.replace(/<[^>]+>/g, ''); // strip remaining tags

    return text.trim();
  }
}
