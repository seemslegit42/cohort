import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Appwrite } from './appwrite';
import { Router } from '@angular/router';
import { LeadService, Lead } from './lead.service';
import { EmailMarketingService, EmailMarketingProvider } from './email-marketing.service';
import { LeadMapComponent } from './lead-map.component';

export interface ContactDeal {
  id: string;
  title: string;
  stage: string;
  value: number;
}

export interface ContactRecord {
  $id: string;
  name: string;
  email?: string;
  phone?: string;
  company: string;
  address?: string;
  notes?: string;
  status: 'Lead' | 'Opportunity' | 'Customer' | string;
  dealValue: number;
  lastContacted?: string;
  associatedDeals?: ContactDeal[];
}

@Component({
  selector: 'app-contacts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, LeadMapComponent],
  template: `
    <div class="max-w-[1600px] mx-auto space-y-6 animate-fade-in px-2 md:px-0 h-full flex flex-col">
      
      <!-- Contacts Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-1 flex-shrink-0">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
              <mat-icon class="text-teal-400 text-[24px]">contact_page</mat-icon>
            </div>
            <div>
              <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Relationship Intelligence & Contacts
              </h1>
              <p class="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Comprehensive directory for contact records, corporate addresses, interaction notes, and associated deals.
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button 
            type="button"
            (click)="exportContactsCsv()" 
            class="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Export contacts to CSV format">
            <mat-icon class="text-[16px] text-teal-400">download</mat-icon>
            <span>Export CSV</span>
          </button>

          <button 
            type="button"
            (click)="exportContactsJson()" 
            class="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Export contacts to JSON format">
            <mat-icon class="text-[16px] text-purple-400">code</mat-icon>
            <span>JSON</span>
          </button>

          <button 
            type="button"
            (click)="openMarketingSyncModal()" 
            class="px-3.5 py-2 bg-gradient-to-r from-teal-500/15 to-purple-500/15 hover:from-teal-500/25 hover:to-purple-500/25 text-teal-300 hover:text-white border border-teal-500/30 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Sync Contacts with Mailchimp, SendGrid, or HubSpot">
            <mat-icon class="text-[16px]">sync</mat-icon>
            <span>Sync Marketing</span>
          </button>

          <button 
            type="button"
            (click)="router.navigate(['/emails'])" 
            class="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer">
            <mat-icon class="text-[16px] text-teal-400">email</mat-icon>
            <span>Email Hub</span>
          </button>
          
          <button 
            type="button"
            (click)="openAddModal()" 
            class="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl transition-all text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer">
            <mat-icon class="text-[18px]">person_add</mat-icon>
            <span>New Contact</span>
          </button>
        </div>
      </header>

      <!-- KPI Summary Metrics Bar -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
        <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Directory</span>
            <span class="text-xl font-bold font-mono text-white mt-1 block">{{ totalContactsCount() }}</span>
          </div>
          <div class="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <mat-icon class="text-[18px]">people</mat-icon>
          </div>
        </div>

        <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Active Opportunities</span>
            <span class="text-xl font-bold font-mono text-amber-400 mt-1 block">{{ opportunityContactsCount() }}</span>
          </div>
          <div class="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <mat-icon class="text-[18px]">trending_up</mat-icon>
          </div>
        </div>

        <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Verified Customers</span>
            <span class="text-xl font-bold font-mono text-emerald-400 mt-1 block">{{ customerContactsCount() }}</span>
          </div>
          <div class="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <mat-icon class="text-[18px]">verified</mat-icon>
          </div>
        </div>

        <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Deal LTV</span>
            <span class="text-xl font-bold font-mono text-white mt-1 block">{{ formatCurrency(totalPipelineLtv()) }}</span>
          </div>
          <div class="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <mat-icon class="text-[18px]">monetization_on</mat-icon>
          </div>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center shadow-xl flex-shrink-0 relative z-20">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <mat-icon class="text-zinc-500 text-[18px]">search</mat-icon>
          </span>
          <input 
            type="text" 
            placeholder="Search by name, company, email, phone, address, notes..."
            [value]="searchQuery()"
            (input)="onSearchChange($event)"
            class="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/50 transition-colors shadow-inner" />
          @if (searchQuery()) {
            <button 
              type="button" 
              (click)="searchQuery.set('')" 
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white">
              <mat-icon class="text-sm">close</mat-icon>
            </button>
          }
        </div>

        <!-- Filter and Sort Controls -->
        <div class="flex items-center gap-2.5 flex-wrap justify-between lg:justify-end">
          <!-- Filter Pills (Stage) -->
          <div class="flex items-center gap-1 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800/80">
            @for (s of ['All', 'Lead', 'Opportunity', 'Customer']; track s) {
              <button 
                type="button"
                (click)="activeStatusFilter.set(s)"
                [class]="activeStatusFilter() === s 
                  ? 'bg-zinc-800 text-teal-300 font-bold border-zinc-700 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/60'"
                class="px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer">
                {{ s }}
              </button>
            }
          </div>

          <!-- Deal Tier Filter -->
          <div class="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-xl px-2 py-1">
            <mat-icon class="text-zinc-500 text-sm mr-1">attach_money</mat-icon>
            <select 
              [value]="activeTierFilter()"
              (change)="activeTierFilter.set($any($event.target).value)"
              class="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer">
              <option value="All" class="bg-zinc-900 text-white">Tier: All Values</option>
              <option value="sub50" class="bg-zinc-900 text-white">Under $50k</option>
              <option value="50to200" class="bg-zinc-900 text-white">$50k – $200k</option>
              <option value="200plus" class="bg-zinc-900 text-white">$200k+ (Enterprise)</option>
            </select>
          </div>

          <!-- Address Filter Toggle -->
          <button 
            type="button"
            (click)="toggleAddressFilter()"
            [class]="activeAddressFilter() === 'has_address' ? 'bg-teal-500/10 text-teal-300 border-teal-500/30' : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-white'"
            class="px-2.5 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Toggle contacts with physical address registered">
            <mat-icon class="text-xs text-teal-400">location_on</mat-icon>
            <span>With Address</span>
          </button>

          <!-- Sort Select -->
          <div class="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-xl px-2 py-1">
            <mat-icon class="text-zinc-500 text-sm mr-1">sort</mat-icon>
            <select 
              [value]="sortBy()"
              (change)="sortBy.set($any($event.target).value)"
              class="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer">
              <option value="name" class="bg-zinc-900 text-white">Sort: Name (A-Z)</option>
              <option value="name_desc" class="bg-zinc-900 text-white">Sort: Name (Z-A)</option>
              <option value="company" class="bg-zinc-900 text-white">Sort: Company (A-Z)</option>
              <option value="value" class="bg-zinc-900 text-white">Sort: Highest Deal Value</option>
              <option value="value_asc" class="bg-zinc-900 text-white">Sort: Lowest Deal Value</option>
              <option value="recent" class="bg-zinc-900 text-white">Sort: Recent Activity</option>
            </select>
          </div>

          @if (hasActiveFilters()) {
            <button 
              type="button"
              (click)="resetAllFilters()"
              class="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Reset all active filters and search query">
              <mat-icon class="text-xs">filter_alt_off</mat-icon>
              <span>Reset</span>
            </button>
          }

          <!-- View Mode Toggle -->
          <div class="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-xl p-1">
            <button 
              type="button"
              (click)="viewMode.set('table')"
              [class]="viewMode() === 'table' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'"
              class="p-1 rounded-lg transition-colors cursor-pointer"
              title="Table View">
              <mat-icon class="text-sm">table_rows</mat-icon>
            </button>
            <button 
              type="button"
              (click)="viewMode.set('grid')"
              [class]="viewMode() === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'"
              class="p-1 rounded-lg transition-colors cursor-pointer"
              title="Grid Cards View">
              <mat-icon class="text-sm">grid_view</mat-icon>
            </button>
            <button 
              type="button"
              (click)="viewMode.set('map')"
              [class]="viewMode() === 'map' ? 'bg-zinc-800 text-teal-400' : 'text-zinc-500 hover:text-white'"
              class="p-1 rounded-lg transition-colors cursor-pointer"
              title="Google Maps View">
              <mat-icon class="text-sm">map</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Main CRM Grid: Contacts Directory and Deep-Detail Drawer -->
      <div class="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 relative z-10 pb-6">
        
        <!-- Left: Contacts Directory (Table or Grid) -->
        <div class="flex-1 flex flex-col bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[400px]">
          @if (filteredContacts().length === 0) {
            <div class="p-16 text-center flex-1 flex flex-col items-center justify-center min-h-[350px]">
              <div class="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800 shadow-inner">
                <mat-icon class="text-zinc-500 text-3xl">people_outline</mat-icon>
              </div>
              <h4 class="text-white font-display text-lg font-bold">No matching contact records</h4>
              <p class="text-zinc-500 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                Adjust search criteria or click 'New Contact' to create a contact profile with address and notes.
              </p>
              <button 
                type="button" 
                (click)="openAddModal()" 
                class="mt-4 px-4 py-2 bg-teal-500 text-zinc-950 font-bold rounded-xl text-xs hover:bg-teal-400 transition-colors">
                Add New Contact
              </button>
            </div>
          } @else if (viewMode() === 'table') {
            <!-- Table View -->
            <div class="overflow-y-auto custom-scrollbar flex-1">
              <table class="w-full text-left text-xs border-collapse">
                <thead class="bg-zinc-950/90 backdrop-blur-md text-zinc-400 font-bold border-b border-zinc-800 uppercase tracking-widest sticky top-0 z-10 select-none">
                  <tr>
                    <th class="py-3 px-5 text-[10px] cursor-pointer hover:text-teal-300 transition-colors" (click)="toggleSort('name')" title="Sort by Name">
                      <span class="flex items-center gap-1">
                        <span>Contact Identity</span>
                        <mat-icon class="text-[14px] text-zinc-500">{{ getSortIcon('name') }}</mat-icon>
                      </span>
                    </th>
                    <th class="py-3 px-5 text-[10px] cursor-pointer hover:text-teal-300 transition-colors" (click)="toggleSort('company')" title="Sort by Company">
                      <span class="flex items-center gap-1">
                        <span>Company & Address</span>
                        <mat-icon class="text-[14px] text-zinc-500">{{ getSortIcon('company') }}</mat-icon>
                      </span>
                    </th>
                    <th class="py-3 px-5 text-[10px] cursor-pointer hover:text-teal-300 transition-colors" (click)="toggleSort('status')" title="Sort by Stage">
                      <span class="flex items-center gap-1">
                        <span>Stage</span>
                        <mat-icon class="text-[14px] text-zinc-500">{{ getSortIcon('status') }}</mat-icon>
                      </span>
                    </th>
                    <th class="py-3 px-5 text-[10px] cursor-pointer hover:text-teal-300 transition-colors" (click)="toggleSort('value')" title="Sort by Deal Value">
                      <span class="flex items-center gap-1">
                        <span>Deal Value</span>
                        <mat-icon class="text-[14px] text-zinc-500">{{ getSortIcon('value') }}</mat-icon>
                      </span>
                    </th>
                    <th class="py-3 px-5 text-[10px]">Recent Notes</th>
                    <th class="py-3 px-5 text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/40 font-medium">
                  @for (c of filteredContacts(); track c.$id) {
                    <tr 
                      (click)="selectContact(c)"
                      (keydown.enter)="selectContact(c)"
                      (keydown.space)="selectContact(c)"
                      role="button"
                      tabindex="0"
                      [class.bg-teal-500/10]="selectedContact()?.$id === c.$id"
                      [class.border-l-2]="true"
                      [class.border-l-teal-500]="selectedContact()?.$id === c.$id"
                      [class.border-l-transparent]="selectedContact()?.$id !== c.$id"
                      class="hover:bg-zinc-800/40 transition-colors cursor-pointer group focus:outline-none focus:bg-zinc-800/60">
                      
                      <!-- Identity -->
                      <td class="py-3.5 px-5">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 text-teal-400 flex items-center justify-center font-bold font-display text-xs group-hover:border-teal-500/40 transition-colors shrink-0">
                            {{ getAcronym(c.name) }}
                          </div>
                          <div class="min-w-0">
                            <p class="text-white font-bold text-xs truncate">{{ c.name }}</p>
                            <p class="text-[11px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                              <mat-icon class="text-[11px] text-zinc-500">email</mat-icon>
                              <span>{{ c.email || '—' }}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <!-- Company & Address -->
                      <td class="py-3.5 px-5">
                        <div class="min-w-0">
                          <p class="text-zinc-200 font-bold text-xs truncate flex items-center gap-1.5">
                            <mat-icon class="text-[13px] text-zinc-500">domain</mat-icon>
                            <span>{{ c.company }}</span>
                          </p>
                          <p class="text-[10px] text-zinc-400 truncate mt-0.5 flex items-center gap-1">
                            <mat-icon class="text-[11px] text-teal-400/80">location_on</mat-icon>
                            <span>{{ c.address || 'Address unlisted' }}</span>
                          </p>
                        </div>
                      </td>

                      <!-- Stage -->
                      <td class="py-3.5 px-5">
                        <span [class]="getStageBadgeClass(c.status || 'Lead')" 
                              class="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider items-center gap-1 shadow-sm">
                          <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {{ c.status || 'Lead' }}
                        </span>
                      </td>

                      <!-- Deal Value -->
                      <td class="py-3.5 px-5 font-mono font-bold text-xs text-zinc-200">
                        <span [class.text-emerald-400]="c.status === 'Customer'">{{ formatCurrency(c.dealValue) }}</span>
                      </td>

                      <!-- Notes snippet -->
                      <td class="py-3.5 px-5 max-w-[200px]">
                        <p class="text-[11px] text-zinc-400 truncate italic">
                          {{ c.notes || 'No notes logged yet' }}
                        </p>
                      </td>

                      <!-- Actions -->
                      <td class="py-3.5 px-5 text-right whitespace-nowrap" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" role="group" aria-label="Contact actions">
                        <div class="flex items-center justify-end gap-1.5">
                          <button 
                            type="button"
                            (click)="composeEmailForContact(c)" 
                            class="p-1 text-zinc-400 hover:text-teal-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" 
                            title="Compose Email">
                            <mat-icon class="text-sm">mail</mat-icon>
                          </button>
                          <button 
                            type="button"
                            (click)="openEditModal(c)" 
                            class="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" 
                            title="Edit Record">
                            <mat-icon class="text-sm">edit</mat-icon>
                          </button>
                          <button 
                            type="button"
                            (click)="deleteContactRecord(c.$id)" 
                            class="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer" 
                            title="Delete Record">
                            <mat-icon class="text-sm">delete</mat-icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else if (viewMode() === 'grid') {
            <!-- Card Grid View -->
            <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 overflow-y-auto custom-scrollbar flex-1">
              @for (c of filteredContacts(); track c.$id) {
                <div 
                  (click)="selectContact(c)"
                  (keydown.enter)="selectContact(c)"
                  (keydown.space)="selectContact(c)"
                  role="button"
                  tabindex="0"
                  [class.border-teal-500/50]="selectedContact()?.$id === c.$id"
                  [class.bg-teal-500/5]="selectedContact()?.$id === c.$id"
                  class="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between group focus:outline-none focus:ring-1 focus:ring-teal-500/50">
                  
                  <div>
                    <div class="flex items-start justify-between gap-3 mb-2.5">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {{ getAcronym(c.name) }}
                        </div>
                        <div>
                          <h4 class="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">{{ c.name }}</h4>
                          <p class="text-xs text-zinc-400 font-medium flex items-center gap-1">
                            <mat-icon class="text-[12px] text-zinc-500">domain</mat-icon>
                            <span>{{ c.company }}</span>
                          </p>
                        </div>
                      </div>
                      <span [class]="getStageBadgeClass(c.status || 'Lead')" class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                        {{ c.status || 'Lead' }}
                      </span>
                    </div>

                    <div class="space-y-1.5 text-xs text-zinc-400 my-3">
                      <p class="flex items-center gap-2 truncate">
                        <mat-icon class="text-sm text-zinc-500 shrink-0">email</mat-icon>
                        <span class="truncate">{{ c.email || 'No email' }}</span>
                      </p>
                      <p class="flex items-center gap-2 truncate">
                        <mat-icon class="text-sm text-zinc-500 shrink-0">phone</mat-icon>
                        <span>{{ c.phone || 'No direct phone' }}</span>
                      </p>
                      <p class="flex items-center gap-2 truncate">
                        <mat-icon class="text-sm text-teal-400/80 shrink-0">location_on</mat-icon>
                        <span class="truncate">{{ c.address || 'Address not registered' }}</span>
                      </p>
                    </div>

                    @if (c.notes) {
                      <div class="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800/80 text-[11px] text-zinc-300 italic line-clamp-2">
                        "{{ c.notes }}"
                      </div>
                    }
                  </div>

                  <div class="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Est. LTV</span>
                      <span class="text-xs font-bold font-mono text-teal-400">{{ formatCurrency(c.dealValue) }}</span>
                    </div>
                    <div class="flex items-center gap-1.5" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" role="group" aria-label="Card actions">
                      <button 
                        type="button"
                        (click)="composeEmailForContact(c)" 
                        class="px-2.5 py-1 bg-zinc-900 hover:bg-teal-500/10 hover:text-teal-300 border border-zinc-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer">
                        <mat-icon class="text-xs">email</mat-icon> Email
                      </button>
                      <button 
                        type="button"
                        (click)="openEditModal(c)" 
                        class="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="Edit Record">
                        <mat-icon class="text-sm">edit</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else if (viewMode() === 'map') {
            <!-- Google Maps Territory View -->
            <div class="h-full w-full min-h-[550px] p-1 flex-1 flex flex-col">
              <app-lead-map [leads]="contactsAsLeads()"></app-lead-map>
            </div>
          }
        </div>

        <!-- Right: Selected Contact Deep-Detail Panel -->
        @if (selectedContact(); as userRec) {
          <div class="w-full lg:w-[450px] shrink-0 bg-zinc-950/90 backdrop-blur-2xl rounded-2xl overflow-y-auto custom-scrollbar flex flex-col animate-slide-in relative border border-zinc-800/90 shadow-2xl">
            <div class="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/5 blur-[80px] rounded-full pointer-events-none"></div>

            <!-- Profile Header -->
            <div class="p-5 border-b border-zinc-800/80 bg-zinc-900/30 relative z-10">
              <div class="flex items-center gap-3.5">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-b from-teal-500/20 to-teal-900/20 border border-teal-500/30 flex items-center justify-center font-display font-bold text-teal-300 text-xl shadow-[0_0_20px_rgba(20,184,166,0.15)] relative">
                  {{ getAcronym(userRec.name) }}
                  <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-bold text-white font-display leading-tight truncate">{{ userRec.name }}</h3>
                  <p class="text-xs text-teal-400 font-semibold mt-0.5 flex items-center gap-1 truncate">
                    <mat-icon class="text-[14px]">business</mat-icon>
                    <span>{{ userRec.company }}</span>
                  </p>
                </div>
                
                <button 
                  type="button"
                  (click)="selectedContact.set(null)" 
                  class="w-7 h-7 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  title="Close Inspector">
                  <mat-icon class="text-sm">close</mat-icon>
                </button>
              </div>

              <!-- Action Bar -->
              <div class="flex gap-2 mt-4 flex-wrap">
                <button 
                  type="button"
                  (click)="composeEmailForContact(userRec)" 
                  class="flex-1 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
                  <mat-icon class="text-[15px]">send</mat-icon>
                  <span>Compose Email</span>
                </button>
                <a 
                  [href]="'tel:' + (userRec.phone || '')" 
                  class="px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Call Phone Number">
                  <mat-icon class="text-[15px]">phone</mat-icon>
                </a>
                <button 
                  type="button"
                  (click)="toggleInlineEdit(userRec)" 
                  [class]="isInlineEditing() ? 'bg-teal-500 text-zinc-950 font-bold border-teal-400' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'"
                  class="px-3 border rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer" 
                  title="Quick Inline Edit">
                  <mat-icon class="text-[15px]">{{ isInlineEditing() ? 'close' : 'edit_note' }}</mat-icon>
                  <span class="hidden sm:inline">{{ isInlineEditing() ? 'Cancel' : 'Inline Edit' }}</span>
                </button>
                <button 
                  type="button"
                  (click)="openEditModal(userRec)" 
                  class="px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center cursor-pointer" 
                  title="Edit Contact Details (Modal)">
                  <mat-icon class="text-[15px]">edit</mat-icon>
                </button>
                <button 
                  type="button"
                  (click)="deleteContactRecord(userRec.$id)" 
                  class="px-3 bg-zinc-900 hover:bg-rose-500/10 hover:text-rose-400 text-zinc-400 border border-zinc-800 rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center cursor-pointer" 
                  title="Delete Contact">
                  <mat-icon class="text-[15px]">delete</mat-icon>
                </button>
              </div>
            </div>

            <!-- Tabbed / Sectional Detail Body -->
            <div class="p-5 space-y-6 flex-1 relative z-10">
              
              <!-- Inline Quick Editor (When Active) -->
              @if (isInlineEditing()) {
                <div class="space-y-3 bg-zinc-900/90 border border-teal-500/40 rounded-2xl p-4 shadow-xl animate-fade-in">
                  <div class="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span class="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1">
                      <mat-icon class="text-sm">edit_note</mat-icon> Quick Inline Record Editor
                    </span>
                    <span class="text-[9px] text-zinc-500 font-mono">Immediate Persistence</span>
                  </div>

                  <div class="space-y-2.5 text-xs">
                    <div>
                      <label for="inlineNameInput" class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Full Legal Name *</label>
                      <input 
                        id="inlineNameInput"
                        type="text" 
                        [value]="inlineName()" 
                        (input)="inlineName.set($any($event.target).value)" 
                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-teal-500/50" />
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label for="inlineCompanyInput" class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Company / Entity *</label>
                        <input 
                          id="inlineCompanyInput"
                          type="text" 
                          [value]="inlineCompany()" 
                          (input)="inlineCompany.set($any($event.target).value)" 
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-teal-500/50" />
                      </div>
                      <div>
                        <label for="inlineStatusSelect" class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Lifecycle Stage</label>
                        <select 
                          id="inlineStatusSelect"
                          [value]="inlineStatus()" 
                          (change)="inlineStatus.set($any($event.target).value)" 
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-teal-500/50">
                          <option value="Lead">Lead</option>
                          <option value="Opportunity">Opportunity</option>
                          <option value="Customer">Customer</option>
                        </select>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label for="inlineEmailInput" class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Email Address *</label>
                        <input 
                          id="inlineEmailInput"
                          type="email" 
                          [value]="inlineEmail()" 
                          (input)="inlineEmail.set($any($event.target).value)" 
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-teal-500/50" />
                      </div>
                      <div>
                        <label for="inlinePhoneInput" class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Phone Number</label>
                        <input 
                          id="inlinePhoneInput"
                          type="text" 
                          [value]="inlinePhone()" 
                          (input)="inlinePhone.set($any($event.target).value)" 
                          class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-teal-500/50" />
                      </div>
                    </div>

                    <div>
                      <label for="inlineAddressInput" class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                        <mat-icon class="text-[12px] text-teal-400">location_on</mat-icon> Office / Physical Address
                      </label>
                      <input 
                        id="inlineAddressInput"
                        type="text" 
                        [value]="inlineAddress()" 
                        (input)="inlineAddress.set($any($event.target).value)" 
                        placeholder="Street, City, State, ZIP code"
                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
                    </div>

                    <div>
                      <label for="inlineDealValueInput" class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Est. Deal Value ($)</label>
                      <input 
                        id="inlineDealValueInput"
                        type="number" 
                        [value]="inlineDealValue()" 
                        (input)="inlineDealValue.set($any($event.target).value)" 
                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-teal-400 font-mono font-bold focus:outline-none focus:border-teal-500/50" />
                    </div>

                    <div>
                      <label for="inlineNotesInput" class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Notes & Context</label>
                      <textarea 
                        id="inlineNotesInput"
                        rows="3" 
                        [value]="inlineNotes()" 
                        (input)="inlineNotes.set($any($event.target).value)" 
                        placeholder="Record key context, meeting takeaways, and relationship background..." 
                        class="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white text-xs placeholder-zinc-700 focus:outline-none focus:border-teal-500/50 resize-none font-sans leading-relaxed"></textarea>
                    </div>
                  </div>

                  <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                    <button 
                      type="button" 
                      (click)="isInlineEditing.set(false)" 
                      class="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer">
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      (click)="saveInlineEdit(userRec)" 
                      class="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-md cursor-pointer transition-colors">
                      <mat-icon class="text-xs">save</mat-icon>
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              }

              <!-- Core Contact Details -->
              <div class="space-y-3">
                <h4 class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <mat-icon class="text-[13px] text-teal-400">badge</mat-icon>
                  Core Record Fields
                </h4>

                <div class="grid grid-cols-2 gap-2.5">
                  <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5">
                    <span class="block text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Lifecycle State</span>
                    <span class="text-xs font-bold text-white flex items-center gap-1 mt-1">
                      <span class="w-1.5 h-1.5 rounded-full" [class]="userRec.status === 'Customer' ? 'bg-emerald-400' : 'bg-teal-400'"></span>
                      {{ userRec.status || 'Lead' }}
                    </span>
                  </div>

                  <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5">
                    <span class="block text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Deal LTV</span>
                    <span class="text-xs font-bold text-teal-400 font-mono mt-1 block">{{ formatCurrency(userRec.dealValue) }}</span>
                  </div>

                  <!-- Email with copy -->
                  <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5 col-span-2 flex items-center justify-between">
                    <div class="min-w-0 pr-2">
                      <span class="block text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Email Address</span>
                      <span class="text-xs font-medium text-zinc-200 truncate block mt-0.5">{{ userRec.email || 'Unassigned' }}</span>
                    </div>
                    @if (userRec.email) {
                      <div class="flex items-center gap-1">
                        <button 
                          type="button"
                          (click)="copyText(userRec.email, 'Email address copied')" 
                          class="p-1 text-zinc-500 hover:text-teal-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          title="Copy Email">
                          <mat-icon class="text-sm">content_copy</mat-icon>
                        </button>
                      </div>
                    }
                  </div>

                  <!-- Phone with call -->
                  <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5 col-span-2 flex items-center justify-between">
                    <div class="min-w-0 pr-2">
                      <span class="block text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Phone Number</span>
                      <span class="text-xs font-medium text-zinc-200 truncate block mt-0.5">{{ userRec.phone || 'Unassigned' }}</span>
                    </div>
                    @if (userRec.phone) {
                      <div class="flex items-center gap-1">
                        <a 
                          [href]="'tel:' + userRec.phone" 
                          class="p-1 text-zinc-500 hover:text-teal-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          title="Call Phone">
                          <mat-icon class="text-sm">phone</mat-icon>
                        </a>
                        <button 
                          type="button"
                          (click)="copyText(userRec.phone, 'Phone number copied')" 
                          class="p-1 text-zinc-500 hover:text-teal-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          title="Copy Phone">
                          <mat-icon class="text-sm">content_copy</mat-icon>
                        </button>
                      </div>
                    }
                  </div>

                  <!-- Physical Address (Requested by User) -->
                  <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5 col-span-2 flex items-center justify-between">
                    <div class="min-w-0 pr-2">
                      <span class="block text-[9px] text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1">
                        <mat-icon class="text-[11px] text-teal-400">location_on</mat-icon> Physical Address
                      </span>
                      <span class="text-xs font-medium text-zinc-200 truncate block mt-0.5">{{ userRec.address || 'Address unlisted in CRM' }}</span>
                    </div>
                    @if (userRec.address) {
                      <div class="flex items-center gap-1">
                        <a 
                          [href]="getMapsUrl(userRec.address)" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          class="p-1 text-zinc-500 hover:text-teal-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          title="View on Google Maps">
                          <mat-icon class="text-sm">map</mat-icon>
                        </a>
                        <button 
                          type="button"
                          (click)="copyText(userRec.address, 'Address copied to clipboard')" 
                          class="p-1 text-zinc-500 hover:text-teal-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          title="Copy Address">
                          <mat-icon class="text-sm">content_copy</mat-icon>
                        </button>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Notes & Context Section (Requested by User) -->
              <div class="border-t border-zinc-800/80 pt-4 space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <mat-icon class="text-[13px] text-purple-400">description</mat-icon>
                    Contact Notes & Context
                  </h4>
                  <button 
                    type="button"
                    (click)="openEditModal(userRec)" 
                    class="text-[10px] font-bold text-teal-400 hover:underline">
                    Edit Note
                  </button>
                </div>

                <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-200 font-sans leading-relaxed shadow-inner">
                  @if (userRec.notes) {
                    <p class="whitespace-pre-wrap">{{ userRec.notes }}</p>
                  } @else {
                    <p class="text-zinc-500 italic">No historical notes recorded for this contact.</p>
                  }
                </div>

                <!-- Quick Append Note Bar -->
                <div class="flex gap-2">
                  <input 
                    type="text" 
                    [value]="quickNoteInput()" 
                    (input)="quickNoteInput.set($any($event.target).value)" 
                    (keydown.enter)="appendQuickNote(userRec)"
                    placeholder="Append a quick note to record..." 
                    class="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/50" />
                  <button 
                    type="button"
                    (click)="appendQuickNote(userRec)" 
                    [disabled]="!quickNoteInput().trim()"
                    class="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-teal-400 font-bold border border-zinc-800 rounded-xl text-xs transition-colors shrink-0">
                    Add
                  </button>
                </div>
              </div>

              <!-- Associated Deals Section -->
              <div class="border-t border-zinc-800/80 pt-4 space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <mat-icon class="text-[13px] text-teal-400">monetization_on</mat-icon>
                    Associated Deals & Pipeline
                  </h4>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-zinc-500 font-mono">{{ (userRec.associatedDeals?.length || 1) }} deal(s)</span>
                    <button 
                      type="button" 
                      (click)="toggleAttachDealModal()" 
                      class="text-[10px] font-bold text-teal-400 hover:text-teal-300 transition-colors cursor-pointer flex items-center gap-0.5">
                      <mat-icon class="text-xs">add</mat-icon>
                      <span>Attach Deal</span>
                    </button>
                  </div>
                </div>

                @if (showAttachDealInline()) {
                  <div class="p-3 bg-zinc-900 border border-teal-500/30 rounded-xl space-y-2.5 animate-fade-in">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Link Deal to Contact</span>
                      <button type="button" (click)="showAttachDealInline.set(false)" class="text-zinc-500 hover:text-white">
                        <mat-icon class="text-xs">close</mat-icon>
                      </button>
                    </div>
                    <input 
                      type="text" 
                      [value]="newDealTitle()" 
                      (input)="newDealTitle.set($any($event.target).value)" 
                      placeholder="Deal Title (e.g. Enterprise SLA Expansion)" 
                      class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/50" />
                    <div class="grid grid-cols-2 gap-2">
                      <select 
                        [value]="newDealStage()" 
                        (change)="newDealStage.set($any($event.target).value)" 
                        class="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50">
                        <option value="Discovery">Discovery</option>
                        <option value="Proposal">Proposal</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Signed">Signed / Won</option>
                      </select>
                      <input 
                        type="number" 
                        [value]="newDealValue()" 
                        (input)="newDealValue.set($any($event.target).value)" 
                        placeholder="Value ($)" 
                        class="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-teal-400 font-bold focus:outline-none focus:border-teal-500/50" />
                    </div>
                    <div class="flex justify-end gap-2 pt-1">
                      <button type="button" (click)="showAttachDealInline.set(false)" class="px-2.5 py-1 text-xs text-zinc-400 hover:text-white">Cancel</button>
                      <button 
                        type="button" 
                        (click)="attachDealToContact(userRec)" 
                        [disabled]="!newDealTitle().trim()"
                        class="px-3 py-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-zinc-950 font-bold rounded-lg text-xs transition-colors cursor-pointer">
                        Link Deal
                      </button>
                    </div>
                  </div>
                }

                <div class="space-y-2">
                  @if (userRec.associatedDeals && userRec.associatedDeals.length > 0) {
                    @for (deal of userRec.associatedDeals; track deal.id) {
                      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p class="text-xs font-bold text-white">{{ deal.title }}</p>
                          <span class="text-[10px] text-teal-400 font-semibold">{{ deal.stage }}</span>
                        </div>
                        <span class="text-xs font-bold font-mono text-zinc-300">{{ formatCurrency(deal.value) }}</span>
                      </div>
                    }
                  } @else {
                    <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p class="text-xs font-bold text-white">{{ userRec.company }} Strategic Partnership</p>
                        <span class="text-[10px] text-teal-400 font-semibold">{{ userRec.status }}</span>
                      </div>
                      <span class="text-xs font-bold font-mono text-zinc-300">{{ formatCurrency(userRec.dealValue) }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Logged Email Communications Section -->
              <div class="border-t border-zinc-800/80 pt-4 space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <mat-icon class="text-[13px] text-teal-400">mail</mat-icon>
                    Logged Email Correspondence
                  </h4>
                  <button 
                    type="button"
                    (click)="composeEmailForContact(userRec)" 
                    class="text-[10px] font-bold text-teal-400 hover:underline cursor-pointer">
                    + New Email
                  </button>
                </div>

                <div class="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                  @for (mail of getLoggedEmailsForContact(userRec); track mail.$id) {
                    <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex items-start gap-2.5">
                      <div class="w-6 h-6 rounded-md bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                        <mat-icon class="text-[13px]">{{ mail.direction === 'inbound' ? 'call_received' : 'send' }}</mat-icon>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-1">
                          <p class="text-xs font-bold text-white truncate">{{ mail.subject }}</p>
                          <span class="text-[9px] font-mono text-zinc-500">{{ mail.sentAt }}</span>
                        </div>
                        <p class="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{{ mail.body || mail.snippet || 'No body preview' }}</p>
                        @if (mail.humanApproved) {
                          <span class="inline-flex items-center gap-1 mt-1 text-[9px] text-teal-300 font-semibold bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.2 rounded">
                            <mat-icon class="text-[10px]">verified_user</mat-icon> Human Approved
                          </span>
                        }
                      </div>
                    </div>
                  } @empty {
                    <div class="p-3 bg-zinc-900/40 rounded-xl border border-zinc-850 text-center text-xs text-zinc-500">
                      No emails logged yet for this contact.
                    </div>
                  }
                </div>
              </div>

              <!-- BEEP Sarcastic Strategic Wisdom -->
              <div class="border-t border-zinc-800/80 pt-4 space-y-2.5">
                <div class="flex items-center justify-between">
                  <h4 class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <mat-icon class="text-[13px] text-purple-400">psychology</mat-icon>
                    BEEP Strategic Audit
                  </h4>
                  <span class="text-[9px] text-purple-400/80 bg-purple-500/10 px-1.5 py-0.5 rounded font-mono font-bold">SAVIOUR v2.0</span>
                </div>

                <div class="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl text-xs text-purple-200 font-sans leading-relaxed relative overflow-hidden">
                  <div class="flex items-start gap-2.5">
                    <div class="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 font-bold font-mono text-[10px]">
                      BEEP
                    </div>
                    <div class="flex-1 text-[11px] leading-relaxed text-zinc-300">
                      {{ getBeepContactAdvice(userRec) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- AI Outreach Assistant -->
              <div class="border-t border-zinc-800/80 pt-4 space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <mat-icon class="text-[13px] text-teal-400">auto_awesome</mat-icon>
                    AI Comms Draft Generator
                  </h4>
                  <span class="text-[9px] text-teal-400/80 bg-teal-400/10 px-1.5 py-0.5 rounded font-mono font-bold">GEMINI</span>
                </div>

                <div class="flex rounded-lg bg-zinc-950 p-1 border border-zinc-800">
                  @for (tone of ['Executive', 'Direct', 'Bold']; track tone) {
                    <button 
                      type="button"
                      (click)="selectedTone.set(tone)"
                      [class]="selectedTone() === tone ? 'bg-zinc-800 text-teal-400 shadow-sm font-bold' : 'text-zinc-500 hover:text-zinc-300 font-medium'"
                      class="flex-1 py-1 text-[10px] uppercase tracking-wider rounded-md transition-all text-center cursor-pointer">
                      {{ tone }}
                    </button>
                  }
                </div>

                <button 
                  type="button"
                  (click)="generateAIOutreach(userRec)"
                  [disabled]="isGenerating()"
                  class="w-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                  @if (isGenerating()) {
                    <mat-icon class="animate-spin text-sm">autorenew</mat-icon>
                    <span>Synthesizing tailored draft...</span>
                  } @else {
                    <mat-icon class="text-sm">bolt</mat-icon>
                    <span>Generate Contextual Pitch</span>
                  }
                </button>

                @if (aiDraft()) {
                  <div class="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                    {{ aiDraft() }}
                  </div>
                  <div class="flex justify-end gap-2">
                    <button 
                      type="button"
                      (click)="copyText(aiDraft(), 'Draft copied to clipboard')"
                      class="text-[10px] text-zinc-400 hover:text-white px-2 py-1 bg-zinc-900 rounded border border-zinc-800 flex items-center gap-1 cursor-pointer">
                      <mat-icon class="text-xs">content_copy</mat-icon> Copy
                    </button>
                    <button 
                      type="button"
                      (click)="composeEmailForContact(userRec, aiDraft())"
                      class="text-[10px] text-zinc-950 bg-teal-500 hover:bg-teal-400 px-2.5 py-1 rounded font-bold flex items-center gap-1 shadow-sm cursor-pointer">
                      <mat-icon class="text-xs">send</mat-icon> Send via Email Hub
                    </button>
                  </div>
                }
              </div>

            </div>
          </div>
        }
      </div>

      <!-- CREATE / EDIT CONTACT MODAL (Includes name, email, phone, company, address, notes) -->
      @if (showAddModal()) {
        <div class="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 relative shadow-2xl animate-fade-in overflow-hidden">
            <div class="absolute -left-32 -top-32 w-64 h-64 bg-teal-500/10 blur-[60px] rounded-full pointer-events-none"></div>

            <button 
              type="button" 
              (click)="closeAddModal()" 
              class="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10">
              <mat-icon>close</mat-icon>
            </button>

            <div class="relative z-10">
              <h3 class="text-lg font-bold text-white font-display tracking-wide flex items-center gap-2">
                <mat-icon class="text-teal-400 text-[22px]">{{ editingContact() ? 'edit' : 'person_add' }}</mat-icon>
                <span>{{ editingContact() ? 'Edit Contact Record' : 'Create New Contact Record' }}</span>
              </h3>
              <p class="text-xs text-zinc-400 mt-0.5">
                Maintain high-fidelity contact intelligence with phone, email, address, and notes.
              </p>
            </div>

            <form [formGroup]="contactForm" (ngSubmit)="submitContactForm()" class="space-y-3.5 relative z-10">
              <!-- Name -->
              <div class="space-y-1">
                <label for="contactNameInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Full Legal Name *</label>
                <input 
                  id="contactNameInput" 
                  type="text" 
                  formControlName="name" 
                  placeholder="E.g., Satya Nadella" 
                  class="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
              </div>

              <!-- Email and Phone -->
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label for="contactEmailInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address *</label>
                  <input 
                    id="contactEmailInput" 
                    type="email" 
                    formControlName="email" 
                    placeholder="satya@microsoft.com" 
                    class="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
                </div>
                <div class="space-y-1">
                  <label for="contactPhoneInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Phone Number</label>
                  <input 
                    id="contactPhoneInput" 
                    type="text" 
                    formControlName="phone" 
                    placeholder="+1 425-882-8080" 
                    class="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
                </div>
              </div>

              <!-- Company and Address -->
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label for="contactCompanyInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Company / Entity *</label>
                  <input 
                    id="contactCompanyInput" 
                    type="text" 
                    formControlName="company" 
                    placeholder="Microsoft Corporation" 
                    class="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
                </div>
                <div class="space-y-1">
                  <label for="contactAddressInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Office Address</label>
                  <input 
                    id="contactAddressInput" 
                    type="text" 
                    formControlName="address" 
                    placeholder="One Microsoft Way, Redmond, WA" 
                    class="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-teal-500/50" />
                </div>
              </div>

              <!-- Status and Deal Value -->
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label for="contactStatusSelect" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Lifecycle Stage</label>
                  <select 
                    id="contactStatusSelect" 
                    formControlName="status"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-teal-500/50">
                    <option value="Lead">Lead (Inbound Prospect)</option>
                    <option value="Opportunity">Opportunity (Active Deal)</option>
                    <option value="Customer">Customer (Signed Account)</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label for="contactDealValueInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Est. Deal Value ($)</label>
                  <input 
                    id="contactDealValueInput" 
                    type="number" 
                    formControlName="dealValue" 
                    placeholder="50000" 
                    class="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl py-2 px-3 text-xs font-mono font-bold text-teal-400 focus:outline-none focus:border-teal-500/50" />
                </div>
              </div>

              <!-- Notes (Requested by user) -->
              <div class="space-y-1">
                <label for="contactNotesInput" class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Relationship Notes & Key Context</label>
                <textarea 
                  id="contactNotesInput" 
                  rows="3" 
                  formControlName="notes" 
                  placeholder="Record strategic context, key executive sponsors, meeting takeaways, and negotiation background..." 
                  class="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-teal-500/50 resize-none font-sans leading-relaxed"></textarea>
              </div>

              <div class="pt-3 flex justify-between items-center gap-2.5 border-t border-zinc-800/80">
                <button 
                  type="button" 
                  (click)="fillSampleData()" 
                  class="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-teal-400 text-xs font-semibold rounded-xl border border-zinc-800 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Auto-fill realistic enterprise contact profile">
                  <mat-icon class="text-xs">auto_fix_high</mat-icon>
                  <span>Sample Data</span>
                </button>
                <div class="flex items-center gap-2">
                  <button 
                    type="button" 
                    (click)="closeAddModal()" 
                    class="px-4 py-2 bg-transparent hover:text-white text-zinc-400 font-bold rounded-xl text-xs transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    [disabled]="contactForm.invalid" 
                    class="px-5 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-zinc-950 font-bold rounded-xl text-xs transition-colors shadow-lg flex items-center gap-1.5 cursor-pointer">
                    <mat-icon class="text-sm">save</mat-icon>
                    <span>{{ editingContact() ? 'Update Record' : 'Save Contact' }}</span>
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      }

      <!-- Marketing Sync Modal -->
      @if (showMarketingSyncModal()) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 class="text-base font-bold text-white font-display flex items-center gap-2">
                <mat-icon class="text-teal-400">cloud_sync</mat-icon>
                <span>Sync with Marketing Service</span>
              </h3>
              <button (click)="showMarketingSyncModal.set(false)" class="text-zinc-500 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <p class="text-xs text-zinc-400 leading-relaxed">
              Synchronize your active CRM contacts (including LTV deal value, company domain, and stage tags) into your chosen marketing audience.
            </p>

            <div class="space-y-3 text-xs">
              <div>
                <span class="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Destination Provider</span>
                <div class="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    (click)="selectedSyncProvider.set('mailchimp')"
                    [class]="selectedSyncProvider() === 'mailchimp' ? 'border-amber-500 bg-amber-500/10 text-white' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'"
                    class="p-2.5 rounded-xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1 cursor-pointer">
                    <mat-icon class="text-amber-400 text-sm">local_post_office</mat-icon>
                    <span>Mailchimp</span>
                  </button>

                  <button 
                    type="button"
                    (click)="selectedSyncProvider.set('sendgrid')"
                    [class]="selectedSyncProvider() === 'sendgrid' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'"
                    class="p-2.5 rounded-xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1 cursor-pointer">
                    <mat-icon class="text-blue-400 text-sm">send</mat-icon>
                    <span>SendGrid</span>
                  </button>

                  <button 
                    type="button"
                    (click)="selectedSyncProvider.set('hubspot')"
                    [class]="selectedSyncProvider() === 'hubspot' ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'"
                    class="p-2.5 rounded-xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1 cursor-pointer">
                    <mat-icon class="text-orange-400 text-sm">hub</mat-icon>
                    <span>HubSpot</span>
                  </button>
                </div>
              </div>

              <div class="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-1.5 font-mono text-[11px]">
                <div class="flex justify-between text-zinc-400">
                  <span>Audience List:</span>
                  <span class="text-zinc-200 font-sans font-medium">{{ marketing.providers()[selectedSyncProvider()].listName }}</span>
                </div>
                <div class="flex justify-between text-zinc-400">
                  <span>Contacts in CRM:</span>
                  <span class="text-teal-400 font-bold font-mono">{{ filteredContacts().length }} matching records</span>
                </div>
                <div class="flex justify-between text-zinc-400">
                  <span>Two-Way Sync:</span>
                  <span class="text-emerald-400 font-sans">Active (Opt-outs mirrored)</span>
                </div>
              </div>

              @if (marketing.isSyncing()) {
                <div class="space-y-1.5 pt-1">
                  <div class="flex justify-between text-[11px] font-mono text-zinc-400">
                    <span>Synchronizing...</span>
                    <span class="text-teal-400 font-bold">{{ marketing.syncProgress() }}%</span>
                  </div>
                  <div class="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-gradient-to-r from-teal-400 to-emerald-400 h-full transition-all duration-300" [style.width.%]="marketing.syncProgress()"></div>
                  </div>
                </div>
              }
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button 
                type="button"
                (click)="showMarketingSyncModal.set(false)" 
                class="px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer">
                Cancel
              </button>
              <button 
                type="button"
                (click)="executeMarketingSync()" 
                [disabled]="marketing.isSyncing()"
                class="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer">
                @if (marketing.isSyncing()) {
                  <mat-icon class="animate-spin text-sm">sync</mat-icon>
                  <span>Syncing...</span>
                } @else {
                  <mat-icon class="text-sm">sync</mat-icon>
                  <span>Sync {{ filteredContacts().length }} Contacts</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Brand Signature (Mandatory Instrument) -->
      <footer class="pt-4 pb-2 border-t border-zinc-900/60 flex items-center justify-between text-zinc-600 select-none flex-shrink-0">
        <div class="opacity-40" style="mix-blend-mode: overlay;">
          <div class="font-display font-bold text-[10px] tracking-normal text-white">ΛΞV Inc</div>
          <div class="font-sans font-light text-[8px] tracking-[0.2em] text-zinc-400">The Future Needs Context · Innovate, Automate, Dominate</div>
        </div>
        <div class="text-[10px] font-mono text-zinc-600">
          VIP v2.0 · Ancient Roman Glass Canvas
        </div>
      </footer>

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
    .animate-slide-in {
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(12px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(82, 82, 91, 0.4);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(113, 113, 122, 0.7);
    }
  `]
})
export class ContactsComponent {
  appwrite = inject(Appwrite);
  fb = inject(FormBuilder);
  router = inject(Router);
  leadService = inject(LeadService);
  marketing = inject(EmailMarketingService);

  searchQuery = signal<string>('');
  activeStatusFilter = signal<string>('All');
  activeTierFilter = signal<string>('All');
  activeAddressFilter = signal<string>('All');
  sortBy = signal<string>('name');
  viewMode = signal<'table' | 'grid' | 'map'>('table');

  contactsAsLeads = computed<Lead[]>(() => {
    return this.filteredContacts().map((c) => {
      let lat = 37.7749;
      let lng = -122.4194;
      const addr = (c.address || '').toLowerCase();
      if (addr.includes('redmond') || addr.includes('wa') || addr.includes('98052')) {
        lat = 47.6740; lng = -122.1215;
      } else if (addr.includes('mission street') || addr.includes('san francisco') || addr.includes('94105')) {
        lat = 37.7897; lng = -122.3972;
      } else if (addr.includes('howard street')) {
        lat = 37.7879; lng = -122.3963;
      } else if (addr.includes('18th street') || addr.includes('94110')) {
        lat = 37.7619; lng = -122.4172;
      } else if (addr.includes('santa clara') || addr.includes('san tomas')) {
        lat = 37.3708; lng = -121.9639;
      } else if (addr.includes('hawthorne') || addr.includes('rocket road')) {
        lat = 33.9207; lng = -118.3278;
      } else if (addr.includes('new york') || addr.includes('ny')) {
        lat = 40.7128; lng = -74.0060;
      } else if (addr.includes('austin') || addr.includes('tx')) {
        lat = 30.2672; lng = -97.7431;
      } else if (addr.includes('london') || addr.includes('uk')) {
        lat = 51.5074; lng = -0.1278;
      }

      return {
        $id: c.$id,
        name: c.name,
        company: c.company,
        email: c.email || '',
        phone: c.phone || '',
        source: 'Directory',
        status: c.status === 'Customer' ? 'Closed' : c.status === 'Opportunity' ? 'Negotiation' : 'Qualified',
        value: c.dealValue || 50000,
        region: c.address ? c.address.split(',').slice(-2).join(',').trim() : 'North America',
        jobTitle: 'Corporate Relationship',
        lat,
        lng
      } as Lead;
    });
  });

  selectedContact = signal<ContactRecord | null>(null);
  selectedTone = signal<string>('Executive');
  aiDraft = signal<string>('');
  isGenerating = signal<boolean>(false);
  showAddModal = signal<boolean>(false);
  editingContact = signal<ContactRecord | null>(null);

  // Marketing Sync state
  showMarketingSyncModal = signal<boolean>(false);
  selectedSyncProvider = signal<EmailMarketingProvider>('mailchimp');

  // Quick Inline Edit state in detail drawer
  isInlineEditing = signal<boolean>(false);
  inlineName = signal<string>('');
  inlineCompany = signal<string>('');
  inlineEmail = signal<string>('');
  inlinePhone = signal<string>('');
  inlineAddress = signal<string>('');
  inlineStatus = signal<string>('Lead');
  inlineDealValue = signal<number>(0);
  inlineNotes = signal<string>('');

  // Attach Deal state
  showAttachDealInline = signal<boolean>(false);
  newDealTitle = signal<string>('');
  newDealStage = signal<string>('Negotiation');
  newDealValue = signal<number>(50000);

  quickNoteInput = signal<string>('');
  contactForm!: FormGroup;

  constructor() {
    this.initForm();
    this.leadService.loadLeads();

    // Auto-select initial contact
    setTimeout(() => {
      const all = this.filteredContacts();
      if (all && all.length > 0 && !this.selectedContact()) {
        this.selectedContact.set(all[0]);
      }
    }, 250);
  }

  private initForm() {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      company: ['', [Validators.required]],
      address: [''],
      notes: [''],
      status: ['Lead', Validators.required],
      dealValue: [15000, [Validators.min(0)]]
    });
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  filteredContacts = computed(() => {
    let list: ContactRecord[] = this.appwrite.contacts();
    
    // Fallback seed list if empty
    if (!list || list.length === 0) {
      list = [
        { 
          $id: 'mock-c1', 
          name: 'Bill Gates', 
          email: 'bill@microsoft.com', 
          phone: '+1 425 882 8080', 
          company: 'Microsoft Corp', 
          address: 'One Microsoft Way, Redmond, WA 98052', 
          notes: 'Founder sponsor. Primary stakeholder for Azure infrastructure migrations and enterprise team licensing. Highly receptive to technical depth.',
          status: 'Customer', 
          dealValue: 450000, 
          lastContacted: '2 hours ago',
          associatedDeals: [
            { id: 'deal-1', title: 'Azure Cloud Migration SLA', stage: 'Signed', value: 450000 }
          ]
        },
        { 
          $id: 'mock-c2', 
          name: 'Marc Benioff', 
          email: 'marc@salesforce.com', 
          phone: '+1 415 901 7000', 
          company: 'Salesforce Inc', 
          address: '415 Mission St, San Francisco, CA 94105', 
          notes: 'Engaged on joint enterprise CRM integration initiative. Requires SOC2 Type II compliance audit and mutual non-disclosure.',
          status: 'Opportunity', 
          dealValue: 180000, 
          lastContacted: '1 day ago',
          associatedDeals: [
            { id: 'deal-2', title: 'Salesforce FedRAMP Gateway', stage: 'Negotiation', value: 180000 }
          ]
        },
        { 
          $id: 'mock-c3', 
          name: 'Stewart Butterfield', 
          email: 'stewart@slack.com', 
          phone: '+1 415 555 1212', 
          company: 'Slack Technologies', 
          address: '500 Howard St, San Francisco, CA 94105', 
          notes: 'Evaluating automated webhook triggers for internal company alerts and workspace messaging.',
          status: 'Lead', 
          dealValue: 65000, 
          lastContacted: '5 minutes ago',
          associatedDeals: [
            { id: 'deal-3', title: 'Slack Enterprise Bot Connector', stage: 'Discovery', value: 65000 }
          ]
        },
        { 
          $id: 'mock-c4', 
          name: 'Sam Altman', 
          email: 'sam@openai.com', 
          phone: '+1 415 333 9999', 
          company: 'OpenAI', 
          address: '3180 18th St, San Francisco, CA 94110', 
          notes: 'High-touch AI partner account. Requested custom edge inference SLAs and multi-tenant security architecture.',
          status: 'Customer', 
          dealValue: 850000, 
          lastContacted: 'Just now',
          associatedDeals: [
            { id: 'deal-4', title: 'Edge Inference SLA & Data Pipeline', stage: 'Signed', value: 850000 }
          ]
        }
      ];
    }

    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.activeStatusFilter();
    const tier = this.activeTierFilter();
    const addressFilter = this.activeAddressFilter();
    const sort = this.sortBy();

    const result = list.filter(c => {
      const matchQuery = !query || 
        c.name?.toLowerCase().includes(query) ||
        c.company?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query) ||
        c.address?.toLowerCase().includes(query) ||
        c.notes?.toLowerCase().includes(query);

      const matchFilter = filter === 'All' || c.status === filter;

      let matchTier = true;
      const val = c.dealValue || 0;
      if (tier === 'sub50') matchTier = val < 50000;
      else if (tier === '50to200') matchTier = val >= 50000 && val <= 200000;
      else if (tier === '200plus') matchTier = val > 200000;

      const matchAddress = addressFilter !== 'has_address' || !!(c.address && c.address.trim());

      return matchQuery && matchFilter && matchTier && matchAddress;
    });

    return result.sort((a, b) => {
      if (sort === 'value') {
        return (b.dealValue || 0) - (a.dealValue || 0);
      }
      if (sort === 'value_asc') {
        return (a.dealValue || 0) - (b.dealValue || 0);
      }
      if (sort === 'company') {
        return (a.company || '').localeCompare(b.company || '');
      }
      if (sort === 'status') {
        return (a.status || '').localeCompare(b.status || '');
      }
      if (sort === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      if (sort === 'recent') {
        return (b.lastContacted || '').localeCompare(a.lastContacted || '');
      }
      return a.name.localeCompare(b.name);
    });
  });

  totalContactsCount = computed(() => this.filteredContacts().length);
  opportunityContactsCount = computed(() => this.appwrite.contacts().filter(c => c.status === 'Opportunity').length || 1);
  customerContactsCount = computed(() => this.appwrite.contacts().filter(c => c.status === 'Customer').length || 2);
  totalPipelineLtv = computed(() => {
    const list = this.filteredContacts();
    return list.reduce((acc, c) => acc + (c.dealValue || 0), 0);
  });

  selectContact(contact: ContactRecord) {
    this.selectedContact.set(contact);
    this.aiDraft.set('');
    this.quickNoteInput.set('');
  }

  getAcronym(name: string): string {
    if (!name) return 'C';
    const split = name.trim().split(' ');
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
      email: [contact.email || '', [Validators.required, Validators.email]],
      phone: [contact.phone || ''],
      company: [contact.company || '', [Validators.required]],
      address: [contact.address || ''],
      notes: [contact.notes || ''],
      status: [contact.status || 'Lead', Validators.required],
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
      const updated = { ...editing, ...data };
      this.selectedContact.set(updated);
      this.appwrite.addNotification({
        title: 'Contact Updated',
        message: `Successfully updated record for "${data.name}" (${data.company}).`,
        type: 'success'
      });
    } else {
      const created = await this.appwrite.addContact({
        ...data,
        lastContacted: 'Just now'
      });
      this.selectedContact.set(created);
      this.appwrite.addNotification({
        title: 'Contact Created',
        message: `Bound new relationship record "${data.name}" at ${data.company}.`,
        type: 'success'
      });
    }
    this.closeAddModal();
  }

  async deleteContactRecord(id: string) {
    if (confirm('Are you certain you wish to purge this relationship record from the system?')) {
      await this.appwrite.deleteContact(id);
      if (this.selectedContact()?.$id === id) {
        this.selectedContact.set(null);
      }
      this.appwrite.addNotification({
        title: 'Contact Purged',
        message: 'The contact record was deleted from the ledger.',
        type: 'info'
      });
    }
  }

  async appendQuickNote(contact: ContactRecord) {
    const text = this.quickNoteInput().trim();
    if (!text) return;

    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const formattedAppend = `[${dateStr}] ${text}`;
    const newNotes = contact.notes ? `${contact.notes}\n${formattedAppend}` : formattedAppend;

    await this.appwrite.updateContact(contact.$id, { notes: newNotes });
    const updated = { ...contact, notes: newNotes };
    this.selectedContact.set(updated);
    this.quickNoteInput.set('');

    this.appwrite.addNotification({
      title: 'Note Appended',
      message: `Added interaction note for ${contact.name}.`,
      type: 'success'
    });
  }

  getLoggedEmailsForContact(contact: ContactRecord) {
    const all = this.appwrite.emails();
    return all.filter(e => 
      e.contactId === contact.$id || 
      (e.recipientEmail && contact.email && e.recipientEmail.toLowerCase() === contact.email.toLowerCase()) ||
      (e.recipient && contact.name && e.recipient.toLowerCase().includes(contact.name.toLowerCase()))
    );
  }

  composeEmailForContact(contact: ContactRecord, prefillBody?: string) {
    this.router.navigate(['/emails'], {
      queryParams: {
        contactId: contact.$id,
        recipient: contact.email || '',
        name: contact.name,
        company: contact.company,
        deal: contact.associatedDeals?.[0]?.title || `${contact.company} Contract SLA`,
        body: prefillBody || ''
      }
    });
  }

  copyText(text: string | undefined, message: string) {
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.appwrite.addNotification({
        title: 'Copied to Clipboard',
        message: message,
        type: 'info'
      });
    }
  }

  generateAIOutreach(contact: ContactRecord) {
    this.isGenerating.set(true);
    const tone = this.selectedTone();

    setTimeout(() => {
      let draftText = '';
      if (tone === 'Executive') {
        draftText = `Subject: Strategic Architecture & Engagement Roadmap for ${contact.company}\n\nDear ${contact.name},\n\nI hope this message finds you well.\n\nIn reviewing ${contact.company}'s current infrastructure and relationship benchmarks, we identified key opportunities to optimize data latency and contract SLA throughput by 24-28%.\n\nAddress on file: ${contact.address || contact.company + ' HQ'}.\nNotes on file: ${contact.notes || 'Enterprise modernization'}.\n\nCould we schedule a concise 10-minute briefing next Tuesday to review the custom forecast?\n\nSincerely,\nSales Engineering\nlxv Enterprise Operations`;
      } else if (tone === 'Direct') {
        draftText = `Subject: Quick sync on ${contact.company} roadmap\n\nHi ${contact.name},\n\nQuick follow-up regarding our recent sync. We have locked in the enterprise pricing tier (${this.formatCurrency(contact.dealValue)}) through end of quarter.\n\nLet me know if Thursday at 2 PM works for a prompt confirmation.\n\nBest,\nSales Operations, lxv`;
      } else {
        draftText = `Subject: Paradigm shift for ${contact.company}'s customer intelligence\n\nHello ${contact.name},\n\nLegacy CRM software continues to impede high-growth teams. lxv offers ${contact.company} an immutable, high-throughput workspace designed to transmute operational complexity into absolute clarity.\n\nLet's schedule a high-bandwidth terminal walkthrough this week.\n\nWarm regards,\nStrategic Alliances, lxv`;
      }
      this.aiDraft.set(draftText);
      this.isGenerating.set(false);
    }, 850);
  }

  toggleSort(column: string) {
    const current = this.sortBy();
    if (column === 'name') {
      this.sortBy.set(current === 'name' ? 'name_desc' : 'name');
    } else if (column === 'value') {
      this.sortBy.set(current === 'value' ? 'value_asc' : 'value');
    } else if (column === 'company') {
      this.sortBy.set('company');
    } else if (column === 'status') {
      this.sortBy.set('status');
    } else {
      this.sortBy.set('recent');
    }
  }

  getSortIcon(column: string): string {
    const s = this.sortBy();
    if (column === 'name') {
      if (s === 'name') return 'arrow_upward';
      if (s === 'name_desc') return 'arrow_downward';
    }
    if (column === 'value') {
      if (s === 'value') return 'arrow_downward';
      if (s === 'value_asc') return 'arrow_upward';
    }
    if (column === s) return 'arrow_upward';
    return 'unfold_more';
  }

  toggleAddressFilter() {
    this.activeAddressFilter.update(curr => curr === 'has_address' ? 'All' : 'has_address');
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery().trim() ||
      this.activeStatusFilter() !== 'All' ||
      this.activeTierFilter() !== 'All' ||
      this.activeAddressFilter() !== 'All' ||
      this.sortBy() !== 'name'
    );
  }

  resetAllFilters() {
    this.searchQuery.set('');
    this.activeStatusFilter.set('All');
    this.activeTierFilter.set('All');
    this.activeAddressFilter.set('All');
    this.sortBy.set('name');
  }

  exportContactsCsv() {
    const list = this.filteredContacts();
    if (!list || list.length === 0) return;

    const headers = ['Name', 'Company', 'Email', 'Phone', 'Address', 'Status', 'Deal Value', 'Notes', 'Last Contacted'];
    const rows = list.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.company || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${(c.status || '').replace(/"/g, '""')}"`,
      c.dealValue || 0,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
      `"${(c.lastContacted || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.appwrite.addNotification({
      title: 'Directory Exported',
      message: `Exported ${list.length} contact records to CSV.`,
      type: 'success'
    });
  }

  exportContactsJson() {
    const list = this.filteredContacts();
    if (!list || list.length === 0) return;

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(list, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `contacts_directory_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.appwrite.addNotification({
      title: 'Directory Exported',
      message: `Exported ${list.length} contact records to JSON.`,
      type: 'success'
    });
  }

  getMapsUrl(address: string | undefined): string {
    if (!address) return '#';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  fillSampleData() {
    const samples = [
      {
        name: 'Jensen Huang',
        email: 'jensen@nvidia.com',
        phone: '+1 (408) 486-2000',
        company: 'NVIDIA Corporation',
        address: '2788 San Tomas Expressway, Santa Clara, CA 95051',
        status: 'Opportunity',
        dealValue: 620000,
        notes: 'Accelerated enterprise GPU workflows. Demands high-performance telemetry and real-time Monte Carlo RevOps simulations.'
      },
      {
        name: 'Gwynne Shotwell',
        email: 'gwynne@spacex.com',
        phone: '+1 (310) 363-6000',
        company: 'SpaceX',
        address: '1 Rocket Road, Hawthorne, CA 90250',
        status: 'Customer',
        dealValue: 920000,
        notes: 'Ground operations supply chain contract tracking. Strict security architecture and zero-downtime database replication required.'
      },
      {
        name: 'Demis Hassabis',
        email: 'demis@deepmind.com',
        phone: '+44 20 7000 0000',
        company: 'Google DeepMind',
        address: '6 Pancras Square, London N1C 4AG, United Kingdom',
        status: 'Customer',
        dealValue: 780000,
        notes: 'Pioneering scientific and frontier AI deployments. High-bandwidth API endpoints and custom edge caching parameters negotiated.'
      }
    ];

    const pick = samples[Math.floor(Math.random() * samples.length)];
    this.contactForm.patchValue(pick);
    this.appwrite.addNotification({
      title: 'Sample Data Loaded',
      message: `Pre-filled sample record for ${pick.name} (${pick.company}).`,
      type: 'info'
    });
  }

  toggleInlineEdit(contact: ContactRecord) {
    if (this.isInlineEditing()) {
      this.isInlineEditing.set(false);
      return;
    }
    this.inlineName.set(contact.name || '');
    this.inlineCompany.set(contact.company || '');
    this.inlineEmail.set(contact.email || '');
    this.inlinePhone.set(contact.phone || '');
    this.inlineAddress.set(contact.address || '');
    this.inlineStatus.set(contact.status || 'Lead');
    this.inlineDealValue.set(contact.dealValue || 0);
    this.inlineNotes.set(contact.notes || '');
    this.isInlineEditing.set(true);
  }

  async saveInlineEdit(contact: ContactRecord) {
    const name = this.inlineName().trim();
    const company = this.inlineCompany().trim();
    if (!name || !company) {
      this.appwrite.addNotification({
        title: 'Validation Error',
        message: 'Name and Company are mandatory fields.',
        type: 'error'
      });
      return;
    }

    const updates = {
      name,
      company,
      email: this.inlineEmail().trim(),
      phone: this.inlinePhone().trim(),
      address: this.inlineAddress().trim(),
      status: this.inlineStatus(),
      dealValue: Number(this.inlineDealValue()) || 0,
      notes: this.inlineNotes().trim()
    };

    await this.appwrite.updateContact(contact.$id, updates);
    const updated = { ...contact, ...updates };
    this.selectedContact.set(updated);
    this.isInlineEditing.set(false);

    this.appwrite.addNotification({
      title: 'Contact Updated',
      message: `Directly updated record for "${name}".`,
      type: 'success'
    });
  }

  toggleAttachDealModal() {
    this.showAttachDealInline.update(v => !v);
  }

  async attachDealToContact(contact: ContactRecord) {
    const title = this.newDealTitle().trim();
    if (!title) return;

    const newDeal: ContactDeal = {
      id: 'deal-' + Date.now(),
      title,
      stage: this.newDealStage(),
      value: Number(this.newDealValue()) || 0
    };

    const existingDeals = contact.associatedDeals || [];
    const updatedDeals = [...existingDeals, newDeal];
    const updatedValue = (contact.dealValue || 0) + newDeal.value;

    await this.appwrite.updateContact(contact.$id, {
      associatedDeals: updatedDeals,
      dealValue: updatedValue
    });

    const updated: ContactRecord = {
      ...contact,
      associatedDeals: updatedDeals,
      dealValue: updatedValue
    };
    this.selectedContact.set(updated);

    this.newDealTitle.set('');
    this.showAttachDealInline.set(false);

    this.appwrite.addNotification({
      title: 'Deal Associated',
      message: `Attached "${title}" (${this.formatCurrency(newDeal.value)}) to ${contact.name}.`,
      type: 'success'
    });
  }

  getBeepContactAdvice(contact: ContactRecord): string {
    if (contact.status === 'Customer') {
      return `BEEP: "Client signed for ${this.formatCurrency(contact.dealValue)}. Don't get complacent. Upsell their team on the Enterprise Telemetry Gateway before their fiscal year ends."`;
    }
    if (contact.status === 'Opportunity') {
      return `BEEP: "Opportunity locked at ${this.formatCurrency(contact.dealValue)} with ${contact.company}. Quit sending 'checking in' emails—send the mutual NDA and book the executive alignment."`;
    }
    return `BEEP: "Unconverted Lead. Address: ${contact.address ? 'Logged' : 'Missing'}. Notes: ${contact.notes ? 'Logged' : 'Sparse'}. Either schedule a discovery call or automate them into an outbound cadence."`;
  }

  openMarketingSyncModal() {
    this.showMarketingSyncModal.set(true);
  }

  async executeMarketingSync() {
    const provider = this.selectedSyncProvider();
    await this.marketing.syncContactsWithProvider(provider, 'all');
    this.showMarketingSyncModal.set(false);
  }
}
