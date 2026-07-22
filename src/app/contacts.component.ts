import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Appwrite } from './appwrite';

export interface ContactRecord {
  $id: string;
  name: string;
  email?: string;
  phone?: string;
  company: string;
  status: string;
  dealValue: number;
  lastContacted?: string;
}

@Component({
  selector: 'app-contacts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="max-w-[1600px] mx-auto space-y-8 animate-fade-in px-2 md:px-0 h-full flex flex-col">
      
      <!-- Contacts Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-2 flex-shrink-0">
        <div>
          <h1 class="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
              <mat-icon class="text-teal-400 text-[24px]">contact_page</mat-icon>
            </div>
            Relationship Intelligence
          </h1>
          <p class="text-sm text-zinc-400 mt-2">
            Master Rolodex for post-conversion relationship tracking, AI outreach generation, and activity histories.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Button to trigger Add Contact modal -->
          <button (click)="openAddModal()" class="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20">
            <mat-icon class="text-[18px]">person_add</mat-icon>
            New Record
          </button>
        </div>
      </header>

      <!-- Search & Filters Block -->
      <div class="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 justify-between items-center shadow-xl flex-shrink-0 relative z-20">
        <!-- Search Box -->
        <div class="relative w-full lg:w-[450px]">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <mat-icon class="text-zinc-500 text-[18px]">search</mat-icon>
          </span>
          <input 
            type="text" 
            placeholder="Query records by name, organisation, or email segment..."
            [value]="searchQuery()"
            (input)="onSearchChange($event)"
            class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-colors shadow-inner" />
        </div>

        <!-- Filter Pills -->
        <div class="flex flex-wrap items-center gap-2 w-full lg:w-auto p-1 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
          @for (s of ['All', 'Lead', 'Opportunity', 'Customer']; track s) {
            <button 
              (click)="activeStatusFilter.set(s)"
              [class]="activeStatusFilter() === s 
                ? 'bg-zinc-800 text-white border-zinc-700 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300 border-transparent hover:bg-zinc-900'"
              class="px-4 py-1.5 rounded-lg border text-xs font-bold transition-all">
              {{ s }}
            </button>
          }
        </div>
      </div>

      <!-- Main CRM Grid: Table and Sidebar outreach generator -->
      <div class="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 relative z-10 pb-6">
        
        <!-- Left Column: Contacts List -->
        <div class="flex-1 flex flex-col bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
            @if (filteredContacts().length === 0) {
              <div class="p-16 text-center flex-1 flex flex-col items-center justify-center min-h-[400px]">
                <div class="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-800 shadow-inner">
                  <mat-icon class="text-zinc-500 text-3xl">people_outline</mat-icon>
                </div>
                <h4 class="text-white font-display text-xl font-bold">No relationship records found</h4>
                <p class="text-zinc-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">Relax query constraints or initialize a new record via the 'New Record' button to begin tracking interactions.</p>
              </div>
            } @else {
              <div class="overflow-y-auto custom-scrollbar flex-1">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="bg-zinc-950/80 backdrop-blur-md text-zinc-400 font-bold border-b border-zinc-800 uppercase tracking-widest sticky top-0 z-10">
                    <tr>
                      <th class="py-4 px-6 text-[10px]">Identity</th>
                      <th class="py-4 px-6 text-[10px]">Organisation Base</th>
                      <th class="py-4 px-6 text-[10px]">Engagement Stage</th>
                      <th class="py-4 px-6 text-[10px]">LTV Potential</th>
                      <th class="py-4 px-6 text-[10px]">Last Sync</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-800/40 font-medium">
                    @for (c of filteredContacts(); track c.$id) {
                      <tr 
                        (click)="selectContact(c)"
                        [class.bg-teal-500/10]="selectedContact()?.$id === c.$id"
                        [class.border-l-2]="true"
                        [class.border-l-teal-500]="selectedContact()?.$id === c.$id"
                        [class.border-l-transparent]="selectedContact()?.$id !== c.$id"
                        class="hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                        
                        <!-- Contact Info Column -->
                        <td class="py-4 px-6">
                          <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 text-teal-400 flex items-center justify-center font-bold font-display text-sm group-hover:border-teal-500/30 transition-colors shadow-inner">
                              {{ getAcronym(c.name) }}
                            </div>
                            <div>
                              <p class="text-white font-bold text-sm leading-tight">{{ c.name }}</p>
                              <div class="flex items-center gap-1.5 mt-1 text-zinc-500 group-hover:text-zinc-400 transition-colors">
                                <mat-icon class="text-[12px] opacity-70">email</mat-icon>
                                <span class="text-[11px]">{{ c.email || '—' }}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <!-- Company Column -->
                        <td class="py-4 px-6 align-middle">
                          <div class="flex items-center gap-2">
                             <div class="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                                <mat-icon class="text-[14px] text-zinc-400">domain</mat-icon>
                             </div>
                             <div class="flex flex-col">
                               <span class="text-zinc-200 font-bold text-xs">{{ c.company || 'Independent' }}</span>
                               <span class="text-zinc-600 text-[10px] mt-0.5">{{ c.phone || 'No direct dial' }}</span>
                             </div>
                          </div>
                        </td>

                        <!-- Deal Stage Status Column -->
                        <td class="py-4 px-6 align-middle">
                          <span [class]="getStageBadgeClass(c.status || 'Lead')" 
                                class="inline-flex px-2.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider items-center gap-1.5 shadow-sm">
                            <div class="w-1.5 h-1.5 rounded-full bg-current"></div>
                            {{ c.status || 'Lead' }}
                          </span>
                        </td>

                        <!-- Deal Value Column -->
                        <td class="py-4 px-6 align-middle">
                          <span class="text-zinc-300 font-mono font-bold text-sm">
                            @if (c.status === 'Customer') {
                               <span class="text-emerald-400">{{ formatCurrency(c.dealValue) }}</span>
                            } @else {
                               {{ formatCurrency(c.dealValue) }}
                            }
                          </span>
                        </td>

                        <!-- Last Sync -->
                        <td class="py-4 px-6 align-middle text-zinc-500 text-xs">
                          {{ c.lastContacted || '2 days ago' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
        </div>

        <!-- Sidebar column: Selected Contact Deep Detail Panel -->
        @if (selectedContact(); as userRec) {
          <div class="w-full lg:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-800/80 bg-zinc-950/80 backdrop-blur-2xl rounded-2xl lg:rounded-none lg:rounded-r-2xl overflow-y-auto custom-scrollbar flex flex-col animate-slide-in relative border border-zinc-800 shadow-2xl">
            
            <div class="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full pointer-events-none"></div>

            <!-- Profile Header Detail -->
            <div class="p-6 border-b border-zinc-800/60 bg-zinc-900/20 relative z-10">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-b from-teal-500/20 to-teal-900/20 border border-teal-500/30 flex items-center justify-center font-display font-bold text-teal-300 text-2xl shadow-[0_0_20px_rgba(20,184,166,0.15)] relative">
                  {{ getAcronym(userRec.name) }}
                  <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-zinc-950"></div>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-white font-display leading-tight">{{ userRec.name }}</h3>
                  <p class="text-sm text-teal-400 font-semibold mt-0.5 flex items-center gap-1"><mat-icon class="text-[16px]">business</mat-icon> {{ userRec.company }}</p>
                </div>
                
                <button (click)="selectedContact.set(null)" class="w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-500 lg:hidden">
                    <mat-icon>close</mat-icon>
                </button>
              </div>

              <!-- Quick action links -->
              <div class="flex gap-2 mt-5">
                 <a href="mailto:{{userRec.email}}" class="flex-1 bg-zinc-900 hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/30 text-zinc-300 border border-zinc-800 rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-2">
                    <mat-icon class="text-[16px]">email</mat-icon> Email
                 </a>
                 <a href="tel:{{userRec.phone}}" class="flex-1 bg-zinc-900 hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/30 text-zinc-300 border border-zinc-800 rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-2">
                    <mat-icon class="text-[16px]">phone</mat-icon> Call
                 </a>
                 <button (click)="openEditModal(userRec)" class="w-10 bg-zinc-900 hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/30 text-zinc-400 border border-zinc-800 rounded-xl flex items-center justify-center transition-all shrink-0" title="Edit Profile">
                    <mat-icon class="text-[16px]">edit</mat-icon>
                 </button>
                 <button (click)="deleteContactRecord(userRec.$id)" class="w-10 bg-zinc-900 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 text-zinc-400 border border-zinc-800 rounded-xl flex items-center justify-center transition-all shrink-0" title="Delete Profile">
                    <mat-icon class="text-[16px]">delete</mat-icon>
                 </button>
              </div>
            </div>

            <div class="p-6 space-y-8 flex-1 relative z-10">
              <!-- CRM Data Board -->
              <div>
                <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <mat-icon class="text-[14px]">insights</mat-icon> Record Intel
                </h4>
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                    <span class="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Lifecycle Phase</span>
                    <span class="text-sm font-bold text-white flex items-center gap-1.5">
                       <div class="w-2 h-2 rounded-full" [class]="userRec.status === 'Customer' ? 'bg-emerald-500' : 'bg-teal-500'"></div>
                       {{ userRec.status || 'Lead' }}
                    </span>
                  </div>
                  <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                    <span class="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Pipeline Value</span>
                    <span class="text-sm font-bold text-teal-400 font-mono">{{ formatCurrency(userRec.dealValue) }}</span>
                  </div>
                  <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 col-span-2 flex justify-between items-center">
                    <div>
                        <span class="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Primary Email</span>
                        <span class="text-xs font-medium text-zinc-300">{{ userRec.email || 'No email attached' }}</span>
                    </div>
                    <mat-icon class="text-zinc-600">content_copy</mat-icon>
                  </div>
                </div>
              </div>

              <!-- AI Synthesizer -->
              <div class="border-t border-zinc-800/80 pt-6">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <mat-icon class="text-[14px] text-teal-500">memory</mat-icon>
                    AI Comms Synthesizer
                  </h4>
                  <span class="text-[9px] text-teal-400/80 bg-teal-400/10 px-1.5 py-0.5 rounded font-mono font-bold border border-teal-500/20">GEMINI PRO</span>
                </div>

                <div class="space-y-3">
                  <div class="flex rounded-lg bg-zinc-950 p-1 border border-zinc-800">
                    @for (tone of ['Expert', 'Direct', 'Bold']; track tone) {
                      <button 
                        (click)="selectedTone.set(tone)"
                        [class]="selectedTone() === tone ? 'bg-zinc-800 text-teal-400 shadow-sm font-bold' : 'text-zinc-500 hover:text-zinc-300 font-medium'"
                        class="flex-1 py-1.5 text-[10px] uppercase tracking-wider rounded-md transition-all text-center">
                        {{ tone }}
                      </button>
                    }
                  </div>

                  <button 
                    (click)="generateAIOutreach(userRec)"
                    [disabled]="isGenerating()"
                    class="w-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative overflow-hidden group">
                    <div class="absolute inset-0 bg-teal-500 w-0 group-hover:w-full transition-all duration-500 opacity-10"></div>
                    @if (isGenerating()) {
                      <mat-icon class="animate-spin text-[16px]">autorenew</mat-icon>
                      <span class="tracking-wide">Synthesizing...</span>
                    } @else {
                      <mat-icon class="text-[18px]">bolt</mat-icon>
                      <span class="tracking-wide">Generate Contextual Pitch</span>
                    }
                  </button>

                  <!-- Generated Output -->
                  @if (aiDraft()) {
                    <div class="mt-4 animate-fade-in relative">
                      <div class="absolute -left-2 top-0 bottom-0 w-1 bg-teal-500/50 rounded-full"></div>
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-[10px] font-bold text-white uppercase tracking-widest pl-2">Draft Revision v1</span>
                        <button 
                          (click)="copyDraftToClipboard()"
                          class="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold pr-1">
                          Copy <mat-icon class="text-[14px]">content_copy</mat-icon>
                        </button>
                      </div>
                      <div class="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 font-medium font-sans leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar shadow-inner ml-2">
                        {{ aiDraft() }}
                      </div>
                    </div>
                  }
                </div>
              </div>
              
              <!-- Interaction Timeline (Visual) -->
              <div class="border-t border-zinc-800/80 pt-6">
                 <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <mat-icon class="text-[14px]">history</mat-icon> Activity Footprint
                </h4>
                
                <div class="space-y-4 pl-2 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-zinc-800 before:to-transparent">
                   <!-- Sync Node -->
                   <div class="relative flex items-center gap-4">
                      <div class="w-5 h-5 rounded-full bg-zinc-900 border-2 border-teal-500 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(20,184,166,0.5)] z-10">
                         <div class="w-1.5 h-1.5 bg-teal-400 rounded-full"></div>
                      </div>
                      <div>
                         <p class="text-white text-xs font-bold leading-none">Last Data Sync</p>
                         <p class="text-zinc-500 text-[10px] mt-1">{{ userRec.lastContacted || '2 days ago' }}</p>
                      </div>
                   </div>
                   <!-- Creation Node -->
                   <div class="relative flex items-center gap-4 opacity-60">
                      <div class="w-5 h-5 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center shrink-0 z-10"></div>
                      <div>
                         <p class="text-zinc-300 text-xs font-bold leading-none">Record Initialized</p>
                         <p class="text-zinc-500 text-[10px] mt-1">11 days ago via API integration</p>
                      </div>
                   </div>
                </div>
              </div>

            </div>
          </div>
        }

      </div>

      <!-- ADD CONTACT MODAL DRAWER -->
      @if (showAddModal()) {
        <div class="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 relative shadow-2xl animate-fade-in overflow-hidden">
            
            <div class="absolute -left-32 -top-32 w-64 h-64 bg-teal-500/10 blur-[60px] rounded-full pointer-events-none"></div>

            <button (click)="closeAddModal()" class="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10">
              <mat-icon>close</mat-icon>
            </button>

            <div class="relative z-10">
              <h3 class="text-xl font-bold text-white font-display tracking-wide flex items-center gap-2">
                <mat-icon class="text-teal-400 text-[24px]">{{ editingContact() ? 'edit' : 'person_add_alt' }}</mat-icon>
                {{ editingContact() ? 'Update Relationship Profile' : 'Bind New Identity' }}
              </h3>
              <p class="text-[11px] text-zinc-400 mt-1">Populate relationship data context to expand tracking networks instantly.</p>
            </div>

            <form [formGroup]="contactForm" (ngSubmit)="submitContactForm()" class="space-y-4 relative z-10">
              <div class="space-y-1">
                <label for="contactNameInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Full Legal Name</label>
                <input id="contactNameInput" type="text" formControlName="name" placeholder="E.g., Jeff Bezos" 
                       class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label for="contactEmailInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Node</label>
                  <input id="contactEmailInput" type="email" formControlName="email" placeholder="jeff@amazon.com" 
                         class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
                </div>
                <div class="space-y-1">
                  <label for="contactPhoneInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Secure Line</label>
                  <input id="contactPhoneInput" type="text" formControlName="phone" placeholder="+1 206 266 1000" 
                         class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label for="contactCompanyInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Entity / Organisation</label>
                  <input id="contactCompanyInput" type="text" formControlName="company" placeholder="Amazon Inc" 
                         class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
                </div>
                <div class="space-y-1">
                  <label for="contactStatusSelect" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Relationship State</label>
                  <select id="contactStatusSelect" formControlName="status"
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50">
                    <option value="Lead">Unqualified Lead</option>
                    <option value="Opportunity">Active Opportunity</option>
                    <option value="Customer">Verified Customer</option>
                  </select>
                </div>
              </div>

              <div class="space-y-1">
                <label for="contactDealValueInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Lifetime Value Estimate (USD)</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 font-mono text-xs">$</span>
                  <input id="contactDealValueInput" type="number" formControlName="dealValue" placeholder="45000" 
                         class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-3 pl-7 pr-3 text-xs font-mono font-bold text-teal-400 placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
                </div>
              </div>

              <div class="pt-4 flex justify-end gap-3 border-t border-zinc-800/80">
                <button type="button" (click)="closeAddModal()" class="px-4 py-2 bg-transparent hover:text-white text-zinc-400 font-bold rounded-xl text-xs transition-colors">
                  Abort
                </button>
                <button type="submit" [disabled]="contactForm.invalid" class="px-6 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-xs transition-colors shadow-lg flex items-center gap-2">
                  <mat-icon class="text-[16px]">save</mat-icon> {{ editingContact() ? 'Save Profile Changes' : 'Inject Profile' }}
                </button>
              </div>
            </form>

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
    .animate-slide-in {
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(24, 24, 27, 0.5); 
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(82, 82, 91, 0.5); 
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(113, 113, 122, 0.8); 
    }
  `]
})
export class ContactsComponent {
  appwrite = inject(Appwrite);
  fb = inject(FormBuilder);

  searchQuery = signal<string>('');
  activeStatusFilter = signal<string>('All');
  selectedContact = signal<ContactRecord | null>(null);
  selectedTone = signal<string>('Expert');
  aiDraft = signal<string>('');
  isGenerating = signal<boolean>(false);
  showAddModal = signal<boolean>(false);
  editingContact = signal<ContactRecord | null>(null);

  contactForm!: FormGroup;

  constructor() {
    this.initForm();
    // Pre-select first contact if available
    setTimeout(() => {
      const all = this.appwrite.contacts();
      if (all && all.length > 0) {
        this.selectedContact.set(all[0]);
      }
    }, 400);
  }

  private initForm() {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phone: [''],
      company: ['', [Validators.required]],
      status: ['Lead'],
      dealValue: [15000, [Validators.min(0)]]
    });
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  filteredContacts = computed(() => {
    let list: ContactRecord[] = this.appwrite.contacts();
    
    // Add default mock values check
    if (!list || list.length === 0) {
      list = [
        { $id: 'mock-c1', name: 'Bill Gates', email: 'bill@microsoft.com', phone: '+1 425 882 8080', company: 'Microsoft', status: 'Customer', dealValue: 450000, lastContacted: '2 hours ago' },
        { $id: 'mock-c2', name: 'Marc Benioff', email: 'marc@salesforce.com', phone: '+1 415 901 7000', company: 'Salesforce', status: 'Opportunity', dealValue: 180000, lastContacted: '1 day ago' },
        { $id: 'mock-c3', name: 'Stewart Butterfield', email: 'stewart@slack.com', phone: '+1 415 555 1212', company: 'Slack', status: 'Lead', dealValue: 65000, lastContacted: '5 minutes ago' },
        { $id: 'mock-c4', name: 'Sam Altman', email: 'sam@openai.com', phone: '+1 415 333 9999', company: 'OpenAI', status: 'Customer', dealValue: 850000, lastContacted: 'Now' }
      ];
    }

    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.activeStatusFilter();

    return list.filter(c => {
      const matchQuery = !query || 
        c.name?.toLowerCase().includes(query) ||
        c.company?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query);

      const matchFilter = filter === 'All' || c.status === filter;

      return matchQuery && matchFilter;
    });
  });

  selectContact(contact: ContactRecord) {
    this.selectedContact.set(contact);
    this.aiDraft.set('');
  }

  getAcronym(name: string): string {
    if (!name) return 'C';
    const split = name.split(' ');
    if (split.length > 1) {
      return (split[0].charAt(0) + split[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  getStageBadgeClass(status: string): string {
    switch (status) {
      case 'Customer':
        return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
      case 'Opportunity':
        return 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
      case 'Lead':
      default:
        return 'text-teal-400 bg-teal-500/10 border border-teal-500/20';
    }
  }

  formatCurrency(value: string | number | undefined): string {
    const numeric = typeof value === 'number' ? value : parseFloat(value || '0') || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(numeric);
  }

  openAddModal() {
    this.editingContact.set(null);
    this.initForm();
    this.showAddModal.set(true);
  }

  openEditModal(contact: ContactRecord) {
    this.editingContact.set(contact);
    this.contactForm = this.fb.group({
      name: [contact.name || '', [Validators.required, Validators.minLength(2)]],
      email: [contact.email || '', [Validators.email]],
      phone: [contact.phone || ''],
      company: [contact.company || '', [Validators.required]],
      status: [contact.status || 'Lead'],
      dealValue: [contact.dealValue || 15000, [Validators.min(0)]]
    });
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
    this.editingContact.set(null);
  }

  async submitContactForm() {
    if (this.contactForm.invalid) return;
    const data = this.contactForm.value;
    
    const editing = this.editingContact();
    if (editing) {
      await this.appwrite.updateContact(editing.$id, data);
      this.selectedContact.set({ ...editing, ...data });
    } else {
      await this.appwrite.addContact(data);
      const list = this.appwrite.contacts();
      if (list && list.length > 0) {
        this.selectedContact.set(list[0]);
      }
    }
    this.closeAddModal();
  }

  async deleteContactRecord(id: string) {
    if (confirm('Are you certain you wish to purge this relationship record from the system?')) {
      await this.appwrite.deleteContact(id);
      if (this.selectedContact()?.$id === id) {
        this.selectedContact.set(null);
      }
    }
  }

  generateAIOutreach(contact: ContactRecord) {
    this.isGenerating.set(true);
    const tone = this.selectedTone();

    // Custom crafted dynamic template matching ΛΞVOS CRM aesthetic
    setTimeout(() => {
      let draftText = '';
      if (tone === 'Expert') {
        draftText = `Subject: Tailored CRM Performance Strategies for ${contact.company}\n\nDear ${contact.name},\n\nI hope this email finds you well. As part of our client relationship review, we've identified key optimizations for ${contact.company}'s customer retention structures.\n\nWith our tenant workspace signals, we see immediate potential to lift campaign response levels by 18-22%.\n\nLet's block a brief 10-minute slot this week to look at the custom data forecast.\n\nBest regards,\nCRM Operations Advisor\nΛΞVOS Team`;
      } else if (tone === 'Direct') {
        draftText = `Subject: Quick sync / ${contact.company} x ΛΞVOS\n\nHi ${contact.name},\n\nQuick question: are you still looking to optimize client management databases at ${contact.company}?\n\nOur CRM pipelines suggest streamline integrations could save your business team an average of 14 hours per week.\n\nIf you have 5 minutes this Thursday, I'd love to share the structural setup.\n\nBest,\nSales Operations\nΛΞVOS`;
      } else {
        draftText = `Subject: Paradigm Shift in Relationship Intel at ${contact.company}\n\nHello ${contact.name},\n\nLegacy CRM platforms are slowing down modern account growth. We're offering ${contact.company} a high-fidelity workspace architecture designed for ultimate relationship clarity.\n\nOur sales signal indicates your portfolio accounts are prime for an automated workflow upgrade (${this.formatCurrency(contact.dealValue * 0.15)} potential Q3 optimization yield).\n\nLet's coordinate a private demo to show you how easy the integration is.\n\nSincerely,\nLead Strategist, ΛΞVOS`;
      }
      this.aiDraft.set(draftText);
      this.isGenerating.set(false);
    }, 1200);
  }

  copyDraftToClipboard() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.aiDraft());
      alert('AI outreach campaign template synchronized to clipboard.');
    }
  }
}
