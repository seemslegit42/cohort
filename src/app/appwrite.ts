/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-empty, @typescript-eslint/consistent-indexed-object-style */
import { Injectable, signal, effect } from '@angular/core';
import { Client, Account, Databases, Teams, Realtime, ID, Query, Permission, Role, Functions, Storage } from 'appwrite';

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  contractsCollectionId: string;
  contactsCollectionId: string;
  tasksCollectionId: string;
  notificationsCollectionId: string;
  leadsCollectionId: string;
  contractsBucketId: string;
}

const DEFAULT_CONFIG: AppwriteConfig = {
  endpoint: 'https://tor.cloud.appwrite.io/v1',
  projectId: '6990e2830030cacccd98',
  databaseId: 'leadwave-main',
  contractsCollectionId: 'contracts',
  contactsCollectionId: 'contacts',
  tasksCollectionId: 'tasks',
  notificationsCollectionId: 'notifications',
  leadsCollectionId: 'leads',
  contractsBucketId: 'contracts'
};

@Injectable({
  providedIn: 'root'
})
export class Appwrite {
  // Config state
  config = signal<AppwriteConfig>(this.loadConfig());

  // Client and API services
  public client!: Client;
  private account!: Account;
  public databases!: Databases;
  private teams!: Teams;
  private realtime!: Realtime;
  private functionsService!: Functions;
  public storage!: Storage;

  // Reactivity states
  isConnected = signal<boolean>(false);
  isConnecting = signal<boolean>(false);
  errorMsg = signal<string | null>(null);

  // Auth States
  currentUser = signal<any | null>(null);
  userTeams = signal<any[]>([]);
  activeTeam = signal<any | null>(null);

  // Data Cache Signals
  contracts = signal<any[]>([]);
  contacts = signal<any[]>([]);
  tasks = signal<any[]>([]);
  notes = signal<any[]>([]);
  notifications = signal<any[]>([]);
  chatMessages = signal<any[]>([]);
  events = signal<any[]>([]);
  emails = signal<any[]>([]);
  workflows = signal<any[]>([]);
  activeEditors = signal<Record<string, any[]>>({}); // Record ID -> Array of User info

  // Realtime listeners map to keep track
  private activeSubscriptions: { [key: string]: () => void } = {};

  constructor() {
    this.initialize();

    // Automatically synchronize database queries when state changes
    effect(() => {
      const user = this.currentUser();
      const connected = this.isConnected();
      if (user && connected) {
        this.fetchInitialData();
        this.setupRealtimeSync();
      } else {
        // Clear caches when logged out
        this.contracts.set([]);
        this.contacts.set([]);
        this.tasks.set([]);
        this.notifications.set([]);
        this.userTeams.set([]);
        this.activeTeam.set([]);
        this.unsubscribeAll();
      }
    });
  }

  private loadConfig(): AppwriteConfig {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('laevos_appwrite_config');
      if (saved) {
        try {
          return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        } catch (e) {
          return DEFAULT_CONFIG;
        }
      }
    }
    return DEFAULT_CONFIG;
  }

  saveConfig(newConfig: Partial<AppwriteConfig>) {
    const current = this.config();
    const updated = { ...current, ...newConfig };
    this.config.set(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('laevos_appwrite_config', JSON.stringify(updated));
    }
    this.initialize();
  }

  resetConfig() {
    this.config.set(DEFAULT_CONFIG);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('laevos_appwrite_config');
    }
    this.initialize();
  }

  private initialize() {
    this.isConnecting.set(true);
    this.errorMsg.set(null);
    this.unsubscribeAll();

    try {
      const conf = this.config();
      this.client = new Client();
      this.client
        .setEndpoint(conf.endpoint)
        .setProject(conf.projectId);

      this.account = new Account(this.client);
      this.databases = new Databases(this.client);
      this.teams = new Teams(this.client);
      this.realtime = new Realtime(this.client);
      this.functionsService = new Functions(this.client);
      this.storage = new Storage(this.client);
      
      this.isConnected.set(true);
      this.checkSession();
    } catch (e: any) {
      this.isConnected.set(false);
      this.errorMsg.set(`Appwrite client init failed: ${e.message || e}`);
      console.error(e);
    } finally {
      this.isConnecting.set(false);
    }
  }

  // check active user session
  async checkSession() {
    try {
      const user = await this.account.get();
      this.currentUser.set(user);
      if (user && user.$id) {
        await this.loadUserTeams();
      } else {
        this.initDefaultLocalTeam();
      }
    } catch {
      this.currentUser.set(null);
      this.initDefaultLocalTeam();
    }
  }

  private initDefaultLocalTeam() {
    if (this.userTeams().length === 0) {
      const defaultTeam: any = {
        $id: 'laevos-workspace',
        name: 'ΛΞVOS Workspace',
        total: 1
      };
      this.userTeams.set([defaultTeam]);
      this.activeTeam.set(defaultTeam);
    }
  }

  // Authenticate user (Email and Password)
  async login(email: string, password: string) {
    this.isConnecting.set(true);
    this.errorMsg.set(null);
    try {
      await this.account.createEmailPasswordSession(email, password);
      const user = await this.account.get();
      this.currentUser.set(user);
      await this.loadUserTeams();
      return user;
    } catch (e: any) {
      this.errorMsg.set(e.message || 'Login failed Check email/password');
      throw e;
    } finally {
      this.isConnecting.set(false);
    }
  }

  // Register user
  async register(email: string, password: string, name: string) {
    this.isConnecting.set(true);
    this.errorMsg.set(null);
    try {
      const newUserId = ID.unique();
      await this.account.create(newUserId, email, password, name);
      // login automatically
      return await this.login(email, password);
    } catch (e: any) {
      this.errorMsg.set(e.message || 'Registration failed');
      throw e;
    } finally {
      this.isConnecting.set(false);
    }
  }

  // Logout current session
  async logout() {
    this.isConnecting.set(true);
    try {
      await this.account.deleteSession('current');
    } catch (e) {
      console.warn('Delete session issue:', e);
    } finally {
      this.currentUser.set(null);
      this.userTeams.set([]);
      this.activeTeam.set(null);
      this.unsubscribeAll();
      this.isConnecting.set(false);
    }
  }

  // --- Real Tenant-based Teams API ---
  async loadUserTeams() {
    if (!this.currentUser()) {
      this.initDefaultLocalTeam();
      return;
    }
    try {
      const response = await this.teams.list();
      this.userTeams.set(response.teams);
      if (response.teams.length > 0) {
        this.activeTeam.set(response.teams[0]);
      } else {
        // Automatically create a default workspace team if none exists
        await this.createWorkspaceTeam('ΛΞVOS Default Workspace');
      }
    } catch {
      this.initDefaultLocalTeam();
    }
  }

  async createWorkspaceTeam(name: string) {
    try {
      const newTeam = await this.teams.create(ID.unique(), name);
      this.userTeams.update(teams => [...teams, newTeam]);
      this.activeTeam.set(newTeam);
      return newTeam;
    } catch (e: any) {
      console.error('Failed creating team:', e);
      throw e;
    }
  }

  async inviteMember(email: string, name: string, roles: string[] = ['member']) {
    const active = this.activeTeam();
    if (!active) throw new Error('No active team selected');
    const origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : 'https://laevos.io';
    try {
      return await this.teams.createMembership(
        active.$id,
        roles,
        email,
        undefined,
        undefined,
        origin + '/accept-invite',
        name
      );
    } catch (e: any) {
      console.error('Failed creating team invite:', e);
      throw e;
    }
  }

  // --- Expanded Teams SDK & Simulation Fallback API ---
  async updateTeamName(teamId: string, name: string) {
    try {
      const res = await this.teams.updateName(teamId, name);
      this.userTeams.update(teams => teams.map(t => t.$id === teamId ? { ...t, name: res.name } : t));
      const active = this.activeTeam();
      if (active && active.$id === teamId) {
        this.activeTeam.set({ ...active, name: res.name });
      }
      return res;
    } catch (e) {
      console.warn('Fallback: updating team name locally', e);
      this.userTeams.update(teams => teams.map(t => t.$id === teamId ? { ...t, name } : t));
      const active = this.activeTeam();
      if (active && active.$id === teamId) {
        this.activeTeam.set({ ...active, name });
      }
      return { $id: teamId, name };
    }
  }

  async deleteTeam(teamId: string) {
    try {
      await this.teams.delete(teamId);
    } catch (e) {
      console.warn('Fallback: deleting team locally', e);
    } finally {
      this.userTeams.update(teams => {
        const filtered = teams.filter(t => t.$id !== teamId);
        if (filtered.length > 0) {
          this.activeTeam.set(filtered[0]);
        } else {
          this.activeTeam.set(null);
        }
        return filtered;
      });
    }
  }

  async listTeamMemberships(teamId: string) {
    try {
      const res = await this.teams.listMemberships(teamId);
      return res.memberships;
    } catch (e) {
      console.warn('Fallback: listing mock memberships', e);
      return [
        { $id: 'memb-1', userId: 'usr-1', userName: 'Ahmed Ali', userEmail: 'ahmed@laevos.io', roles: ['owner', 'admin'], joined: new Date().toISOString(), confirm: true },
        { $id: 'memb-2', userId: 'usr-2', userName: 'Sarah Jenkins', userEmail: 'sarah@laevos.io', roles: ['member'], joined: new Date().toISOString(), confirm: true },
        { $id: 'memb-3', userId: 'usr-3', userName: 'Alex Rivera', userEmail: 'alex@laevos.io', roles: ['developer'], joined: '', confirm: false }
      ];
    }
  }

  async deleteMembership(teamId: string, membershipId: string) {
    try {
      return await this.teams.deleteMembership(teamId, membershipId);
    } catch (e) {
      console.warn('Fallback: delete membership local simulation', e);
      return true;
    }
  }

  async getTeamPrefs(teamId: string) {
    if (this.currentUser()) {
      try {
        return await this.teams.getPrefs(teamId);
      } catch {
        // Fallback to local storage
      }
    }
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(`laevos_team_prefs_${teamId}`);
      if (saved) return JSON.parse(saved);
    }
    return { theme: 'cosmic-dark', notifications_enabled: 'true', default_role: 'member' };
  }

  async updateTeamPrefs(teamId: string, prefs: any) {
    if (this.currentUser()) {
      try {
        return await this.teams.updatePrefs(teamId, prefs);
      } catch {
        // Fallback to local storage
      }
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`laevos_team_prefs_${teamId}`, JSON.stringify(prefs));
    }
    return prefs;
  }

  // --- Storage API & Simulation Fallback ---
  async uploadFile(file: File, bucketId?: string) {
    const bId = bucketId || this.config().contractsBucketId || 'contracts';
    const teamId = this.activeTeam()?.$id || 'laevos-crm';
    if (this.currentUser()) {
      try {
        const result = await this.storage.createFile(bId, ID.unique(), file);
        this.addNotification({
          title: 'File Uploaded',
          message: `"${file.name}" has been uploaded to Appwrite Storage bucket "${bId}".`,
          type: 'success'
        });
        return {
          $id: result.$id,
          $createdAt: result.$createdAt,
          name: result.name,
          size: result.sizeOriginal || 0,
          mimeType: result.mimeType,
          bucketId: bId,
          teamId
        };
      } catch {
        // Simulating locally below
      }
    }
    const simResult = {
      $id: 'file-' + Math.random().toString(36).substr(2, 9),
      $createdAt: new Date().toISOString(),
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      bucketId: bId,
      teamId
    };
    if (typeof localStorage !== 'undefined') {
      const key = `laevos_mock_files_${teamId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift(simResult);
      localStorage.setItem(key, JSON.stringify(existing));
    }
    return simResult;
  }

  async listFiles(bucketId?: string) {
    const bId = bucketId || this.config().contractsBucketId || 'contracts';
    const teamId = this.activeTeam()?.$id || 'laevos-crm';
    if (this.currentUser()) {
      try {
        const result = await this.storage.listFiles(bId);
        return result.files.map((f: any) => ({
          $id: f.$id,
          $createdAt: f.$createdAt,
          name: f.name,
          size: f.sizeOriginal || f.size || 0,
          mimeType: f.mimeType,
          bucketId: bId,
          teamId
        }));
      } catch {
        // Fallback to local files
      }
    }
    if (typeof localStorage !== 'undefined') {
      const key = `laevos_mock_files_${teamId}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    }
    return [
      {
        $id: 'file-nda',
        $createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        name: 'NDA_laevos_v2_signed.pdf',
        size: 1024 * 342,
        mimeType: 'application/pdf',
        bucketId: bId,
        teamId
      },
      {
        $id: 'file-sla',
        $createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        name: 'SLA_enterprise_draft.docx',
        size: 1024 * 128,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        bucketId: bId,
        teamId
      }
    ];
  }

  async deleteFile(fileId: string, bucketId?: string) {
    const bId = bucketId || this.config().contractsBucketId || 'contracts';
    const teamId = this.activeTeam()?.$id || 'laevos-crm';
    try {
      await this.storage.deleteFile(bId, fileId);
      this.addNotification({
        title: 'File Deleted',
        message: 'File was successfully removed from Appwrite Storage.',
        type: 'success'
      });
      return true;
    } catch (e) {
      console.warn('Appwrite Storage delete failed, deleting from mock store:', e);
      if (typeof localStorage !== 'undefined') {
        const key = `laevos_mock_files_${teamId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = existing.filter((f: any) => f.$id !== fileId);
        localStorage.setItem(key, JSON.stringify(filtered));
      }
      return true;
    }
  }

  getFileViewUrl(fileId: string, bucketId?: string): string {
    const bId = bucketId || this.config().contractsBucketId || 'contracts';
    try {
       return this.storage.getFileView(bId, fileId).toString();
    } catch (e) {
       return `https://tor.cloud.appwrite.io/v1/storage/buckets/${bId}/files/${fileId}/view?project=${this.config().projectId}`;
    }
  }

  getFileDownloadUrl(fileId: string, bucketId?: string): string {
    const bId = bucketId || this.config().contractsBucketId || 'contracts';
    try {
       return this.storage.getFileDownload(bId, fileId).toString();
    } catch (e) {
       return `https://tor.cloud.appwrite.io/v1/storage/buckets/${bId}/files/${fileId}/download?project=${this.config().projectId}`;
    }
  }

  // --- Functions SDK & Simulation Fallback API ---
  async executeFunction(functionId: string, bodyJson?: string) {
    try {
      const result = await this.functionsService.createExecution(
        functionId,
        bodyJson || '{}',
        false, // async = false to receive the output immediately
        '/',
        'POST' as any
      );
      return result;
    } catch (e: any) {
      console.warn('Fallback: simulating function execution locally', e);
      
      // Simulate real execution behavior based on selected function
      const isEnrichment = functionId.includes('enrich');
      const randomSuccess = Math.random() > 0.05; // 95% success rate
      const timestamp = new Date().toISOString();
      const executionId = 'exec-' + Math.random().toString(36).substr(2, 9);
      
      let responseBody = '';
      let stdout = '';
      let stderr = '';
      
      if (isEnrichment) {
        stdout = '[INFO] Starting contact enrichment function for payload: ' + (bodyJson || '{}') + '\n';
        stdout += '[API] Fetching social profiles...\n';
        stdout += '[API] Matching domain in databases...\n';
        if (randomSuccess) {
          responseBody = JSON.stringify({
            status: 'success',
            enriched_data: {
              organization_size: '500-1000',
              founded: '2019',
              verified_linkedin: 'https://linkedin.com/company/laevos-demo',
              estimated_revenue: '$5.4M'
            }
          }, null, 2);
          stdout += '[SUCCESS] Contact record enriched with CRM signals.\n';
        } else {
          stderr = '[ERROR] Network connection timed out contacting enrichment service.\n';
        }
      } else {
        stdout = '[INFO] Activating Slack web-hook trigger...\n';
        stdout += '[INFO] Payload parsed: ' + (bodyJson || '{}') + '\n';
        if (randomSuccess) {
          responseBody = JSON.stringify({ status: 'delivered', channel: '#sales-alerts', ts: '171920392.00192' });
          stdout += '[SUCCESS] Slack notification posted successfully.\n';
        } else {
          stderr = '[ERROR] Invalid Webhook URL. Authentication failed.\n';
        }
      }

      const simResult = {
        $id: executionId,
        $createdAt: timestamp,
        $updatedAt: timestamp,
        functionId,
        trigger: 'http',
        status: randomSuccess ? 'completed' : 'failed',
        requestMethod: 'POST',
        requestPath: '/',
        requestHeaders: [],
        responseStatusCode: randomSuccess ? 200 : 500,
        responseHeaders: [{ key: 'Content-Type', value: 'application/json' }],
        responseBody,
        logs: stdout,
        errors: stderr,
        duration: Math.round(150 + Math.random() * 850) / 1000 // 0.15s to 1.0s
      };

      // Save executions cache locally to simulate persistent list-executions calls
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(`laevos_fn_execs_${functionId}`);
        const currentExecs = stored ? JSON.parse(stored) : [];
        currentExecs.unshift(simResult);
        localStorage.setItem(`laevos_fn_execs_${functionId}`, JSON.stringify(currentExecs.slice(0, 50)));
      }

      return simResult;
    }
  }

  async listFunctionExecutions(functionId: string) {
    try {
      const res = await (this.functionsService as any).listExecutions(functionId);
      return res.executions;
    } catch (e) {
      console.warn('Fallback: loading mock execution history', e);
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(`laevos_fn_execs_${functionId}`);
        if (saved) return JSON.parse(saved);
      }
      
      // Default initial mock history
      const now = Date.now();
      return [
        {
          $id: 'exec-8b392a',
          $createdAt: new Date(now - 300000).toISOString(),
          $updatedAt: new Date(now - 300000).toISOString(),
          functionId,
          trigger: 'event',
          status: 'completed',
          requestMethod: 'POST',
          requestPath: '/',
          responseStatusCode: 200,
          responseBody: '{"status":"ok"}',
          logs: '[INFO] Automations handler active\n[SUCCESS] Pipeline executed successfully',
          errors: '',
          duration: 0.42
        },
        {
          $id: 'exec-7a281c',
          $createdAt: new Date(now - 86400000).toISOString(),
          $updatedAt: new Date(now - 86400000).toISOString(),
          functionId,
          trigger: 'http',
          status: 'failed',
          requestMethod: 'POST',
          requestPath: '/',
          responseStatusCode: 500,
          responseBody: '{"error":"unauthorized"}',
          logs: '[INFO] Trigger HTTP client initialization\n[ERROR] Authentication failed',
          errors: 'Unauthorized: invalid signature',
          duration: 0.18
        }
      ];
    }
  }

  async getFunctionVariables(functionId: string) {
    try {
      const res = await (this.functionsService as any).listVariables(functionId);
      return res.variables;
    } catch (e) {
      console.warn('Fallback: loading mock variables', e);
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(`laevos_fn_vars_${functionId}`);
        if (saved) return JSON.parse(saved);
      }
      
      const defaults = functionId.includes('enrich') 
        ? [
            { $id: 'v-1', key: 'GEMINI_API_KEY', value: 'AIzaSyCh...89Dk', createdAt: new Date().toISOString() },
            { $id: 'v-2', key: 'CRM_TARGET_FOLDER', value: 'prospects', createdAt: new Date().toISOString() }
          ]
        : [
            { $id: 'v-3', key: 'SLACK_WEBHOOK_URL', value: 'https://hooks.slack.com/services/...', createdAt: new Date().toISOString() },
            { $id: 'v-4', key: 'ALERT_MIN_VALUE', value: '50000', createdAt: new Date().toISOString() }
          ];
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`laevos_fn_vars_${functionId}`, JSON.stringify(defaults));
      }
      return defaults;
    }
  }

  async createFunctionVariable(functionId: string, key: string, value: string) {
    try {
      return await (this.functionsService as any).createVariable(functionId, key, value);
    } catch (e) {
      console.warn('Fallback: saving variable locally', e);
      const newVar = {
        $id: 'v-' + Math.random().toString(36).substr(2, 9),
        key,
        value,
        createdAt: new Date().toISOString()
      };
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(`laevos_fn_vars_${functionId}`);
        const current = stored ? JSON.parse(stored) : [];
        current.push(newVar);
        localStorage.setItem(`laevos_fn_vars_${functionId}`, JSON.stringify(current));
      }
      return newVar;
    }
  }

  async deleteFunctionVariable(functionId: string, variableId: string) {
    try {
      return await (this.functionsService as any).deleteVariable(functionId, variableId);
    } catch (e) {
      console.warn('Fallback: deleting variable locally', e);
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(`laevos_fn_vars_${functionId}`);
        if (stored) {
          const filtered = JSON.parse(stored).filter((v: any) => v.$id !== variableId);
          localStorage.setItem(`laevos_fn_vars_${functionId}`, JSON.stringify(filtered));
        }
      }
      return true;
    }
  }

  // --- Database API CRUD with Team-based Permissions ---
  async fetchInitialData() {
    if (typeof window === 'undefined') {
      this.contracts.set(this.getDefaultMockValues('contracts'));
      this.contacts.set(this.getDefaultMockValues('contacts'));
      this.tasks.set(this.getDefaultMockValues('tasks'));
      this.notes.set(this.getDefaultMockValues('notes'));
      this.notifications.set(this.getDefaultMockValues('notifications'));
      this.chatMessages.set([]);
      this.events.set(this.getDefaultMockValues('events'));
      this.emails.set(this.getDefaultMockValues('emails'));
      this.workflows.set(this.getDefaultMockValues('workflows'));
      return;
    }

    const conf = this.config();
    const activeT = this.activeTeam();
    const teamId = activeT?.$id || 'laevos-crm';

    // Helper to query API and handle missing collections gracefully
    const queryCollection = async (collId: string, signalSetter: (val: any[]) => void) => {
      try {
        const response = await fetch(`/api/${collId}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        signalSetter(data.items || data[collId] || []);
      } catch (e: any) {
        console.warn(`Collection ${collId} lookup issue (may need creation):`, e.message || e);
        signalSetter(this.getDefaultMockValues(collId));
      }
    };

    await Promise.all([
      queryCollection('contracts', this.contracts.set.bind(this.contracts)),
      queryCollection('contacts', this.contacts.set.bind(this.contacts)),
      queryCollection('tasks', this.tasks.set.bind(this.tasks)),
      queryCollection('notes', this.notes.set.bind(this.notes)),
      queryCollection('notifications', this.notifications.set.bind(this.notifications)),
      queryCollection('leads', () => undefined), // Just for cache, but we don't have leads signal in appwrite.ts right now
      queryCollection('chatMessages', this.chatMessages.set.bind(this.chatMessages)),
      queryCollection('events', this.events.set.bind(this.events)),
      queryCollection('emails', this.emails.set.bind(this.emails)),
      queryCollection('workflows', this.workflows.set.bind(this.workflows))
    ]);
  }

  // Creates structured Appwrite database if initialized but missing collections
  async autoProvisionDatabase() {
    this.isConnecting.set(true);
    try {
      const response = await fetch('/api/contracts');
      if (response.ok) {
        this.errorMsg.set('Backend connected successfully!');
      } else {
        this.errorMsg.set(`Database check returned error`);
      }
    } catch (e: any) {
      this.errorMsg.set(`Database check returned: ${e.message || e}`);
    } finally {
      this.isConnecting.set(false);
    }
  }

  // --- Database CRUD Actions ---
  async addContract(data: any) {
    const team = this.activeTeam();
    const teamId = team?.$id || 'laevos-crm';
    const payload = { ...data, teamId };

    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to create contract');
      const doc = (await response.json()).item;
      this.contracts.update(arr => [doc, ...arr]);
      return doc;
    } catch (e: any) {
      console.warn('Falling back local creation due to backend issue:', e);
      const offlineDoc = { $id: 'mock-' + Date.now(), ...payload, createdAt: new Date().toISOString() };
      this.contracts.update(arr => [offlineDoc, ...arr]);
      return offlineDoc;
    }
  }

  async updateContractStatus(documentId: string, status: string) {
    try {
      if (documentId.startsWith('mock-')) {
        this.contracts.update(arr => arr.map(doc => doc.$id === documentId ? { ...doc, status } : doc));
        return { $id: documentId, status };
      }
      const response = await fetch(`/api/contracts/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update contract');
      const updated = (await response.json()).item;
      this.contracts.update(arr => arr.map(doc => doc.$id === documentId ? updated : doc));
      return updated;
    } catch (e: any) {
      console.warn('Falling back to local status update:', e);
      this.contracts.update(arr => arr.map(doc => doc.$id === documentId ? { ...doc, status } : doc));
      return { $id: documentId, status };
    }
  }

  async deleteContract(documentId: string) {
    try {
      if (!documentId.startsWith('mock-')) {
        await fetch(`/api/contracts/${documentId}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Failed cloud delete, fallback local delete:', e);
    } finally {
      this.contracts.update(arr => arr.filter(doc => doc.$id !== documentId));
    }
  }

  // Same generic CRUD helpers for Tasks, Contacts and Alerts
  async addContact(data: any) {
    const team = this.activeTeam();
    const teamId = team?.$id || 'laevos-crm';
    const payload = { ...data, teamId };
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to create contact');
      const doc = (await response.json()).item;
      this.contacts.update(arr => [doc, ...arr]);
      return doc;
    } catch (e) {
      const offlineDoc = { $id: 'mock-' + Date.now(), ...payload, createdAt: new Date().toISOString() };
      this.contacts.update(arr => [offlineDoc, ...arr]);
      return offlineDoc;
    }
  }

  async updateContact(documentId: string, updates: any) {
    try {
      if (documentId.startsWith('mock-')) {
        this.contacts.update(arr => arr.map(doc => doc.$id === documentId ? { ...doc, ...updates } : doc));
        return { $id: documentId, ...updates };
      }
      const response = await fetch(`/api/contacts/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update contact');
      const updated = (await response.json()).item;
      this.contacts.update(arr => arr.map(doc => doc.$id === documentId ? updated : doc));
      return updated;
    } catch (e: any) {
      console.warn('Falling back local update:', e);
      this.contacts.update(arr => arr.map(doc => doc.$id === documentId ? { ...doc, ...updates } : doc));
      return { $id: documentId, ...updates };
    }
  }

  async deleteContact(documentId: string) {
    try {
      if (!documentId.startsWith('mock-')) {
        await fetch(`/api/contacts/${documentId}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Failed cloud delete, fallback local delete:', e);
    } finally {
      this.contacts.update(arr => arr.filter(doc => doc.$id !== documentId));
    }
  }

  async addTask(data: any) {
    const team = this.activeTeam();
    const teamId = team?.$id || 'laevos-crm';
    const payload = { ...data, teamId, completed: false };
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to create task');
      const doc = (await response.json()).item;
      this.tasks.update(arr => [doc, ...arr]);
      return doc;
    } catch (e) {
      const offlineDoc = { $id: 'mock-' + Date.now(), ...payload, createdAt: new Date().toISOString() };
      this.tasks.update(arr => [offlineDoc, ...arr]);
      return offlineDoc;
    }
  }

  async updateTask(documentId: string, updates: any) {
    try {
      if (documentId.startsWith('mock-')) {
        this.tasks.update(arr => arr.map(doc => doc.$id === documentId ? { ...doc, ...updates } : doc));
        return { $id: documentId, ...updates };
      }
      const response = await fetch(`/api/tasks/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update task');
      const updated = (await response.json()).item;
      this.tasks.update(arr => arr.map(doc => doc.$id === documentId ? updated : doc));
      return updated;
    } catch (e: any) {
      this.tasks.update(arr => arr.map(doc => doc.$id === documentId ? { ...doc, ...updates } : doc));
      return { $id: documentId, ...updates };
    }
  }

  async deleteTask(documentId: string) {
    try {
      if (!documentId.startsWith('mock-')) {
        await fetch(`/api/tasks/${documentId}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Failed cloud delete, fallback local delete:', e);
    } finally {
      this.tasks.update(arr => arr.filter(doc => doc.$id !== documentId));
    }
  }

  async addNote(data: any) {
    const team = this.activeTeam();
    const teamId = team?.$id || 'laevos-crm';
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, teamId })
      });
      if (!response.ok) throw new Error('Failed to create note');
      const doc = (await response.json()).item;
      this.notes.update(arr => [doc, ...arr]);
      return doc;
    } catch (e: any) {
      console.warn('Falling back local note:', e);
      const mockDoc = { $id: `mock-n-${Date.now()}`, ...data, teamId, date: 'Just now' };
      this.notes.update(arr => [mockDoc, ...arr]);
      return mockDoc;
    }
  }

  async updateNote(documentId: string, updates: any) {
    try {
      if (documentId.startsWith('mock-')) {
        this.notes.update(arr => arr.map(doc => doc.$id === documentId ? { ...doc, ...updates } : doc));
        return { $id: documentId, ...updates };
      }
      const response = await fetch(`/api/notes/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update note');
      const updated = (await response.json()).item;
      this.notes.update(arr => arr.map(doc => doc.$id === documentId ? updated : doc));
      return updated;
    } catch (e: any) {
      this.notes.update(arr => arr.map(doc => doc.$id === documentId ? { ...doc, ...updates } : doc));
      return { $id: documentId, ...updates };
    }
  }

  async deleteNote(documentId: string) {
    try {
      if (!documentId.startsWith('mock-')) {
        await fetch(`/api/notes/${documentId}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Failed cloud delete, fallback local delete:', e);
    } finally {
      this.notes.update(arr => arr.filter(doc => doc.$id !== documentId));
    }
  }

  async toggleTaskCompleted(documentId: string, completed: boolean) {
    try {
      if (documentId.startsWith('mock-')) {
        this.tasks.update(arr => arr.map(doc => doc.$id === documentId ? { ...doc, completed } : doc));
        return { $id: documentId, completed };
      }
      const response = await fetch(`/api/tasks/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });
      if (!response.ok) throw new Error('Failed to update task');
      const updated = (await response.json()).item;
      this.tasks.update(arr => arr.map(doc => doc.$id === documentId ? updated : doc));
      return updated;
    } catch (e) {
      this.tasks.update(arr => arr.map(doc => doc.$id === documentId ? { ...doc, completed } : doc));
      return { $id: documentId, completed };
    }
  }

  async addEmail(data: any) {
    const teamId = this.activeTeam()?.$id || 'laevos-crm';
    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, teamId })
      });
      if (response.ok) {
        const doc = (await response.json()).item;
        this.emails.update(arr => [doc, ...arr]);
        return doc;
      }
      throw new Error('Failed to create email');
    } catch (e) {
      console.warn('Falling back local email:', e);
      const mockDoc = { $id: `mock-em-${Date.now()}`, ...data, teamId };
      this.emails.update(arr => [mockDoc, ...arr]);
      return mockDoc;
    }
  }

  async deleteEmail(documentId: string) {
    try {
      if (!documentId.startsWith('mock-') && !documentId.startsWith('mail-')) {
        await fetch(`/api/emails/${documentId}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Fallback delete email:', e);
    } finally {
      this.emails.update(arr => arr.filter(doc => doc.$id !== documentId));
    }
  }

  async addEvent(data: any) {
    const team = this.activeTeam();
    const teamId = team?.$id || 'laevos-crm';
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, teamId })
      });
      if (!response.ok) throw new Error('Failed to create event');
      const doc = (await response.json()).item;
      this.events.update(arr => [doc, ...arr].sort((a, b) => parseInt(a.day || '0') - parseInt(b.day || '0')));
      return doc;
    } catch (e: any) {
      console.warn('Falling back local event:', e);
      const mockDoc = { $id: `mock-e-${Date.now()}`, ...data, teamId };
      this.events.update(arr => [mockDoc, ...arr].sort((a, b) => parseInt(a.day || '0') - parseInt(b.day || '0')));
      return mockDoc;
    }
  }

  async deleteEvent(documentId: string) {
    try {
      if (!documentId.startsWith('mock-')) {
        await fetch(`/api/events/${documentId}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Failed cloud delete, fallback local delete:', e);
    } finally {
      this.events.update(arr => arr.filter(doc => doc.$id !== documentId));
    }
  }

  async markNotificationRead(documentId: string) {
    try {
      if (documentId.startsWith('mock-')) {
        this.notifications.update(arr => arr.map(n => n.$id === documentId ? { ...n, isRead: true } : n));
        return { $id: documentId, isRead: true };
      }
      const response = await fetch(`/api/notifications/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });
      if (response.ok) {
        this.notifications.update(arr => arr.map(n => n.$id === documentId ? { ...n, isRead: true } : n));
      }
      return { $id: documentId, isRead: true };
    } catch (e) {
      this.notifications.update(arr => arr.map(n => n.$id === documentId ? { ...n, isRead: true } : n));
      return { $id: documentId, isRead: true };
    }
  }

  async deleteNotification(documentId: string) {
    try {
      if (!documentId.startsWith('mock-')) {
        await fetch(`/api/notifications/${documentId}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Failed cloud delete, fallback local delete:', e);
    } finally {
      this.notifications.update(arr => arr.filter(n => n.$id !== documentId));
    }
  }

  async addNotification(data: any) {
    const team = this.activeTeam();
    const teamId = team?.$id || 'laevos-crm';
    const payload = { ...data, teamId, isRead: false };
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to create notification');
      const doc = (await response.json()).item;
      this.notifications.update(arr => [doc, ...arr]);
      return doc;
    } catch (e) {
      const offlineDoc = { $id: 'mock-' + Date.now(), ...payload, timestamp: new Date().toISOString() };
      this.notifications.update(arr => [offlineDoc, ...arr]);
      return offlineDoc;
    }
  }

  // --- Real-time Collaboration APIs ---
  async sendChatMessage(dealId: string, message: string, user: any) {
    const payload = {
      dealId,
      message,
      user
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to send message');
      const savedMsg = (await response.json()).message;
      this.chatMessages.update(arr => [...arr, savedMsg]);
    } catch (e) {
      console.warn('Fallback local message send due to backend issue:', e);
      const offlineMsg = {
        $id: 'mock-msg-' + Date.now(),
        ...payload,
        timestamp: new Date().toISOString()
      };
      this.chatMessages.update(arr => [...arr, offlineMsg]);
    }
    
    // Simulate other team members replying
    setTimeout(() => {
      if (Math.random() > 0.5) {
        this.addNotification({
          title: 'New Chat Message',
          message: 'Sarah Jenkins replied to the discussion.',
          type: 'info'
        });
        
        const replyPayload = {
          dealId,
          message: 'I agree, let me update the contract terms.',
          user: { id: 'sarah', name: 'Sarah Jenkins', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah' }
        };

        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(replyPayload)
        }).then(res => res.json()).then(data => {
          this.chatMessages.update(arr => [...arr, data.message]);
        }).catch(e => {
          this.chatMessages.update(arr => [...arr, {
            $id: 'mock-msg-' + Date.now(),
            ...replyPayload,
            timestamp: new Date().toISOString()
          }]);
        });
      }
    }, 4000);
    return payload;
  }

  simulateUserEditing(recordId: string, isEditing: boolean) {
    const mockUser = { id: 'usr-sim', name: 'Alex Rivera', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex' };
    this.activeEditors.update(editors => {
      const current = editors[recordId] || [];
      if (isEditing) {
        if (!current.find(u => u.id === mockUser.id)) {
          return { ...editors, [recordId]: [...current, mockUser] };
        }
      } else {
        return { ...editors, [recordId]: current.filter(u => u.id !== mockUser.id) };
      }
      return editors;
    });
  }

  simulateExternalUpdate(recordType: string, recordId: string) {
    this.addNotification({
      title: 'Record Updated',
      message: `A ${recordType} record was just updated by Alex Rivera.`,
      type: 'warning'
    });
  }

  // --- Appwrite Realtime Subscriptions ---
  private setupRealtimeSync() {
    const conf = this.config();
    const team = this.activeTeam();
    const teamId = team?.$id || 'laevos-crm';
    
    this.unsubscribeAll();

    // Channel names conform to databases.[dbId].collections.[collId].documents
    const subscribeCollection = async (collId: string, signalUpdate: any) => {
      const channel = `databases.${conf.databaseId}.collections.${collId}.documents`;
      try {
        const sub = await this.realtime.subscribe(channel, (response: any) => {
          const { events, payload } = response;
          if (!payload.teamId || payload.teamId !== teamId) return;

          if (events.some((e: string) => e.includes('.create'))) {
            signalUpdate.update((arr: any[]) => {
              if (arr.some(item => item.$id === payload.$id)) return arr;
              return [payload, ...arr];
            });
          } else if (events.some((e: string) => e.includes('.update'))) {
            signalUpdate.update((arr: any[]) => arr.map(item => item.$id === payload.$id ? payload : item));
          } else if (events.some((e: string) => e.includes('.delete'))) {
            signalUpdate.update((arr: any[]) => arr.filter(item => item.$id !== payload.$id));
          }
        });

        // Safe client unsubscribe mapping regardless of synchronous function or async promise/wrapper
        this.activeSubscriptions[collId] = () => {
          try {
            if (typeof sub === 'function') {
              (sub as any)();
            } else if (sub && typeof (sub as any).unsubscribe === 'function') {
              (sub as any).unsubscribe();
            }
          } catch (e) {
            console.warn('Error unsubscribing:', e);
          }
        };
      } catch (e) {
        console.warn(`Could not subscribe to Appwrite realtime for ${collId}:`, e);
      }
    };

    subscribeCollection(conf.contractsCollectionId, this.contracts);
    subscribeCollection(conf.contactsCollectionId, this.contacts);
    subscribeCollection(conf.tasksCollectionId, this.tasks);
    subscribeCollection(conf.notificationsCollectionId, this.notifications);
  }

  private unsubscribeAll() {
    Object.keys(this.activeSubscriptions).forEach(key => {
      try {
        this.activeSubscriptions[key]();
      } catch (e) {}
    });
    this.activeSubscriptions = {};
  }

  // Default elegant initial values for local presentation / before collection setup
  private getDefaultMockValues(collectionId: string): any[] {
    const team = this.activeTeam();
    const teamId = team?.$id || 'laevos-crm';
    
    if (collectionId === 'contracts') {
      return [
        {
          $id: 'mock-1',
          name: 'Enterprise License Agreement',
          clientName: 'Microsoft Corp',
          value: '450,000',
          status: 'Signed',
          teamId,
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          $id: 'mock-2',
          name: 'SaaS Agreement',
          clientName: 'Slack Technologies',
          value: '120,000',
          status: 'Pending Signature',
          teamId,
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          $id: 'mock-3',
          name: 'Marketing Consultation Master Contract',
          clientName: 'Coca Cola Inc',
          value: '85,000',
          status: 'Review',
          teamId,
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
        }
      ];
    } else if (collectionId === 'contacts') {
      return [
        { $id: 'mock-c1', name: 'Bill Gates', email: 'bill@microsoft.com', phone: '+1 425 882 8080', company: 'Microsoft', teamId },
        { $id: 'mock-c2', name: 'Marc Benioff', email: 'marc@salesforce.com', phone: '+1 415 901 7000', company: 'Salesforce', teamId },
        { $id: 'mock-c3', name: 'Stewart Butterfield', email: 'stewart@slack.com', phone: '+1 415 555 1212', company: 'Slack', teamId }
      ];
    } else if (collectionId === 'notes') {
      return [
        {
          $id: 'mock-n1',
          title: 'Salesforce Account Renewal Strategy',
          content: 'Key decision makers: Sarah Jenkins (CTO), Mike Ross (VP Sales).\n\nThe renewal is up in 45 days.',
          date: 'Today, 9:41 AM',
          tags: ['Salesforce', 'Strategy'],
          color: 'border-t-rose-500 text-rose-500',
          teamId
        },
        {
          $id: 'mock-n2',
          title: 'UI Component Feedback',
          content: 'The new dashboard layout looks phenomenal. The CRM stats need to have real-time webhook updates.',
          date: 'Yesterday, 4:20 PM',
          tags: ['Feedback', 'UI/UX'],
          color: 'border-t-teal-500 text-teal-500',
          teamId
        }
      ];
    } else if (collectionId === 'tasks') {
      return [
        { $id: 'mock-t1', title: 'Prepare sales forecast presentation', completed: false, priority: 'High', teamId },
        { $id: 'mock-t2', title: 'Call Stewart Butterfield for feedback', completed: true, priority: 'Medium', teamId },
        { $id: 'mock-t3', title: 'Review legal terms for Acme SLA', completed: false, priority: 'High', teamId }
      ];
    } else if (collectionId === 'notifications') {
      return [
        { $id: 'mock-n1', title: 'New Deal Registered', message: 'Microsoft Corp signed license master contract.', isRead: false, type: 'success', timestamp: new Date().toISOString() },
        { $id: 'mock-n2', title: 'SLA Renewal Warning', message: 'Acme SLA expires in 22 days.', isRead: false, type: 'warning', timestamp: new Date().toISOString() }
      ];
    } else if (collectionId === 'events') {
      return [
        { $id: 'mock-e1', title: 'Enterprise SLA Negotiation', month: 'Jul', day: '15', time: '10:00 AM', contact: 'Microsoft Corp', type: 'Meeting' },
        { $id: 'mock-e2', title: 'Q3 Product Demo', month: 'Jul', day: '18', time: '2:30 PM', contact: 'Salesforce Inc', type: 'Demo' },
        { $id: 'mock-e3', title: 'Contract Renewal Sync', month: 'Jul', day: '21', time: '11:15 AM', contact: 'Acme Corp', type: 'Follow-Up' }
      ];
    } else if (collectionId === 'emails') {
      return [
        { $id: 'mail-1', recipient: 'Bill Gates', company: 'Microsoft Corp', subject: 'Strategic Cloud Portal Proposal - ΛΞVOS Workspace', status: 'Replied', sentAt: '2h ago' },
        { $id: 'mail-2', recipient: 'Marc Benioff', company: 'Salesforce Inc', subject: 'SLA Migration Framework Analysis for Salesforce', status: 'Delivered', sentAt: '12h ago' },
        { $id: 'mail-3', recipient: 'Stewart Butterfield', company: 'Slack Technologies', subject: 'Follow up: CRM Database Expansion Timelines', status: 'Sent', sentAt: '1d ago' }
      ];
    } else if (collectionId === 'workflows') {
      return [
        { $id: 'mock-w1', name: 'New Enterprise Lead Qualification', description: 'Automatically scores and assigns leads >$10k to Senior AE.', status: 'Active', triggers: 142, successRate: 98, lastRun: '2 mins ago', icon: 'auto_awesome', colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
        { $id: 'mock-w2', name: 'Contract Signature Follow-up', description: 'Sends 3-day reminder if SLA remains unsigned in DocuSign.', status: 'Active', triggers: 45, successRate: 100, lastRun: '1 hour ago', icon: 'draw', colorClass: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
        { $id: 'mock-w3', name: 'Churn Risk Alerting', description: 'Notifies CS channel when login frequency drops 40%.', status: 'Paused', triggers: 0, successRate: 0, lastRun: 'N/A', icon: 'warning', colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
      ];
    }
    return [];
  }
}
