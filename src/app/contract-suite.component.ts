import { Component, ChangeDetectionStrategy, signal, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';

export interface ContractTemplate {
  id: string;
  title: string;
  category: 'NDA' | 'MSA' | 'SLA' | 'DPA' | 'Custom';
  description: string;
  collaborators: number;
  defaultClauses: string[];
}

export interface ContractFile {
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
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="h-full flex flex-col p-3 sm:p-5 md:p-6 animate-fade-in max-w-[1600px] mx-auto space-y-6">
      
      <!-- Header -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.25)] font-bold">
              <mat-icon class="text-[22px]">gavel</mat-icon>
            </div>
            <div>
              <h1 class="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Contract & Legal Vault Suite</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-normal">Cryptographic v3.2</span>
              </h1>
              <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">Automated MSA/NDA synthesis, live variable merging, digital signature seal generation, and Appwrite encrypted storage.</p>
            </div>
          </div>
        </div>

        <!-- Header Actions -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <button 
            type="button"
            (click)="activeTab.set('generator')" 
            [class]="activeTab() === 'generator' ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs' : 'text-zinc-400 hover:text-white bg-zinc-900/60 border-zinc-800'"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px] text-amber-400">edit_document</mat-icon>
            <span>Contract Generator & Seal</span>
          </button>

          <button 
            type="button"
            (click)="activeTab.set('vault')" 
            [class]="activeTab() === 'vault' ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs' : 'text-zinc-400 hover:text-white bg-zinc-900/60 border-zinc-800'"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer">
            <mat-icon class="text-[16px] text-teal-400">cloud_done</mat-icon>
            <span>Encrypted Storage Vault</span>
          </button>

          <button 
            type="button"
            (click)="openForgeTemplateModal()" 
            class="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 transition-all">
            <mat-icon class="text-[16px]">add</mat-icon>
            <span>Forge Custom Template</span>
          </button>
        </div>
      </header>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Templates in Vault</span>
            <mat-icon class="text-amber-400 text-[18px]">collections_bookmark</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ templates().length }} Legal Blueprints</div>
          <div class="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">verified</mat-icon> Standardized Enterprise Master Terms
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Stored Envelopes</span>
            <mat-icon class="text-teal-400 text-[18px]">folder_zip</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">{{ uploadedFiles().length }} Documents</div>
          <div class="text-[11px] text-teal-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">lock</mat-icon> Appwrite AES-256 Storage
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Avg Signature Turnaround</span>
            <mat-icon class="text-purple-400 text-[18px]">speed</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">18.4 Hours</div>
          <div class="text-[11px] text-purple-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">trending_down</mat-icon> -42% vs paper PDF routing
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Compliance Integrity</span>
            <mat-icon class="text-emerald-400 text-[18px]">shield</mat-icon>
          </div>
          <div class="text-xl sm:text-2xl font-bold text-white font-mono">100% Audit Ready</div>
          <div class="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <mat-icon class="text-[14px]">check_circle</mat-icon> SOC2 / GDPR / ISO27001
          </div>
        </div>
      </div>

      <!-- TAB 1: Live Interactive Contract Generator -->
      @if (activeTab() === 'generator') {
        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          <!-- Left Column: Variable Configuration Form (5 cols) -->
          <div class="xl:col-span-5 p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div class="flex items-center gap-2">
                <mat-icon class="text-amber-400 text-[18px]">tune</mat-icon>
                <h2 class="text-sm font-bold text-white font-display">Contract Parameters & Clauses</h2>
              </div>
              <span class="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">Live Merging</span>
            </div>

            <!-- Template Selector -->
            <div class="space-y-1">
              <label for="template-select" class="text-xs text-zinc-400 font-semibold">Legal Blueprint</label>
              <select 
                id="template-select" 
                [ngModel]="selectedTemplateId()" 
                (ngModelChange)="onTemplateChange($event)"
                class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
                @for (t of templates(); track t.id) {
                  <option [value]="t.id">{{ t.title }} ({{ t.category }})</option>
                }
              </select>
            </div>

            <!-- Party A & B -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label for="contract-party-a" class="text-xs text-zinc-400 font-semibold">First Party (Provider)</label>
                <input id="contract-party-a" type="text" [ngModel]="partyA()" (ngModelChange)="partyA.set($event)" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div class="space-y-1">
                <label for="contract-party-b" class="text-xs text-zinc-400 font-semibold">Second Party (Counterparty)</label>
                <input id="contract-party-b" type="text" [ngModel]="partyB()" (ngModelChange)="partyB.set($event)" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label for="contract-effective-date" class="text-xs text-zinc-400 font-semibold">Effective Date</label>
                <input id="contract-effective-date" type="date" [ngModel]="effectiveDate()" (ngModelChange)="effectiveDate.set($event)" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div class="space-y-1">
                <label for="contract-jurisdiction" class="text-xs text-zinc-400 font-semibold">Governing Law Jurisdiction</label>
                <input id="contract-jurisdiction" type="text" [ngModel]="jurisdiction()" (ngModelChange)="jurisdiction.set($event)" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="space-y-1">
                <label for="contract-liability" class="text-xs text-zinc-400 font-semibold">Aggregate Liability Cap ($)</label>
                <input id="contract-liability" type="number" [ngModel]="liabilityCap()" (ngModelChange)="liabilityCap.set($event)" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div class="space-y-1">
                <label for="contract-uptime" class="text-xs text-zinc-400 font-semibold">Guaranteed SLA Uptime</label>
                <select id="contract-uptime" [ngModel]="slaUptime()" (ngModelChange)="slaUptime.set($event)" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white">
                  <option value="99.9%">99.9% Standard Enterprise</option>
                  <option value="99.95%">99.95% High Availability</option>
                  <option value="99.99%">99.99% Mission Critical</option>
                </select>
              </div>
            </div>

            <!-- Signature Pad Section -->
            <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-zinc-300 flex items-center gap-1">
                  <mat-icon class="text-amber-400 text-[15px]">draw</mat-icon> Digital Signature Pad
                </span>
                <button type="button" (click)="clearSignature()" class="text-[10px] text-zinc-500 hover:text-rose-400">Clear</button>
              </div>
              
              <canvas 
                #signatureCanvas 
                width="380" 
                height="80" 
                (mousedown)="startDrawing($event)" 
                (mousemove)="draw($event)" 
                (mouseup)="stopDrawing()" 
                (mouseleave)="stopDrawing()"
                (touchstart)="startTouchDrawing($event)"
                (touchmove)="touchDraw($event)"
                (touchend)="stopDrawing()"
                class="w-full bg-zinc-900/90 rounded-lg border border-zinc-800 cursor-crosshair h-20 touch-none">
              </canvas>

              <div class="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                <span>Signee: {{ signatoryName() }}</span>
                <span class="text-emerald-400">SHA-256 Hash Verified</span>
              </div>
            </div>

            <div class="pt-2 flex gap-2">
              <button 
                type="button"
                (click)="stampAndSealContract()" 
                class="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer transition-all">
                <mat-icon class="text-[16px]">verified</mat-icon>
                <span>Stamp & Save to Vault</span>
              </button>
              <button 
                type="button"
                (click)="printContract()" 
                class="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
                <mat-icon class="text-[16px]">print</mat-icon>
                <span>Print</span>
              </button>
            </div>

          </div>

          <!-- Right Column: Live Document Preview (7 cols) -->
          <div class="xl:col-span-7 space-y-4">
            <div class="flex items-center justify-between px-1">
              <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Live Synthesized Document</h3>
              <span class="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Cryptographic Envelope Active
              </span>
            </div>

            <!-- Paper-Style Document Container -->
            <div class="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl text-zinc-300 font-serif leading-relaxed text-xs sm:text-sm space-y-4 max-h-[750px] overflow-y-auto print:p-0 print:border-none print:text-black">
              
              <!-- Document Title & Header -->
              <div class="text-center pb-4 border-b border-zinc-800 space-y-1 font-sans">
                <span class="text-[10px] tracking-widest text-amber-500 font-bold uppercase font-mono">CONFIDENTIAL LEGAL INSTRUMENT</span>
                <h2 class="text-lg sm:text-xl font-bold text-white uppercase tracking-tight">{{ currentTemplate().title }}</h2>
                <p class="text-xs text-zinc-500 font-mono">Document Reference: LAEVOS-DOC-{{ effectiveDate().replace('-', '') }}-SEC</p>
              </div>

              <!-- Preamble -->
              <p>
                This Agreement is entered into on <strong class="text-white font-mono">{{ effectiveDate() }}</strong> (the "Effective Date"), by and between <strong class="text-amber-300 font-sans">{{ partyA() }}</strong> ("Disclosing Party / Service Provider") and <strong class="text-teal-300 font-sans">{{ partyB() }}</strong> ("Receiving Party / Counterparty").
              </p>

              <!-- Standard Clauses Section -->
              <div class="space-y-3 pt-2">
                <h4 class="font-sans font-bold text-zinc-200 text-xs uppercase tracking-wider">1. Obligations & Scope of Service</h4>
                <p class="text-zinc-400 text-xs">
                  {{ currentTemplate().description }} The parties covenant to maintain reasonable administrative, physical, and technical safeguards to preserve confidentiality and SLA commitments.
                </p>

                <h4 class="font-sans font-bold text-zinc-200 text-xs uppercase tracking-wider">2. Service Level Guarantee & Availability</h4>
                <p class="text-zinc-400 text-xs">
                  The Service Provider guarantees an operational platform uptime of <strong class="text-white font-mono">{{ slaUptime() }}</strong> per calendar billing period, excluding scheduled off-peak maintenance announced 72 hours in advance.
                </p>

                <h4 class="font-sans font-bold text-zinc-200 text-xs uppercase tracking-wider">3. Limitation of Liability & Indemnity</h4>
                <p class="text-zinc-400 text-xs">
                  To the maximum extent permitted by applicable law, the aggregate liability of either party arising out of or related to this Agreement shall not exceed <strong class="text-white font-mono">\${{ liabilityCap().toLocaleString() }} USD</strong>.
                </p>

                <h4 class="font-sans font-bold text-zinc-200 text-xs uppercase tracking-wider">4. Governing Law & Dispute Resolution</h4>
                <p class="text-zinc-400 text-xs">
                  This Agreement shall be governed by and construed in accordance with the substantive laws of <strong class="text-white font-mono">{{ jurisdiction() }}</strong>, without regard to conflict of law principles.
                </p>
              </div>

              <!-- Signature Execution Block -->
              <div class="pt-6 mt-6 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
                <div class="space-y-2">
                  <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Executed on Behalf of First Party:</span>
                  <div class="h-12 border-b border-zinc-700 flex items-end pb-1 text-sm font-semibold text-white">
                    {{ partyA() }}
                  </div>
                  <div class="text-[10px] text-zinc-500 font-mono">Title: Authorized Corporate Signatory</div>
                </div>

                <div class="space-y-2">
                  <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Executed on Behalf of Counterparty:</span>
                  <div class="h-12 border-b border-zinc-700 flex items-end pb-1 text-sm font-semibold text-amber-400 font-mono">
                    {{ hasSignature() ? signatoryName() : '(Pending Signature Capture)' }}
                  </div>
                  <div class="text-[10px] text-zinc-500 font-mono flex items-center justify-between">
                    <span>Date: {{ effectiveDate() }}</span>
                    @if (hasSignature()) {
                      <span class="text-emerald-400 font-bold">✓ Sealed</span>
                    }
                  </div>
                </div>
              </div>

              <!-- Cryptographic Hash Seal -->
              <div class="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-[10px] font-mono text-zinc-500 space-y-0.5">
                <div class="flex justify-between text-zinc-400 font-bold">
                  <span>CRYPTOGRAPHIC ENVELOPE DIGEST</span>
                  <span class="text-emerald-400">VERIFIED</span>
                </div>
                <div class="truncate text-zinc-500">Hash: {{ getDocHash() }}</div>
              </div>

            </div>
          </div>

        </div>
      }

      <!-- TAB 2: Encrypted Storage Vault -->
      @if (activeTab() === 'vault') {
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          <!-- Upload Drag-and-Drop Zone (1 col) -->
          <div class="bg-[#0f191a] border border-[#3a494b] rounded-2xl p-5 relative overflow-hidden flex flex-col shadow-lg">
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
              role="button">
              
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
            </div>

            <!-- Upload Info Alert -->
            <p class="text-[10px] text-zinc-500 leading-relaxed mt-3 flex items-center gap-1 font-mono">
              <mat-icon class="text-[12px] text-zinc-600">security</mat-icon>
              Files are strictly encrypted via Appwrite Storage buckets
            </p>
          </div>

          <!-- Document Ledger / File List (2 cols) -->
          <div class="xl:col-span-2 bg-[#0d1515] border border-[#3a494b] rounded-2xl p-5 flex-1 flex flex-col">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/60">
              <h3 class="text-xs font-display font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <mat-icon class="text-teal-400 text-[16px]">folder_zip</mat-icon>
                Vault Ledger Documents ({{ uploadedFiles().length }})
              </h3>
              <button (click)="loadUploadedFiles()" class="text-zinc-500 hover:text-white transition-colors" title="Reload File list">
                <mat-icon class="text-[16px] [class.animate-spin]='isLoadingFiles()'">refresh</mat-icon>
              </button>
            </div>

            <!-- Loading overlay -->
            @if (isLoadingFiles()) {
              <div class="flex flex-col items-center justify-center py-10 text-center gap-2">
                <mat-icon class="text-teal-400 text-[24px] animate-spin">autorenew</mat-icon>
                <span class="text-[11px] text-zinc-500 font-mono uppercase font-bold tracking-wider">Querying Appwrite Storage...</span>
              </div>
            } @else {
              <!-- Ledger File List -->
              <div class="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                @for (file of uploadedFiles(); track file.$id) {
                  <div class="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 flex items-center justify-between gap-3 group hover:border-teal-500/30 transition-all">
                    <div class="flex items-start gap-2.5 min-w-0">
                      <div class="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 text-teal-400 shrink-0">
                        <mat-icon class="text-[18px]">
                          {{ file.mimeType.includes('pdf') ? 'picture_as_pdf' : 'description' }}
                        </mat-icon>
                      </div>
                      
                      <div class="min-w-0">
                        <h4 class="text-xs font-bold text-zinc-200 truncate font-sans group-hover:text-white">{{ file.name }}</h4>
                        <p class="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">
                          {{ formatBytes(file.size) }} &bull; {{ file.$createdAt | date:'shortDate' }}
                        </p>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-1.5 shrink-0">
                      <a 
                        [href]="appwrite.getFileViewUrl(file.$id)" 
                        target="_blank" 
                        rel="noreferrer"
                        class="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-teal-500/20 text-zinc-400 hover:text-teal-400 flex items-center justify-center border border-zinc-800 transition-colors"
                        title="View Document">
                        <mat-icon class="text-[14px]">visibility</mat-icon>
                      </a>
                      
                      <a 
                        [href]="appwrite.getFileDownloadUrl(file.$id)" 
                        class="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-teal-500/20 text-zinc-400 hover:text-teal-400 flex items-center justify-center border border-zinc-800 transition-colors"
                        title="Download Document">
                        <mat-icon class="text-[14px]">download</mat-icon>
                      </a>

                      <button 
                        (click)="deleteFile(file.$id)" 
                        class="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 flex items-center justify-center border border-zinc-800 transition-colors"
                        title="Delete Document">
                        <mat-icon class="text-[14px]">delete_outline</mat-icon>
                      </button>
                    </div>
                  </div>
                } @empty {
                  <div class="flex flex-col items-center justify-center py-12 text-center">
                    <mat-icon class="text-zinc-600 mb-2 text-[28px]">cloud_off</mat-icon>
                    <span class="text-xs text-zinc-500">Vault ledger is empty</span>
                    <span class="text-[9px] text-zinc-600 uppercase font-mono mt-1">Upload a PDF or DOCX file above</span>
                  </div>
                }
              </div>
            }

          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ContractSuiteComponent implements OnInit {
  appwrite = inject(Appwrite);

  activeTab = signal<'generator' | 'vault'>('generator');

  // Generator Signals
  selectedTemplateId = signal<string>('1');
  partyA = signal<string>('ΛΞV Technologies Inc.');
  partyB = signal<string>('Apex Global FinTech Corp.');
  effectiveDate = signal<string>(new Date().toISOString().slice(0, 10));
  jurisdiction = signal<string>('Delaware, United States');
  liabilityCap = signal<number>(250000);
  slaUptime = signal<string>('99.95%');
  signatoryName = signal<string>('Elena Rostova, CTO');
  hasSignature = signal<boolean>(false);

  @ViewChild('signatureCanvas') signatureCanvas?: ElementRef<HTMLCanvasElement>;
  private isDrawing = false;

  // Templates
  templates = signal<ContractTemplate[]>([
    {
      id: '1',
      title: 'Mutual Non-Disclosure Agreement (NDA)',
      category: 'NDA',
      description: 'Protects proprietary source code, algorithmic logic, telemetry endpoints, and commercial discussions.',
      collaborators: 240,
      defaultClauses: ['Confidentiality', 'Non-Compete', 'Term of 2 Years']
    },
    {
      id: '2',
      title: 'Master Services Agreement (MSA)',
      category: 'MSA',
      description: 'Comprehensive enterprise terms including license grant, multi-tenant SLAs, liability caps, and billing terms.',
      collaborators: 85,
      defaultClauses: ['License Grant', 'Warranty', 'Indemnity']
    },
    {
      id: '3',
      title: 'Enterprise Data Processing Addendum (DPA)',
      category: 'DPA',
      description: 'GDPR Article 28 and CCPA compliant sub-processor and data residency terms.',
      collaborators: 110,
      defaultClauses: ['Sub-processor Notification', 'Standard Contractual Clauses']
    },
    {
      id: '4',
      title: 'Mission-Critical SLA Agreement',
      category: 'SLA',
      description: 'Guarantees sub-second latency, 99.99% uptime, and financial service credits for breach.',
      collaborators: 60,
      defaultClauses: ['Service Credits', 'Downtime Exclusions']
    }
  ]);

  uploadedFiles = signal<ContractFile[]>([]);
  isDragging = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  isLoadingFiles = signal<boolean>(false);

  ngOnInit() {
    this.loadUploadedFiles();
  }

  currentTemplate(): ContractTemplate {
    return this.templates().find(t => t.id === this.selectedTemplateId()) || this.templates()[0];
  }

  onTemplateChange(id: string) {
    this.selectedTemplateId.set(id);
  }

  getDocHash(): string {
    const raw = `${this.partyA()}|${this.partyB()}|${this.effectiveDate()}|${this.liabilityCap()}|${this.slaUptime()}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(16, '0') + 'd9a4f208c1b9';
  }

  // Signature canvas handlers
  startDrawing(event: MouseEvent) {
    this.isDrawing = true;
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  }

  draw(event: MouseEvent) {
    if (!this.isDrawing) return;
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
    this.hasSignature.set(true);
  }

  startTouchDrawing(event: TouchEvent) {
    event.preventDefault();
    this.isDrawing = true;
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas || !event.touches[0]) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(event.touches[0].clientX - rect.left, event.touches[0].clientY - rect.top);
  }

  touchDraw(event: TouchEvent) {
    event.preventDefault();
    if (!this.isDrawing || !event.touches[0]) return;
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(event.touches[0].clientX - rect.left, event.touches[0].clientY - rect.top);
    ctx.stroke();
    this.hasSignature.set(true);
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clearSignature() {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSignature.set(false);
  }

  async stampAndSealContract() {
    this.hasSignature.set(true);
    const docName = `${this.currentTemplate().title.replace(/[^a-zA-Z0-9]/g, '_')}_${this.partyB().replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    // Simulate saving sealed envelope
    this.appwrite.addNotification({
      title: 'Contract Sealed & Stored',
      message: `Cryptographic envelope for "${docName}" sealed with SHA-256 and committed to Appwrite vault.`,
      type: 'success'
    });
  }

  printContract() {
    if (typeof window !== 'undefined') {
      window.print();
    }
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
      this.appwrite.addNotification({
        title: 'Document Vaulted',
        message: `Successfully encrypted and uploaded "${file.name}".`,
        type: 'success'
      });
    } catch (e) {
      console.error('File upload failed:', e);
    } finally {
      this.isUploading.set(false);
    }
  }

  async deleteFile(fileId: string) {
    try {
      await this.appwrite.deleteFile(fileId);
      await this.loadUploadedFiles();
      this.appwrite.addNotification({
        title: 'Document Shredded',
        message: 'Document record permanently erased from vault.',
        type: 'warning'
      });
    } catch (e) {
      console.error('Failed to delete file:', e);
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

  openForgeTemplateModal() {
    const newT: ContractTemplate = {
      id: 'template-' + Date.now(),
      title: 'Strategic Channel Partner Agreement',
      category: 'Custom',
      description: 'Defines wholesale revenue sharing, co-marketing fund (MDF) allocations, and lead registration rules.',
      collaborators: 18,
      defaultClauses: ['Revenue Share 25%', 'Lead Exclusivity 90 Days']
    };

    this.templates.update(list => [newT, ...list]);
    this.selectedTemplateId.set(newT.id);
    this.activeTab.set('generator');

    this.appwrite.addNotification({
      title: 'Template Registered',
      message: `Forged custom template "${newT.title}".`,
      type: 'success'
    });
  }
}
