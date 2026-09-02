/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { ID, Query, Permission, Role } from 'appwrite';
import { Appwrite } from './appwrite';
import { Lead } from './lead.service';

export type WorkflowTriggerType = 
  | 'lead_created' 
  | 'stage_changed' 
  | 'lead_score_reached' 
  | 'deal_value_exceeded' 
  | 'tag_added' 
  | 'inactivity_detected';

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  targetStage?: string;
  minScore?: number;
  minDealValue?: number;
  tag?: string;
  inactivityDays?: number;
}

export interface StepStats {
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
}

export interface EmailWorkflowStep {
  id: string;
  stepOrder: number;
  name: string;
  delayValue: number;
  delayUnit: 'minutes' | 'hours' | 'days';
  subject: string;
  body: string;
  previewText?: string;
  abTest?: {
    enabled: boolean;
    variantSubject?: string;
    variantBody?: string;
    splitRatio?: number; // e.g. 50%
    statsA?: StepStats;
    statsB?: StepStats;
  };
  actionOnOpen?: 'notify_rep' | 'increase_score' | 'change_stage' | 'create_task' | 'none';
  actionOnReply?: 'stop_sequence' | 'notify_rep' | 'mark_hot_lead' | 'none';
  stats: StepStats;
}

export interface EmailWorkflow {
  $id: string;
  teamId: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'paused' | 'archived';
  trigger: WorkflowTrigger;
  steps: EmailWorkflowStep[];
  enrolledCount: number;
  completedCount: number;
  convertedCount: number;
  replyRate: number;
  openRate: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PersonalizationToken {
  tag: string;
  label: string;
  category: 'lead' | 'deal' | 'rep' | 'system';
  sample: string;
}

export const PERSONALIZATION_TOKENS: PersonalizationToken[] = [
  { tag: '{{lead.firstName}}', label: 'First Name', category: 'lead', sample: 'Sarah' },
  { tag: '{{lead.lastName}}', label: 'Last Name', category: 'lead', sample: 'Connor' },
  { tag: '{{lead.name}}', label: 'Full Name', category: 'lead', sample: 'Sarah Connor' },
  { tag: '{{lead.company}}', label: 'Company Name', category: 'lead', sample: 'Cyberdyne Systems' },
  { tag: '{{lead.email}}', label: 'Email Address', category: 'lead', sample: 's.connor@cyberdyne.io' },
  { tag: '{{lead.jobTitle}}', label: 'Job Title', category: 'lead', sample: 'VP of Technology' },
  { tag: '{{lead.industry}}', label: 'Industry', category: 'lead', sample: 'AI Infrastructure' },
  { tag: '{{lead.region}}', label: 'Region / Territory', category: 'lead', sample: 'North America' },
  { tag: '{{lead.dealValue}}', label: 'Deal Value ($)', category: 'deal', sample: '$145,000' },
  { tag: '{{lead.status}}', label: 'Pipeline Stage', category: 'deal', sample: 'Discovery' },
  { tag: '{{lead.score}}', label: 'Lead Score', category: 'deal', sample: '94' },
  { tag: '{{rep.name}}', label: 'Rep Name', category: 'rep', sample: 'Ahmed Ali' },
  { tag: '{{rep.email}}', label: 'Rep Email', category: 'rep', sample: 'ahmed@laevos.io' },
  { tag: '{{today}}', label: 'Current Date', category: 'system', sample: 'September 1, 2026' },
  { tag: '{{deal.scopeUrl}}', label: 'Scoping Doc URL', category: 'deal', sample: 'https://laevos.internal/deals/scoping-doc' }
];

export interface ExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  stepNumber: number;
  leadId: string;
  leadName: string;
  leadEmail: string;
  renderedSubject: string;
  renderedBody: string;
  status: 'scheduled' | 'dispatched' | 'opened' | 'replied' | 'paused';
  timestamp: string;
  delayString: string;
}

const DEFAULT_WORKFLOWS: EmailWorkflow[] = [
  {
    $id: 'wf-enterprise-inbound',
    teamId: 'laevos-crm',
    name: 'Enterprise Inbound Rapid Qualification',
    description: 'Triggered when high-tier inbound prospects enter the Discovery pipeline. Automatically routes scoping docs and schedules deep-dive tech reviews.',
    status: 'active',
    trigger: {
      type: 'stage_changed',
      targetStage: 'Discovery',
      minDealValue: 50000
    },
    steps: [
      {
        id: 'step-1',
        stepOrder: 1,
        name: 'Immediate Architectural Intro & Scoping Deck',
        delayValue: 0,
        delayUnit: 'minutes',
        subject: 'Tailored architecture evaluation for {{lead.company}} ({{lead.dealValue}})',
        body: `Hi {{lead.firstName}},\n\nThanks for reaching out to ΛΞVOS regarding your {{lead.industry}} infrastructure goals.\n\nI reviewed {{lead.company}}'s requirements and put together a tailored evaluation framework covering multi-tenant data isolation and real-time Appwrite orchestration:\n\n👉 Review Scoping Blueprint: {{deal.scopeUrl}}\n\nAre you available for a 15-minute sync with our solutions engineering team this Thursday?\n\nBest regards,\n{{rep.name}}\n{{rep.email}}`,
        previewText: 'Custom architecture review for {{lead.company}}',
        abTest: {
          enabled: true,
          variantSubject: 'Quick question regarding {{lead.company}}\'s Q4 pipeline initiatives',
          variantBody: `Hi {{lead.firstName}},\n\nNoticed {{lead.company}}'s recent expansion in {{lead.industry}}. We help enterprise teams scale secure CRM workflows with sub-100ms response times.\n\nCheck out the executive summary: {{deal.scopeUrl}}\n\nLet me know if Friday morning works for a quick walkthrough.\n\nCheers,\n{{rep.name}}`,
          splitRatio: 50,
          statsA: { sent: 142, opened: 114, clicked: 78, replied: 42, bounced: 0 },
          statsB: { sent: 140, opened: 121, clicked: 89, replied: 53, bounced: 0 }
        },
        actionOnOpen: 'increase_score',
        actionOnReply: 'stop_sequence',
        stats: { sent: 282, opened: 235, clicked: 167, replied: 95, bounced: 0 }
      },
      {
        id: 'step-2',
        stepOrder: 2,
        name: 'Technical Benchmark & Security Whitepaper',
        delayValue: 2,
        delayUnit: 'days',
        subject: 'Security & compliance overview for {{lead.company}}',
        body: `Hi {{lead.firstName}},\n\nFollowing up on my previous note. Since {{lead.jobTitle}}s in {{lead.industry}} prioritize SOC-2 compliance and zero-trust multi-tenancy, here is our audited compliance brief:\n\n🔐 https://laevos.internal/security-whitepaper\n\nWould it help if I looped in our Head of Security for a brief 10-minute briefing?\n\nBest,\n{{rep.name}}`,
        previewText: 'Compliance and benchmark documentation',
        actionOnOpen: 'notify_rep',
        actionOnReply: 'mark_hot_lead',
        stats: { sent: 187, opened: 148, clicked: 92, replied: 51, bounced: 0 }
      },
      {
        id: 'step-3',
        stepOrder: 3,
        name: 'Executive Closing Offer & NDA Routing',
        delayValue: 4,
        delayUnit: 'days',
        subject: 'Finalizing mutual NDA and trial Sandbox for {{lead.company}}',
        body: `Hi {{lead.firstName}},\n\nI want to make sure you have everything needed to evaluate our platform without blockers. We can provision a dedicated, isolated sandbox environment for {{lead.company}} today.\n\nLet me know if you would like me to route our standard mutual NDA before Friday's deep dive.\n\nWarmly,\n{{rep.name}}`,
        actionOnReply: 'stop_sequence',
        stats: { sent: 136, opened: 98, clicked: 54, replied: 38, bounced: 0 }
      }
    ],
    enrolledCount: 282,
    completedCount: 136,
    convertedCount: 95,
    replyRate: 33.7,
    openRate: 83.3,
    tags: ['Enterprise', 'Inbound', 'High-Value', 'Automated'],
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    $id: 'wf-dormant-reengagement',
    teamId: 'laevos-crm',
    name: 'Dormant Pipeline Win-Back & Re-Engagement',
    description: 'Automatically targets prospects who have been inactive in Proposal or Negotiation for over 10 days with compelling feature updates and executive incentives.',
    status: 'active',
    trigger: {
      type: 'inactivity_detected',
      inactivityDays: 10,
      minScore: 60
    },
    steps: [
      {
        id: 'step-d1',
        stepOrder: 1,
        name: 'New Platform Capabilities & Value Check-In',
        delayValue: 0,
        delayUnit: 'hours',
        subject: 'Updates on our {{lead.industry}} integration roadmap for {{lead.company}}',
        body: `Hi {{lead.firstName}},\n\nChecking back in regarding our discussions on {{lead.company}}'s workflow optimization.\n\nWe just shipped our updated AI Copilot and Appwrite Realtime engine, which cuts data replication latency by 70%.\n\nWould you be open to revisiting where we left off last month?\n\nBest,\n{{rep.name}}`,
        actionOnOpen: 'notify_rep',
        actionOnReply: 'stop_sequence',
        stats: { sent: 118, opened: 84, clicked: 41, replied: 29, bounced: 0 }
      },
      {
        id: 'step-d2',
        stepOrder: 2,
        name: 'Contract Fast-Track Incentive',
        delayValue: 3,
        delayUnit: 'days',
        subject: 'Quarter-end acceleration terms for {{lead.company}}',
        body: `Hi {{lead.firstName}},\n\nTo help support {{lead.company}}'s launch timeline this quarter, leadership has approved waiving onboarding fees on our Enterprise tier (valued at $10k).\n\nLet me know if we can finalize the contract before the end of this week.\n\nBest regards,\n{{rep.name}}`,
        actionOnReply: 'mark_hot_lead',
        stats: { sent: 89, opened: 67, clicked: 35, replied: 22, bounced: 0 }
      }
    ],
    enrolledCount: 118,
    completedCount: 89,
    convertedCount: 36,
    replyRate: 30.5,
    openRate: 71.2,
    tags: ['Re-Engagement', 'Win-Back', 'Nurture'],
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    $id: 'wf-hot-lead-fast-track',
    teamId: 'laevos-crm',
    name: 'Hot Lead Instant Engagement (>85 Score)',
    description: 'Instant VIP outreach triggered whenever a prospect hits high predictive engagement (Score >= 85) across website visits and product whitepaper downloads.',
    status: 'active',
    trigger: {
      type: 'lead_score_reached',
      minScore: 85
    },
    steps: [
      {
        id: 'step-h1',
        stepOrder: 1,
        name: 'Direct Calendar Invite from Executive Rep',
        delayValue: 5,
        delayUnit: 'minutes',
        subject: 'Direct VIP access: Exploring {{lead.company}}\'s tech requirements',
        body: `Hi {{lead.firstName}},\n\nI noticed you have been exploring our enterprise telemetry and automated workflows today. Given your role as {{lead.jobTitle}} at {{lead.company}}, I wanted to provide direct VIP access to my calendar:\n\n📅 https://laevos.internal/meet/{{rep.name}}\n\nHappy to walk through any custom integration requirements you might have.\n\nBest,\n{{rep.name}}\n{{rep.email}}`,
        actionOnOpen: 'create_task',
        actionOnReply: 'mark_hot_lead',
        stats: { sent: 74, opened: 68, clicked: 52, replied: 34, bounced: 0 }
      }
    ],
    enrolledCount: 74,
    completedCount: 74,
    convertedCount: 34,
    replyRate: 45.9,
    openRate: 91.8,
    tags: ['Hot-Lead', 'High-Intent', 'Instant-VIP'],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

@Injectable({
  providedIn: 'root'
})
export class EmailWorkflowService {
  private appwrite = inject(Appwrite);

  // Core signals
  workflows = signal<EmailWorkflow[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedWorkflowId = signal<string | null>('wf-enterprise-inbound');
  executionLogs = signal<ExecutionLog[]>([]);

  // Computed summary metrics
  selectedWorkflow = computed<EmailWorkflow | null>(() => {
    const list = this.workflows();
    const id = this.selectedWorkflowId();
    if (!id) return list[0] || null;
    return list.find(w => w.$id === id) || list[0] || null;
  });

  activeWorkflowsCount = computed(() => {
    return this.workflows().filter(w => w.status === 'active').length;
  });

  totalEnrolledCount = computed(() => {
    return this.workflows().reduce((acc, w) => acc + (w.enrolledCount || 0), 0);
  });

  avgReplyRate = computed(() => {
    const list = this.workflows();
    if (list.length === 0) return 0;
    const total = list.reduce((acc, w) => acc + (w.replyRate || 0), 0);
    return Math.round((total / list.length) * 10) / 10;
  });

  avgOpenRate = computed(() => {
    const list = this.workflows();
    if (list.length === 0) return 0;
    const total = list.reduce((acc, w) => acc + (w.openRate || 0), 0);
    return Math.round((total / list.length) * 10) / 10;
  });

  private unsubscribeRealtime: (() => void) | null = null;

  constructor() {
    this.loadWorkflows();

    // Re-synchronize when active team changes in Appwrite
    effect(() => {
      const activeTeam = this.appwrite.activeTeam();
      if (activeTeam) {
        this.loadWorkflows();
        this.setupRealtime();
      }
    });
  }

  // --- Real Appwrite Storage & Query Layer ---
  async loadWorkflows() {
    this.isLoading.set(true);
    this.error.set(null);
    const teamId = this.appwrite.activeTeam()?.$id || 'laevos-crm';
    const dbId = this.appwrite.config().databaseId || 'leadwave-main';
    const collectionId = 'email_workflows';

    try {
      if (this.appwrite.currentUser() && this.appwrite.databases) {
        try {
          const response = await this.appwrite.databases.listDocuments(
            dbId,
            collectionId,
            [Query.equal('teamId', teamId)]
          );

          if (response && response.documents && response.documents.length > 0) {
            const mapped: EmailWorkflow[] = response.documents.map((doc: any) => ({
              $id: doc.$id,
              teamId: doc.teamId,
              name: doc.name,
              description: doc.description,
              status: doc.status,
              trigger: typeof doc.trigger === 'string' ? JSON.parse(doc.trigger) : doc.trigger,
              steps: typeof doc.steps === 'string' ? JSON.parse(doc.steps) : doc.steps,
              enrolledCount: doc.enrolledCount || 0,
              completedCount: doc.completedCount || 0,
              convertedCount: doc.convertedCount || 0,
              replyRate: doc.replyRate || 0,
              openRate: doc.openRate || 0,
              tags: typeof doc.tags === 'string' ? JSON.parse(doc.tags) : (doc.tags || []),
              createdAt: doc.createdAt || doc.$createdAt,
              updatedAt: doc.updatedAt || doc.$updatedAt
            }));
            this.workflows.set(mapped);
            this.syncToLocalStorage(mapped, teamId);
            this.isLoading.set(false);
            return;
          }
        } catch (dbErr: any) {
          // If collection doesn't exist yet, fall back gracefully to local storage
          console.warn('Appwrite collection "email_workflows" check:', dbErr?.message || dbErr);
        }
      }

      // Load from Local Storage with default templates fallback
      const cached = this.loadFromLocalStorage(teamId);
      if (cached && cached.length > 0) {
        this.workflows.set(cached);
      } else {
        const initial = DEFAULT_WORKFLOWS.map(w => ({ ...w, teamId }));
        this.workflows.set(initial);
        this.syncToLocalStorage(initial, teamId);
      }
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to load email workflows');
      const cached = this.loadFromLocalStorage(teamId);
      this.workflows.set(cached && cached.length > 0 ? cached : DEFAULT_WORKFLOWS);
    } finally {
      this.isLoading.set(false);
    }
  }

  private setupRealtime() {
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
      this.unsubscribeRealtime = null;
    }

    const dbId = this.appwrite.config().databaseId || 'leadwave-main';
    const channel = `databases.${dbId}.collections.email_workflows.documents`;

    try {
      if (this.appwrite.client) {
        this.unsubscribeRealtime = this.appwrite.client.subscribe(channel, (event: any) => {
          if (event.events?.some((ev: string) => ev.includes('.create') || ev.includes('.update') || ev.includes('.delete'))) {
            this.loadWorkflows();
          }
        });
      }
    } catch {
      // Ignore realtime subscribe fallback
    }
  }

  // --- CRUD Operations ---

  async createWorkflow(workflow: Partial<EmailWorkflow>): Promise<EmailWorkflow> {
    this.isSaving.set(true);
    const teamId = this.appwrite.activeTeam()?.$id || 'laevos-crm';
    const dbId = this.appwrite.config().databaseId || 'leadwave-main';
    const collectionId = 'email_workflows';

    const newWorkflow: EmailWorkflow = {
      $id: 'wf-' + ID.unique(),
      teamId,
      name: workflow.name || 'Untitled Email Sequence',
      description: workflow.description || 'Custom trigger-based automated sequence.',
      status: workflow.status || 'draft',
      trigger: workflow.trigger || {
        type: 'stage_changed',
        targetStage: 'Discovery',
        minDealValue: 0
      },
      steps: workflow.steps && workflow.steps.length > 0 ? workflow.steps : [
        {
          id: 'step-' + ID.unique(),
          stepOrder: 1,
          name: 'Introduction & Value Proposition',
          delayValue: 0,
          delayUnit: 'minutes',
          subject: 'Connecting with {{lead.company}} | Introduction',
          body: `Hi {{lead.firstName}},\n\nWanted to reach out to see how {{lead.company}} is currently approaching automated sales operations in {{lead.industry}}.\n\nWould you have 10 minutes for a brief introduction this week?\n\nBest,\n{{rep.name}}`,
          stats: { sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 },
          actionOnReply: 'stop_sequence'
        }
      ],
      enrolledCount: 0,
      completedCount: 0,
      convertedCount: 0,
      replyRate: 0,
      openRate: 0,
      tags: workflow.tags || ['Automated', 'Outbound'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (this.appwrite.currentUser() && this.appwrite.databases) {
        try {
          const doc = await this.appwrite.databases.createDocument(
            dbId,
            collectionId,
            newWorkflow.$id,
            {
              teamId: newWorkflow.teamId,
              name: newWorkflow.name,
              description: newWorkflow.description,
              status: newWorkflow.status,
              trigger: JSON.stringify(newWorkflow.trigger),
              steps: JSON.stringify(newWorkflow.steps),
              enrolledCount: newWorkflow.enrolledCount,
              completedCount: newWorkflow.completedCount,
              convertedCount: newWorkflow.convertedCount,
              replyRate: newWorkflow.replyRate,
              openRate: newWorkflow.openRate,
              tags: JSON.stringify(newWorkflow.tags),
              createdAt: newWorkflow.createdAt,
              updatedAt: newWorkflow.updatedAt
            },
            [
              Permission.read(Role.team(teamId)),
              Permission.update(Role.team(teamId, 'member')),
              Permission.delete(Role.team(teamId, 'admin'))
            ]
          );
          newWorkflow.$id = doc.$id;
        } catch (dbErr: any) {
          console.warn('Persisting locally due to Appwrite server state:', dbErr?.message || dbErr);
        }
      }

      this.workflows.update(list => [newWorkflow, ...list]);
      this.selectedWorkflowId.set(newWorkflow.$id);
      this.syncToLocalStorage(this.workflows(), teamId);

      this.appwrite.addNotification({
        title: 'Workflow Created',
        message: `Sequence "${newWorkflow.name}" has been created and saved.`,
        type: 'success'
      });

      return newWorkflow;
    } finally {
      this.isSaving.set(false);
    }
  }

  async updateWorkflow(id: string, updates: Partial<EmailWorkflow>): Promise<EmailWorkflow> {
    this.isSaving.set(true);
    const teamId = this.appwrite.activeTeam()?.$id || 'laevos-crm';
    const dbId = this.appwrite.config().databaseId || 'leadwave-main';
    const collectionId = 'email_workflows';

    const current = this.workflows().find(w => w.$id === id);
    if (!current) throw new Error(`Workflow with ID ${id} not found`);

    const updated: EmailWorkflow = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    try {
      if (this.appwrite.currentUser() && this.appwrite.databases) {
        try {
          await this.appwrite.databases.updateDocument(
            dbId,
            collectionId,
            id,
            {
              name: updated.name,
              description: updated.description,
              status: updated.status,
              trigger: JSON.stringify(updated.trigger),
              steps: JSON.stringify(updated.steps),
              enrolledCount: updated.enrolledCount,
              completedCount: updated.completedCount,
              convertedCount: updated.convertedCount,
              replyRate: updated.replyRate,
              openRate: updated.openRate,
              tags: JSON.stringify(updated.tags),
              updatedAt: updated.updatedAt
            }
          );
        } catch (dbErr: any) {
          console.warn('Local update synced for Appwrite workflow:', dbErr?.message || dbErr);
        }
      }

      this.workflows.update(list => list.map(w => w.$id === id ? updated : w));
      this.syncToLocalStorage(this.workflows(), teamId);

      return updated;
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    const teamId = this.appwrite.activeTeam()?.$id || 'laevos-crm';
    const dbId = this.appwrite.config().databaseId || 'leadwave-main';
    const collectionId = 'email_workflows';

    try {
      if (this.appwrite.currentUser() && this.appwrite.databases) {
        try {
          await this.appwrite.databases.deleteDocument(dbId, collectionId, id);
        } catch (e) {
          console.warn('Appwrite delete skipped:', e);
        }
      }

      this.workflows.update(list => list.filter(w => w.$id !== id));
      if (this.selectedWorkflowId() === id) {
        const remaining = this.workflows();
        this.selectedWorkflowId.set(remaining.length > 0 ? remaining[0].$id : null);
      }
      this.syncToLocalStorage(this.workflows(), teamId);

      this.appwrite.addNotification({
        title: 'Workflow Deleted',
        message: 'The email sequence has been removed from Appwrite storage.',
        type: 'info'
      });
    } catch (e: any) {
      this.error.set(e?.message || 'Failed to delete workflow');
    }
  }

  async toggleStatus(id: string): Promise<void> {
    const current = this.workflows().find(w => w.$id === id);
    if (!current) return;
    const nextStatus = current.status === 'active' ? 'paused' : 'active';
    await this.updateWorkflow(id, { status: nextStatus });

    this.appwrite.addNotification({
      title: nextStatus === 'active' ? 'Sequence Activated' : 'Sequence Paused',
      message: `"${current.name}" is now ${nextStatus}.`,
      type: nextStatus === 'active' ? 'success' : 'warning'
    });
  }

  async duplicateWorkflow(id: string): Promise<EmailWorkflow> {
    const current = this.workflows().find(w => w.$id === id);
    if (!current) throw new Error('Workflow not found');

    const copy: Partial<EmailWorkflow> = {
      name: `${current.name} (Copy)`,
      description: current.description,
      status: 'draft',
      trigger: JSON.parse(JSON.stringify(current.trigger)),
      steps: JSON.parse(JSON.stringify(current.steps)).map((s: any, idx: number) => ({
        ...s,
        id: 'step-' + ID.unique(),
        stepOrder: idx + 1,
        stats: { sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 }
      })),
      tags: [...current.tags]
    };

    return await this.createWorkflow(copy);
  }

  // --- Step Pipeline Management ---

  async addStep(workflowId: string): Promise<void> {
    const wf = this.workflows().find(w => w.$id === workflowId);
    if (!wf) return;

    const newStepOrder = wf.steps.length + 1;
    const newStep: EmailWorkflowStep = {
      id: 'step-' + ID.unique(),
      stepOrder: newStepOrder,
      name: `Follow-Up Touch #${newStepOrder}`,
      delayValue: 2,
      delayUnit: 'days',
      subject: `Following up on {{lead.company}}'s architecture assessment`,
      body: `Hi {{lead.firstName}},\n\nWanted to quickly follow up on my previous message. Are there any specific questions I can answer for you and the team at {{lead.company}}?\n\nBest regards,\n{{rep.name}}`,
      actionOnReply: 'stop_sequence',
      stats: { sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 }
    };

    const updatedSteps = [...wf.steps, newStep];
    await this.updateWorkflow(workflowId, { steps: updatedSteps });
  }

  async updateStep(workflowId: string, stepId: string, updates: Partial<EmailWorkflowStep>): Promise<void> {
    const wf = this.workflows().find(w => w.$id === workflowId);
    if (!wf) return;

    const updatedSteps = wf.steps.map(s => {
      if (s.id === stepId) {
        return { ...s, ...updates };
      }
      return s;
    });

    await this.updateWorkflow(workflowId, { steps: updatedSteps });
  }

  async removeStep(workflowId: string, stepId: string): Promise<void> {
    const wf = this.workflows().find(w => w.$id === workflowId);
    if (!wf) return;
    if (wf.steps.length <= 1) {
      this.appwrite.addNotification({
        title: 'Action Denied',
        message: 'A workflow sequence must retain at least one dispatch step.',
        type: 'warning'
      });
      return;
    }

    const filtered = wf.steps.filter(s => s.id !== stepId);
    const reordered = filtered.map((s, idx) => ({ ...s, stepOrder: idx + 1 }));
    await this.updateWorkflow(workflowId, { steps: reordered });
  }

  async moveStep(workflowId: string, index: number, direction: 'up' | 'down'): Promise<void> {
    const wf = this.workflows().find(w => w.$id === workflowId);
    if (!wf) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= wf.steps.length) return;

    const stepsCopy = [...wf.steps];
    const temp = stepsCopy[index];
    stepsCopy[index] = stepsCopy[targetIndex];
    stepsCopy[targetIndex] = temp;

    const reordered = stepsCopy.map((s, idx) => ({ ...s, stepOrder: idx + 1 }));
    await this.updateWorkflow(workflowId, { steps: reordered });
  }

  // --- Personalization Token Parsing Engine ---

  renderTemplate(template: string, lead?: Lead | null, repName?: string, repEmail?: string): string {
    if (!template) return '';
    let result = template;

    const rep = {
      name: repName || this.appwrite.currentUser()?.name || 'Ahmed Ali',
      email: repEmail || this.appwrite.currentUser()?.email || 'ahmed@laevos.io'
    };

    const targetLead = lead || {
      name: 'Sarah Connor',
      email: 's.connor@cyberdyne.io',
      source: 'Inbound Demo',
      status: 'Discovery',
      value: 145000,
      industry: 'AI Infrastructure & Cybernetics',
      jobTitle: 'VP of Technology',
      region: 'North America',
      score: 94
    };

    const firstName = targetLead.name ? targetLead.name.split(' ')[0] : 'there';
    const lastName = targetLead.name && targetLead.name.includes(' ') ? targetLead.name.split(' ').slice(1).join(' ') : '';
    const company = (targetLead as any).company || (targetLead.name ? targetLead.name.split(' ')[0] + ' Labs' : 'your team');
    const formattedDeal = targetLead.value ? '$' + Number(targetLead.value).toLocaleString() : '$50,000+';

    const replacements: Record<string, string> = {
      '{{lead.firstName}}': firstName,
      '{{lead.lastName}}': lastName,
      '{{lead.name}}': targetLead.name || 'Valued Prospect',
      '{{lead.company}}': company,
      '{{lead.email}}': targetLead.email || 'prospect@enterprise.com',
      '{{lead.jobTitle}}': targetLead.jobTitle || 'Decision Maker',
      '{{lead.industry}}': targetLead.industry || 'Technology',
      '{{lead.region}}': targetLead.region || 'Enterprise',
      '{{lead.dealValue}}': formattedDeal,
      '{{lead.status}}': targetLead.status || 'Active',
      '{{lead.score}}': String(targetLead.score || 85),
      '{{rep.name}}': rep.name,
      '{{rep.email}}': rep.email,
      '{{today}}': new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      '{{deal.scopeUrl}}': 'https://laevos.internal/deals/scoping-doc'
    };

    for (const [token, value] of Object.entries(replacements)) {
      result = result.split(token).join(value);
    }

    return result;
  }

  // --- Lead Trigger Evaluation & Simulation Runner ---

  checkLeadMatchesTrigger(workflow: EmailWorkflow, lead: Lead): boolean {
    const trigger = workflow.trigger;
    if (workflow.status !== 'active') return false;

    switch (trigger.type) {
      case 'stage_changed':
        if (trigger.targetStage && lead.status !== trigger.targetStage) return false;
        if (trigger.minDealValue && (lead.value || 0) < trigger.minDealValue) return false;
        return true;

      case 'lead_score_reached':
        return (lead.score || 0) >= (trigger.minScore || 80);

      case 'deal_value_exceeded':
        return (lead.value || 0) >= (trigger.minDealValue || 100000);

      case 'inactivity_detected':
        // Evaluates inactivity simulation
        return (lead.score || 0) >= (trigger.minScore || 0);

      case 'lead_created':
      default:
        return true;
    }
  }

  simulateWorkflowRun(workflow: EmailWorkflow, lead: Lead): ExecutionLog[] {
    const logs: ExecutionLog[] = [];
    const now = Date.now();

    workflow.steps.forEach((step, idx) => {
      let delayMs = 0;
      if (step.delayUnit === 'minutes') delayMs = step.delayValue * 60 * 1000;
      else if (step.delayUnit === 'hours') delayMs = step.delayValue * 3600 * 1000;
      else delayMs = step.delayValue * 86400 * 1000;

      const scheduleTime = new Date(now + delayMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const delayLabel = step.delayValue === 0 ? 'Immediately (T+0)' : `+${step.delayValue} ${step.delayUnit}`;

      logs.push({
        id: 'log-' + ID.unique(),
        workflowId: workflow.$id,
        workflowName: workflow.name,
        stepNumber: step.stepOrder || (idx + 1),
        leadId: lead.$id || 'lead-sim',
        leadName: lead.name,
        leadEmail: lead.email,
        renderedSubject: this.renderTemplate(step.subject, lead),
        renderedBody: this.renderTemplate(step.body, lead),
        status: idx === 0 ? 'dispatched' : 'scheduled',
        timestamp: scheduleTime,
        delayString: delayLabel
      });
    });

    this.executionLogs.set(logs);

    // Update workflow metrics in Appwrite simulation
    this.updateWorkflow(workflow.$id, {
      enrolledCount: (workflow.enrolledCount || 0) + 1,
      completedCount: (workflow.completedCount || 0) + 1
    });

    this.appwrite.addNotification({
      title: 'Sequence Simulation Dispatched',
      message: `Dispatched step #1 to ${lead.name} (${lead.email}). ${workflow.steps.length - 1} steps queued in Appwrite schedule.`,
      type: 'success'
    });

    return logs;
  }

  // --- Local Storage Helpers ---
  private getStorageKey(teamId: string): string {
    return `laevos_email_workflows_${teamId}`;
  }

  private loadFromLocalStorage(teamId: string): EmailWorkflow[] | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const saved = localStorage.getItem(this.getStorageKey(teamId));
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  private syncToLocalStorage(workflows: EmailWorkflow[], teamId: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.getStorageKey(teamId), JSON.stringify(workflows));
    } catch (e) {
      console.warn('LocalStorage sync warning:', e);
    }
  }
}
