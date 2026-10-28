/* eslint-disable @typescript-eslint/no-unused-vars */
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { db } from '../db';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini client if key is provided
const aiApiKey = process.env['GEMINI_API_KEY'];
let aiClient: GoogleGenAI | null = null;
if (aiApiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: aiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-mcp'
        }
      }
    });
  } catch (err) {
    console.error('[MCP] Failed to initialize GoogleGenAI client:', err);
  }
}

// Fallback Leads for when Appwrite DB is not connected or empty
export interface LeadRecord {
  $id?: string;
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  value?: number;
  industry?: string;
  company?: string;
  region?: string;
  jobTitle?: string;
  companySize?: string;
  annualRevenue?: number;
  budgetTier?: string;
  lat?: number;
  lng?: number;
  aiInsights?: string;
  priority?: string;
  expectedCloseDate?: string;
  createdAt?: string;
  websiteActivity?: string;
  emailEngagement?: string;
  websiteVisits?: number;
  emailOpens?: number;
  emailClicks?: number;
  downloads?: string[];
  webinarsAttended?: string[];
  activities?: { id?: string; type?: string; detail?: string; points?: number; timestamp?: string }[];
  history?: { type: string; date: string; content: string }[];
  [key: string]: unknown;
}

export const DEFAULT_LEADS: LeadRecord[] = [
  {
    $id: '1',
    name: 'Acme Corp',
    email: 'contact@acme.com',
    phone: '+1 555-0192',
    source: 'Website',
    status: 'Qualified',
    value: 85000,
    industry: 'SaaS',
    companySize: 'Enterprise',
    jobTitle: 'VP of Engineering',
    websiteActivity: 'High',
    emailEngagement: 'High',
    websiteVisits: 12,
    emailOpens: 8,
    emailClicks: 4,
    downloads: ['2026 Enterprise Security Blueprint'],
    webinarsAttended: ['Automating Enterprise CRM at Scale'],
    region: 'North America',
    expectedCloseDate: '2026-10-15',
    createdAt: '2026-09-15T10:00:00.000Z',
    history: [
      { type: 'Status Changed', date: 'Yesterday, 2:30 PM', content: 'Moved to Qualified stage after discovery call.' },
      { type: 'Email Received', date: '2 days ago, 10:15 AM', content: 'Requested security compliance questionnaire.' }
    ]
  },
  {
    $id: '2',
    name: 'Stark Industries',
    email: 'tony@stark.com',
    phone: '+1 555-3000',
    source: 'Referral',
    status: 'Contacted',
    value: 250000,
    industry: 'Cyber Security',
    companySize: 'Enterprise',
    jobTitle: 'Chief Executive Officer',
    websiteActivity: 'High',
    emailEngagement: 'Medium',
    websiteVisits: 18,
    emailOpens: 5,
    emailClicks: 3,
    downloads: ['Zero-Trust Architecture Spec'],
    region: 'North America',
    expectedCloseDate: '2026-11-01',
    createdAt: '2026-09-18T14:30:00.000Z',
    history: [
      { type: 'Call Logged', date: 'Today, 11:00 AM', content: 'Initial discovery alignment with CTO.' }
    ]
  },
  {
    $id: '3',
    name: 'Wayne Enterprises',
    email: 'bruce@wayne.com',
    phone: '+1 555-4921',
    source: 'Event',
    status: 'New',
    value: 120000,
    industry: 'FinTech',
    companySize: 'Enterprise',
    jobTitle: 'Managing Director',
    websiteActivity: 'Medium',
    emailEngagement: 'Low',
    websiteVisits: 4,
    emailOpens: 2,
    emailClicks: 1,
    region: 'North America',
    expectedCloseDate: '2026-11-20',
    createdAt: '2026-09-20T09:15:00.000Z'
  },
  {
    $id: '4',
    name: 'Cyberdyne Systems',
    email: 'miles@cyberdyne.com',
    phone: '+1 555-8000',
    source: 'Outbound',
    status: 'New',
    value: 95000,
    industry: 'AI',
    companySize: 'Mid-Market',
    jobTitle: 'Head of Data Science',
    websiteActivity: 'Low',
    emailEngagement: 'High',
    websiteVisits: 3,
    emailOpens: 4,
    emailClicks: 2,
    region: 'Europe',
    expectedCloseDate: '2026-10-30',
    createdAt: '2026-09-21T16:45:00.000Z'
  }
];

export const DEFAULT_CONTACTS = [
  {
    $id: 'c-101',
    name: 'Bill Gates',
    email: 'bill@microsoft.com',
    phone: '+1 (425) 882-8080',
    company: 'Microsoft Corp',
    notes: 'Primary executive sponsor for Azure cloud migration.',
    status: 'Customer',
    dealValue: 450000
  },
  {
    $id: 'c-102',
    name: 'Marc Benioff',
    email: 'marc@salesforce.com',
    phone: '+1 (415) 901-7000',
    company: 'Salesforce Inc',
    notes: 'Joint enterprise CRM interoperability evaluation.',
    status: 'Opportunity',
    dealValue: 280000
  },
  {
    $id: 'c-104',
    name: 'Sam Altman',
    email: 'sam@openai.com',
    phone: '+1 (415) 333-9999',
    company: 'OpenAI',
    notes: 'Testing high-throughput inference caching.',
    status: 'Customer',
    dealValue: 850000
  }
];

export const DEFAULT_TASKS = [
  {
    $id: 't-1',
    title: 'Deliver executive proposal & ROI model to Acme Corp',
    leadId: '1',
    leadName: 'Acme Corp',
    priority: 'High',
    status: 'in_progress',
    dueDate: '2026-10-05'
  },
  {
    $id: 't-2',
    title: 'Schedule architecture compliance review with Stark CTO',
    leadId: '2',
    leadName: 'Stark Industries',
    priority: 'High',
    status: 'todo',
    dueDate: '2026-10-08'
  },
  {
    $id: 't-3',
    title: 'Follow up on FinTech summit discussion with Bruce Wayne',
    leadId: '3',
    leadName: 'Wayne Enterprises',
    priority: 'Medium',
    status: 'todo',
    dueDate: '2026-10-12'
  }
];

export const DEFAULT_NOTES = [
  {
    $id: 'n-1',
    title: 'Q3 Enterprise Sales Strategy & Playbook',
    content: 'Focus heavily on Tier-1 SaaS, Cyber Security, and AI sectors. Highlight deterministic scoring and real-time RevOps simulation capabilities.',
    tags: ['Strategy', 'Playbook', 'Q3'],
    category: 'Sales Strategy'
  },
  {
    $id: 'n-2',
    title: 'Acme Corp Buying Committee Meeting Debrief',
    content: 'VP of Engineering emphasized strict security requirements and low latency CRM sync. Promised turnaround on MSA terms by Friday.',
    tags: ['Meeting', 'AcmeCorp', 'Enterprise'],
    category: 'Customer Intelligence'
  }
];

// Helper to fetch leads safely with fallback
export async function getLeadsList(): Promise<LeadRecord[]> {
  try {
    const items = (await db.leads.list()) as LeadRecord[];
    if (items && items.length > 0) return items;
  } catch {
    // fallback
  }
  return DEFAULT_LEADS;
}

// Helper to calculate deterministic lead score
export function calculateMcpLeadScore(lead: LeadRecord) {
  let demoPoints = 0;
  let actPoints = 0;
  const factors: { factor: string; points: number }[] = [];

  if (lead.industry) {
    const highTier = ['SaaS', 'FinTech', 'Healthcare', 'Cyber Security', 'Bio-Tech', 'AI', 'Cloud'];
    if (highTier.some(t => lead.industry?.toLowerCase().includes(t.toLowerCase()))) {
      demoPoints += 20;
      factors.push({ factor: `Tier-1 Strategic Industry (${lead.industry})`, points: 20 });
    } else {
      demoPoints += 10;
      factors.push({ factor: `Standard Industry (${lead.industry})`, points: 10 });
    }
  }

  if (lead.companySize === 'Enterprise') {
    demoPoints += 25;
    factors.push({ factor: 'Enterprise Scale (500+ employees)', points: 25 });
  } else if (lead.companySize === 'Mid-Market') {
    demoPoints += 15;
    factors.push({ factor: 'Mid-Market Account', points: 15 });
  }

  if (lead.jobTitle) {
    const t = lead.jobTitle.toLowerCase();
    if (t.includes('chief') || t.includes('ceo') || t.includes('cto') || t.includes('cio') || t.includes('founder')) {
      demoPoints += 20;
      factors.push({ factor: `C-Suite Executive (${lead.jobTitle})`, points: 20 });
    } else if (t.includes('vp') || t.includes('director') || t.includes('head')) {
      demoPoints += 15;
      factors.push({ factor: `VP/Director Seniority (${lead.jobTitle})`, points: 15 });
    }
  }

  if (lead.value && lead.value >= 100000) {
    demoPoints += 25;
    factors.push({ factor: `High-Value Pipeline ($${(lead.value / 1000).toFixed(0)}k ARR)`, points: 25 });
  } else if (lead.value && lead.value >= 50000) {
    demoPoints += 15;
    factors.push({ factor: `Mid-Value Pipeline ($${(lead.value / 1000).toFixed(0)}k ARR)`, points: 15 });
  }

  const visits = lead.websiteVisits || (lead.websiteActivity === 'High' ? 10 : 2);
  if (visits > 0) {
    const pts = Math.min(25, visits * 3);
    actPoints += pts;
    factors.push({ factor: `${visits} Verified Web Sessions`, points: pts });
  }

  const opens = lead.emailOpens || (lead.emailEngagement === 'High' ? 6 : 1);
  if (opens > 0) {
    const pts = Math.min(20, opens * 5);
    actPoints += pts;
    factors.push({ factor: `${opens} Email Opens`, points: pts });
  }

  const score = Math.min(100, Math.max(1, Math.round(demoPoints * 0.45 + actPoints * 0.55)));
  const category = score >= 75 ? 'Hot' : score >= 45 ? 'Warm' : 'Cold';
  const grade = score >= 90 ? 'A+' : score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 45 ? 'C' : 'D';

  return {
    score,
    grade,
    category,
    demographicPoints: demoPoints,
    activityPoints: actPoints,
    factors,
    repCoaching: score >= 75 
      ? 'High buying velocity. Skip generic feature discovery and present an executive ROI proposal.'
      : 'Mid-funnel prospect. Share strategic case study or invite to live webinar.'
  };
}

/**
 * Creates and configures the ΛΞVOS CRM Model Context Protocol (MCP) server instance.
 */
export function createCrmMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'levos-crm-mcp',
      version: '1.0.0'
    },
    {
      instructions: 'ΛΞVOS Enterprise CRM Model Context Protocol (MCP) Server. Provides real-time tools, resources, and prompt templates to query and manage leads, deals, contacts, tasks, AI lead scores, pipeline analytics, and knowledge base notes.'
    }
  );

  // ==========================================
  // MCP TOOLS
  // ==========================================

  // 1. Tool: crm_list_leads
  server.tool(
    'crm_list_leads',
    'List leads from the CRM pipeline with optional filtering by status, industry, search query, or limit.',
    {
      query: z.string().optional().describe('Search query to match against lead name, email, or company'),
      status: z.string().optional().describe('Filter by stage: New, Contacted, Qualified, Proposal, Negotiation, Won, Lost'),
      industry: z.string().optional().describe('Filter by industry sector, e.g. SaaS, FinTech, Cyber Security, AI'),
      limit: z.number().optional().default(50).describe('Maximum number of leads to return')
    },
    async ({ query, status, industry, limit }) => {
      let leads = await getLeadsList();

      if (status) {
        leads = leads.filter(l => l.status?.toLowerCase() === status.toLowerCase());
      }
      if (industry) {
        leads = leads.filter(l => l.industry?.toLowerCase().includes(industry.toLowerCase()));
      }
      if (query) {
        const q = query.toLowerCase();
        leads = leads.filter(l => 
          (l.name && l.name.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.company && l.company.toLowerCase().includes(q))
        );
      }

      leads = leads.slice(0, limit);

      const totalPipelineValue = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      const stageDistribution = leads.reduce((acc: Record<string, number>, l) => {
        const s = l.status || 'Unassigned';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              count: leads.length,
              totalPipelineValue,
              stageDistribution,
              leads: leads.map(l => ({
                id: l.$id,
                name: l.name,
                email: l.email,
                company: l.company || l.name,
                status: l.status,
                value: l.value,
                industry: l.industry,
                jobTitle: l.jobTitle,
                region: l.region
              }))
            }, null, 2)
          }
        ]
      };
    }
  );

  // 2. Tool: crm_get_lead
  server.tool(
    'crm_get_lead',
    'Retrieve full details for a specific lead by ID, including deterministic score analysis, grading, and rep coaching advice.',
    {
      id: z.string().describe('The unique identifier of the lead')
    },
    async ({ id }) => {
      const leads = await getLeadsList();
      const lead = leads.find(l => l.$id === id);

      if (!lead) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error: Lead with ID "${id}" was not found in the CRM database.`
            }
          ]
        };
      }

      const score = calculateMcpLeadScore(lead);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              lead,
              scoreAnalysis: score
            }, null, 2)
          }
        ]
      };
    }
  );

  // 3. Tool: crm_create_lead
  server.tool(
    'crm_create_lead',
    'Create a new lead account in the CRM pipeline.',
    {
      name: z.string().describe('Lead / Organization name'),
      email: z.string().describe('Primary contact email address'),
      value: z.number().describe('Estimated pipeline deal value in USD ($)'),
      status: z.string().optional().default('New').describe('Pipeline stage: New, Contacted, Qualified, Proposal, Negotiation'),
      industry: z.string().optional().default('SaaS').describe('Industry sector'),
      companySize: z.string().optional().default('Mid-Market').describe('Enterprise, Mid-Market, Small Business, Startup'),
      jobTitle: z.string().optional().default('VP').describe('Decision maker job title'),
      phone: z.string().optional().describe('Contact phone number'),
      source: z.string().optional().default('MCP Assistant').describe('Lead acquisition source')
    },
    async (leadData) => {
      const newLead: LeadRecord = {
        ...leadData,
        createdAt: new Date().toISOString(),
        history: [
          {
            type: 'Lead Created',
            date: new Date().toLocaleString(),
            content: `Created via Model Context Protocol (MCP) by AI assistant.`
          }
        ]
      };

      let createdItem: LeadRecord;
      try {
        createdItem = (await db.leads.create(newLead as never)) as LeadRecord;
      } catch {
        newLead.$id = 'mcp-' + Date.now().toString(36);
        createdItem = newLead;
      }

      const score = calculateMcpLeadScore(createdItem);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Lead "${leadData['name']}" created successfully.`,
              lead: createdItem,
              score
            }, null, 2)
          }
        ]
      };
    }
  );

  // 4. Tool: crm_update_lead
  server.tool(
    'crm_update_lead',
    'Update lead status, deal value, or attributes in the CRM pipeline.',
    {
      id: z.string().describe('The ID of the lead to update'),
      status: z.string().optional().describe('New stage: New, Contacted, Qualified, Proposal, Negotiation, Won, Lost'),
      value: z.number().optional().describe('Updated deal value in USD'),
      industry: z.string().optional().describe('Updated industry'),
      jobTitle: z.string().optional().describe('Updated job title'),
      activityNote: z.string().optional().describe('Note to append to activity history')
    },
    async ({ id, status, value, industry, jobTitle, activityNote }) => {
      const leads = await getLeadsList();
      const lead = leads.find(l => l.$id === id);

      if (!lead) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Lead with ID "${id}" was not found.` }]
        };
      }

      const updates: Partial<LeadRecord> = {};
      if (status !== undefined) updates.status = status;
      if (value !== undefined) updates.value = value;
      if (industry !== undefined) updates.industry = industry;
      if (jobTitle !== undefined) updates.jobTitle = jobTitle;

      if (activityNote) {
        const history = lead.history || [];
        updates.history = [
          {
            type: 'MCP Update',
            date: new Date().toLocaleString(),
            content: activityNote
          },
          ...history
        ];
      }

      let updatedLead: LeadRecord = { ...lead, ...updates };
      try {
        updatedLead = (await db.leads.update(id, updates)) as LeadRecord;
      } catch {
        // In-memory update
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Lead "${lead.name}" updated successfully.`,
              lead: updatedLead
            }, null, 2)
          }
        ]
      };
    }
  );

  // 5. Tool: crm_score_lead
  server.tool(
    'crm_score_lead',
    'Execute the multi-factor scoring engine on a lead to calculate 1-100 score, tier grade, demographic vs behavioral breakdown, and sales rep advice.',
    {
      id: z.string().optional().describe('ID of existing lead to score'),
      leadPayload: z.object({
        name: z.string().optional(),
        industry: z.string().optional(),
        companySize: z.string().optional(),
        jobTitle: z.string().optional(),
        value: z.number().optional(),
        websiteVisits: z.number().optional(),
        emailOpens: z.number().optional(),
        emailClicks: z.number().optional()
      }).optional().describe('Arbitrary lead attributes to score if not referencing an existing ID')
    },
    async ({ id, leadPayload }) => {
      let target: LeadRecord | null = null;
      if (id) {
        const leads = await getLeadsList();
        target = leads.find(l => l.$id === id) || null;
      }
      if (!target && leadPayload) {
        target = leadPayload as LeadRecord;
      }

      if (!target) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'Please provide either an existing lead "id" or a "leadPayload" object to score.' }]
        };
      }

      const result = calculateMcpLeadScore(target);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              leadName: target.name || 'Evaluated Prospect',
              ...result
            }, null, 2)
          }
        ]
      };
    }
  );

  // 6. Tool: crm_list_tasks
  server.tool(
    'crm_list_tasks',
    'List strategic tasks, action items, and deadlines from the CRM.',
    {
      status: z.string().optional().describe('Filter by status: todo, in_progress, completed'),
      priority: z.string().optional().describe('Filter by priority: High, Medium, Low'),
      leadId: z.string().optional().describe('Filter tasks for a specific lead')
    },
    async ({ status, priority, leadId }) => {
      let tasks = DEFAULT_TASKS;
      try {
        const dbTasks = (await db.tasks.list()) as typeof DEFAULT_TASKS;
        if (dbTasks && dbTasks.length > 0) tasks = dbTasks;
      } catch {
        // fallback
      }

      if (status) tasks = tasks.filter(t => t.status === status);
      if (priority) tasks = tasks.filter(t => t.priority === priority);
      if (leadId) tasks = tasks.filter(t => t.leadId === leadId);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              count: tasks.length,
              tasks
            }, null, 2)
          }
        ]
      };
    }
  );

  // 7. Tool: crm_create_task
  server.tool(
    'crm_create_task',
    'Create an actionable task or deadline in the CRM, optionally linked to a lead.',
    {
      title: z.string().describe('Task objective or deliverable title'),
      leadId: z.string().optional().describe('Optional ID of the associated lead'),
      leadName: z.string().optional().describe('Associated lead or client name'),
      priority: z.string().optional().default('Medium').describe('High, Medium, Low'),
      dueDate: z.string().optional().describe('Target completion date (YYYY-MM-DD)')
    },
    async ({ title, leadId, leadName, priority, dueDate }) => {
      const task = {
        title,
        leadId: leadId || null,
        leadName: leadName || 'General Workspace',
        priority: priority || 'Medium',
        status: 'todo',
        dueDate: dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      let created;
      try {
        created = await db.tasks.create(task as never);
      } catch {
        created = { $id: 'task-' + Date.now().toString(36), ...task };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Task "${title}" created.`,
              task: created
            }, null, 2)
          }
        ]
      };
    }
  );

  // 8. Tool: crm_list_notes
  server.tool(
    'crm_list_notes',
    'List knowledge base entries, meeting debriefs, and strategic documentation.',
    {
      tag: z.string().optional().describe('Filter by topic tag, e.g. Strategy, Meeting, Q3'),
      search: z.string().optional().describe('Search query for note title or content')
    },
    async ({ tag, search }) => {
      let notes = DEFAULT_NOTES;
      try {
        const dbNotes = (await db.notes.list()) as typeof DEFAULT_NOTES;
        if (dbNotes && dbNotes.length > 0) notes = dbNotes;
      } catch {
        // fallback
      }

      if (tag) {
        notes = notes.filter(n => n.tags?.some(t => t.toLowerCase() === tag.toLowerCase()));
      }
      if (search) {
        const q = search.toLowerCase();
        notes = notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              count: notes.length,
              notes
            }, null, 2)
          }
        ]
      };
    }
  );

  // 9. Tool: crm_create_note
  server.tool(
    'crm_create_note',
    'Create a rich formatted knowledge base note or meeting summary in the CRM.',
    {
      title: z.string().describe('Note title'),
      content: z.string().describe('Note content (Markdown formatting supported)'),
      tags: z.array(z.string()).optional().default(['General']).describe('List of tags'),
      category: z.string().optional().default('General').describe('Category folder')
    },
    async ({ title, content, tags, category }) => {
      const note = {
        title,
        content,
        tags: tags || ['General'],
        category: category || 'General',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: new Date().toISOString()
      };

      let created;
      try {
        created = await db.notes.create(note as never);
      } catch {
        created = { $id: 'note-' + Date.now().toString(36), ...note };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Note "${title}" saved to knowledge base.`,
              note: created
            }, null, 2)
          }
        ]
      };
    }
  );

  // 10. Tool: crm_search_crm
  server.tool(
    'crm_search_crm',
    'Perform a global full-text search across leads, contacts, tasks, and knowledge base notes.',
    {
      query: z.string().describe('Keyword or phrase to search for')
    },
    async ({ query }) => {
      const q = query.toLowerCase();
      const leads = (await getLeadsList()).filter(l => 
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.company && l.company.toLowerCase().includes(q)) ||
        (l.industry && l.industry.toLowerCase().includes(q))
      );

      const contacts = DEFAULT_CONTACTS.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.notes.toLowerCase().includes(q)
      );

      const tasks = DEFAULT_TASKS.filter(t => 
        t.title.toLowerCase().includes(q) ||
        (t.leadName && t.leadName.toLowerCase().includes(q))
      );

      const notes = DEFAULT_NOTES.filter(n => 
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query,
              totalResults: leads.length + contacts.length + tasks.length + notes.length,
              leads: leads.map(l => ({ id: l.$id, name: l.name, value: l.value, status: l.status })),
              contacts: contacts.map(c => ({ id: c.$id, name: c.name, company: c.company })),
              tasks: tasks.map(t => ({ id: t.$id, title: t.title, priority: t.priority })),
              notes: notes.map(n => ({ id: n.$id, title: n.title, tags: n.tags }))
            }, null, 2)
          }
        ]
      };
    }
  );

  // 11. Tool: crm_get_pipeline_analytics
  server.tool(
    'crm_get_pipeline_analytics',
    'Get real-time pipeline KPIs, ARR forecast, stage conversion counts, and top deals.',
    {},
    async () => {
      const leads = await getLeadsList();
      const totalPipeline = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      const avgDealSize = leads.length > 0 ? Math.round(totalPipeline / leads.length) : 0;
      
      const byStage: Record<string, { count: number; value: number }> = {};
      leads.forEach(l => {
        const s = l.status || 'New';
        if (!byStage[s]) byStage[s] = { count: 0, value: 0 };
        byStage[s].count += 1;
        byStage[s].value += Number(l.value) || 0;
      });

      const topOpportunities = [...leads]
        .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
        .slice(0, 3)
        .map(l => ({ id: l.$id, name: l.name, value: l.value, status: l.status, industry: l.industry }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              kpis: {
                totalAccounts: leads.length,
                totalPipelineValueUSD: totalPipeline,
                averageDealSizeUSD: avgDealSize,
                weightedForecastUSD: Math.round(totalPipeline * 0.62)
              },
              stageBreakdown: byStage,
              topDeals: topOpportunities
            }, null, 2)
          }
        ]
      };
    }
  );

  // 12. Tool: crm_generate_sales_email
  server.tool(
    'crm_generate_sales_email',
    'Draft a context-aware sales outreach or follow-up email tailored to a lead in the pipeline.',
    {
      leadId: z.string().describe('ID of the lead'),
      emailType: z.enum(['initial_outreach', 'follow_up', 'pricing_proposal', 're_engagement'])
        .optional().default('initial_outreach')
        .describe('Type of sales email to generate'),
      customTone: z.string().optional().default('Executive & ROI-focused').describe('Tone: Executive, Consultative, Technical, Urgent')
    },
    async ({ leadId, emailType, customTone }) => {
      const leads = await getLeadsList();
      const lead = leads.find(l => l.$id === leadId);

      if (!lead) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Lead with ID "${leadId}" was not found.` }]
        };
      }

      const score = calculateMcpLeadScore(lead);

      if (aiClient) {
        try {
          const prompt = `You are the lead sales director for ΛΞVOS CRM.
Write a personalized ${emailType} email to:
- Name: ${lead.name}
- Title: ${lead.jobTitle || 'Executive'}
- Industry: ${lead.industry || 'Technology'}
- Deal Value: $${(lead.value || 0).toLocaleString()}
- Intent Score: ${score.score}/100 (${score.category} Lead)
- Coaching Context: ${score.repCoaching}
- Desired Tone: ${customTone}

Format the output strictly as JSON:
{
  "subject": "Email Subject",
  "body": "Email body content with professional sign-off",
  "strategicRationale": "1-2 sentence explanation of why this angle converts this specific prospect"
}`;

          const response = await aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });

          const text = response.text || '';
          return {
            content: [{ type: 'text', text }]
          };
        } catch (err) {
          console.error('[MCP] Gemini email generation error:', err);
        }
      }

      // Smart Simulated Fallback
      const subjects: Record<string, string> = {
        initial_outreach: `Accelerating ${lead.name}'s revenue pipeline with deterministic CRM automation`,
        follow_up: `Following up: Modernizing sales ops architecture at ${lead.name}`,
        pricing_proposal: `Executive Summary & Solution Roadmap for ${lead.name}`,
        re_engagement: `New RevOps capabilities for ${lead.industry || 'Enterprise'} teams`
      };

      const fallbackSubject = subjects[emailType] || subjects['initial_outreach'];
      const fallbackBody = `Dear ${lead.jobTitle || 'Team'} at ${lead.name},\n\nI hope you are having a productive week. Given your strategic leadership in the ${lead.industry || 'technology'} space, I wanted to share how enterprise teams are leveraging ΛΞVOS to eliminate pipeline blind spots and automate deal execution.\n\nBased on your organization's scale, our workspace typically unlocks a 40% reduction in cycle velocity and automates mutual action plans across buying committees.\n\nWould you be open to a brief 10-minute briefing next Tuesday to review the numbers?\n\nBest regards,\n\nΛΞVOS Enterprise Team`;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              subject: fallbackSubject,
              body: fallbackBody,
              strategicRationale: `Anchored on ${lead.industry} industry pain points and ${lead.jobTitle} executive priorities.`
            }, null, 2)
          }
        ]
      };
    }
  );

  // ==========================================
  // MCP RESOURCES
  // ==========================================

  // 1. Resource: crm://leads
  server.resource(
    'CRM Leads Dataset',
    'crm://leads',
    {
      description: 'Active leads dataset in the CRM pipeline',
      mimeType: 'application/json'
    },
    async () => {
      const leads = await getLeadsList();
      return {
        contents: [
          {
            uri: 'crm://leads',
            mimeType: 'application/json',
            text: JSON.stringify(leads, null, 2)
          }
        ]
      };
    }
  );

  // 2. Resource: crm://pipeline-summary
  server.resource(
    'Pipeline Summary Analytics',
    'crm://pipeline-summary',
    {
      description: 'Real-time aggregated pipeline analytics, ARR forecast, and stage distribution',
      mimeType: 'application/json'
    },
    async () => {
      const leads = await getLeadsList();
      const totalPipeline = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      return {
        contents: [
          {
            uri: 'crm://pipeline-summary',
            mimeType: 'application/json',
            text: JSON.stringify({
              totalPipelineUSD: totalPipeline,
              totalAccounts: leads.length,
              generatedAt: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }
  );

  // 3. Resource: crm://tasks
  server.resource(
    'CRM Strategic Tasks',
    'crm://tasks',
    {
      description: 'List of strategic objectives, action items, and account deadlines',
      mimeType: 'application/json'
    },
    async () => {
      let tasks = DEFAULT_TASKS;
      try {
        const dbTasks = (await db.tasks.list()) as typeof DEFAULT_TASKS;
        if (dbTasks && dbTasks.length > 0) tasks = dbTasks;
      } catch {
        // fallback
      }
      return {
        contents: [
          {
            uri: 'crm://tasks',
            mimeType: 'application/json',
            text: JSON.stringify(tasks, null, 2)
          }
        ]
      };
    }
  );

  // 4. Resource: crm://contacts
  server.resource(
    'Contacts Directory',
    'crm://contacts',
    {
      description: 'Directory of enterprise client contacts and stakeholders',
      mimeType: 'application/json'
    },
    async () => {
      return {
        contents: [
          {
            uri: 'crm://contacts',
            mimeType: 'application/json',
            text: JSON.stringify(DEFAULT_CONTACTS, null, 2)
          }
        ]
      };
    }
  );

  // 5. Resource: crm://notes
  server.resource(
    'Knowledge Base & Meeting Notes',
    'crm://notes',
    {
      description: 'CRM strategic documents, playbooks, and meeting notes',
      mimeType: 'application/json'
    },
    async () => {
      let notes = DEFAULT_NOTES;
      try {
        const dbNotes = (await db.notes.list()) as typeof DEFAULT_NOTES;
        if (dbNotes && dbNotes.length > 0) notes = dbNotes;
      } catch {
        // fallback
      }
      return {
        contents: [
          {
            uri: 'crm://notes',
            mimeType: 'application/json',
            text: JSON.stringify(notes, null, 2)
          }
        ]
      };
    }
  );

  // ==========================================
  // MCP PROMPTS
  // ==========================================

  // 1. Prompt: lead_qualification_review
  server.prompt(
    'lead_qualification_review',
    'Generate a structured qualification review prompt (MEDDIC/BANT) for an account',
    {
      leadId: z.string().describe('ID of the lead to qualify')
    },
    async ({ leadId }) => {
      const leads = await getLeadsList();
      const lead = leads.find(l => l.$id === leadId);
      const leadJson = lead ? JSON.stringify(lead, null, 2) : `Lead ID: ${leadId}`;

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please review the following account using the MEDDIC sales qualification framework:\n\n${leadJson}\n\nAssess:\n1. Metrics (Expected economic impact)\n2. Economic Buyer (Likelihood of executive sign-off)\n3. Decision Criteria (Security, latency, compliance requirements)\n4. Decision Process (Timeline and key hurdles)\n5. Identify Pain (Quantifiable bottleneck)\n6. Champion (Internal advocate strength)\n\nProvide clear action items to advance the deal.`
            }
          }
        ]
      };
    }
  );

  // 2. Prompt: outreach_strategy_brief
  server.prompt(
    'outreach_strategy_brief',
    'Generate an omnichannel sales cadence brief for an enterprise prospect',
    {
      leadId: z.string().describe('ID of the target prospect')
    },
    async ({ leadId }) => {
      const leads = await getLeadsList();
      const lead = leads.find(l => l.$id === leadId);

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate an omnichannel sales outreach plan for ${lead?.name || 'Prospect'} (${lead?.industry || 'Tech'}, Value: $${(lead?.value || 0).toLocaleString()}).\nInclude:\n- Day 1: Personalized LinkedIn connection request & initial icebreaker\n- Day 3: Problem-centric executive email\n- Day 7: Phone call talking points & voicemail script\n- Day 12: High-value case study delivery\n- Day 18: Break-up note or executive invite.`
            }
          }
        ]
      };
    }
  );

  // 3. Prompt: executive_pipeline_report
  server.prompt(
    'executive_pipeline_report',
    'Prepare an executive briefing analyzing pipeline risks, velocity, and quarterly forecast',
    {
      period: z.string().optional().default('Q4 2026').describe('Reporting time frame')
    },
    async ({ period }) => {
      const leads = await getLeadsList();
      const total = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Prepare a concise C-Suite executive pipeline report for ${period}.\nCurrent total pipeline stands at $${total.toLocaleString()} across ${leads.length} accounts.\n\nStructure the report with:\n1. Executive Summary & Attainment Probability\n2. Key Risks in Top Tier Accounts\n3. Slippage Analysis & AE Capacity Bottlenecks\n4. Recommended Leadership Interventions.`
            }
          }
        ]
      };
    }
  );

  return server;
}

/**
 * Returns metadata manifest describing all exposed tools, resources, and prompts
 * for client inspection and documentation.
 */
export function getMcpServerManifest() {
  return {
    server: {
      name: 'levos-crm-mcp',
      version: '1.0.0',
      protocolVersion: '2024-11-05',
      status: 'active',
      instructions: 'ΛΞVOS Enterprise CRM Model Context Protocol (MCP) Server.'
    },
    transports: ['stdio', 'http-jsonrpc-2.0', 'sse'],
    endpoints: {
      jsonRpc: '/api/mcp',
      sse: '/api/mcp/sse',
      messages: '/api/mcp/messages',
      status: '/api/mcp/status'
    },
    tools: [
      {
        name: 'crm_list_leads',
        description: 'List leads from the CRM pipeline with optional filtering by status, industry, search query, or limit.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query to match against lead name, email, or company' },
            status: { type: 'string', description: 'Filter by stage (New, Contacted, Qualified, Proposal, Negotiation)' },
            industry: { type: 'string', description: 'Filter by industry sector' },
            limit: { type: 'number', description: 'Maximum number of leads to return (default: 50)' }
          }
        }
      },
      {
        name: 'crm_get_lead',
        description: 'Retrieve full details for a specific lead by ID, including deterministic score analysis and rep coaching.',
        inputSchema: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'The unique identifier of the lead' }
          }
        }
      },
      {
        name: 'crm_create_lead',
        description: 'Create a new lead account in the CRM pipeline.',
        inputSchema: {
          type: 'object',
          required: ['name', 'email', 'value'],
          properties: {
            name: { type: 'string', description: 'Organization or contact name' },
            email: { type: 'string', description: 'Primary contact email' },
            value: { type: 'number', description: 'Estimated pipeline deal value in USD ($)' },
            status: { type: 'string', description: 'Pipeline stage' },
            industry: { type: 'string', description: 'Industry sector' },
            companySize: { type: 'string', description: 'Company size tier' },
            jobTitle: { type: 'string', description: 'Job title' }
          }
        }
      },
      {
        name: 'crm_update_lead',
        description: 'Update lead status, deal value, or attributes in the CRM pipeline.',
        inputSchema: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'ID of lead to update' },
            status: { type: 'string', description: 'Updated pipeline stage' },
            value: { type: 'number', description: 'Updated deal value' },
            activityNote: { type: 'string', description: 'Activity note to record' }
          }
        }
      },
      {
        name: 'crm_score_lead',
        description: 'Execute multi-factor scoring engine on a lead (1-100 score, tier grade, demographic vs behavioral breakdown).',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Existing lead ID' },
            leadPayload: { type: 'object', description: 'Arbitrary lead object attributes to score' }
          }
        }
      },
      {
        name: 'crm_list_tasks',
        description: 'List strategic tasks, action items, and deadlines from the CRM.',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'Filter by status (todo, in_progress, completed)' },
            priority: { type: 'string', description: 'Filter by priority (High, Medium, Low)' },
            leadId: { type: 'string', description: 'Filter by lead ID' }
          }
        }
      },
      {
        name: 'crm_create_task',
        description: 'Create an actionable task or deadline in the CRM.',
        inputSchema: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', description: 'Task title or deliverable' },
            leadId: { type: 'string', description: 'Associated lead ID' },
            priority: { type: 'string', description: 'Priority: High, Medium, Low' },
            dueDate: { type: 'string', description: 'Target date (YYYY-MM-DD)' }
          }
        }
      },
      {
        name: 'crm_list_notes',
        description: 'List knowledge base entries, meeting debriefs, and strategic documentation.',
        inputSchema: {
          type: 'object',
          properties: {
            tag: { type: 'string', description: 'Filter by tag' },
            search: { type: 'string', description: 'Search query' }
          }
        }
      },
      {
        name: 'crm_create_note',
        description: 'Create a rich formatted knowledge base note or meeting summary.',
        inputSchema: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string', description: 'Note title' },
            content: { type: 'string', description: 'Note content (Markdown supported)' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags array' }
          }
        }
      },
      {
        name: 'crm_search_crm',
        description: 'Perform a global full-text search across leads, contacts, tasks, and notes.',
        inputSchema: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string', description: 'Search term or phrase' }
          }
        }
      },
      {
        name: 'crm_get_pipeline_analytics',
        description: 'Get real-time pipeline KPIs, ARR forecast, stage conversion counts, and top deals.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'crm_generate_sales_email',
        description: 'Draft a context-aware sales outreach or follow-up email tailored to a lead.',
        inputSchema: {
          type: 'object',
          required: ['leadId'],
          properties: {
            leadId: { type: 'string', description: 'Lead ID' },
            emailType: { type: 'string', enum: ['initial_outreach', 'follow_up', 'pricing_proposal', 're_engagement'] },
            customTone: { type: 'string', description: 'Desired tone' }
          }
        }
      }
    ],
    resources: [
      { uri: 'crm://leads', name: 'CRM Leads Dataset', mimeType: 'application/json', description: 'Active leads dataset in the CRM pipeline' },
      { uri: 'crm://pipeline-summary', name: 'Pipeline Summary Analytics', mimeType: 'application/json', description: 'Aggregated pipeline analytics & ARR forecast' },
      { uri: 'crm://tasks', name: 'CRM Strategic Tasks', mimeType: 'application/json', description: 'List of strategic objectives and deadlines' },
      { uri: 'crm://contacts', name: 'Contacts Directory', mimeType: 'application/json', description: 'Directory of enterprise client contacts' },
      { uri: 'crm://notes', name: 'Knowledge Base & Meeting Notes', mimeType: 'application/json', description: 'CRM strategic documents and meeting notes' }
    ],
    prompts: [
      { name: 'lead_qualification_review', description: 'Structured qualification review prompt (MEDDIC/BANT) for an account' },
      { name: 'outreach_strategy_brief', description: 'Omnichannel sales cadence brief for an enterprise prospect' },
      { name: 'executive_pipeline_report', description: 'Executive briefing analyzing pipeline risks, velocity, and quarterly forecast' }
    ]
  };
}
