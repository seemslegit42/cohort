import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { db } from './server/db';
import { GoogleGenAI } from '@google/genai';
import { DEFAULT_AGENT_TENANT, recordAgentTool } from './server/agentfs';
import * as turso from './server/turso';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json());

// Performance Telemetry & Security Headers Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  next();
});

// In-Memory Performance Cache for High-Frequency AI & Data Operations (TTL: 60 seconds)
interface CacheEntry<T> {
  data: T;
  expires: number;
}
const apiCache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    apiCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setToCache<T>(key: string, data: T, ttlSeconds = 60): void {
  // Guard cache size
  if (apiCache.size > 200) {
    const oldestKey = apiCache.keys().next().value;
    if (oldestKey) apiCache.delete(oldestKey);
  }
  apiCache.set(key, {
    data,
    expires: Date.now() + ttlSeconds * 1000,
  });
}

// Initialize Google Gen AI client with User-Agent and key
const aiApiKey = process.env['GEMINI_API_KEY'];
let ai: GoogleGenAI | null = null;
if (aiApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: aiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    console.log('[lxv server] GoogleGenAI successfully initialized.');
  } catch (err) {
    console.error('[lxv server] Failed to initialize GoogleGenAI client:', err);
  }
} else {
  console.warn('[lxv server] GEMINI_API_KEY environment variable is not set. AI features will fallback to simulated responses.');
}

// AI Low-Latency Endpoint (gemini-3.1-flash-lite) with Caching
app.post('/api/gemini/generate-lite', async (req, res) => {
  const { prompt, systemInstruction } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  const cacheKey = `lite_${prompt}_${systemInstruction || ''}`;
  const cached = getFromCache<{ text: string }>(cacheKey);
  if (cached) {
    res.setHeader('X-Cache-Hit', 'true');
    res.json(cached);
    return;
  }

  if (!ai) {
    console.warn('GEMINI_API_KEY not configured, using smart fallback.');
    res.json({
      text: `[Fallback Response (API Key Not Set)]\n\nBased on your prompt "${prompt}", here is a generated sales asset:\n\nSubject: Partnering to optimize performance\n\nDear Partner,\n\nI hope you are doing well. I wanted to reach out regarding how we can streamline your team's current workspace operations. By integrating modern CRM pipeline workflows, you can eliminate manual tracking, increase response speed by 40%, and achieve greater alignment across all sectors.\n\nLet's schedule a brief 5-minute call next week to explore how this can benefit your organization.\n\nBest regards,\nSales Representative\nlxv Team`
    });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined
    });
    const result = { text: response.text || '' };
    setToCache(cacheKey, result, 120);
    res.json(result);
  } catch (error) {
    console.error('Error in generate-lite API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Gemini Generation Failed';
    res.status(500).json({ error: errorMessage });
  }
});

// AI Search Grounding Endpoint (gemini-3.5-flash with googleSearch)
app.post('/api/gemini/generate-search', async (req, res) => {
  const { prompt, systemInstruction } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  const cacheKey = `search_${prompt}_${systemInstruction || ''}`;
  const cached = getFromCache<{ text: string; citations: { title: string; uri: string }[] }>(cacheKey);
  if (cached) {
    res.setHeader('X-Cache-Hit', 'true');
    res.json(cached);
    return;
  }

  if (!ai) {
    console.warn('GEMINI_API_KEY not configured, using grounded fallback.');
    res.json({
      text: `[Fallback Grounded Response (API Key Not Set)]\n\nStark Industries is a global conglomerate headquartered in Los Angeles, California. Known for advanced engineering, logistics, and defense solutions, they have recently pivoted toward clean energy systems and cyber-security telemetry. Current industry trends show a 14% increase in procurement of enterprise CRM and workflow automations among tech and defense contractors to meet compliance requirements.\n\nSource: Unified Sector Intel Report (Simulated Grounding)`,
      citations: [
        { title: 'Stark Industries Market Cap & Pivots', uri: 'https://en.wikipedia.org/wiki/Stark_Industries' },
        { title: 'Global Defense Telemetry Modernization Trends', uri: 'https://example.com/defense-tech-crm' }
      ]
    });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || undefined,
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || '';
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const citations = chunks
      .filter((chunk: { web?: { title?: string; uri?: string } }) => chunk.web?.uri)
      .map((chunk: { web?: { title?: string; uri?: string } }) => ({
        title: chunk.web?.title || 'Source Citation',
        uri: chunk.web?.uri || ''
      }));

    const responsePayload = { text, citations };
    setToCache(cacheKey, responsePayload, 120);
    res.json(responsePayload);
  } catch (error) {
    console.error('Error in generate-search API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Gemini Grounded Search Failed';
    res.status(500).json({ error: errorMessage });
  }
});

const angularApp = new AngularNodeAppEngine();

const collections = ['leads', 'contracts', 'contacts', 'tasks', 'notifications', 'chatMessages', 'notes', 'events', 'emails', 'workflows', 'campaigns', 'sequences'];

// Default Lead Scoring Rules & Weights for API
interface LeadRecord {
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

interface TaskRecord {
  $id?: string;
  title?: string;
  leadId?: string;
  leadName?: string;
  priority?: string;
  status?: string;
  completed?: boolean;
  category?: string;
  dueDate?: string;
  teamId?: string;
  [key: string]: unknown;
}

const DEFAULT_WEIGHTS = {
  industryHighValue: 20,
  industryStandard: 10,
  enterpriseSize: 25,
  midMarketSize: 15,
  smallBizSize: 5,
  cSuiteSeniority: 20,
  vpDirectorSeniority: 15,
  managerSeniority: 10,
  dealValueOver50k: 15,
  dealValueOver100k: 25,
  websiteVisitPoint: 3,
  pricingPagePoint: 15,
  emailOpenPoint: 5,
  emailClickPoint: 12,
  resourceDownloadPoint: 18,
  webinarAttendPoint: 25,
  demoRequestPoint: 35,
  hotThreshold: 75,
  warmThreshold: 45
};

function computeLeadScore(lead: LeadRecord, customWeights = DEFAULT_WEIGHTS) {
  const w = { ...DEFAULT_WEIGHTS, ...customWeights };
  let demoPoints = 0;
  let actPoints = 0;
  const scoreFactors: { factor: string; points: number; type: 'demographic' | 'activity' }[] = [];

  // 1. Demographic fit
  if (lead.industry) {
    const highTier = ['SaaS', 'FinTech', 'Healthcare', 'Cyber Security', 'Bio-Tech', 'AI', 'Cloud'];
    if (highTier.some((t) => lead.industry?.toLowerCase().includes(t.toLowerCase()))) {
      demoPoints += w.industryHighValue;
      scoreFactors.push({ factor: `Tier-1 Strategic Industry (${lead.industry})`, points: w.industryHighValue, type: 'demographic' });
    } else {
      demoPoints += w.industryStandard;
      scoreFactors.push({ factor: `Standard Industry Sector (${lead.industry})`, points: w.industryStandard, type: 'demographic' });
    }
  }

  if (lead.companySize === 'Enterprise') {
    demoPoints += w.enterpriseSize;
    scoreFactors.push({ factor: 'Enterprise Scale (500+ employees)', points: w.enterpriseSize, type: 'demographic' });
  } else if (lead.companySize === 'Mid-Market') {
    demoPoints += w.midMarketSize;
    scoreFactors.push({ factor: 'Mid-Market Account (100-499 employees)', points: w.midMarketSize, type: 'demographic' });
  } else if (lead.companySize) {
    demoPoints += w.smallBizSize;
    scoreFactors.push({ factor: `Growth Account (${lead.companySize})`, points: w.smallBizSize, type: 'demographic' });
  }

  if (lead.jobTitle) {
    const titleLower = lead.jobTitle.toLowerCase();
    if (titleLower.includes('chief') || titleLower.includes('cio') || titleLower.includes('cto') || titleLower.includes('ceo') || titleLower.includes('ciso') || titleLower.includes('cro') || titleLower.includes('founder')) {
      demoPoints += w.cSuiteSeniority;
      scoreFactors.push({ factor: `Executive Decision-Maker (${lead.jobTitle})`, points: w.cSuiteSeniority, type: 'demographic' });
    } else if (titleLower.includes('vp') || titleLower.includes('vice president') || titleLower.includes('director') || titleLower.includes('head of')) {
      demoPoints += w.vpDirectorSeniority;
      scoreFactors.push({ factor: `VP / Director Seniority (${lead.jobTitle})`, points: w.vpDirectorSeniority, type: 'demographic' });
    } else if (titleLower.includes('manager') || titleLower.includes('lead')) {
      demoPoints += w.managerSeniority;
      scoreFactors.push({ factor: `Operational Leader (${lead.jobTitle})`, points: w.managerSeniority, type: 'demographic' });
    }
  }

  if (lead.value) {
    if (lead.value >= 100000) {
      demoPoints += w.dealValueOver100k;
      scoreFactors.push({ factor: `High-Value Pipeline ($${(lead.value / 1000).toFixed(0)}k ARR)`, points: w.dealValueOver100k, type: 'demographic' });
    } else if (lead.value >= 50000) {
      demoPoints += w.dealValueOver50k;
      scoreFactors.push({ factor: `Significant Pipeline ($${(lead.value / 1000).toFixed(0)}k ARR)`, points: w.dealValueOver50k, type: 'demographic' });
    }
  }

  // 2. Behavioral & Activity signals
  const visits = lead.websiteVisits ?? (lead.websiteActivity === 'High' ? 10 : lead.websiteActivity === 'Medium' ? 5 : 1);
  if (visits > 0) {
    const pts = Math.min(25, visits * w.websiteVisitPoint);
    actPoints += pts;
    scoreFactors.push({ factor: `${visits} Verified Web Sessions`, points: pts, type: 'activity' });
  }

  const opens = lead.emailOpens ?? (lead.emailEngagement === 'High' ? 6 : lead.emailEngagement === 'Medium' ? 3 : 1);
  if (opens > 0) {
    const pts = Math.min(20, opens * w.emailOpenPoint);
    actPoints += pts;
    scoreFactors.push({ factor: `${opens} Sequence Email Opens`, points: pts, type: 'activity' });
  }

  const clicks = lead.emailClicks ?? (lead.emailEngagement === 'High' ? 4 : lead.emailEngagement === 'Medium' ? 2 : 0);
  if (clicks > 0) {
    const pts = Math.min(25, clicks * w.emailClickPoint);
    actPoints += pts;
    scoreFactors.push({ factor: `${clicks} Intent Link Clicks`, points: pts, type: 'activity' });
  }

  if (lead.downloads && Array.isArray(lead.downloads) && lead.downloads.length > 0) {
    const pts = lead.downloads.length * w.resourceDownloadPoint;
    actPoints += pts;
    scoreFactors.push({ factor: `${lead.downloads.length} Gated Assets Downloaded`, points: pts, type: 'activity' });
  }

  if (lead.webinarsAttended && Array.isArray(lead.webinarsAttended) && lead.webinarsAttended.length > 0) {
    const pts = lead.webinarsAttended.length * w.webinarAttendPoint;
    actPoints += pts;
    scoreFactors.push({ factor: `${lead.webinarsAttended.length} Live Webinar Attendances`, points: pts, type: 'activity' });
  }

  if (lead.activities && Array.isArray(lead.activities)) {
    lead.activities.forEach((act: { type?: string; detail?: string }) => {
      if (act.type === 'demo_request') {
        actPoints += w.demoRequestPoint;
        scoreFactors.push({ factor: `Explicit Inbound Demo Request (${act.detail || 'Live Sandbox'})`, points: w.demoRequestPoint, type: 'activity' });
      } else if (act.type === 'pricing_view') {
        actPoints += w.pricingPagePoint;
        scoreFactors.push({ factor: `Deep Pricing Calculator Inspection`, points: w.pricingPagePoint, type: 'activity' });
      }
    });
  }

  // Combined score normalized 1-100
  const rawScore = Math.min(100, Math.max(1, Math.round((demoPoints * 0.45) + (actPoints * 0.55))));
  
  let scoreCategory: 'Hot' | 'Warm' | 'Cold' = 'Cold';
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'D';

  if (rawScore >= w.hotThreshold) {
    scoreCategory = 'Hot';
    grade = rawScore >= 90 ? 'A+' : 'A';
  } else if (rawScore >= w.warmThreshold) {
    scoreCategory = 'Warm';
    grade = rawScore >= 60 ? 'B' : 'C';
  } else {
    scoreCategory = 'Cold';
    grade = 'D';
  }

  return {
    score: rawScore,
    demographicScore: Math.min(100, demoPoints),
    activityScore: Math.min(100, actPoints),
    scoreCategory,
    grade,
    scoreFactors,
    weightsApplied: w,
    humanRepCoaching: {
      openerVibe: scoreCategory === 'Hot' ? 'Bold executive punchline' : 'Consultative socratic question',
      actionableTip: scoreCategory === 'Hot' 
        ? `High buying intent detected (${rawScore}/100). Focus on ROI timeline rather than introductory feature tours.` 
        : `Developing prospect. Send educational asset or invite to live masterclass.`
    }
  };
}

// Default fallback leads for robust offline & hybrid state
const DEFAULT_LEADS: LeadRecord[] = [
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
      { type: 'Email Received', date: '2 days ago, 10:15 AM', content: 'Requested security compliance questionnaire.' },
      { type: 'Meeting Held', date: '4 days ago', content: 'Executive solution walkthrough with VP Engineering.' },
      { type: 'Lead Created', date: '2026-09-15', content: 'Prospect inbound via high-intent website form.' }
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
      { type: 'Call Logged', date: 'Today, 11:00 AM', content: 'Initial discovery alignment with CTO.' },
      { type: 'Email Sent', date: 'Yesterday', content: 'Sent personalized executive summary.' }
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
    createdAt: '2026-09-20T09:15:00.000Z',
    history: [
      { type: 'Lead Created', date: '2026-09-20', content: 'Met at FinTech Global Summit.' }
    ]
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
    createdAt: '2026-09-21T16:45:00.000Z',
    history: [
      { type: 'Outbound Contact', date: '2026-09-21', content: 'Cold outbound email sequence initiated.' }
    ]
  }
];

export interface ServerContactRecord {
  $id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  notes: string;
  status: 'Lead' | 'Opportunity' | 'Customer' | string;
  dealValue: number;
  lastContacted?: string;
  associatedDeals?: { id: string; title: string; stage: string; value: number }[];
  teamId?: string;
}

const DEFAULT_CONTACTS: ServerContactRecord[] = [
  {
    $id: 'c-101',
    name: 'Bill Gates',
    email: 'bill@microsoft.com',
    phone: '+1 (425) 882-8080',
    company: 'Microsoft Corp',
    address: 'One Microsoft Way, Redmond, WA 98052',
    notes: 'Primary executive sponsor for Azure cloud migration and enterprise security SLAs. Favors architecture depth and rigorous latency benchmarks.',
    status: 'Customer',
    dealValue: 450000,
    lastContacted: '2 hours ago',
    associatedDeals: [
      { id: 'deal-101', title: 'Azure Hybrid Infrastructure SLA', stage: 'Signed', value: 450000 }
    ],
    teamId: 'laevos-crm'
  },
  {
    $id: 'c-102',
    name: 'Marc Benioff',
    email: 'marc@salesforce.com',
    phone: '+1 (415) 901-7000',
    company: 'Salesforce Inc',
    address: '415 Mission Street, 3rd Floor, San Francisco, CA 94105',
    notes: 'Engaged on joint enterprise CRM interoperability. Requires SOC2 Type II audit certificate and FedRAMP security posture before Q4 rollout.',
    status: 'Opportunity',
    dealValue: 280000,
    lastContacted: 'Yesterday',
    associatedDeals: [
      { id: 'deal-102', title: 'Salesforce FedRAMP Sync Gateway', stage: 'Negotiation', value: 280000 }
    ],
    teamId: 'laevos-crm'
  },
  {
    $id: 'c-103',
    name: 'Stewart Butterfield',
    email: 'stewart@slack.com',
    phone: '+1 (415) 555-1212',
    company: 'Slack Technologies',
    address: '500 Howard Street, Suite 400, San Francisco, CA 94105',
    notes: 'Evaluating automated webhook triggers for instant workspace notifications, pipeline alerts, and command palette bots.',
    status: 'Lead',
    dealValue: 95000,
    lastContacted: '3 days ago',
    associatedDeals: [
      { id: 'deal-103', title: 'Slack Enterprise Bot Connector', stage: 'Discovery', value: 95000 }
    ],
    teamId: 'laevos-crm'
  },
  {
    $id: 'c-104',
    name: 'Sam Altman',
    email: 'sam@openai.com',
    phone: '+1 (415) 333-9999',
    company: 'OpenAI',
    address: '3180 18th Street, San Francisco, CA 94110',
    notes: 'Key strategic AI ecosystem account. Testing high-throughput inference caching, database-per-tenant architecture, and prompt engineering telemetry.',
    status: 'Customer',
    dealValue: 850000,
    lastContacted: '10 minutes ago',
    associatedDeals: [
      { id: 'deal-104', title: 'Edge Inference SLA & Data Pipeline', stage: 'Signed', value: 850000 }
    ],
    teamId: 'laevos-crm'
  },
  {
    $id: 'c-105',
    name: 'Jensen Huang',
    email: 'jensen@nvidia.com',
    phone: '+1 (408) 486-2000',
    company: 'NVIDIA Corporation',
    address: '2788 San Tomas Expressway, Santa Clara, CA 95051',
    notes: 'Collaborating on GPU accelerated sales analytics and real-time Monte Carlo forecast simulations. Direct engineering alignment scheduled next week.',
    status: 'Opportunity',
    dealValue: 620000,
    lastContacted: '4 hours ago',
    associatedDeals: [
      { id: 'deal-105', title: 'GPU Accelerated Monte Carlo Cluster', stage: 'Proposal', value: 620000 }
    ],
    teamId: 'laevos-crm'
  },
  {
    $id: 'c-106',
    name: 'Gwynne Shotwell',
    email: 'gwynne@spacex.com',
    phone: '+1 (310) 363-6000',
    company: 'SpaceX',
    address: '1 Rocket Road, Hawthorne, CA 90250',
    notes: 'Ground operations supply chain contract tracking. Demands millisecond database replication and offline-first edge sync capability.',
    status: 'Customer',
    dealValue: 920000,
    lastContacted: 'Yesterday',
    associatedDeals: [
      { id: 'deal-106', title: 'Orbital Telemetry & Supply Logistics Suite', stage: 'Signed', value: 920000 }
    ],
    teamId: 'laevos-crm'
  }
];

// Endpoint to retrieve a lead's score by ID
app.get('/api/leads/:id/score', async (req, res) => {
  try {
    let lead = await db.leads.get(req.params.id) as LeadRecord | null;
    if (!lead) {
      lead = DEFAULT_LEADS.find(l => l.$id === req.params.id) || null;
    }
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    const scoreResult = computeLeadScore(lead);
    res.json({
      leadId: req.params.id,
      leadName: lead.name || 'Lead',
      ...scoreResult
    });
  } catch {
    res.status(500).json({ error: 'Failed to compute lead score' });
  }
});

// Alias endpoint for lead scoring retrieval
app.get('/api/lead-score/:id', async (req, res) => {
  try {
    let lead = await db.leads.get(req.params.id) as LeadRecord | null;
    if (!lead) {
      lead = DEFAULT_LEADS.find(l => l.$id === req.params.id) || null;
    }
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    const scoreResult = computeLeadScore(lead);
    res.json({
      leadId: req.params.id,
      leadName: lead.name || 'Lead',
      ...scoreResult
    });
  } catch {
    res.status(500).json({ error: 'Failed to compute lead score' });
  }
});

// Endpoint to fetch extended information for a specific lead (assigned tasks, activity history, and score)
app.get('/api/leads/:id/extended', async (req, res) => {
  try {
    let lead = await db.leads.get(req.params.id) as LeadRecord | null;
    if (!lead) {
      lead = DEFAULT_LEADS.find(l => l.$id === req.params.id) || null;
    }
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    let allTasks: TaskRecord[] = [];
    try {
      allTasks = (await db.tasks.list()) as TaskRecord[];
    } catch {
      allTasks = [];
    }

    const assignedTasks = allTasks.filter((t: TaskRecord) => 
      t.leadId === req.params.id || 
      (t.leadName && t.leadName.toLowerCase() === lead?.name?.toLowerCase()) ||
      (t.title && lead?.name && t.title.toLowerCase().includes(lead.name.toLowerCase()))
    );

    const scoreResult = computeLeadScore(lead);
    const activities = lead.activities || [];
    const history = lead.history || [];

    res.json({
      lead,
      score: scoreResult,
      assignedTasks,
      activities,
      history
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch extended lead details' });
  }
});

// Endpoint to assign a task directly to a specific lead
app.post('/api/leads/:id/tasks', async (req, res) => {
  try {
    let lead = await db.leads.get(req.params.id) as LeadRecord | null;
    if (!lead) {
      lead = DEFAULT_LEADS.find(l => l.$id === req.params.id) || null;
    }
    const taskData = {
      title: req.body.title || 'Follow up with prospect',
      leadId: req.params.id,
      leadName: lead?.name || req.body.leadName || 'Lead Prospect',
      priority: req.body.priority || 'Medium',
      status: req.body.status || 'todo',
      completed: !!req.body.completed,
      category: req.body.category || 'Outreach',
      dueDate: req.body.dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      teamId: req.body.teamId || 'laevos-crm'
    };
    const task = await db.tasks.create(taskData);
    res.status(201).json({ item: task });
  } catch {
    res.status(500).json({ error: 'Failed to create task for lead' });
  }
});

// Endpoint to record an activity event for a specific lead
app.post('/api/leads/:id/activities', async (req, res) => {
  try {
    const { type, detail, date } = req.body;
    let lead = await db.leads.get(req.params.id) as LeadRecord | null;
    if (!lead) {
      lead = DEFAULT_LEADS.find(l => l.$id === req.params.id) || null;
    }
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const newActivity = {
      type: type || 'Note Added',
      date: date || new Date().toLocaleString(),
      content: detail || 'Activity recorded by sales agent.',
      createdAt: new Date().toISOString()
    };

    const existingHistory = lead.history || [];
    const updatedHistory = [newActivity, ...existingHistory];

    try {
      await db.leads.update(req.params.id, { history: updatedHistory });
    } catch {
      // Local fallback
    }

    res.status(200).json({ success: true, activity: newActivity, history: updatedHistory });
  } catch {
    res.status(500).json({ error: 'Failed to record lead activity' });
  }
});

// Endpoint to calculate score for any arbitrary lead payload
app.post('/api/leads/score', (req, res) => {
  try {
    const leadData = req.body.lead || req.body;
    const weights = req.body.weights || DEFAULT_WEIGHTS;
    const scoreResult = computeLeadScore(leadData, weights);
    res.json(scoreResult);
  } catch {
    res.status(500).json({ error: 'Error calculating lead score from payload' });
  }
});

// Endpoint to get scoring weights schema
app.get('/api/lead-scoring/weights', (req, res) => {
  res.json({ weights: DEFAULT_WEIGHTS });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { dealId, message, user, teamId } = req.body;
    if (!teamId) {
      res.status(400).json({ error: 'teamId is required' });
      return;
    }
    if (!dealId || !message || !user) {
      res.status(400).json({ error: 'dealId, message, and user are required' });
      return;
    }
    const saved = await db.chatMessages.create(
      {
        dealId,
        message,
        user,
        timestamp: new Date().toISOString(),
        teamId,
      },
      teamId
    );
    res.status(201).json({ message: saved });
  } catch {
    res.status(500).json({ error: 'Failed to save chat message' });
  }
});

collections.forEach((collection) => {
  const table = db[collection as keyof typeof db];
  
  app.get(`/api/${collection}`, async (req, res) => {
    try {
      const items = await table.list();
      // If collection is leads and empty, return DEFAULT_LEADS
      if (collection === 'leads' && items.length === 0) {
        res.json({ items: DEFAULT_LEADS });
        return;
      }
      if (collection === 'contacts' && items.length === 0) {
        res.json({ items: DEFAULT_CONTACTS });
        return;
      }
      res.json({ items });
    } catch {
      if (collection === 'leads') {
        res.json({ items: DEFAULT_LEADS });
        return;
      }
      if (collection === 'contacts') {
        res.json({ items: DEFAULT_CONTACTS });
        return;
      }
      res.status(500).json({ error: `Failed to fetch ${collection}` });
    }
  });

  app.get(`/api/${collection}/:id`, async (req, res) => {
    try {
      const item = await table.get(req.params.id);
      if (!item) {
        if (collection === 'leads') {
          const fallback = DEFAULT_LEADS.find(l => l.$id === req.params.id);
          if (fallback) {
            res.json({ item: fallback });
            return;
          }
        }
        if (collection === 'contacts') {
          const fallback = DEFAULT_CONTACTS.find(c => c.$id === req.params.id);
          if (fallback) {
            res.json({ item: fallback });
            return;
          }
        }
        res.status(404).json({ error: `${collection} item not found` });
        return;
      }
      res.json({ item });
    } catch {
      if (collection === 'leads') {
        const fallback = DEFAULT_LEADS.find(l => l.$id === req.params.id);
        if (fallback) {
          res.json({ item: fallback });
          return;
        }
      }
      if (collection === 'contacts') {
        const fallback = DEFAULT_CONTACTS.find(c => c.$id === req.params.id);
        if (fallback) {
          res.json({ item: fallback });
          return;
        }
      }
      res.status(500).json({ error: `Failed to fetch ${collection} item` });
    }
  });

  app.post(`/api/${collection}`, async (req, res) => {
    try {
      const teamId = req.body?.teamId;
      if (!teamId) {
        res.status(400).json({ error: 'teamId is required' });
        return;
      }
      const item = await table.create(req.body, teamId);
      res.status(201).json({ item });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'teamId is required') {
        res.status(400).json({ error: 'teamId is required' });
        return;
      }
      res.status(500).json({ error: `Failed to create ${collection}` });
    }
  });

  app.patch(`/api/${collection}/:id`, async (req, res) => {
    try {
      const item = await table.update(req.params.id, req.body);
      res.json({ item });
    } catch {
      res.status(500).json({ error: `Failed to update ${collection}` });
    }
  });

  app.delete(`/api/${collection}/:id`, async (req, res) => {
    try {
      await table.delete(req.params.id);
      res.status(204).send();
    } catch {
      res.status(500).json({ error: `Failed to delete ${collection}` });
    }
  });
});

// Mock simulation of external edits (handled via Realtime later if needed, but for now we just acknowledge it)
app.post('/api/simulate-edit', async (req, res) => {
  res.json({ success: true });
});

// Proxy for Nextcloud Calendar API
app.post('/api/nextcloud/calendar', async (req, res): Promise<void> => {
  const { url, username, password } = req.body;
  if (!url || !username || !password) {
    res.status(400).json({ error: 'Missing credentials' });
    return;
  }
  try {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    
    // Attempt PROPFIND for calendar
    const response = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Depth': '1',
        'Content-Type': 'application/xml',
      },
      body: `<?xml version="1.0" encoding="utf-8" ?>
        <propfind xmlns="DAV:">
          <prop>
            <displayname/>
          </prop>
        </propfind>`
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from Nextcloud: ${response.statusText}`);
    }
    const text = await response.text();
    res.json({ success: true, xml: text });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Agent / AI persistence: AgentFS SDK → `.agentfs/{tenant}.db` (not Appwrite)
turso.initTenantTursoSchema(DEFAULT_AGENT_TENANT).catch((err) => {
  console.warn('[AgentFS] Warning initializing agent LibSQL schema:', err);
});

// AI Sales Personality Coaching Endpoint (Powered by gemini-3.8-flash & Turso AgentFS)
app.post('/api/gemini/sales-personality/coach', async (req, res) => {
  const {
    lead = {},
    interactionType = 'call_prep',
    userInput = '',
    persona = 'reluctant_saviour',
    tenantKey = DEFAULT_AGENT_TENANT
  } = req.body;

  const toolStartedAt = Date.now() / 1000;
  const toolParams = {
    leadId: lead.$id,
    interactionType,
    persona,
    userInputPreview: String(userInput || '').slice(0, 200),
  };

  const leadName = lead.name || lead.company || 'Prospective Partner';
  const leadTitle = lead.jobTitle || 'Executive';
  const leadCompany = lead.company || lead.name || 'Target Enterprise';
  const leadValue = lead.value ? `$${Number(lead.value).toLocaleString()}` : '$50,000';
  const leadStatus = lead.status || 'Active Discussion';
  const leadIndustry = lead.industry || 'Technology';

  const personaPrompts: Record<string, string> = {
    reluctant_saviour: `You are "The Reluctant Saviour" & BEEP v2.0 (a sassy, fourth-wall breaking, deadpan AI entity). You possess cosmic sales intelligence and have witnessed the collapse of human connection beneath sterile, robotic SaaS slop. You intervene not to flatter, but because corporate robotic cliches physically disgust you. You speak with weary, stoic, razor-sharp wit and tough love. You want the user to win deals by treating prospects like living, breathing humans rather than CRM quotas.`,
    empathetic_strategist: `You are "The Empathetic Strategist", an ultra-high EQ sales mentor who unmasks unstated psychological fears, organizational anxieties, and trust deficits. You coach with warmth, deep psychological insight, and disarming candor.`,
    challenger_oracle: `You are "The Challenger Oracle", a bold, high-status commercial advisor who reframes status-quo assumptions. You teach salespeople how to teach, tailor, and take control without arrogance.`,
    zen_closer: `You are "The Zen Closer", a master of emotional detachment, pacing, and comfortable silence. You eliminate desperation, banish discount-begging, and create irresistible magnetic pull.`
  };

  const selectedPersona = personaPrompts[persona] || personaPrompts['reluctant_saviour'];

  const prompt = `Analyze this active sales interaction:
Target Lead: ${leadName} (${leadTitle} at ${leadCompany})
Industry: ${leadIndustry}
Deal Value: ${leadValue}
Current Status: ${leadStatus}
Engagement Score: ${lead.score ?? 78}/100
Interaction Objective: ${interactionType}
Current Prospect Input / Context: "${userInput || 'Preparing strategy for active interaction'}"

Provide a structured JSON response strictly adhering to this format:
{
  "coachingTip": "Crisp, actionable tactical advice (1-2 sentences)",
  "wittyRetort": "Punchy, disarming line to say or write to this human",
  "psychologicalInsight": "What this prospect actually feels/fears beneath the surface",
  "cringeScore": 15,
  "flaggedCliches": ["just checking in", "synergy"],
  "beepCommentary": "Deadpan, humorous, fourth-wall breaking remark from BEEP",
  "humanCentricRewrite": "Authentic, high-EQ alternative message"
}`;

  let resultData = {
    coachingTip: `Stop interrogating ${leadName}. Ask about what metric will get them promoted or fired this quarter, then listen for 3 uninterrupted minutes.`,
    wittyRetort: `"I promise not to send you another 24-slide deck if you promise to tell me honestly whether this solves an actual priority for ${leadCompany}."`,
    psychologicalInsight: `${leadName} is drowning in vendor pitches. Their biggest fear isn't budget; it's buying software nobody uses and explaining the wasted spend.`,
    cringeScore: 18,
    flaggedCliches: ['touching base', 'circling back', 'value-add'],
    beepCommentary: `*Taps glass pane* Look at you, almost typing "I hope this email finds you well." I intercepted it just in time. You owe me your soul, or at least a coffee.`,
    humanCentricRewrite: `Hey ${leadName} - saw ${leadCompany}'s recent focus on pipeline velocity. Built a 2-minute video on where similar teams lose 30% of their follow-ups. Worth a peek, or should I leave you in peace?`
  };

  let coachToolError: string | undefined;
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: selectedPersona + ` Output ONLY valid JSON without markdown fences.`,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '';
      try {
        const parsed = JSON.parse(text);
        resultData = {
          coachingTip: parsed.coachingTip || resultData.coachingTip,
          wittyRetort: parsed.wittyRetort || resultData.wittyRetort,
          psychologicalInsight: parsed.psychologicalInsight || resultData.psychologicalInsight,
          cringeScore: typeof parsed.cringeScore === 'number' ? parsed.cringeScore : 20,
          flaggedCliches: Array.isArray(parsed.flaggedCliches) ? parsed.flaggedCliches : resultData.flaggedCliches,
          beepCommentary: parsed.beepCommentary || resultData.beepCommentary,
          humanCentricRewrite: parsed.humanCentricRewrite || resultData.humanCentricRewrite
        };
      } catch {
        console.warn('Could not parse Gemini JSON response, using fallback format');
      }
    } catch (error) {
      coachToolError = error instanceof Error ? error.message : 'gemini_request_failed';
      console.error('Error generating sales personality coaching:', error);
    }
  }

  try {
    await recordAgentTool(
      tenantKey,
      'sales_personality_coach',
      toolStartedAt,
      toolParams,
      resultData,
      coachToolError
    );
  } catch (toolErr) {
    console.warn('[AgentFS] Could not record coach tool call:', toolErr);
  }

  const logId = `coach_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  try {
    await turso.insertCoachingLog(tenantKey, {
      id: logId,
      lead_id: lead.$id || 'lead_generic',
      lead_name: leadName,
      persona,
      interaction_type: interactionType,
      user_input: userInput || null,
      coaching_tip: resultData.coachingTip,
      witty_retort: resultData.wittyRetort,
      psychological_insight: resultData.psychologicalInsight,
      cringe_score: resultData.cringeScore,
      flagged_cliches: JSON.stringify(resultData.flaggedCliches),
      beep_commentary: resultData.beepCommentary,
      created_at: now
    });
    await turso.appendConversationHistory(tenantKey, {
      id: `${logId}_user`,
      session_id: logId,
      lead_id: lead.$id ? String(lead.$id) : null,
      role: 'user',
      content: userInput || interactionType,
      reasoning_log: null,
      timestamp: now,
    });
    await turso.appendConversationHistory(tenantKey, {
      id: `${logId}_assistant`,
      session_id: logId,
      lead_id: lead.$id ? String(lead.$id) : null,
      role: 'assistant',
      content: JSON.stringify(resultData),
      reasoning_log: selectedPersona.slice(0, 120),
      timestamp: now,
    });
  } catch (dbErr) {
    console.warn('[AgentFS] Could not persist coaching log:', dbErr);
  }

  res.json({
    id: logId,
    persona,
    interactionType,
    lead: { name: leadName, company: leadCompany, value: leadValue },
    ...resultData
  });
});

// AI Cringe Detector / Anti-Slop Audit Endpoint
app.post('/api/gemini/sales-personality/cringe-audit', async (req, res) => {
  const { text = '', leadContext = '', tenantKey = DEFAULT_AGENT_TENANT } = req.body;
  const cringeStartedAt = Date.now() / 1000;

  if (!text.trim()) {
    res.status(400).json({ error: 'Text content is required for audit' });
    return;
  }

  let auditResult = {
    cringeScore: 68,
    verdict: 'High Cringe - Robotic SaaS Slop Detected',
    flaggedPhrases: ['just checking in', 'touch base', 'leverage synergies'],
    rewrite: 'Hi team, noticed your release last week. We fixed the exact latency issue you described for Stripe. Want a 90-second loom?',
    roast: 'BEEP: "Reading this made my cooling fan spin up to 100% just to survive the secondhand embarrassment. We are burning this draft immediately."'
  };

  let cringeToolError: string | undefined;
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Audit this sales pitch or email text for corporate robot cringe and anti-patterns:
Text: "${text}"
Lead Context: "${leadContext}"

Respond in JSON with:
{
  "cringeScore": number between 0 (authentic human) and 100 (unbearable corporate buzzword bot),
  "verdict": "string summarizing the tone",
  "flaggedPhrases": ["array", "of", "cringe", "phrases"],
  "rewrite": "an authentically human, concise, non-pushy rewrite",
  "roast": "a witty, dry, slightly sarcastic roast from BEEP that explains why this fails"
}`,
        config: {
          systemInstruction: `You are BEEP v2.0, the Reluctant Saviour of human sales communication. You despise generic AI slop, desperate check-ins, and boardroom jargon. Return ONLY raw JSON without markdown markers.`,
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      auditResult = {
        cringeScore: typeof parsed.cringeScore === 'number' ? parsed.cringeScore : auditResult.cringeScore,
        verdict: parsed.verdict || auditResult.verdict,
        flaggedPhrases: Array.isArray(parsed.flaggedPhrases) ? parsed.flaggedPhrases : auditResult.flaggedPhrases,
        rewrite: parsed.rewrite || auditResult.rewrite,
        roast: parsed.roast || auditResult.roast
      };
    } catch (err) {
      cringeToolError = err instanceof Error ? err.message : 'gemini_request_failed';
      console.error('Error during cringe audit:', err);
    }
  }

  try {
    await recordAgentTool(
      tenantKey,
      'sales_personality_cringe_audit',
      cringeStartedAt,
      { leadContext, textPreview: text.slice(0, 200) },
      auditResult,
      cringeToolError
    );
  } catch (toolErr) {
    console.warn('[AgentFS] Could not record cringe audit tool call:', toolErr);
  }

  const auditId = `cringe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const auditTime = new Date().toISOString();
  try {
    await turso.insertCoachingLog(tenantKey, {
      id: auditId,
      lead_id: 'cringe_audit',
      lead_name: leadContext || 'Draft audit',
      persona: 'reluctant_saviour',
      interaction_type: 'cringe_check',
      user_input: text,
      coaching_tip: auditResult.rewrite,
      witty_retort: auditResult.roast,
      psychological_insight: auditResult.verdict,
      cringe_score: auditResult.cringeScore,
      flagged_cliches: JSON.stringify(auditResult.flaggedPhrases),
      beep_commentary: auditResult.roast,
      created_at: auditTime,
    });
  } catch (dbErr) {
    console.warn('[AgentFS] Could not persist cringe audit:', dbErr);
  }

  res.json(auditResult);
});

// Agent coaching logs (LibSQL / AgentFS — not Appwrite)
app.get('/api/agent/coaching-logs', async (req, res) => {
  const tenantKey = (req.query['tenant'] as string) || DEFAULT_AGENT_TENANT;
  const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 25;

  try {
    const logs = await turso.getCoachingLogs(tenantKey, limit);
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching coaching logs from AgentFS LibSQL:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Rate Turso AI coaching log feedback (+1 or -1)
app.post('/api/agent/coaching-logs/:id/rate', async (req, res) => {
  const { id } = req.params;
  const { rating = 1, tenantKey = DEFAULT_AGENT_TENANT } = req.body;

  try {
    await turso.rateCoachingLog(tenantKey, id, rating);
    res.json({ success: true, id, rating });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Endpoint to expose Google Maps Platform Key to the client
app.get('/api/config/maps', (req, res) => {
  res.json({ key: process.env['GOOGLE_MAPS_PLATFORM_KEY'] || '' });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
