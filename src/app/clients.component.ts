import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Appwrite } from './appwrite';

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  owner: string;
  expectedCloseDate?: string;
}

@Component({
  selector: 'app-clients',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, DragDropModule],
  template: `
    <div class="max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      
      <!-- Clients Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-4">
        <div>
          <h1 class="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <mat-icon class="text-teal-400 text-[28px]">business</mat-icon>
            Enterprise Portfolio Accounts & Deals
          </h1>
          <p class="text-xs text-zinc-400 mt-1">
            Monitor client account status, execute pipeline progression, and analyze deal values in real time.
          </p>
        </div>

        <div class="flex items-center gap-3 self-start sm:self-auto">
          <!-- Create Deal Button -->
          <button (click)="openDealModal()" class="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20">
            <mat-icon class="text-sm">add</mat-icon>
            New Deal
          </button>

          <!-- View Switcher Tabs -->
          <div class="bg-zinc-950/60 p-1 rounded-xl border border-zinc-800/80 flex gap-1 shadow-inner overflow-x-auto custom-scrollbar">
            <button 
              (click)="activeTab.set('pipeline')"
              [class]="activeTab() === 'pipeline' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold' : 'text-zinc-400 hover:text-zinc-200'"
              class="px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap">
              <mat-icon class="text-sm">view_week</mat-icon>
              Deal Kanban
            </button>
            <button 
              (click)="activeTab.set('accounts')"
              [class]="activeTab() === 'accounts' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold' : 'text-zinc-400 hover:text-zinc-200'"
              class="px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap">
              <mat-icon class="text-sm">list_alt</mat-icon>
              Account Directory
            </button>
            <button 
              (click)="activeTab.set('datasync')"
              [class]="activeTab() === 'datasync' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold' : 'text-zinc-400 hover:text-zinc-200'"
              class="px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap">
              <mat-icon class="text-sm">sync_alt</mat-icon>
              Data Sync
            </button>
            <button 
              (click)="activeTab.set('settings')"
              [class]="activeTab() === 'settings' ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60 font-semibold' : 'text-zinc-400 hover:text-zinc-200'"
              class="px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap">
              <mat-icon class="text-sm">settings</mat-icon>
              Settings
            </button>
          </div>
        </div>
      </header>

      <!-- Search & Filter Bar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/80">
        <div class="relative w-full sm:w-80">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</mat-icon>
          <input 
            type="text" 
            [value]="searchQuery()" 
            (input)="updateSearch($event)" 
            placeholder="Search deals or companies..." 
            class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/50" />
        </div>

        <div class="text-xs text-zinc-400 font-medium">
          Showing <span class="text-teal-400 font-bold font-mono">{{ filteredDeals().length }}</span> active pipeline deals
        </div>
      </div>

      <!-- TAB 1: DEAL KANBAN PIPELINE -->
      @if (activeTab() === 'pipeline') {
        <div class="space-y-6">
          <!-- Pipeline stats summary -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-900/20 backdrop-blur-md p-4 rounded-2xl border border-zinc-800/80">
            <div>
              <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Pipeline Value</span>
              <span class="text-lg font-bold text-teal-400 font-mono">{{ formatCurrency(totalPipelineValue()) }}</span>
            </div>
            <div>
              <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Average Deal Size</span>
              <span class="text-lg font-bold text-white font-mono">{{ formatCurrency(avgDealSize()) }}</span>
            </div>
            <div>
              <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Deals</span>
              <span class="text-lg font-bold text-white font-display">{{ pipelineDeals().length }} Deals</span>
            </div>
            <div>
              <span class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Conversion Rate</span>
              <span class="text-lg font-bold text-emerald-400 font-mono">74.2%</span>
            </div>
          </div>

          <!-- Board layout -->
          <div cdkDropListGroup class="flex flex-nowrap md:grid md:grid-cols-3 lg:flex lg:flex-nowrap gap-4 overflow-x-auto min-h-[500px] pb-6 custom-scrollbar">
            
            <!-- Column Stage Loop -->
            @for (stage of stages(); track stage) {
              <div class="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex flex-col space-y-4 min-w-[280px] w-[280px] shrink-0">
                <!-- Column Header -->
                <div class="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                  <div class="flex items-center gap-2">
                    <span [class]="getStageColorClass(stage)" class="w-2.5 h-2.5 rounded-full"></span>
                    <h3 class="text-xs font-bold text-white tracking-wider uppercase font-display">{{ stage }}</h3>
                  </div>
                  <span class="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full font-bold text-zinc-400 font-mono">
                    {{ getDealsByStage(stage).length }}
                  </span>
                </div>

                <!-- Column Items list -->
                <div 
                  class="flex-1 space-y-3 min-h-[150px]"
                  cdkDropList
                  [cdkDropListData]="getDealsByStage(stage)"
                  (cdkDropListDropped)="handleDrop($event, stage)"
                >
                  @for (deal of getDealsByStage(stage); track deal.id) {
                    <div 
                      cdkDrag 
                      [cdkDragData]="deal"
                      class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 hover:bg-zinc-850/60 transition-all cursor-grab active:cursor-grabbing relative group"
                    >
                      <div *cdkDragPlaceholder class="bg-zinc-950/40 border border-dashed border-zinc-800 rounded-xl h-[120px] transition-all"></div>
                      
                      <!-- Absolute decorative flare on hover -->
                      <div class="absolute inset-y-0 left-0 w-1 bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl"></div>
                      
                      <div class="space-y-1.5">
                        <span class="block text-[9px] font-bold text-teal-400 uppercase tracking-wider font-mono">{{ deal.company }}</span>
                        <h4 class="text-xs font-bold text-zinc-100 leading-snug group-hover:text-white transition-colors">{{ deal.title }}</h4>
                        <p class="text-[11px] font-mono text-zinc-400 font-bold mt-1">{{ formatCurrency(deal.value) }}</p>
                        @if (deal.expectedCloseDate) {
                          <p class="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                            <mat-icon class="text-[12px]">event</mat-icon> {{ deal.expectedCloseDate }}
                          </p>
                        }
                      </div>

                      <div class="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/50">
                        <span class="text-[10px] text-zinc-500 flex items-center gap-1">
                          <mat-icon class="text-[12px] text-zinc-500">person</mat-icon>
                          {{ deal.owner }}
                        </span>
                        
                        <!-- Mini advancement buttons -->
                        <div class="flex items-center gap-1">
                          <button 
                            (click)="openDealModal(deal)"
                            title="Edit Deal"
                            class="p-1 rounded bg-zinc-800 text-zinc-400 hover:bg-teal-500/20 hover:text-teal-400 transition-colors opacity-0 group-hover:opacity-100">
                            <mat-icon class="text-xs">edit</mat-icon>
                          </button>
                          <button 
                            (click)="deleteDeal(deal.id)"
                            title="Delete Deal"
                            class="p-1 rounded bg-zinc-800 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                            <mat-icon class="text-xs">delete</mat-icon>
                          </button>
                        </div>
                      </div>

                    </div>
                  } @empty {
                    <!-- Empty Column placeholder -->
                    <div class="h-32 rounded-xl border border-dashed border-zinc-800/80 flex flex-col items-center justify-center text-center p-4">
                      <p class="text-[10px] text-zinc-600 font-medium">No candidates in stage</p>
                    </div>
                  }
                </div>

                <!-- Add quick deal placeholder button -->
                <button 
                  (click)="quickAddDeal(stage)"
                  class="w-full py-2 bg-zinc-900/20 hover:bg-zinc-800 border border-dashed border-zinc-800/80 rounded-xl text-[11px] text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-1.5 font-medium">
                  <mat-icon class="text-xs">add</mat-icon>
                  Quick Deal
                </button>

              </div>
            }

          </div>
        </div>
      }

      <!-- TAB 2: PORTFOLIO CLIENT ACCOUNTS DIRECTORY -->
      @if (activeTab() === 'accounts') {
        <div class="space-y-6">
          <div class="text-xs text-zinc-400 bg-zinc-950/40 p-4 border border-zinc-800 rounded-2xl flex items-center justify-between">
            <span>Showing key enterprise accounts synchronized with your workspace. Add contacts on the 
            <a href="/contacts" class="text-teal-400 font-bold underline hover:text-teal-300">Contacts Desk</a> 
            to enrich this client intelligence directory automatically.</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (client of clientAccounts(); track client.name) {
              <div class="bg-zinc-900/40 border border-zinc-800 hover:border-teal-500/20 rounded-2xl p-6 transition-all relative overflow-hidden group">
                
                <!-- Glowing corner accent -->
                <div class="absolute -right-12 -top-12 w-28 h-28 bg-teal-500/5 blur-3xl rounded-full group-hover:bg-teal-500/10 transition-all duration-500"></div>

                <div class="flex items-start gap-4 mb-5">
                  <div class="w-12 h-12 bg-zinc-800 rounded-xl border border-zinc-700/80 flex items-center justify-center text-teal-400 shadow-md">
                    <mat-icon class="text-[25px]">business</mat-icon>
                  </div>
                  <div>
                    <h3 class="text-white font-bold text-base font-display tracking-tight">{{ client.name }}</h3>
                    <p class="text-zinc-500 text-xs mt-0.5">{{ client.region || 'Enterprise Account' }} &bull; Portfolio Client</p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3 bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-900 font-sans mb-5">
                  <div>
                    <span class="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Active Deals</span>
                    <span class="text-xs font-bold text-zinc-200">{{ client.activeDealsCount }}</span>
                  </div>
                  <div>
                    <span class="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Account Pipeline</span>
                    <span class="text-xs font-bold text-teal-400 font-mono">{{ formatCurrency(client.totalPipeline) }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full" [class]="client.status === 'Active' ? 'bg-teal-400' : 'bg-zinc-600'"></span>
                    <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{{ client.status }} Account</span>
                  </div>
                  <button 
                    (click)="triggerAccountCampaign(client.name)"
                    class="text-teal-400 text-xs font-bold hover:text-teal-300 transition-colors flex items-center gap-1 bg-teal-400/10 px-2.5 py-1.5 rounded-lg border border-teal-400/20">
                    <mat-icon class="text-xs">bolt</mat-icon>
                    Nurture AI
                  </button>
                </div>

              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 3: DATA SYNC (IMPORT/EXPORT) -->
      @if (activeTab() === 'datasync') {
        <div class="space-y-6">
          <div class="text-xs text-zinc-400 bg-zinc-950/40 p-4 border border-zinc-800 rounded-2xl flex items-center justify-between">
            <span>Import or export your pipeline data via CSV.</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Export Section -->
            <div class="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
              <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <mat-icon class="text-teal-400">download</mat-icon> Export Pipeline Data
              </h2>
              <div class="space-y-4">
                <div>
                  <label for="exportStatus" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Filter by Status</label>
                  <select id="exportStatus" #exportStatus class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
                    <option value="All">All Stages</option>
                    @for (stage of stages(); track stage) {
                      <option [value]="stage">{{ stage }}</option>
                    }
                  </select>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label for="exportStartDate" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Date Range (Start)</label>
                    <input id="exportStartDate" type="date" #startDate class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
                  </div>
                  <div>
                    <label for="exportEndDate" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Date Range (End)</label>
                    <input id="exportEndDate" type="date" #endDate class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
                  </div>
                </div>
                <button (click)="exportCSV(exportStatus.value, startDate.value, endDate.value)" class="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2">
                  <mat-icon class="text-[18px]">download</mat-icon> Download CSV
                </button>
              </div>
            </div>

            <!-- Import Section -->
            <div class="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
              <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <mat-icon class="text-teal-400">upload</mat-icon> Import Pipeline Data
              </h2>
              <div class="space-y-4">
                <button type="button" class="w-full border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center bg-zinc-950/50 hover:bg-zinc-900/50 transition-colors cursor-pointer" (click)="fileInput.click()">
                  <input type="file" #fileInput class="hidden" accept=".csv" (change)="handleFileSelect($event)" tabindex="-1">
                  <mat-icon class="text-zinc-500 text-4xl mb-2">upload_file</mat-icon>
                  <p class="text-sm font-bold text-white">Click to upload CSV</p>
                  <p class="text-xs text-zinc-500 mt-1">Map columns automatically</p>
                </button>

                @if (selectedFileName()) {
                  <div class="bg-zinc-800/50 rounded-lg p-3 flex justify-between items-center border border-zinc-700">
                    <span class="text-xs text-white truncate"><mat-icon class="text-[14px] inline align-middle mr-1">description</mat-icon> {{ selectedFileName() }}</span>
                    <button class="text-zinc-400 hover:text-white" (click)="clearFile()">
                      <mat-icon class="text-[16px]">close</mat-icon>
                    </button>
                  </div>
                  
                  <div class="space-y-2">
                    <p class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Column Mapping</p>
                    <div class="grid grid-cols-2 gap-2 text-xs items-center p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <label for="mapTitle" class="text-zinc-300">Deal Title</label>
                      <select id="mapTitle" [value]="columnMapping()['title']" (change)="updateMapping('title', $event)" class="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white">
                        <option value="">-- Default --</option>
                        @for (col of csvHeaders(); track col; let i = $index) {
                          <option [value]="i">{{ col }}</option>
                        }
                      </select>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs items-center p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <label for="mapCompany" class="text-zinc-300">Company</label>
                      <select id="mapCompany" [value]="columnMapping()['company']" (change)="updateMapping('company', $event)" class="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white">
                        <option value="">-- Default --</option>
                        @for (col of csvHeaders(); track col; let i = $index) {
                          <option [value]="i">{{ col }}</option>
                        }
                      </select>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs items-center p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <label for="mapValue" class="text-zinc-300">Value ($)</label>
                      <select id="mapValue" [value]="columnMapping()['value']" (change)="updateMapping('value', $event)" class="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white">
                        <option value="">-- Default --</option>
                        @for (col of csvHeaders(); track col; let i = $index) {
                          <option [value]="i">{{ col }}</option>
                        }
                      </select>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs items-center p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <label for="mapStage" class="text-zinc-300">Stage</label>
                      <select id="mapStage" [value]="columnMapping()['stage']" (change)="updateMapping('stage', $event)" class="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white">
                        <option value="">-- Default --</option>
                        @for (col of csvHeaders(); track col; let i = $index) {
                          <option [value]="i">{{ col }}</option>
                        }
                      </select>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs items-center p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <label for="mapOwner" class="text-zinc-300">Owner</label>
                      <select id="mapOwner" [value]="columnMapping()['owner']" (change)="updateMapping('owner', $event)" class="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white">
                        <option value="">-- Default --</option>
                        @for (col of csvHeaders(); track col; let i = $index) {
                          <option [value]="i">{{ col }}</option>
                        }
                      </select>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs items-center p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <label for="mapDate" class="text-zinc-300">Expected Close</label>
                      <select id="mapDate" [value]="columnMapping()['expectedCloseDate']" (change)="updateMapping('expectedCloseDate', $event)" class="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white">
                        <option value="">-- Default --</option>
                        @for (col of csvHeaders(); track col; let i = $index) {
                          <option [value]="i">{{ col }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <button (click)="importCSV()" class="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2">
                    <mat-icon class="text-[18px]">publish</mat-icon> Import Data
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB 4: SETTINGS -->
      @if (activeTab() === 'settings') {
        <div class="space-y-6">
          <div class="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <mat-icon class="text-teal-400">tune</mat-icon> Customize Pipeline Stages
            </h2>
            <div class="space-y-4 max-w-lg">
              <p class="text-xs text-zinc-400">Add, remove, or reorder your sales pipeline stages.</p>
              
              <div class="space-y-2">
                @for (stage of stages(); track stage; let i = $index) {
                  <div class="flex items-center gap-2">
                    <input 
                      type="text" 
                      [value]="stage" 
                      (change)="updateStage(i, $event)"
                      class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
                    <button 
                      (click)="removeStage(i)"
                      class="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 hover:text-rose-400 hover:border-rose-500/50 transition-colors">
                      <mat-icon class="text-[16px]">delete</mat-icon>
                    </button>
                  </div>
                }
              </div>
              
              <button 
                (click)="addStage()"
                class="w-full py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-300 transition-all flex items-center justify-center gap-2">
                <mat-icon class="text-[16px]">add</mat-icon> Add Stage
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Custom New Deal Modal -->
      @if (isDealModalOpen()) {
        <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" (click)="closeDealModal()" (keydown.escape)="closeDealModal()" tabindex="0" role="dialog" aria-modal="true">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
            <div class="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <h2 class="text-lg font-bold text-white font-display">Create Custom Deal</h2>
              <button (click)="closeDealModal()" class="text-zinc-500 hover:text-zinc-300">
                <mat-icon class="text-[20px]">close</mat-icon>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label for="deal-title" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Deal Title *</label>
                <input id="deal-title" type="text" #titleInput [value]="editingDeal()?.title || ''" placeholder="e.g. Enterprise SLA Migration Contract" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
              </div>

              <div>
                <label for="deal-company" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Company Name *</label>
                <input id="deal-company" type="text" #companyInput [value]="editingDeal()?.company || ''" placeholder="e.g. Acme Corp" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="deal-value" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Deal Value ($)</label>
                  <input id="deal-value" type="number" #valueInput [value]="editingDeal()?.value || 75000" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
                </div>

                <div>
                  <label for="deal-stage" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Stage</label>
                  <select id="deal-stage" #stageInput [value]="editingDeal()?.stage || stages()[0]" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
                    @for (stage of stages(); track stage) {
                      <option [value]="stage">{{ stage }}</option>
                    }
                  </select>
                </div>
              </div>

              <div>
                <label for="deal-owner" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Deal Owner / Contact</label>
                <input id="deal-owner" type="text" #ownerInput [value]="editingDeal()?.owner || ''" placeholder="e.g. Sarah Jenkins" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
              </div>

              <div>
                <label for="deal-date" class="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Expected Close Date</label>
                <input id="deal-date" type="date" #dateInput [value]="editingDeal()?.expectedCloseDate || ''" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500">
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3 border-t border-zinc-800/80 pt-4">
              <button (click)="closeDealModal()" class="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-colors">Cancel</button>
              <button (click)="saveDeal(titleInput.value, companyInput.value, valueInput.value, stageInput.value, ownerInput.value, dateInput.value)" class="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-zinc-950 font-bold rounded-xl transition-all text-xs shadow-lg shadow-teal-500/20">
                {{ editingDeal() ? 'Save Changes' : 'Create Deal' }}
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ClientsComponent {
  appwrite = inject(Appwrite);

  activeTab = signal<'pipeline' | 'accounts' | 'datasync' | 'settings'>('pipeline');
  searchQuery = signal('');
  isDealModalOpen = signal(false);
  selectedFileName = signal<string | null>(null);
  selectedFileContent = signal<string | null>(null);
  csvHeaders = signal<string[]>([]);
  csvData = signal<string[][]>([]);
  columnMapping = signal<Record<string, string>>({
    title: '',
    company: '',
    value: '',
    stage: '',
    owner: '',
    expectedCloseDate: ''
  });
  
  stages = signal<string[]>([
    'Lead', 'Contacted', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'
  ]);

  editingDeal = signal<Deal | null>(null);

  // Pipeline deals state
  pipelineDeals = signal<Deal[]>([
    { id: 'deal-1', title: 'Enterprise Cloud SLA Integration', company: 'Microsoft', value: 450000, stage: 'Closed Won', owner: 'Bill Gates', expectedCloseDate: '2026-10-15' },
    { id: 'deal-2', title: 'Workspace Expansion Suite v2', company: 'Salesforce', value: 180000, stage: 'Proposal Sent', owner: 'Marc Benioff', expectedCloseDate: '2026-09-01' },
    { id: 'deal-3', title: 'Productivity Platform Co-Investment', company: 'Slack', value: 65000, stage: 'Lead', owner: 'Stewart Butterfield' },
    { id: 'deal-4', title: 'Corporate Logistics Renewal SLA', company: 'FedEx Corp', value: 125000, stage: 'Negotiation', owner: 'Fred Smith', expectedCloseDate: '2026-08-30' },
    { id: 'deal-5', title: 'SaaS Platform Analytics Suite', company: 'Acme Corp', value: 35000, stage: 'Contacted', owner: 'Sarah Jenkins' }
  ]);

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  filteredDeals = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.pipelineDeals();
    return this.pipelineDeals().filter(d => 
      d.title.toLowerCase().includes(q) || 
      d.company.toLowerCase().includes(q) ||
      d.owner.toLowerCase().includes(q)
    );
  });

  // Derived dashboard analytics
  totalPipelineValue = computed(() => {
    return this.pipelineDeals().reduce((acc, current) => acc + current.value, 0);
  });

  avgDealSize = computed(() => {
    const deals = this.pipelineDeals();
    return deals.length > 0 ? (this.totalPipelineValue() / deals.length) : 0;
  });

  // Unique clients derived from contacts database
  clientAccounts = computed(() => {
    interface ClientCompany {
      name: string;
      region: string;
      activeDealsCount: number;
      totalPipeline: number;
      status: string;
    }
    const list = this.appwrite.contacts();
    const map = new Map<string, ClientCompany>();

    const seedCompanies: ClientCompany[] = [
      { name: 'Microsoft', region: 'Seattle, WA', activeDealsCount: 1, totalPipeline: 450000, status: 'Active' },
      { name: 'Salesforce', region: 'San Francisco, CA', activeDealsCount: 1, totalPipeline: 180000, status: 'Active' },
      { name: 'Slack', region: 'Vancouver, BC', activeDealsCount: 1, totalPipeline: 65000, status: 'Active' },
      { name: 'FedEx Corp', region: 'Memphis, TN', activeDealsCount: 1, totalPipeline: 125000, status: 'Active' },
      { name: 'Acme Corp', region: 'Austin, TX', activeDealsCount: 1, totalPipeline: 35000, status: 'Active' }
    ];

    seedCompanies.forEach(sc => map.set(sc.name, sc));

    list.forEach(c => {
      if (c.company) {
        if (map.has(c.company)) {
          const current = map.get(c.company);
          if (current) {
            map.set(c.company, {
              ...current,
              activeDealsCount: current.activeDealsCount + 1,
              totalPipeline: current.totalPipeline + (parseFloat(c.dealValue) || 15000)
            });
          }
        } else {
          map.set(c.company, {
            name: c.company,
            region: 'Global Portfolio',
            activeDealsCount: 1,
            totalPipeline: parseFloat(c.dealValue) || 15000,
            status: 'Active'
          });
        }
      }
    });

    return Array.from(map.values());
  });

  getDealsByStage(stage: string): Deal[] {
    return this.filteredDeals().filter(d => d.stage === stage);
  }

  updateStage(index: number, event: Event) {
    const newName = (event.target as HTMLInputElement).value.trim();
    if (newName) {
      const oldName = this.stages()[index];
      this.stages.update(arr => {
        const newStages = [...arr];
        newStages[index] = newName;
        return newStages;
      });
      this.pipelineDeals.update(deals => deals.map(d => 
        d.stage === oldName ? { ...d, stage: newName } : d
      ));
      this.appwrite.addNotification({
        title: 'Stage Updated',
        message: `Pipeline stage renamed to "${newName}".`,
        type: 'success'
      });
    }
  }

  removeStage(index: number) {
    if (confirm('Are you sure you want to remove this stage? Deals in this stage will be moved to the first stage.')) {
      const removedStage = this.stages()[index];
      this.stages.update(arr => arr.filter((_, i) => i !== index));
      
      const fallbackStage = this.stages()[0] || 'Lead';
      this.pipelineDeals.update(deals => deals.map(d => 
        d.stage === removedStage ? { ...d, stage: fallbackStage } : d
      ));
    }
  }

  addStage() {
    this.stages.update(arr => [...arr, `New Stage ${arr.length + 1}`]);
  }

  getStageColorClass(stage: string): string {
    if (stage.toLowerCase().includes('lead')) return 'bg-teal-500';
    if (stage.toLowerCase().includes('contacted')) return 'bg-sky-400';
    if (stage.toLowerCase().includes('proposal')) return 'bg-amber-400';
    if (stage.toLowerCase().includes('negotiation')) return 'bg-violet-400';
    if (stage.toLowerCase().includes('won')) return 'bg-emerald-400';
    if (stage.toLowerCase().includes('lost')) return 'bg-rose-500';
    return 'bg-zinc-500';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  openDealModal(deal?: Deal) {
    if (deal) {
      this.editingDeal.set(deal);
    } else {
      this.editingDeal.set(null);
    }
    this.isDealModalOpen.set(true);
  }

  closeDealModal() {
    this.isDealModalOpen.set(false);
  }

  saveDeal(title: string, company: string, valueStr: string, stageRaw: string, owner: string, expectedCloseDate: string) {
    if (!title.trim() || !company.trim()) return;

    const value = parseFloat(valueStr) || 25000;
    const stage = stageRaw || this.stages()[0];

    const currentDeal = this.editingDeal();

    if (currentDeal) {
      this.pipelineDeals.update(arr => arr.map(d => d.id === currentDeal.id ? {
        ...d,
        title,
        company,
        value,
        stage,
        owner: owner.trim() || 'Account Executive',
        expectedCloseDate
      } : d));
      
      this.appwrite.addNotification({
        title: 'Deal Updated',
        message: `Updated deal "${title}".`,
        type: 'success'
      });
    } else {
      const newDeal: Deal = {
        id: 'custom-' + Date.now(),
        title,
        company,
        value,
        stage,
        owner: owner.trim() || 'Account Executive',
        expectedCloseDate
      };
  
      this.pipelineDeals.update(arr => [...arr, newDeal]);
  
      this.appwrite.addNotification({
        title: 'Deal Created',
        message: `Created deal "${title}" for ${company} ($${(value / 1000).toFixed(0)}k).`,
        type: 'success'
      });
    }

    this.closeDealModal();
  }

  advanceDeal(id: string) {
    this.pipelineDeals.update(deals => {
      return deals.map(d => {
        if (d.id === id) {
          const targetIndex = this.stages().indexOf(d.stage) + 1;
          const nextStage = this.stages()[targetIndex] || d.stage;
          
          if (nextStage === 'Closed Won') {
            this.appwrite.addNotification({
              title: 'Deal Closed Won!',
              message: `Congratulations! ${d.company}'s deal "${d.title}" progressed to CLOSED WON!`,
              type: 'success'
            });
          } else {
            this.appwrite.addNotification({
              title: 'Deal Stage Advanced',
              message: `Moved "${d.title}" to ${nextStage}`,
              type: 'info'
            });
          }
          return { ...d, stage: nextStage };
        }
        return d;
      });
    });
  }

  deleteDeal(id: string) {
    if (confirm('Are you sure you want to remove this deal from the interactive pipeline?')) {
      this.pipelineDeals.update(arr => arr.filter(d => d.id !== id));
      this.appwrite.addNotification({
        title: 'Deal Removed',
        message: 'Deal removed from active pipeline.',
        type: 'warning'
      });
    }
  }

  quickAddDeal(stage: string) {
    const titles = [
      'Strategic API Consultation SLA',
      'Unified Identity SaaS Upgrade',
      'Advanced Marketing Insights Suite',
      'Data Lake Storage Partnership'
    ];
    const companies = ['Google Cloud', 'Netflix Inc', 'Airbnb Corp', 'Stripe Inc'];
    const values = [45000, 95000, 150000, 310000];
    const owners = ['Sundar Pichai', 'Reed Hastings', 'Brian Chesky', 'Patrick Collison'];

    const randomIndex = Math.floor(Math.random() * titles.length);
    
    const newDeal: Deal = {
      id: 'custom-' + Date.now(),
      title: titles[randomIndex],
      company: companies[randomIndex],
      value: values[randomIndex],
      stage,
      owner: owners[randomIndex]
    };

    this.pipelineDeals.update(arr => [...arr, newDeal]);

    this.appwrite.addNotification({
      title: 'Deal Registered',
      message: `Registered quick pipeline deal for ${newDeal.company} valued at $${newDeal.value / 1000}k`,
      type: 'info'
    });
  }

  handleDrop(event: CdkDragDrop<Deal[]>, targetStage: string) {
    if (event.previousContainer === event.container) {
      // Reordering not implemented/needed for simple columns yet
      return;
    }

    const deal = event.item.data as Deal;
    if (deal && deal.id) {
      this.pipelineDeals.update(deals => 
        deals.map(d => d.id === deal.id ? { ...d, stage: targetStage as Deal['stage'] } : d)
      );

      this.appwrite.addNotification({
        title: 'Deal Stage Updated',
        message: `Moved "${deal.title}" to ${targetStage}`,
        type: 'info'
      });
    }
  }

  handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFileName.set(file.name);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        this.selectedFileContent.set(content);
        
        const lines = content.split('\n').filter(l => l.trim() !== '');
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.replace(/["']/g, '').trim());
          this.csvHeaders.set(headers);
          
          const data = lines.slice(1).map(l => l.split(',').map(c => c.replace(/["']/g, '').trim()));
          this.csvData.set(data);
          
          const mapping: Record<string, string> = {
             title: headers.findIndex(h => h.toLowerCase().includes('title') || h.toLowerCase().includes('deal')).toString(),
             company: headers.findIndex(h => h.toLowerCase().includes('company') || h.toLowerCase().includes('client')).toString(),
             value: headers.findIndex(h => h.toLowerCase().includes('value') || h.toLowerCase().includes('amount')).toString(),
             stage: headers.findIndex(h => h.toLowerCase().includes('stage') || h.toLowerCase().includes('status')).toString(),
             owner: headers.findIndex(h => h.toLowerCase().includes('owner') || h.toLowerCase().includes('rep')).toString(),
             expectedCloseDate: headers.findIndex(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('expected')).toString(),
          };
          
          Object.keys(mapping).forEach(k => {
            if (mapping[k] === '-1') mapping[k] = '';
          });
          
          this.columnMapping.set(mapping);
        }
      };
      reader.readAsText(file);
    }
  }

  updateMapping(field: string, event: Event) {
    const select = event.target as HTMLSelectElement;
    this.columnMapping.update(m => ({ ...m, [field]: select.value }));
  }

  clearFile() {
    this.selectedFileName.set(null);
    this.selectedFileContent.set(null);
    this.csvHeaders.set([]);
    this.csvData.set([]);
  }

  importCSV() {
    const data = this.csvData();
    if (!data || data.length === 0) return;
    
    const mapping = this.columnMapping();
    
    const titleIdx = parseInt(mapping['title']);
    const companyIdx = parseInt(mapping['company']);
    const valueIdx = parseInt(mapping['value']);
    const stageIdx = parseInt(mapping['stage']);
    const ownerIdx = parseInt(mapping['owner']);
    const dateIdx = parseInt(mapping['expectedCloseDate']);
    
    const importedDeals = data.map((parts, index) => {
      let stageStr = (!isNaN(stageIdx) && stageIdx >= 0) ? parts[stageIdx] : 'Lead';
      if (!this.stages().includes(stageStr as Deal['stage'])) stageStr = 'Lead';
      
      return {
        id: 'imported-' + Date.now() + '-' + index,
        title: (!isNaN(titleIdx) && titleIdx >= 0) ? parts[titleIdx] : 'Imported Deal',
        company: (!isNaN(companyIdx) && companyIdx >= 0) ? parts[companyIdx] : 'Unknown Company',
        value: (!isNaN(valueIdx) && valueIdx >= 0) ? parseFloat(parts[valueIdx]) || 0 : 0,
        stage: stageStr as Deal['stage'],
        owner: (!isNaN(ownerIdx) && ownerIdx >= 0) ? parts[ownerIdx] : 'System Import',
        expectedCloseDate: (!isNaN(dateIdx) && dateIdx >= 0) ? parts[dateIdx] : undefined
      };
    });
    
    this.pipelineDeals.update(arr => [...arr, ...importedDeals]);
    this.clearFile();
    this.appwrite.addNotification({
      title: 'Import Successful',
      message: `Imported ${importedDeals.length} deals successfully.`,
      type: 'success'
    });
  }

  exportCSV(status: string, startDate?: string, endDate?: string) {
    let deals = this.pipelineDeals();
    if (status !== 'All') {
      deals = deals.filter(d => d.stage === status);
    }
    
    // Filter by Date Range if expectedCloseDate exists on items
    if (startDate) {
      deals = deals.filter(d => d.expectedCloseDate && new Date(d.expectedCloseDate) >= new Date(startDate));
    }
    
    if (endDate) {
      deals = deals.filter(d => d.expectedCloseDate && new Date(d.expectedCloseDate) <= new Date(endDate));
    }
    
    // Basic CSV generation
    const header = 'Title,Company,Value,Stage,Owner,ExpectedCloseDate\n';
    const rows = deals.map(d => `"${d.title}","${d.company}",${d.value},"${d.stage}","${d.owner}","${d.expectedCloseDate || ''}"`).join('\n');
    const csv = header + rows;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    this.appwrite.addNotification({
      title: 'Export Complete',
      message: `Pipeline data exported to CSV (${deals.length} deals).`,
      type: 'success'
    });
  }

  triggerAccountCampaign(clientName: string) {
    this.appwrite.addNotification({
      title: 'AI Nurture Activated',
      message: `Triggered outreach intelligence scan for ${clientName}. Insights compiling on dashboard.`,
      type: 'info'
    });
  }
}
