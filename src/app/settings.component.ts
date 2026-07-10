/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Appwrite } from './appwrite';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  template: `
    <div class="max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      
      <!-- Top banner status -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6 mb-2">
        <div>
          <h1 class="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <mat-icon class="text-teal-400 text-[28px]">settings_ethernet</mat-icon>
            Appwrite Integration Control Center
          </h1>
          <p class="text-sm font-medium text-zinc-400 mt-1">
            Manage your Appwrite SDK credentials, authentication state, real-time sync, and team-based tenant workspaces.
          </p>
        </div>
        
        <!-- Connection Pill -->
        <div class="flex items-center gap-3">
          <div [ngClass]="appwrite.isConnected() ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'" 
               class="px-4 py-2 rounded-xl border flex items-center gap-2 text-sm font-semibold shadow-inner">
            <span class="w-2.5 h-2.5 rounded-full" [ngClass]="appwrite.isConnected() ? 'bg-teal-400 animate-pulse' : 'bg-rose-400'"></span>
            <span>Appwrite Status: {{ appwrite.isConnected() ? 'Live Connected' : 'Error / Offline' }}</span>
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left: API Credentials Configuration Form -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div class="flex items-center gap-3 mb-5 border-b border-zinc-800/50 pb-4">
              <mat-icon class="text-zinc-400">api</mat-icon>
              <h2 class="text-base font-bold text-white font-display tracking-tight">API Credentials Settings</h2>
            </div>

            <form [formGroup]="configForm" (ngSubmit)="applyConfig()" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label for="endpoint-field" class="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Appwrite API Endpoint</label>
                  <input id="endpoint-field" type="text" formControlName="endpoint" 
                         class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium font-mono" />
                </div>
                
                <div>
                  <label for="project-field" class="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Project ID</label>
                  <input id="project-field" type="text" formControlName="projectId" 
                         class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium font-mono" />
                </div>

                <div>
                  <label for="database-field" class="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Database ID</label>
                  <input id="database-field" type="text" formControlName="databaseId" 
                         class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium font-mono" />
                </div>

                <div>
                  <label for="contracts-field" class="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Contracts Collection ID</label>
                  <input id="contracts-field" type="text" formControlName="contractsCollectionId" 
                         class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium font-mono" />
                </div>

                <div>
                  <label for="contacts-field" class="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Contacts Collection ID</label>
                  <input id="contacts-field" type="text" formControlName="contactsCollectionId" 
                         class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium font-mono" />
                </div>

                <div>
                  <label for="tasks-field" class="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Tasks Collection ID</label>
                  <input id="tasks-field" type="text" formControlName="tasksCollectionId" 
                         class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium font-mono" />
                </div>

                <div class="md:col-span-2">
                  <label for="notifications-field" class="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Notifications Collection ID</label>
                  <input id="notifications-field" type="text" formControlName="notificationsCollectionId" 
                         class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium font-mono" />
                </div>

              </div>

              <!-- Action buttons -->
              <div class="flex items-center gap-3 pt-4 border-t border-zinc-800/50 mt-6">
                <button type="submit" [disabled]="!configForm.valid || appwrite.isConnecting()"
                        class="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-teal-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md">
                  <mat-icon class="text-[18px]">save</mat-icon>
                  <span>Save & Initialize SDK</span>
                </button>
                <button type="button" (click)="resetToDefaults()"
                        class="flex items-center gap-2 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-5 py-2.5 rounded-xl text-xs font-bold transition-all">
                  <mat-icon class="text-[18px]">restart_alt</mat-icon>
                  <span>Reset to default URL</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Team Tenants Workspace Administration -->
          <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-zinc-800/50 pb-4">
              <div class="flex items-center gap-3">
                <mat-icon class="text-zinc-400">group_work</mat-icon>
                <div>
                  <h2 class="text-base font-bold text-white font-display tracking-tight">Active Team Workspace</h2>
                  <p class="text-xs text-zinc-500">Enable secure data isolation for organizations or projects.</p>
                </div>
              </div>
              
              <!-- Active workspace badge -->
              @if (appwrite.activeTeam(); as active) {
                <div class="bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold py-1 px-3 rounded-md">
                  Tenant: {{ active.name }}
                </div>
              }
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Change workspace selection -->
              <div class="space-y-4">
                <h3 class="text-xs font-bold tracking-widest text-zinc-400 uppercase">My Workspaces</h3>
                @if (appwrite.userTeams().length === 0) {
                  <p class="text-[13px] text-zinc-500 leading-normal">Configure credentials or log in to pull your workspace organizations list.</p>
                } @else {
                  <div class="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                    @for (team of appwrite.userTeams(); track team.$id) {
                      <button type="button" (click)="appwrite.activeTeam.set(team)" (keyup.enter)="appwrite.activeTeam.set(team)"
                           [ngClass]="appwrite.activeTeam()?.$id === team.$id ? 'bg-zinc-800/80 border-teal-500/40 text-white' : 'bg-zinc-950 hover:bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:text-white'"
                           class="w-full text-left flex justify-between items-center py-2.5 px-3.5 border rounded-xl cursor-pointer transition-all">
                        <div class="flex items-center gap-2.5 justify-start">
                          <mat-icon class="text-[14px] w-4 h-4 mr-1 opacity-60">layers</mat-icon>
                          <span class="text-xs font-semibold">{{ team.name }}</span>
                        </div>
                        @if (appwrite.activeTeam()?.$id === team.$id) {
                          <mat-icon class="text-teal-400 text-[16px]">check_circle_outline</mat-icon>
                        }
                      </button>
                    }
                  </div>
                }

                <!-- Create Workspace form -->
                <div class="pt-2">
                  <div class="flex gap-2">
                    <input #teamInput type="text" placeholder="New workspace name" 
                           class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500/50" />
                    <button (click)="createWorkspace(teamInput.value); teamInput.value = ''"
                            class="bg-zinc-800 hover:bg-zinc-700 text-white px-4.5 rounded-lg text-xs font-semibold border border-zinc-700 select-none shadow-inner">
                      Create
                    </button>
                  </div>
                </div>
              </div>

              <!-- Invite other members to workspace -->
              <div class="space-y-4 border-t md:border-t-0 md:border-l border-zinc-800/80 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                <div>
                  <h3 class="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3">Workspace Member Invitation</h3>
                  <p class="text-xs text-zinc-500 mb-4 leading-relaxed">
                    Enter the email address of colleagues to invite them to collaborate in the active workspace context with tenant security.
                  </p>
                  
                  <div class="space-y-3">
                    <input #inviteEmail type="email" placeholder="colleague@domain.com"
                           class="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500/50" />
                    <input #inviteName type="text" placeholder="Colleague Full Name"
                           class="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none" />
                  </div>
                </div>

                <div class="pt-3">
                  <button (click)="sendInvite(inviteEmail.value, inviteName.value); inviteEmail.value = ''; inviteName.value = ''"
                          class="bg-teal-500 hover:bg-teal-400 text-teal-950 py-2 w-full rounded-lg text-xs font-bold border border-teal-400/20 transition-colors shadow-sm">
                    Send Team Invitation
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Right: Authentication & Status Information -->
        <div class="space-y-6">
          
          <!-- Authentication State -->
          <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div class="flex items-center gap-3 mb-5 border-b border-zinc-800/50 pb-4">
              <mat-icon class="text-zinc-400">lock_open</mat-icon>
              <h2 class="text-base font-bold text-white font-display tracking-tight">Active Session Auth</h2>
            </div>

            <!-- Logged In view -->
            @if (appwrite.currentUser(); as user) {
              <div class="space-y-4">
                <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                  <img src="https://api.dicebear.com/7.x/notionists/svg?seed={{user.name || 'User'}}" alt="User Profile" class="w-10 h-10 rounded-full bg-zinc-850" />
                  <div class="min-w-0">
                    <h4 class="text-xs font-bold text-white">{{ user.name }}</h4>
                    <p class="text-[11px] text-zinc-500 truncate mt-0.5">{{ user.email }}</p>
                  </div>
                </div>

                <!-- Session details list -->
                <div class="space-y-2 pt-2 text-[11px] text-zinc-400 font-mono">
                  <div class="flex justify-between">
                    <span class="text-zinc-500 font-sans uppercase font-semibold">User ID:</span>
                    <span>{{ user.$id }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500 font-sans uppercase font-semibold">Registered:</span>
                    <span>{{ user.registration | date:'short' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500 font-sans uppercase font-semibold">Verified:</span>
                    <span [ngClass]="user.emailVerification ? 'text-teal-400' : 'text-amber-500'">{{ user.emailVerification ? 'Yes ✅' : 'No' }}</span>
                  </div>
                </div>

                <button (click)="logout()" 
                        class="w-full mt-4 flex items-center justify-center gap-2 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 py-2 px-4 rounded-xl text-xs font-bold transition-all">
                  <mat-icon class="text-[16px]">logout</mat-icon>
                  <span>Logout Appwrite Session</span>
                </button>
              </div>
            } @else {
              <!-- Logged out sign in form -->
              <div class="space-y-4">
                <div class="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                  <button (click)="authMode.set('login')" [ngClass]="authMode() === 'login' ? 'bg-zinc-800 text-white' : 'text-zinc-400'"
                          class="flex-1 py-1.5 text-xs font-semibold rounded-md transition-all select-none">
                    Log In
                  </button>
                  <button (click)="authMode.set('register')" [ngClass]="authMode() === 'register' ? 'bg-zinc-800 text-white' : 'text-zinc-400'"
                          class="flex-1 py-1.5 text-xs font-semibold rounded-md transition-all select-none">
                    Register
                  </button>
                </div>

                <form [formGroup]="authForm" (ngSubmit)="handleAuth()" class="space-y-3.5">
                  @if (authMode() === 'register') {
                    <div>
                      <input type="text" formControlName="name" placeholder="Full Name"
                             class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none" />
                    </div>
                  }

                  <div>
                    <input type="email" formControlName="email" placeholder="email@address.com"
                           class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none" />
                  </div>

                  <div>
                    <input type="password" formControlName="password" placeholder="••••••••"
                           class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none" />
                  </div>

                  <button type="submit" [disabled]="!authForm.valid || appwrite.isConnecting()"
                          class="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-teal-950 py-2 rounded-xl text-xs font-bold font-display tracking-tight transition-all shadow-md mt-4">
                    {{ authMode() === 'login' ? 'Proceed Log In' : 'Create Account' }}
                  </button>
                </form>
              </div>
            }
          </div>

          <!-- Developer Info & Guides -->
          <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div class="flex items-center gap-3 mb-4">
              <mat-icon class="text-teal-400">help</mat-icon>
              <h3 class="text-sm font-bold text-white font-display tracking-tight">Appwrite Integration Guide</h3>
            </div>

            <p class="text-xs text-zinc-400 leading-relaxed mb-4">
              Appwrite acts as your persistent cloud backend. To link your self-hosted or Appwrite Cloud console instance:
            </p>

            <ul class="space-y-2 text-[11px] text-zinc-500 pl-4 list-decimal leading-relaxed">
              <li>Create a project in the Appwrite Console.</li>
              <li>Under <span class="text-zinc-400">Platforms</span>, add a Web app platform and insert your hosted CRM domain namespace.</li>
              <li>Create a database with ID <code class="text-zinc-300 font-mono">leadwave-main</code>.</li>
              <li>Inside your database, create the following collections:
                <code class="text-zinc-300 font-mono">contracts</code>, <code class="text-zinc-300 font-mono">contacts</code>, <code class="text-zinc-300 font-mono">tasks</code>, and <code class="text-zinc-300 font-mono">notifications</code>.
              </li>
              <li>All collections must have document permissions allowing queries and have a <code class="text-zinc-300 font-mono">teamId</code> field configured as an index attribute.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  `
})
export class SettingsComponent {
  appwrite = inject(Appwrite);
  fb = inject(FormBuilder);

  configForm: FormGroup;
  authForm: FormGroup;
  authMode = signal<'login' | 'register'>('login');

  constructor() {
    const currentConf = this.appwrite.config();
    this.configForm = this.fb.group({
      endpoint: [currentConf.endpoint, [Validators.required]],
      projectId: [currentConf.projectId, [Validators.required]],
      databaseId: [currentConf.databaseId, [Validators.required]],
      contractsCollectionId: [currentConf.contractsCollectionId, [Validators.required]],
      contactsCollectionId: [currentConf.contactsCollectionId, [Validators.required]],
      tasksCollectionId: [currentConf.tasksCollectionId, [Validators.required]],
      notificationsCollectionId: [currentConf.notificationsCollectionId, [Validators.required]]
    });

    this.authForm = this.fb.group({
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  applyConfig() {
    if (this.configForm.valid) {
      this.appwrite.saveConfig(this.configForm.value);
    }
  }

  resetToDefaults() {
    this.appwrite.resetConfig();
    const currentConf = this.appwrite.config();
    this.configForm.patchValue(currentConf);
  }

  async handleAuth() {
    if (!this.authForm.valid) return;
    const { name, email, password } = this.authForm.value;
    try {
      if (this.authMode() === 'login') {
        await this.appwrite.login(email, password);
      } else {
        await this.appwrite.register(email, password, name);
      }
    } catch (e) {
      console.warn('Authentication status error:', e);
    }
  }

  async logout() {
    await this.appwrite.logout();
  }

  async createWorkspace(name: string) {
    if (!name.trim()) return;
    try {
      await this.appwrite.createWorkspaceTeam(name);
    } catch (e: any) {
      alert('Could not create workspace: ' + (e?.message || e));
    }
  }

  async sendInvite(email: string, name: string) {
    if (!email || !name) return;
    try {
      await this.appwrite.inviteMember(email, name);
      alert('Invitation has been generated & logged successfully!');
    } catch (e: any) {
      alert('Invitation error: ' + (e?.message || e));
    }
  }
}
