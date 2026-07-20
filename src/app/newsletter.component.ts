import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';
import { Models } from 'appwrite';

interface NewsletterSubscriber extends Models.Document {
  email: string;
  status: string;
  firstName?: string;
  lastName?: string;
  source?: string;
  teamId: string;
}

@Component({
  selector: 'app-newsletter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="h-full flex flex-col relative">
      <div class="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none"></div>
      
      <div class="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 relative z-10">
        <div class="max-w-6xl mx-auto space-y-6">
          
          <!-- Header -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
            <div>
              <h1 class="font-display text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <mat-icon class="text-purple-400">mark_email_read</mat-icon>
                Newsletter Management
              </h1>
              <p class="text-xs md:text-sm text-zinc-400 mt-2">Manage subscribers, monitor growth, and handle campaigns.</p>
            </div>
            
            <div class="flex items-center gap-3">
              <button (click)="openAddModal()" class="bg-purple-500 hover:bg-purple-400 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-[0_0_15px_rgba(168,85,247,0.2)] flex items-center gap-2">
                <mat-icon class="text-[18px]">person_add</mat-icon>
                Add Subscriber
              </button>
            </div>
          </div>

          <!-- KPI Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-5 relative overflow-hidden">
              <div class="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
              <div class="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <mat-icon class="text-[16px] text-purple-400">group</mat-icon> Total Subscribers
              </div>
              <div class="text-3xl font-display font-bold text-white">{{ totalSubscribers() }}</div>
            </div>
            <div class="bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-5 relative overflow-hidden">
              <div class="absolute -right-4 -top-4 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl"></div>
              <div class="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <mat-icon class="text-[16px] text-teal-400">check_circle</mat-icon> Active Status
              </div>
              <div class="text-3xl font-display font-bold text-white">{{ activeSubscribers() }}</div>
            </div>
            <div class="bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm rounded-2xl p-5 relative overflow-hidden">
              <div class="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl"></div>
              <div class="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <mat-icon class="text-[16px] text-rose-400">cancel</mat-icon> Unsubscribed
              </div>
              <div class="text-3xl font-display font-bold text-white">{{ unsubscribed() }}</div>
            </div>
          </div>

          <!-- Subscribers Table -->
          <div class="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-zinc-800/80 bg-zinc-900/80">
                    <th class="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Subscriber</th>
                    <th class="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Source</th>
                    <th class="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Added Date</th>
                    <th class="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/50 text-sm">
                  @if (isLoading()) {
                    <tr>
                      <td colspan="5" class="px-6 py-8 text-center text-zinc-500">
                        <mat-icon class="animate-spin mb-2">refresh</mat-icon>
                        <p>Loading subscribers...</p>
                      </td>
                    </tr>
                  } @else if (subscribers().length === 0) {
                    <tr>
                      <td colspan="5" class="px-6 py-8 text-center text-zinc-500">
                        <mat-icon class="text-4xl mb-2 opacity-50">mail_outline</mat-icon>
                        <p>No subscribers found.</p>
                      </td>
                    </tr>
                  } @else {
                    @for (sub of subscribers(); track sub.$id) {
                      <tr class="hover:bg-zinc-800/30 transition-colors group">
                        <td class="px-6 py-4 border-zinc-800/50 align-top">
                          <div class="font-bold text-white mb-1 flex items-center gap-2">
                            {{ sub.firstName }} {{ sub.lastName }}
                          </div>
                          <div class="flex flex-col gap-1">
                            <span class="text-zinc-400 text-xs flex items-center gap-1.5">
                              <mat-icon class="text-[14px]">mail</mat-icon> {{ sub.email }}
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4 border-zinc-800/50 align-top text-zinc-300">
                          {{ sub.source || 'Manual' }}
                        </td>
                        <td class="px-6 py-4 border-zinc-800/50 align-top">
                          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                                [ngClass]="{
                                  'bg-teal-500/10 text-teal-400 border-teal-500/20': sub.status === 'subscribed',
                                  'bg-rose-500/10 text-rose-400 border-rose-500/20': sub.status === 'unsubscribed'
                                }">
                            {{ sub.status }}
                          </span>
                        </td>
                        <td class="px-6 py-4 border-zinc-800/50 align-top text-zinc-500 text-xs">
                          {{ sub.$createdAt | date:'mediumDate' }}
                        </td>
                        <td class="px-6 py-4 border-zinc-800/50 text-right align-top">
                          <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button (click)="toggleStatus(sub)" class="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800" [title]="sub.status === 'subscribed' ? 'Unsubscribe' : 'Subscribe'">
                              <mat-icon class="text-[18px]">{{ sub.status === 'subscribed' ? 'block' : 'check_circle' }}</mat-icon>
                            </button>
                            <button (click)="deleteSubscriber(sub.$id)" class="text-zinc-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-zinc-800" title="Delete">
                              <mat-icon class="text-[18px]">delete</mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div class="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" tabindex="-1" role="dialog" aria-modal="true">
            <div class="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h3 class="text-lg font-display font-bold text-white flex items-center gap-2">
                <mat-icon class="text-purple-400">person_add</mat-icon> Add Subscriber
              </h3>
              <button (click)="closeModal()" class="text-zinc-500 hover:text-white transition-colors">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            
            <form (ngSubmit)="saveSubscriber()" class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="firstNameInput" class="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">First Name</label>
                  <input id="firstNameInput" type="text" [(ngModel)]="currentSubscriber.firstName" name="firstName" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors">
                </div>
                <div>
                  <label for="lastNameInput" class="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Last Name</label>
                  <input id="lastNameInput" type="text" [(ngModel)]="currentSubscriber.lastName" name="lastName" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors">
                </div>
              </div>

              <div>
                <label for="emailInput" class="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Email <span class="text-rose-500">*</span></label>
                <input id="emailInput" type="email" [(ngModel)]="currentSubscriber.email" name="email" required class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors">
              </div>

              <div>
                <label for="statusInput" class="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Status</label>
                <select id="statusInput" [(ngModel)]="currentSubscriber.status" name="status" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none">
                  <option value="subscribed">Subscribed</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
              </div>
              
              <div class="pt-4 flex justify-end gap-3">
                <button type="button" (click)="closeModal()" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" [disabled]="isSubmitting() || !currentSubscriber.email" class="bg-purple-500 hover:bg-purple-400 disabled:opacity-50 disabled:hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(168,85,247,0.2)] flex items-center gap-2">
                  @if (isSubmitting()) {
                    <mat-icon class="animate-spin text-[18px]">refresh</mat-icon> Saving...
                  } @else {
                    Save
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class NewsletterComponent implements OnInit {
  appwrite = inject(Appwrite);

  subscribers = signal<NewsletterSubscriber[]>([]);
  isLoading = signal<boolean>(true);
  showModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  currentSubscriber: Partial<NewsletterSubscriber> = {
    status: 'subscribed'
  };

  totalSubscribers = computed(() => this.subscribers().length);
  activeSubscribers = computed(() => this.subscribers().filter(s => s.status === 'subscribed').length);
  unsubscribed = computed(() => this.subscribers().filter(s => s.status === 'unsubscribed').length);

  ngOnInit() {
    this.loadSubscribers();
  }

  async loadSubscribers() {
    this.isLoading.set(true);
    try {
      const response = await this.appwrite.databases.listDocuments('leadwave-main', 'newsletter_subscribers');
      this.subscribers.set(response.documents as unknown as NewsletterSubscriber[]);
    } catch (err) {
      const error = err as { code?: number, message?: string };
      console.error('Failed to load subscribers', error);
      if (error.code === 404) {
         this.appwrite.addNotification({
          title: 'Setup Required',
          message: 'Newsletter database not found. Please run the setup-newsletter-db.js script.',
          isRead: false,
          type: 'warning'
        });
      } else {
        this.appwrite.addNotification({
          title: 'Error',
          message: 'Could not load newsletter subscribers.',
          isRead: false,
          type: 'error'
        });
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  openAddModal() {
    this.currentSubscriber = {
      status: 'subscribed',
      source: 'manual'
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async saveSubscriber() {
    if (!this.currentSubscriber.email) return;
    
    this.isSubmitting.set(true);
    try {
      if (this.currentSubscriber.$id) {
        // Update logic (omitted for brevity, but follows same pattern)
      } else {
        // Create new via Appwrite DB SDK directly (since this is internal CRM management)
        // Alternatively we could call our Appwrite Function, but we'll use DB directly for CRM admins
        const teamId = 'team-1'; // Mock team ID for now, in a real app would come from auth context
        
        // Use ID.unique() from appwrite package if imported, or just let backend handle it if calling function.
        // We will call the database directly for now.
        const res = await this.appwrite.databases.createDocument('leadwave-main', 'newsletter_subscribers', 'unique()', {
          email: this.currentSubscriber.email,
          status: this.currentSubscriber.status,
          firstName: this.currentSubscriber.firstName || '',
          lastName: this.currentSubscriber.lastName || '',
          source: this.currentSubscriber.source || 'manual',
          teamId: teamId
        });
        
        this.subscribers.update(subs => [res as unknown as NewsletterSubscriber, ...subs]);
        
        this.appwrite.addNotification({
          title: 'Success',
          message: 'Subscriber added successfully.',
          isRead: false,
          type: 'success'
        });
      }
      this.closeModal();
    } catch (err) {
      const error = err as { code?: number, message?: string };
      console.error('Save failed', error);
      this.appwrite.addNotification({
        title: 'Error',
        message: error.message || 'Failed to save subscriber.',
        isRead: false,
        type: 'error'
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async toggleStatus(sub: NewsletterSubscriber) {
    const newStatus = sub.status === 'subscribed' ? 'unsubscribed' : 'subscribed';
    try {
      await this.appwrite.databases.updateDocument('leadwave-main', 'newsletter_subscribers', sub.$id, {
        status: newStatus
      });
      
      this.subscribers.update(subs => subs.map(s => s.$id === sub.$id ? { ...s, status: newStatus } : s));
    } catch (err) {
       console.error('Failed to update status', err);
       this.appwrite.addNotification({
        title: 'Error',
        message: 'Failed to update subscriber status.',
        isRead: false,
        type: 'error'
      });
    }
  }
  
  async deleteSubscriber(id: string) {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;
    
    try {
      await this.appwrite.databases.deleteDocument('leadwave-main', 'newsletter_subscribers', id);
      this.subscribers.update(subs => subs.filter(s => s.$id !== id));
      
      this.appwrite.addNotification({
        title: 'Success',
        message: 'Subscriber deleted.',
        isRead: false,
        type: 'success'
      });
    } catch (err) {
       console.error('Failed to delete subscriber', err);
       this.appwrite.addNotification({
        title: 'Error',
        message: 'Failed to delete subscriber.',
        isRead: false,
        type: 'error'
      });
    }
  }
}
