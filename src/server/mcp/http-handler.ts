/* eslint-disable @typescript-eslint/no-unused-vars, no-empty */
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import {
  getMcpServerManifest,
  calculateMcpLeadScore,
  getLeadsList,
  DEFAULT_LEADS,
  DEFAULT_CONTACTS,
  DEFAULT_TASKS,
  DEFAULT_NOTES,
  LeadRecord
} from './crm-mcp';
import { db } from '../db';
import { GoogleGenAI } from '@google/genai';

const aiApiKey = process.env['GEMINI_API_KEY'];
let aiClient: GoogleGenAI | null = null;
if (aiApiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: aiApiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build-mcp' } }
    });
  } catch (err) {
    console.error('[MCP HTTP] Failed to initialize GoogleGenAI client:', err);
  }
}

// In-memory active SSE sessions
interface SseSession {
  id: string;
  res: Response;
  createdAt: number;
}
const sseSessions = new Map<string, SseSession>();

// Cleanup stale sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sseSessions.entries()) {
    if (now - session.createdAt > 3600000) {
      try { session.res.end(); } catch {}
      sseSessions.delete(id);
    }
  }
}, 600000);

/**
 * Dispatches a single MCP JSON-RPC 2.0 message and returns the JSON-RPC response.
 */
export async function executeMcpJsonRpc(body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const { jsonrpc = '2.0', id, method, params } = body;
  const manifest = getMcpServerManifest();

  // Notifications (requests without id)
  if (id === undefined || id === null) {
    if (method === 'notifications/initialized') {
      return null;
    }
    return null;
  }

  const success = (result: unknown) => ({ jsonrpc, id, result });
  const error = (code: number, message: string, data?: unknown) => ({
    jsonrpc,
    id,
    error: { code, message, data }
  });

  try {
    switch (method) {
      case 'initialize': {
        return success({
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
            prompts: { listChanged: false },
            logging: {}
          },
          serverInfo: {
            name: manifest.server.name,
            version: manifest.server.version
          },
          instructions: manifest.server.instructions
        });
      }

      case 'ping': {
        return success({});
      }

      // TOOLS
      case 'tools/list': {
        return success({
          tools: manifest.tools
        });
      }

      case 'tools/call': {
        const p = (params || {}) as { name?: string; arguments?: Record<string, unknown> };
        const toolName = p.name;
        const args = p.arguments || {};

        if (!toolName) {
          return error(-32602, 'Missing required param "name" in tools/call');
        }

        const toolResult = await handleToolExecution(toolName, args);
        return success(toolResult);
      }

      // RESOURCES
      case 'resources/list': {
        return success({
          resources: manifest.resources
        });
      }

      case 'resources/read': {
        const p = (params || {}) as { uri?: string };
        if (!p.uri) {
          return error(-32602, 'Missing required param "uri" in resources/read');
        }
        const resourceResult = await handleResourceRead(p.uri);
        return success(resourceResult);
      }

      // PROMPTS
      case 'prompts/list': {
        return success({
          prompts: manifest.prompts
        });
      }

      case 'prompts/get': {
        const p = (params || {}) as { name?: string; arguments?: Record<string, string> };
        if (!p.name) {
          return error(-32602, 'Missing required param "name" in prompts/get');
        }
        const promptResult = await handlePromptGet(p.name, p.arguments || {});
        return success(promptResult);
      }

      default: {
        return error(-32601, `Method "${method}" not found or not supported by ΛΞVOS CRM MCP Server`);
      }
    }
  } catch (err) {
    console.error(`[MCP HTTP] Error handling method ${method}:`, err);
    return error(-32603, err instanceof Error ? err.message : 'Internal MCP server execution error');
  }
}

/**
 * Handles tool calls directly.
 */
async function handleToolExecution(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'crm_list_leads': {
      let leads = await getLeadsList();
      const status = typeof args['status'] === 'string' ? args['status'] : undefined;
      const industry = typeof args['industry'] === 'string' ? args['industry'] : undefined;
      const query = typeof args['query'] === 'string' ? args['query'].toLowerCase() : undefined;
      const limit = typeof args['limit'] === 'number' ? args['limit'] : 50;

      if (status) leads = leads.filter(l => l.status?.toLowerCase() === status.toLowerCase());
      if (industry) leads = leads.filter(l => l.industry?.toLowerCase().includes(industry.toLowerCase()));
      if (query) {
        leads = leads.filter(l =>
          (l.name && l.name.toLowerCase().includes(query)) ||
          (l.email && l.email.toLowerCase().includes(query)) ||
          (l.company && l.company.toLowerCase().includes(query))
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

    case 'crm_get_lead': {
      const id = String(args['id'] || '');
      const leads = await getLeadsList();
      const lead = leads.find(l => l.$id === id);
      if (!lead) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Lead with ID "${id}" was not found.` }]
        };
      }
      const score = calculateMcpLeadScore(lead);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ lead, scoreAnalysis: score }, null, 2)
          }
        ]
      };
    }

    case 'crm_create_lead': {
      const nameVal = String(args['name'] || 'New Lead');
      const emailVal = String(args['email'] || 'contact@example.com');
      const val = Number(args['value'] || 50000);

      const newLead: LeadRecord = {
        name: nameVal,
        email: emailVal,
        value: val,
        status: (args['status'] as string) || 'New',
        industry: (args['industry'] as string) || 'SaaS',
        companySize: (args['companySize'] as string) || 'Mid-Market',
        jobTitle: (args['jobTitle'] as string) || 'VP',
        phone: (args['phone'] as string) || '',
        createdAt: new Date().toISOString(),
        history: [{ type: 'Created via MCP', date: new Date().toLocaleString(), content: 'Created by Model Context Protocol.' }]
      };

      let created: LeadRecord;
      try {
        created = (await db.leads.create(newLead as never)) as LeadRecord;
      } catch {
        newLead.$id = 'mcp-' + Date.now().toString(36);
        created = newLead;
      }
      const score = calculateMcpLeadScore(created);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, message: `Lead "${nameVal}" created.`, lead: created, score }, null, 2)
          }
        ]
      };
    }

    case 'crm_update_lead': {
      const id = String(args['id'] || '');
      const leads = await getLeadsList();
      const lead = leads.find(l => l.$id === id);
      if (!lead) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Lead with ID "${id}" was not found.` }]
        };
      }
      const updates: Partial<LeadRecord> = {};
      if (args['status'] !== undefined) updates.status = String(args['status']);
      if (args['value'] !== undefined) updates.value = Number(args['value']);
      if (args['industry'] !== undefined) updates.industry = String(args['industry']);
      if (args['jobTitle'] !== undefined) updates.jobTitle = String(args['jobTitle']);
      if (args['activityNote']) {
        updates.history = [
          { type: 'MCP Update', date: new Date().toLocaleString(), content: String(args['activityNote']) },
          ...(lead.history || [])
        ];
      }
      let updated = { ...lead, ...updates };
      try {
        updated = (await db.leads.update(id, updates)) as LeadRecord;
      } catch {
        // memory update
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, lead: updated }, null, 2) }]
      };
    }

    case 'crm_score_lead': {
      const id = args['id'] ? String(args['id']) : undefined;
      const payload = args['leadPayload'] as LeadRecord | undefined;
      let target: LeadRecord | null = null;
      if (id) {
        const leads = await getLeadsList();
        target = leads.find(l => l.$id === id) || null;
      }
      if (!target && payload) target = payload;
      if (!target) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'Specify "id" or "leadPayload" to score.' }]
        };
      }
      const result = calculateMcpLeadScore(target);
      return {
        content: [{ type: 'text', text: JSON.stringify({ leadName: target.name || 'Lead', ...result }, null, 2) }]
      };
    }

    case 'crm_list_tasks': {
      let tasks = DEFAULT_TASKS;
      try {
        const dbTasks = (await db.tasks.list()) as typeof DEFAULT_TASKS;
        if (dbTasks && dbTasks.length > 0) tasks = dbTasks;
      } catch {}
      if (args['status']) tasks = tasks.filter(t => t.status === args['status']);
      if (args['priority']) tasks = tasks.filter(t => t.priority === args['priority']);
      if (args['leadId']) tasks = tasks.filter(t => t.leadId === args['leadId']);
      return {
        content: [{ type: 'text', text: JSON.stringify({ count: tasks.length, tasks }, null, 2) }]
      };
    }

    case 'crm_create_task': {
      const title = String(args['title'] || 'Follow up with lead');
      const task = {
        title,
        leadId: (args['leadId'] as string) || null,
        leadName: (args['leadName'] as string) || 'Workspace',
        priority: (args['priority'] as string) || 'Medium',
        status: 'todo',
        dueDate: (args['dueDate'] as string) || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      let created;
      try {
        created = await db.tasks.create(task as never);
      } catch {
        created = { $id: 'task-' + Date.now().toString(36), ...task };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, task: created }, null, 2) }]
      };
    }

    case 'crm_list_notes': {
      let notes = DEFAULT_NOTES;
      try {
        const dbNotes = (await db.notes.list()) as typeof DEFAULT_NOTES;
        if (dbNotes && dbNotes.length > 0) notes = dbNotes;
      } catch {}
      if (args['tag']) {
        const tag = String(args['tag']).toLowerCase();
        notes = notes.filter(n => n.tags?.some(t => t.toLowerCase() === tag));
      }
      if (args['search']) {
        const q = String(args['search']).toLowerCase();
        notes = notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ count: notes.length, notes }, null, 2) }]
      };
    }

    case 'crm_create_note': {
      const note = {
        title: String(args['title'] || 'Note'),
        content: String(args['content'] || ''),
        tags: Array.isArray(args['tags']) ? (args['tags'] as string[]) : ['General'],
        category: (args['category'] as string) || 'General',
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
        content: [{ type: 'text', text: JSON.stringify({ success: true, note: created }, null, 2) }]
      };
    }

    case 'crm_search_crm': {
      const q = String(args['query'] || '').toLowerCase();
      const leads = (await getLeadsList()).filter(l =>
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.industry && l.industry.toLowerCase().includes(q))
      );
      const contacts = DEFAULT_CONTACTS.filter(c => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q));
      const tasks = DEFAULT_TASKS.filter(t => t.title.toLowerCase().includes(q));
      const notes = DEFAULT_NOTES.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query: q,
              totalResults: leads.length + contacts.length + tasks.length + notes.length,
              leads: leads.map(l => ({ id: l.$id, name: l.name, value: l.value, status: l.status })),
              contacts: contacts.map(c => ({ id: c.$id, name: c.name, company: c.company })),
              tasks: tasks.map(t => ({ id: t.$id, title: t.title })),
              notes: notes.map(n => ({ id: n.$id, title: n.title }))
            }, null, 2)
          }
        ]
      };
    }

    case 'crm_get_pipeline_analytics': {
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
              stageBreakdown: byStage
            }, null, 2)
          }
        ]
      };
    }

    case 'crm_generate_sales_email': {
      const leadId = String(args['leadId'] || '');
      const leads = await getLeadsList();
      const lead = leads.find(l => l.$id === leadId);
      if (!lead) {
        return { isError: true, content: [{ type: 'text', text: `Lead "${leadId}" not found.` }] };
      }
      const emailType = (args['emailType'] as string) || 'initial_outreach';
      const score = calculateMcpLeadScore(lead);

      if (aiClient) {
        try {
          const prompt = `Write a personalized ${emailType} email to:
- Name: ${lead.name}
- Title: ${lead.jobTitle || 'Executive'}
- Industry: ${lead.industry || 'Technology'}
- Deal Value: $${(lead.value || 0).toLocaleString()}
- Score: ${score.score}/100 (${score.category})
Output strictly JSON: {"subject": "...", "body": "...", "strategicRationale": "..."}`;
          const res = await aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });
          return { content: [{ type: 'text', text: res.text || '' }] };
        } catch {}
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              subject: `Accelerating ${lead.name}'s revenue pipeline`,
              body: `Dear ${lead.jobTitle || 'Team'} at ${lead.name},\n\nI wanted to share how enterprise teams are leveraging our CRM to automate pipeline velocity and deal execution.\n\nWould you be open to a brief call next week?\n\nBest regards,\nSales Director`,
              strategicRationale: 'Anchored on industry benchmarks and executive priorities.'
            }, null, 2)
          }
        ]
      };
    }

    default:
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown tool: ${name}` }]
      };
  }
}

/**
 * Handles resource read requests.
 */
async function handleResourceRead(uri: string) {
  switch (uri) {
    case 'crm://leads': {
      const leads = await getLeadsList();
      return {
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(leads, null, 2) }]
      };
    }
    case 'crm://pipeline-summary': {
      const leads = await getLeadsList();
      const total = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ totalPipelineUSD: total, totalAccounts: leads.length, generatedAt: new Date().toISOString() }, null, 2)
          }
        ]
      };
    }
    case 'crm://tasks': {
      let tasks = DEFAULT_TASKS;
      try {
        const dbTasks = (await db.tasks.list()) as typeof DEFAULT_TASKS;
        if (dbTasks && dbTasks.length > 0) tasks = dbTasks;
      } catch {}
      return {
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(tasks, null, 2) }]
      };
    }
    case 'crm://contacts': {
      return {
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(DEFAULT_CONTACTS, null, 2) }]
      };
    }
    case 'crm://notes': {
      let notes = DEFAULT_NOTES;
      try {
        const dbNotes = (await db.notes.list()) as typeof DEFAULT_NOTES;
        if (dbNotes && dbNotes.length > 0) notes = dbNotes;
      } catch {}
      return {
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(notes, null, 2) }]
      };
    }
    default:
      throw new Error(`Resource "${uri}" not found`);
  }
}

/**
 * Handles prompt generation requests.
 */
async function handlePromptGet(name: string, args: Record<string, string>) {
  switch (name) {
    case 'lead_qualification_review': {
      const leadId = args['leadId'] || '1';
      const leads = await getLeadsList();
      const lead = leads.find(l => l.$id === leadId);
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please review this account using the MEDDIC qualification framework:\n\n${JSON.stringify(lead || { id: leadId }, null, 2)}\n\nAssess Metrics, Economic Buyer, Decision Criteria, Decision Process, Pain, and Champion.`
            }
          }
        ]
      };
    }

    case 'outreach_strategy_brief': {
      const leadId = args['leadId'] || '1';
      const leads = await getLeadsList();
      const lead = leads.find(l => l.$id === leadId);
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate an omnichannel sales cadence plan for ${lead?.name || 'Prospect'} (${lead?.industry || 'Tech'}, Value: $${(lead?.value || 0).toLocaleString()}). Include Day 1, Day 3, Day 7, Day 12, and Day 18 touchpoints.`
            }
          }
        ]
      };
    }

    case 'executive_pipeline_report': {
      const period = args['period'] || 'Q4 2026';
      const leads = await getLeadsList();
      const total = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Prepare a C-Suite executive pipeline report for ${period}.\nTotal pipeline: $${total.toLocaleString()} across ${leads.length} accounts.\nProvide: 1. Executive Summary, 2. Key Risks, 3. Slippage Analysis, 4. Recommended Leadership Interventions.`
            }
          }
        ]
      };
    }

    default:
      throw new Error(`Prompt template "${name}" not found`);
  }
}

// ==========================================
// EXPRESS ROUTE HANDLERS
// ==========================================

/**
 * POST /api/mcp - Standard HTTP JSON-RPC 2.0 endpoint for single or batched calls.
 */
export async function handleMcpPost(req: Request, res: Response): Promise<void> {
  const body = req.body;
  if (!body) {
    res.status(400).json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: empty request body' } });
    return;
  }

  // Handle batch requests
  if (Array.isArray(body)) {
    const responses = (await Promise.all(body.map(item => executeMcpJsonRpc(item)))).filter(Boolean);
    res.json(responses);
    return;
  }

  const response = await executeMcpJsonRpc(body);
  if (response === null) {
    res.status(204).send();
    return;
  }
  res.json(response);
}

/**
 * GET /api/mcp/status - Server info, manifest, and setup snippets.
 */
export function handleMcpStatus(req: Request, res: Response): void {
  const manifest = getMcpServerManifest();
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const baseUrl = `${protocol}://${host}`;

  res.json({
    ...manifest,
    serverUrl: baseUrl,
    activeSseConnections: sseSessions.size,
    uptimeSeconds: Math.round(process.uptime()),
    clientConfigurations: {
      claudeDesktop: {
        mcpServers: {
          'levos-crm': {
            command: 'npx',
            args: ['-y', 'tsx', `${process.cwd()}/scripts/mcp-server.ts`]
          }
        }
      },
      claudeDesktopRemoteSse: {
        mcpServers: {
          'levos-crm-remote': {
            url: `${baseUrl}/api/mcp/sse`
          }
        }
      },
      cursor: {
        name: 'levos-crm',
        type: 'command',
        command: `npx tsx ${process.cwd()}/scripts/mcp-server.ts`
      },
      curlExample: `curl -X POST ${baseUrl}/api/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"crm_list_leads","arguments":{"limit":5}}}'`
    }
  });
}

/**
 * GET /api/mcp/sse - Opens a Server-Sent Events stream for MCP SSE clients.
 */
export function handleMcpSse(req: Request, res: Response): void {
  const sessionId = randomUUID();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Immediately send initial endpoint event telling the client where to post messages
  const endpointUrl = `/api/mcp/messages?sessionId=${sessionId}`;
  res.write(`event: endpoint\ndata: ${endpointUrl}\n\n`);

  sseSessions.set(sessionId, { id: sessionId, res, createdAt: Date.now() });

  req.on('close', () => {
    sseSessions.delete(sessionId);
  });
}

/**
 * POST /api/mcp/messages - Handles client messages for active SSE sessions.
 */
export async function handleMcpSseMessage(req: Request, res: Response): Promise<void> {
  const sessionId = (req.query['sessionId'] as string) || (req.headers['x-session-id'] as string);
  const session = sessionId ? sseSessions.get(sessionId) : null;

  const result = await executeMcpJsonRpc(req.body);

  if (session && result) {
    session.res.write(`event: message\ndata: ${JSON.stringify(result)}\n\n`);
  }

  // Acknowledge the POST request per MCP SSE spec
  res.status(202).json({ accepted: true, sessionId });
}
