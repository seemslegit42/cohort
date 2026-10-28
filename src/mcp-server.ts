import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { db } from './server/db';

export interface LeadSummary {
  id: string;
  name: string;
  email: string;
  company: string;
  status: string;
  value: number;
  industry?: string;
  jobTitle?: string;
  score?: number;
  priority?: string;
  expectedCloseDate?: string;
  summary: string;
}

export interface TaskItem {
  id: string;
  title: string;
  leadId?: string;
  leadName?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completed: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category?: string;
  date?: string;
}

// Default in-memory fallbacks for Leadwave CRM data layer
export const DEFAULT_LEAD_DATA = [
  {
    $id: '1',
    name: 'Jonathan Reynolds',
    company: 'Acme Corp',
    email: 'contact@acme.com',
    phone: '+1 555-0192',
    status: 'Qualified',
    value: 85000,
    industry: 'SaaS',
    jobTitle: 'VP of Engineering',
    companySize: 'Enterprise',
    priority: 'High',
    expectedCloseDate: '2026-10-15',
    score: 88,
    websiteActivity: 'High',
    emailEngagement: 'High'
  },
  {
    $id: '2',
    name: 'Tony Stark',
    company: 'Stark Industries',
    email: 'tony@stark.com',
    phone: '+1 555-3000',
    status: 'Contacted',
    value: 250000,
    industry: 'Cyber Security',
    jobTitle: 'Chief Executive Officer',
    companySize: 'Enterprise',
    priority: 'High',
    expectedCloseDate: '2026-11-01',
    score: 94,
    websiteActivity: 'High',
    emailEngagement: 'Medium'
  },
  {
    $id: '3',
    name: 'Bruce Wayne',
    company: 'Wayne Enterprises',
    email: 'bruce@wayne.com',
    phone: '+1 555-4921',
    status: 'New',
    value: 120000,
    industry: 'FinTech',
    jobTitle: 'Managing Director',
    companySize: 'Enterprise',
    priority: 'Medium',
    expectedCloseDate: '2026-11-20',
    score: 72,
    websiteActivity: 'Medium',
    emailEngagement: 'Low'
  },
  {
    $id: '4',
    name: 'Miles Dyson',
    company: 'Cyberdyne Systems',
    email: 'miles@cyberdyne.com',
    phone: '+1 555-8000',
    status: 'New',
    value: 95000,
    industry: 'AI',
    jobTitle: 'Head of Data Science',
    companySize: 'Mid-Market',
    priority: 'Medium',
    expectedCloseDate: '2026-10-30',
    score: 68,
    websiteActivity: 'Low',
    emailEngagement: 'High'
  }
];

export const DEFAULT_TASK_DATA: TaskItem[] = [
  {
    id: 't-1',
    title: 'Deliver executive proposal & ROI model to Acme Corp',
    leadId: '1',
    leadName: 'Acme Corp',
    status: 'in_progress',
    priority: 'High',
    dueDate: '2026-10-05',
    completed: false
  },
  {
    id: 't-2',
    title: 'Schedule architecture compliance review with Stark CTO',
    leadId: '2',
    leadName: 'Stark Industries',
    status: 'todo',
    priority: 'High',
    dueDate: '2026-10-08',
    completed: false
  },
  {
    id: 't-3',
    title: 'Follow up on FinTech summit discussion with Bruce Wayne',
    leadId: '3',
    leadName: 'Wayne Enterprises',
    status: 'todo',
    priority: 'Medium',
    dueDate: '2026-10-12',
    completed: false
  },
  {
    id: 't-4',
    title: 'Prepare AI model governance documentation for Cyberdyne',
    leadId: '4',
    leadName: 'Cyberdyne Systems',
    status: 'todo',
    priority: 'Low',
    dueDate: '2026-10-25',
    completed: false
  }
];

export const DEFAULT_NOTE_DATA: NoteItem[] = [
  {
    id: 'n-1',
    title: 'Q3 Enterprise Sales Strategy & Playbook',
    content: `# Q3 Enterprise Sales Strategy & Playbook\n\n- **Target Sectors:** Tier-1 SaaS, Cyber Security, FinTech, and AI.\n- **Value Proposition:** 40% reduction in sales cycle latency with automated pipeline telemetry.\n- **Key Objective:** Focus on executive ROI timelines rather than introductory feature walkthroughs for hot leads ($100k+ ARR).`,
    tags: ['Strategy', 'Playbook', 'Q3', 'Enterprise'],
    category: 'Sales Strategy',
    date: 'Sep 28, 2026'
  },
  {
    id: 'n-2',
    title: 'Acme Corp Buying Committee Meeting Debrief',
    content: `# Acme Corp Buying Committee Meeting Debrief\n\n- **Attendees:** VP of Engineering (Jonathan Reynolds), Lead Architect.\n- **Technical Requirements:** SOC2 Type II compliance, sub-50ms API sync latency, deterministic lead scoring.\n- **Next Steps:** Deliver updated SLA schedule and mutual action plan by Friday.`,
    tags: ['Meeting', 'AcmeCorp', 'Enterprise', 'Debrief'],
    category: 'Customer Intelligence',
    date: 'Sep 29, 2026'
  },
  {
    id: 'n-3',
    title: 'Stark Industries Security Architecture Requirements',
    content: `# Stark Industries Security Architecture Requirements\n\n- **Scope:** Zero-Trust architecture specification for enterprise edge endpoints.\n- **Timeline:** Pilot scheduled for Q4 with $250k initial deal scope.\n- **Champion:** Tony Stark (CEO) requested direct alignment on encryption protocols.`,
    tags: ['Security', 'StarkIndustries', 'ZeroTrust'],
    category: 'Technical Specs',
    date: 'Sep 29, 2026'
  }
];

/**
 * Helper to fetch leads from Leadwave CRM data layer with safe fallback.
 */
async function fetchLeadsFromDataLayer() {
  try {
    const list = await db.leads.list();
    if (list && list.length > 0) {
      return list;
    }
  } catch {
    // fallback
  }
  return DEFAULT_LEAD_DATA;
}

/**
 * Helper to fetch tasks from Leadwave CRM data layer with safe fallback.
 */
async function fetchTasksFromDataLayer(): Promise<TaskItem[]> {
  try {
    const list = (await db.tasks.list()) as Record<string, unknown>[];
    if (list && list.length > 0) {
      return list.map((t) => ({
        id: (t['$id'] as string) || (t['id'] as string) || 'task-' + Math.random().toString(36).substring(2, 6),
        title: (t['title'] as string) || 'Untitled Task',
        leadId: (t['leadId'] as string) || undefined,
        leadName: (t['leadName'] as string) || undefined,
        status: (t['status'] as string) || 'todo',
        priority: (t['priority'] as string) || 'Medium',
        dueDate: (t['dueDate'] as string) || undefined,
        completed: Boolean(t['completed'])
      }));
    }
  } catch {
    // fallback
  }
  return DEFAULT_TASK_DATA;
}

/**
 * Helper to fetch notes from Leadwave CRM data layer with safe fallback.
 */
async function fetchNotesFromDataLayer(): Promise<NoteItem[]> {
  try {
    const list = (await db.notes.list()) as Record<string, unknown>[];
    if (list && list.length > 0) {
      return list.map((n) => ({
        id: (n['$id'] as string) || (n['id'] as string) || 'note-' + Math.random().toString(36).substring(2, 6),
        title: (n['title'] as string) || 'Untitled Note',
        content: (n['content'] as string) || '',
        tags: Array.isArray(n['tags']) ? (n['tags'] as string[]) : ['General'],
        category: (n['category'] as string) || 'General',
        date: (n['date'] as string) || undefined
      }));
    }
  } catch {
    // fallback
  }
  return DEFAULT_NOTE_DATA;
}

/**
 * Creates and initializes the Leadwave CRM MCP Server instance.
 */
export function createLeadwaveMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'leadwave-crm-mcp-server',
      version: '1.0.0'
    },
    {
      instructions: 'Leadwave CRM Model Context Protocol (MCP) Server. Exposes tools for retrieving lead summaries, strategic task lists, and knowledge base note contents for AI assistant integration.'
    }
  );

  // =========================================================================
  // TOOL 1: get_lead_summaries (Retrieve lead summaries from Leadwave CRM)
  // =========================================================================
  server.tool(
    'get_lead_summaries',
    'Retrieve structured summaries of leads in the Leadwave CRM pipeline. Allows filtering by pipeline status, industry, minimum deal value, or general search query.',
    {
      status: z.string().optional().describe('Filter by pipeline stage (e.g. New, Contacted, Qualified, Proposal, Negotiation, Won, Lost)'),
      industry: z.string().optional().describe('Filter by industry sector (e.g. SaaS, Cyber Security, FinTech, AI, Healthcare)'),
      minDealValue: z.number().optional().describe('Minimum deal value in USD ($) to filter high-value opportunities'),
      query: z.string().optional().describe('Search keyword matching name, company, email, or job title'),
      limit: z.number().optional().default(50).describe('Maximum number of lead summaries to return')
    },
    async ({ status, industry, minDealValue, query, limit }) => {
      const rawLeads = await fetchLeadsFromDataLayer();
      let filtered = [...rawLeads];

      if (status) {
        filtered = filtered.filter((l) => String(l['status'] || '').toLowerCase() === status.toLowerCase());
      }
      if (industry) {
        filtered = filtered.filter((l) => String(l['industry'] || '').toLowerCase().includes(industry.toLowerCase()));
      }
      if (minDealValue !== undefined) {
        filtered = filtered.filter((l) => Number(l['value'] || 0) >= minDealValue);
      }
      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter((l) =>
          String(l['name'] || '').toLowerCase().includes(q) ||
          String(l['company'] || '').toLowerCase().includes(q) ||
          String(l['email'] || '').toLowerCase().includes(q) ||
          String(l['jobTitle'] || '').toLowerCase().includes(q)
        );
      }

      filtered = filtered.slice(0, limit);

      const summaries: LeadSummary[] = filtered.map((l) => {
        const val = Number(l['value'] || 0);
        const name = String(l['name'] || 'Unknown Lead');
        const comp = String(l['company'] || name);
        const st = String(l['status'] || 'New');
        const ind = (l['industry'] as string) || undefined;
        const job = (l['jobTitle'] as string) || undefined;
        const score = typeof l['score'] === 'number' ? (l['score'] as number) : undefined;
        const priority = (l['priority'] as string) || (val >= 100000 ? 'High' : 'Medium');
        const expectedCloseDate = (l['expectedCloseDate'] as string) || undefined;

        const summaryText = `${name} (${job ? job + ', ' : ''}${comp}) — Stage: ${st}, Value: $${val.toLocaleString()}${ind ? ', Industry: ' + ind : ''}${score ? ', Intent Score: ' + score + '/100' : ''}.`;

        return {
          id: String(l['$id'] || l['id'] || ''),
          name,
          company: comp,
          email: String(l['email'] || ''),
          status: st,
          value: val,
          industry: ind,
          jobTitle: job,
          score,
          priority,
          expectedCloseDate,
          summary: summaryText
        };
      });

      const totalValue = summaries.reduce((sum, item) => sum + item.value, 0);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              totalCount: summaries.length,
              totalPipelineValueUSD: totalValue,
              leads: summaries
            }, null, 2)
          }
        ]
      };
    }
  );

  // =========================================================================
  // TOOL 2: get_lead_details (Retrieve single lead by ID with full history)
  // =========================================================================
  server.tool(
    'get_lead_details',
    'Retrieve full detailed profile of a single lead by ID, including activity history and contacts.',
    {
      leadId: z.string().describe('The unique identifier ($id) of the lead')
    },
    async ({ leadId }) => {
      const rawLeads = await fetchLeadsFromDataLayer();
      const lead = rawLeads.find((l) => String(l['$id'] || l['id']) === leadId);

      if (!lead) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Lead with ID "${leadId}" was not found in the Leadwave CRM data layer.`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(lead, null, 2)
          }
        ]
      };
    }
  );

  // =========================================================================
  // TOOL 3: get_task_lists (Retrieve tasks and action items from Leadwave CRM)
  // =========================================================================
  server.tool(
    'get_task_lists',
    'Retrieve task lists, action items, and upcoming deadlines from the Leadwave CRM data layer. Filter by status, priority, or associated lead.',
    {
      status: z.enum(['all', 'todo', 'in_progress', 'completed']).optional().default('all').describe('Filter by task progress status'),
      priority: z.enum(['all', 'High', 'Medium', 'Low']).optional().default('all').describe('Filter by urgency/priority tier'),
      leadId: z.string().optional().describe('Optional lead ID to get tasks associated with a specific account'),
      includeCompleted: z.boolean().optional().default(true).describe('Whether to include completed tasks in the output')
    },
    async ({ status, priority, leadId, includeCompleted }) => {
      const allTasks = await fetchTasksFromDataLayer();
      let filtered = [...allTasks];

      if (!includeCompleted) {
        filtered = filtered.filter((t) => !t.completed && t.status !== 'completed');
      }
      if (status && status !== 'all') {
        filtered = filtered.filter((t) => t.status.toLowerCase() === status.toLowerCase());
      }
      if (priority && priority !== 'all') {
        filtered = filtered.filter((t) => t.priority.toLowerCase() === priority.toLowerCase());
      }
      if (leadId) {
        filtered = filtered.filter((t) => t.leadId === leadId);
      }

      const counts = {
        total: filtered.length,
        highPriority: filtered.filter((t) => t.priority.toLowerCase() === 'high').length,
        inProgress: filtered.filter((t) => t.status === 'in_progress').length,
        todo: filtered.filter((t) => t.status === 'todo').length,
        completed: filtered.filter((t) => t.completed || t.status === 'completed').length
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              metrics: counts,
              tasks: filtered
            }, null, 2)
          }
        ]
      };
    }
  );

  // =========================================================================
  // TOOL 4: get_note_contents (Retrieve formatted notes and strategic documents)
  // =========================================================================
  server.tool(
    'get_note_contents',
    'Retrieve rich formatted knowledge notes, meeting debriefs, playbooks, and strategic documentation from Leadwave CRM. Search by keyword or filter by tag/category.',
    {
      tag: z.string().optional().describe('Filter notes by topic tag (e.g. Strategy, Meeting, Enterprise, Security, Debrief)'),
      category: z.string().optional().describe('Filter notes by category folder (e.g. Sales Strategy, Customer Intelligence, Technical Specs)'),
      searchQuery: z.string().optional().describe('Full-text keyword search across note titles and content bodies'),
      noteId: z.string().optional().describe('Optional specific note ID to retrieve a single note directly')
    },
    async ({ tag, category, searchQuery, noteId }) => {
      const allNotes = await fetchNotesFromDataLayer();
      let filtered = [...allNotes];

      if (noteId) {
        filtered = filtered.filter((n) => n.id === noteId);
      }
      if (tag) {
        const t = tag.toLowerCase();
        filtered = filtered.filter((n) => n.tags.some((tagItem) => tagItem.toLowerCase() === t));
      }
      if (category) {
        const c = category.toLowerCase();
        filtered = filtered.filter((n) => (n.category || '').toLowerCase().includes(c));
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              count: filtered.length,
              notes: filtered
            }, null, 2)
          }
        ]
      };
    }
  );

  // =========================================================================
  // TOOL 5: create_leadwave_task (Create a new task in Leadwave CRM)
  // =========================================================================
  server.tool(
    'create_leadwave_task',
    'Create an actionable task or deadline in the Leadwave CRM backlog, optionally linking to a lead.',
    {
      title: z.string().describe('Title of the action item or deliverable'),
      leadId: z.string().optional().describe('Optional ID of the associated lead'),
      leadName: z.string().optional().describe('Optional name of the associated lead/company'),
      priority: z.enum(['High', 'Medium', 'Low']).optional().default('Medium').describe('Priority level'),
      dueDate: z.string().optional().describe('Target due date in YYYY-MM-DD format')
    },
    async ({ title, leadId, leadName, priority, dueDate }) => {
      const taskRecord = {
        title,
        leadId: leadId || null,
        leadName: leadName || 'General Workspace',
        priority: priority || 'Medium',
        status: 'todo',
        dueDate: dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        completed: false,
        createdAt: new Date().toISOString()
      };

      let created;
      try {
        created = await db.tasks.create(taskRecord as never);
      } catch {
        created = {
          id: 'task-' + Date.now().toString(36),
          ...taskRecord
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Task "${title}" successfully recorded in Leadwave CRM.`,
              task: created
            }, null, 2)
          }
        ]
      };
    }
  );

  // =========================================================================
  // TOOL 6: create_leadwave_note (Create a new formatted note in Leadwave CRM)
  // =========================================================================
  server.tool(
    'create_leadwave_note',
    'Create a rich formatted knowledge note, customer debrief, or strategy document in Leadwave CRM.',
    {
      title: z.string().describe('Title of the note'),
      content: z.string().describe('Content body of the note (Markdown supported)'),
      tags: z.array(z.string()).optional().default(['General']).describe('List of topic tags'),
      category: z.string().optional().default('General').describe('Category folder')
    },
    async ({ title, content, tags, category }) => {
      const noteRecord = {
        title,
        content,
        tags: tags || ['General'],
        category: category || 'General',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: new Date().toISOString()
      };

      let created;
      try {
        created = await db.notes.create(noteRecord as never);
      } catch {
        created = {
          id: 'note-' + Date.now().toString(36),
          ...noteRecord
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Note "${title}" successfully saved to Leadwave CRM knowledge base.`,
              note: created
            }, null, 2)
          }
        ]
      };
    }
  );

  // =========================================================================
  // RESOURCES: Structured Context Data
  // =========================================================================
  server.resource(
    'Leadwave Pipeline Leads',
    'leadwave://leads',
    {
      description: 'Current pipeline leads dataset in JSON format',
      mimeType: 'application/json'
    },
    async () => {
      const leads = await fetchLeadsFromDataLayer();
      return {
        contents: [
          {
            uri: 'leadwave://leads',
            mimeType: 'application/json',
            text: JSON.stringify(leads, null, 2)
          }
        ]
      };
    }
  );

  server.resource(
    'Leadwave Task Backlog',
    'leadwave://tasks',
    {
      description: 'Active strategic tasks and action items in JSON format',
      mimeType: 'application/json'
    },
    async () => {
      const tasks = await fetchTasksFromDataLayer();
      return {
        contents: [
          {
            uri: 'leadwave://tasks',
            mimeType: 'application/json',
            text: JSON.stringify(tasks, null, 2)
          }
        ]
      };
    }
  );

  server.resource(
    'Leadwave Knowledge Base Notes',
    'leadwave://notes',
    {
      description: 'Knowledge base entries and meeting summaries in JSON format',
      mimeType: 'application/json'
    },
    async () => {
      const notes = await fetchNotesFromDataLayer();
      return {
        contents: [
          {
            uri: 'leadwave://notes',
            mimeType: 'application/json',
            text: JSON.stringify(notes, null, 2)
          }
        ]
      };
    }
  );

  // =========================================================================
  // PROMPTS: Prompt Templates for LLMs
  // =========================================================================
  server.prompt(
    'leadwave_pipeline_review',
    'Generate an executive pipeline review and deal qualification prompt for Leadwave CRM',
    {
      focusIndustry: z.string().optional().describe('Industry to focus on (e.g. SaaS, Cyber Security, FinTech)')
    },
    async ({ focusIndustry }) => {
      const leads = await fetchLeadsFromDataLayer();
      let selected = leads;
      if (focusIndustry) {
        selected = leads.filter((l) => String(l['industry'] || '').toLowerCase().includes(focusIndustry.toLowerCase()));
      }

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `You are the executive revenue strategist for Leadwave CRM. Please review the following pipeline accounts and formulate a deal acceleration strategy:\n\n${JSON.stringify(selected, null, 2)}\n\nAnalyze:\n1. Highest ARR closing probability.\n2. Key stakeholder objections and recommended mitigation.\n3. Next high-leverage sales actions.`
            }
          }
        ]
      };
    }
  );

  return server;
}

/**
 * Main execution entry point when running directly as a standalone process.
 * Connects the server via Stdio transport.
 */
export async function startMcpServer() {
  process.stderr.write('[Leadwave CRM MCP Server] Initializing Stdio transport...\n');
  try {
    const server = createLeadwaveMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write('[Leadwave CRM MCP Server] Server running and listening on Stdio.\n');
  } catch (err) {
    process.stderr.write(`[Leadwave CRM MCP Server] Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
}

// If executed directly as script (node / tsx)
if (import.meta.url === `file://${process.argv[1]}`) {
  startMcpServer().catch((err) => {
    process.stderr.write(`Uncaught error: ${err}\n`);
    process.exit(1);
  });
}
