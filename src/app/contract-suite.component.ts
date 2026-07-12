import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Appwrite } from './appwrite';

interface ContractTemplate {
  id: string;
  title: string;
  description: string;
  collaborators: number;
}

interface ContractFile {
  $id: string;
  $createdAt: string;
  name: string;
  size: number;
  mimeType: string;
  bucketId: string;
  teamId: string;
}

@Component({
  selector: 'app-contract-suite',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="mt-8 space-y-6 animate-fade-in relative" style="animation-delay: 200ms;" id="contractual-workspace-root">
      
      <!-- Stepped Geometric Aztec Indicator -->
      <div class="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800" id="workspace-header">
        <div class="flex items-center gap-3">
          <!-- The Aztec Step Graphic -->
          <div class="flex flex-col items-center justify-center gap-[2px] w-8 h-8 rounded bg-zinc-900 border border-teal-500/30 text-teal-400 relative overflow-hidden" id="aztec-step-icon">
            <div class="w-4 h-1 bg-teal-400/80"></div>
            <div class="w-3 h-1 bg-teal-400/60"></div>
            <div class="w-2 h-1 bg-teal-400/40"></div>
          </div>
          <div>
            <h2 class="text-xl font-display font-bold text-white tracking-tight">Contractual Workspace Suite</h2>
            <p class="text-xs text-zinc-400 font-sans tracking-wide">Sync NDA, SLAs, & Custom Files with Appwrite Storage Vault</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono">STATUS:</span>
          <div class="bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-1 text-[11px] font-mono text-teal-400 flex items-center gap-1.5 font-bold" id="vault-status-indicator">
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
            VAULT SYNCHRONIZED
          </div>
        </div>
      </div>

      <!-- Main Columns Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6" id="workspace-grid">
        
        <!-- COLUMN 1: Templates & Creator Form (Left 2 cols) -->
        <div class="xl:col-span-2 space-y-6" id="templates-section">
          
          <!-- Template Catalog Grid -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-display font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <mat-icon class="text-teal-400 text-[18px]">collections_bookmark</mat-icon>
                Active Contract Templates
              </h3>
              <span class="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded font-bold">
                {{ templates().length }} Templates Registered
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" id="templates-grid">
              @for (template of templates(); track template.id) {
                <div class="bg-[#0f191a] backdrop-blur-xl border border-[#3a494b] rounded-2xl p-5 hover:border-teal-500/50 hover:bg-[#152122] transition-all group shadow-md flex flex-col justify-between" [id]="'template-card-' + template.id">
                  <div>
                    <div class="flex justify-between items-start mb-3">
                      <!-- Rounded geometric container -->
                      <div class="w-10 h-10 bg-zinc-900/80 rounded-xl flex items-center justify-center border border-zinc-800 shadow-inner group-hover:border-teal-500/30 transition-colors">
                        <mat-icon class="text-teal-400 text-[20px]">folder_open</mat-icon>
                      </div>
                      
                      <!-- Collaborators avatar stack -->
                      <div class="flex -space-x-2">
                        <div class="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 z-30 overflow-hidden flex justify-center items-center text-[9px] text-zinc-400 font-bold tracking-tighter">{{ template.collaborators }}+</div>
                        <img src="https://api.dicebear.com/7.x/notionists/svg?seed=A1&backgroundColor=fcd34d" class="w-6 h-6 rounded-full border border-zinc-950 z-20" alt="Collaborator Face A" referrerpolicy="no-referrer" />
                        <img src="https://api.dicebear.com/7.x/notionists/svg?seed=B2&backgroundColor=67e8f9" class="w-6 h-6 rounded-full border border-zinc-950 z-10" alt="Collaborator Face B" referrerpolicy="no-referrer" />
                      </div>
                    </div>
                    
                    <h4 class="text-white font-semibold text-sm mb-1 tracking-tight font-display">{{ template.title }}</h4>
                    <p class="text-xs text-zinc-400 font-sans font-light mb-4 line-clamp-2 leading-relaxed min-h-[32px]">{{ template.description }}</p>
                  </div>
                  
                  <div class="flex gap-2">
                    <button (click)="shareTemplate(template)" class="flex-1 bg-zinc-950/75 hover:bg-teal-500 hover:text-zinc-950 text-zinc-300 border border-zinc-800/80 rounded-lg py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm" [id]="'share-btn-' + template.id">
                      <mat-icon class="text-[14px]">share</mat-icon> Share
                    </button>
                    <button (click)="deleteTemplate(template.id)" class="px-2.5 bg-zinc-950/75 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-500 border border-zinc-800/80 rounded-lg py-1.5 text-xs font-semibold flex items-center justify-center transition-all" title="Delete Template" [id]="'delete-btn-' + template.id">
                      <mat-icon class="text-[14px]">delete</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Template Creator Form -->
          <div class="bg-[#0d1515] border border-[#3a494b] rounded-2xl p-5 relative overflow-hidden shadow-xl" id="template-creator-box">
            <!-- Aztec ambient gold background accent -->
            <div class="absolute -right-16 -bottom-16 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none"></div>
            
            <h3 class="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <mat-icon class="text-amber-400 text-[18px]">design_services</mat-icon>
              Forge Custom Contract Template
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label for="template-title-input" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Contract Title</label>
                <input 
                  type="text" 
                  [value]="newTitle()" 
                  (input)="newTitle.set($any($event.target).value)"
                  placeholder="e.g. Master Services Agreement" 
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
                  id="template-title-input" />
              </div>

              <div>
                <label for="template-collabs-input" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Collaborator Base (Est.)</label>
                <input 
                  type="number" 
                  [value]="newCollaborators()" 
                  (input)="newCollaborators.set(+$any($event.target).value)"
                  placeholder="e.g. 15" 
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
                  id="template-collabs-input" />
              </div>
            </div>

            <div class="mb-4">
              <label for="template-desc-input" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Contract Summary / Scope</label>
              <textarea 
                [value]="newDescription()" 
                (input)="newDescription.set($any($event.target).value)"
                placeholder="Briefly state data constraints, obligations, renewal intervals, and relationship definitions..." 
                rows="2" 
                class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 resize-none"
                id="template-desc-input"></textarea>
            </div>

            <div class="flex justify-end">
              <button 
                (click)="createTemplate()" 
                [disabled]="!newTitle() || !newDescription()" 
                class="bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500 text-zinc-950 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                id="generate-template-btn">
                <mat-icon class="text-[16px]">add_circle</mat-icon> Generate & Register Template
              </button>
            </div>
          </div>

        </div>

        <!-- COLUMN 2: Upload Vault (Right 1 col) -->
        <div class="space-y-6" id="upload-vault-section">
          
          <!-- Upload Drag-and-Drop Zone -->
          <div class="bg-[#0f191a] border border-[#3a494b] rounded-2xl p-5 relative overflow-hidden flex flex-col shadow-lg" id="drag-drop-container">
            <h3 class="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <mat-icon class="text-teal-400 text-[18px]">cloud_upload</mat-icon>
              Secure Document Vault
            </h3>

            <!-- Drag Area -->
            <div 
              class="border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group relative overflow-hidden focus:outline-none focus:border-teal-500"
              [class.border-teal-500]="isDragging()"
              [class.bg-teal-500/5]="isDragging()"
              [class.border-zinc-800]="!isDragging()"
              [class.hover:border-zinc-700]="!isDragging()"
              (dragover)="$event.preventDefault(); isDragging.set(true)"
              (dragleave)="isDragging.set(false)"
              (drop)="$event.preventDefault(); isDragging.set(false); onFileDrop($event)"
              (click)="fileInput.click()"
              (keydown.enter)="fileInput.click()"
              (keydown.space)="$event.preventDefault(); fileInput.click()"
              tabindex="0"
              role="button"
              id="file-drop-zone">
              
              <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)">
              
              <div class="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:scale-110 group-hover:border-teal-500/40 transition-all shadow-inner">
                @if (isUploading()) {
                  <mat-icon class="text-teal-400 text-[26px] animate-spin">autorenew</mat-icon>
                } @else {
                  <mat-icon class="text-teal-400 text-[26px]">upload_file</mat-icon>
                }
              </div>

              <div>
                <p class="text-xs font-bold text-white font-sans">
                  @if (isUploading()) {
                    Uploading record to Appwrite...
                  } @else {
                    Drag & Drop File Here
                  }
                </p>
                <p class="text-[10px] text-zinc-500 mt-1 uppercase font-semibold font-mono tracking-wider">
                  Or click to browse storage
                </p>
              </div>

              <!-- Miniature Roman Glass Overlay Effect -->
              <div class="absolute inset-0 bg-gradient-to-br from-[#00f2ff]/5 to-[#cf5cff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>

            <!-- Upload Info Alert -->
            <p class="text-[10px] text-zinc-500 leading-relaxed mt-3 flex items-center gap-1 font-mono">
              <mat-icon class="text-[12px] text-zinc-600">security</mat-icon>
              Files are strictly processed via Appwrite Storage buckets
            </p>
          </div>

          <!-- Document Ledger / File List -->
          <div class="bg-[#0d1515] border border-[#3a494b] rounded-2xl p-5 flex-1 flex flex-col" id="vault-documents-box">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/60">
              <h3 class="text-xs font-display font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <mat-icon class="text-teal-400 text-[16px]">folder_zip</mat-icon>
                Vault Ledger Documents
              </h3>
              <button (click)="loadUploadedFiles()" class="text-zinc-500 hover:text-white transition-colors" title="Reload File list" id="refresh-vault-btn">
                <mat-icon class="text-[16px] [class.animate-spin]='isLoadingFiles()'">refresh</mat-icon>
              </button>
            </div>

            <!-- Loading overlay -->
            @if (isLoadingFiles()) {
              <div class="flex flex-col items-center justify-center py-10 text-center gap-2" id="vault-loading-state">
                <mat-icon class="text-teal-400 text-[24px] animate-spin">autorenew</mat-icon>
                <span class="text-[11px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Querying Appwrite Storage...</span>
              </div>
            } @else {
              <!-- Ledger File List -->
              <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1" id="vault-documents-list">
                @for (file of uploadedFiles(); track file.$id) {
                  <div class="bg-zinc-950 border border-zinc-900 rounded-xl p-3 flex items-center justify-between gap-3 group hover:border-teal-500/30 transition-all" [id]="'file-row-' + file.$id">
                    <div class="flex items-start gap-2.5 min-w-0">
                      <!-- Icon selector based on mimetype -->
                      <div class="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center border border-zinc-800 text-teal-400 flex-shrink-0">
                        <mat-icon class="text-[18px]">
                          {{ file.mimeType.includes('pdf') ? 'picture_as_pdf' : 'description' }}
                        </mat-icon>
                      </div>
                      
                      <div class="min-w-0">
                        <h4 class="text-xs font-bold text-zinc-200 truncate font-sans group-hover:text-white" [title]="file.name">{{ file.name }}</h4>
                        <p class="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">
                          {{ formatBytes(file.size) }} &bull; {{ file.$createdAt | date:'shortDate' }}
                        </p>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-1 flex-shrink-0">
                      <!-- View Link -->
                      <a 
                        [href]="appwrite.getFileViewUrl(file.$id)" 
                        target="_blank" 
                        rel="noreferrer"
                        class="w-6 h-6 rounded bg-zinc-900 hover:bg-teal-500/20 text-zinc-400 hover:text-teal-400 flex items-center justify-center border border-zinc-800 transition-colors"
                        title="View Document"
                        [id]="'view-file-btn-' + file.$id">
                        <mat-icon class="text-[14px]">visibility</mat-icon>
                      </a>
                      
                      <!-- Download Link -->
                      <a 
                        [href]="appwrite.getFileDownloadUrl(file.$id)" 
                        class="w-6 h-6 rounded bg-zinc-900 hover:bg-teal-500/20 text-zinc-400 hover:text-teal-400 flex items-center justify-center border border-zinc-800 transition-colors"
                        title="Download Document"
                        [id]="'download-file-btn-' + file.$id">
                        <mat-icon class="text-[14px]">download</mat-icon>
                      </a>

                      <!-- Delete Button -->
                      <button 
                        (click)="deleteFile(file.$id)" 
                        class="w-6 h-6 rounded bg-zinc-900 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 flex items-center justify-center border border-zinc-800 transition-colors"
                        title="Delete Document"
                        [id]="'delete-file-btn-' + file.$id">
                        <mat-icon class="text-[14px]">delete_outline</mat-icon>
                      </button>
                    </div>
                  </div>
                } @empty {
                  <div class="flex flex-col items-center justify-center py-10 text-center" id="vault-empty-state">
                    <mat-icon class="text-zinc-600 mb-2 text-[28px]">cloud_off</mat-icon>
                    <span class="text-xs text-zinc-500">Vault ledger is empty</span>
                    <span class="text-[9px] text-zinc-600 uppercase font-mono mt-1">Upload a PDF or DOCX file above</span>
                  </div>
                }
              </div>
            }

          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.8s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ContractSuiteComponent implements OnInit {
  appwrite = inject(Appwrite);

  // Templates signal
  templates = signal<ContractTemplate[]>([]);
  uploadedFiles = signal<ContractFile[]>([]);

  // States
  isDragging = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  isLoadingFiles = signal<boolean>(false);

  // Form signals
  newTitle = signal<string>('');
  newDescription = signal<string>('');
  newCollaborators = signal<number>(1);

  ngOnInit() {
    this.loadUploadedFiles();
    this.loadCustomTemplates();
  }

  // --- Document Storage Vault Operations ---
  async loadUploadedFiles() {
    this.isLoadingFiles.set(true);
    try {
      const files = await this.appwrite.listFiles();
      this.uploadedFiles.set(files);
    } catch (e) {
      console.error('Failed to load files:', e);
    } finally {
      this.isLoadingFiles.set(false);
    }
  }

  onFileDrop(event: DragEvent) {
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileUpload(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.handleFileUpload(files[0]);
    }
  }

  async handleFileUpload(file: File) {
    this.isUploading.set(true);
    try {
      await this.appwrite.uploadFile(file);
      await this.loadUploadedFiles();
    } catch (e) {
      console.error('File upload failed:', e);
    } finally {
      this.isUploading.set(false);
    }
  }

  async deleteFile(fileId: string) {
    if (confirm('Are you sure you want to securely shred and delete this document?')) {
      try {
        await this.appwrite.deleteFile(fileId);
        await this.loadUploadedFiles();
      } catch (e) {
        console.error('Failed to delete file:', e);
      }
    }
  }

  formatBytes(bytes: number, decimals = 2) {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // --- Template Catalog Operations ---
  loadCustomTemplates() {
    let savedList: ContractTemplate[] = [];
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('laevos_contract_templates');
      if (saved) {
        try {
          savedList = JSON.parse(saved);
        } catch {
          savedList = [];
        }
      }
    }

    if (savedList.length === 0) {
      savedList = [
        {
          id: '1',
          title: 'NDA Agreement',
          description: 'To make sure our data is secure when we build',
          collaborators: 240
        },
        {
          id: '2',
          title: 'Service Level Agreement',
          description: 'Defines the expected level of service performance',
          collaborators: 50
        },
        {
          id: '3',
          title: 'User Onboarding Guide',
          description: 'A comprehensive guide to help new users start',
          collaborators: 89
        },
        {
          id: '4',
          title: 'Privacy Policy',
          description: 'Details on how we handle user data and privacy',
          collaborators: 12
        }
      ];
      this.saveTemplatesToLocalStorage(savedList);
    }

    this.templates.set(savedList);
  }

  saveTemplatesToLocalStorage(list: ContractTemplate[]) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('laevos_contract_templates', JSON.stringify(list));
    }
  }

  createTemplate() {
    const title = this.newTitle().trim();
    const desc = this.newDescription().trim();
    const collabs = this.newCollaborators() || 1;

    if (!title || !desc) return;

    const newT: ContractTemplate = {
      id: 'template-' + Date.now(),
      title,
      description: desc,
      collaborators: collabs
    };

    const updated = [newT, ...this.templates()];
    this.templates.set(updated);
    this.saveTemplatesToLocalStorage(updated);

    // Clear inputs
    this.newTitle.set('');
    this.newDescription.set('');
    this.newCollaborators.set(1);

    this.appwrite.addNotification({
      title: 'Template Forged',
      message: `"${title}" has been successfully added to your Contractual Workspace catalog.`,
      type: 'success'
    });
  }

  deleteTemplate(id: string) {
    if (confirm('Are you sure you want to permanently delete this contract template?')) {
      const updated = this.templates().filter(t => t.id !== id);
      this.templates.set(updated);
      this.saveTemplatesToLocalStorage(updated);

      this.appwrite.addNotification({
        title: 'Template Deleted',
        message: 'Contract template removed from catalog.',
        type: 'warning'
      });
    }
  }

  shareTemplate(template: ContractTemplate) {
    const dummyUrl = `${window.location.origin}/contracts/view/${template.id}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(dummyUrl).then(() => {
        this.appwrite.addNotification({
          title: 'Link Copied',
          message: `Direct workspace path for "${template.title}" copied to clipboard.`,
          type: 'success'
        });
      }).catch(() => {
        this.fallbackToast(template.title);
      });
    } else {
      this.fallbackToast(template.title);
    }
  }

  private fallbackToast(title: string) {
    this.appwrite.addNotification({
      title: 'Share Action Prepped',
      message: `Draft created for "${title}". Direct Link ready for teammates.`,
      type: 'success'
    });
  }
}
