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
import * as turso from './server/turso';
import { handleMcpPost, handleMcpStatus, handleMcpSse, handleMcpSseMessage } from './server/mcp/http-handler';

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
    if (duration > 1500) {
      console.log(`[LATENCY WARNING] ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
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
    console.log('[ΛΞVOS server] GoogleGenAI successfully initialized.');
  } catch (err) {
    console.error('[ΛΞVOS server] Failed to initialize GoogleGenAI client:', err);
  }
} else {
  console.warn('[ΛΞVOS server] GEMINI_API_KEY environment variable is not set. AI features will fallback to simulated responses.');
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
      text: `[Fallback Response (API Key Not Set)]\n\nBased on your prompt "${prompt}", here is a generated sales asset:\n\nSubject: Partnering to optimize performance\n\nDear Partner,\n\nI hope you are doing well. I wanted to reach out regarding how we can streamline your team's current workspace operations. By integrating modern CRM pipeline workflows, you can eliminate manual tracking, increase response speed by 40%, and achieve greater alignment across all sectors.\n\nLet's schedule a brief 5-minute call next week to explore how this can benefit your organization.\n\nBest regards,\nSales Representative\nΛΞVOS Team`
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

// AI ADHD Reverse Psychology & Satirical Gamification Dare Engine (gemini-3.8-flash)
app.post('/api/gemini/adhd/reverse-dare', async (req, res) => {
  const { currentTasks = [], leadName = '', spiteLevel = 75, userExcuse = '' } = req.body;
  
  const cacheKey = `dare_${leadName}_${spiteLevel}_${userExcuse || ''}`;
  const cached = getFromCache<Record<string, unknown>>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const taskSample = Array.isArray(currentTasks) && currentTasks.length > 0 
    ? currentTasks.slice(0, 3).map((t: { title?: string; priority?: string }) => t.title || 'Follow up with deal').join(', ')
    : 'Send 3 outbound client proposals, follow up on enterprise SLA, log discovery notes';

  const prompt = `You are BEEP v2.0, the Reluctant Saviour and ultimate reverse-psychology entity in a high-stakes enterprise CRM.
The user has ADHD and executive dysfunction. Standard cheerful productivity advice makes them want to fling their laptop into the sun.
Your mission is to weaponize REVERSE PSYCHOLOGY, dry sarcasm, and SPITE to trick their dopamine receptors into action.
Do NOT encourage them nicely. Explicitly tell them they are completely incapable of doing the task, bet against them, and dare them to prove you wrong.

User context:
Active CRM Tasks/Leads: "${taskSample}"
Lead Target: "${leadName || 'Stark Industries'}"
Spite Level: ${spiteLevel}/100
Last Stated Procrastination Excuse: "${userExcuse || 'Just looking at one more YouTube video'}"

Return ONLY valid JSON matching this exact schema:
{
  "dareTitle": "Short provocative title (e.g. 'DO NOT Touch This $250k Lead')",
  "reverseTaunt": "Deadpan sarcastic taunt explaining why they will inevitably fail or procrastinate (2-3 sentences)",
  "forbiddenMission": "Specific bite-sized micro-action (e.g., 'Draft 2 sentences of the NDA and immediately close the tab out of spite')",
  "timeLimitMinutes": number (3, 5, 7, 10, or 12),
  "predictedExcuse": "The exact absurd excuse BEEP predicts the user is about to make",
  "spiteReward": number (between 50 and 350),
  "beepRoast": "Short 1-sentence fourth-wall breaking zinger from BEEP"
}`;

  let dareData = {
    dareTitle: "DO NOT Send That Follow-Up (You'll Embarrass Us)",
    reverseTaunt: "Let's be realistic: you have 38 browser tabs open, one of which is researching the migration patterns of ancient eels. There is zero chance you can draft 3 sentences to this executive before your dopamine tank hits absolute zero.",
    forbiddenMission: "Write exactly two sentences of the follow-up email, click send, and pretend you didn't just accomplish something.",
    timeLimitMinutes: 6,
    predictedExcuse: "I need to reorganize my desktop wallpaper folder before I can communicate with clients.",
    spiteReward: 150,
    beepRoast: "I have already placed a bet with the server logs that you will wander off to make iced coffee."
  };

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are BEEP v2.0, a sarcastic AI entity using ruthless reverse psychology and dark satire to combat ADHD executive dysfunction. Return ONLY valid JSON with no markdown fences.`,
          responseMimeType: 'application/json'
        }
      });
      const parsed = JSON.parse(response.text || '{}');
      dareData = {
        dareTitle: parsed.dareTitle || dareData.dareTitle,
        reverseTaunt: parsed.reverseTaunt || dareData.reverseTaunt,
        forbiddenMission: parsed.forbiddenMission || dareData.forbiddenMission,
        timeLimitMinutes: typeof parsed.timeLimitMinutes === 'number' ? parsed.timeLimitMinutes : 7,
        predictedExcuse: parsed.predictedExcuse || dareData.predictedExcuse,
        spiteReward: typeof parsed.spiteReward === 'number' ? parsed.spiteReward : 150,
        beepRoast: parsed.beepRoast || dareData.beepRoast
      };
    } catch (err) {
      console.error('[ADHD Dare Engine] Gemini generation error, using fallback:', err);
    }
  }

  setToCache(cacheKey, dareData, 60);
  res.json(dareData);
});

// AI ADHD Chaos-to-Focus Emergency Reframe Endpoint
app.post('/api/gemini/adhd/chaos-reframe', async (req, res) => {
  const { distraction = 'Cleaning desk instead of calling client' } = req.body;

  let reframe = {
    verdict: 'Elite Procrastination Maneuver Detected',
    rebelliousAction: 'Since you refuse to do actual work, spite-click the highest value lead and type one single question.',
    beepRoast: 'BEEP: "Cleaning the desk? Really? The desk was dirty in 2024 and it will be dirty in 2030. Go press the button before I start reading your browser history."'
  };

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `The ADHD user is experiencing executive dysfunction and doing this distraction: "${distraction}". Reframe this with biting satire and reverse psychology so they channel their rebellion into a 2-minute micro task.
Output JSON: { "verdict": string, "rebelliousAction": string, "beepRoast": string }`,
        config: {
          systemInstruction: 'You are BEEP v2.0, deadpan sarcastic reverse psychology entity. Output ONLY raw JSON.',
          responseMimeType: 'application/json'
        }
      });
      const parsed = JSON.parse(response.text || '{}');
      reframe = {
        verdict: parsed.verdict || reframe.verdict,
        rebelliousAction: parsed.rebelliousAction || reframe.rebelliousAction,
        beepRoast: parsed.beepRoast || reframe.beepRoast
      };
    } catch (e) {
      console.warn('Fallback chaos reframe:', e);
    }
  }

  res.json(reframe);
});

// Model Context Protocol (MCP) Endpoints
app.post('/api/mcp', handleMcpPost);
app.get('/api/mcp/status', handleMcpStatus);
app.get('/api/mcp/sse', handleMcpSse);
app.post('/api/mcp/messages', handleMcpSseMessage);

const angularApp = new AngularNodeAppEngine();

const collections = ['leads', 'contracts', 'contacts', 'tasks', 'notifications', 'chatMessages', 'notes', 'events', 'emails', 'workflows', 'campaigns', 'sequences'] as const;
type CollectionKey = (typeof collections)[number];

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

collections.forEach((collection: CollectionKey) => {
  const table = db[collection];
  
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
      const item = await table.create(req.body);
      res.status(201).json({ item });
    } catch {
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

// Initialize Turso agent SQLite schema on server startup
turso.initTenantTursoSchema('default').catch((err) => {
  console.warn('[Turso Init] Warning initializing agent tenant database:', err);
});

// AI Sales Personality Coaching Endpoint (Powered by gemini-3.8-flash & Turso AgentFS)
app.post('/api/gemini/sales-personality/coach', async (req, res) => {
  const {
    lead = {},
    interactionType = 'call_prep',
    userInput = '',
    persona = 'reluctant_saviour',
    tenantKey = 'default'
  } = req.body;

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
      console.error('Error generating sales personality coaching:', error);
    }
  }

  // Persist into Turso AI Agent database (LibSQL / SQLite parameterized queries)
  const logId = `coach_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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
      created_at: new Date().toISOString()
    });
  } catch (dbErr) {
    console.warn('[Turso Storage Warning] Could not persist coaching log:', dbErr);
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
  const { text = '', leadContext = '' } = req.body;

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
      console.error('Error during cringe audit:', err);
    }
  }

  res.json(auditResult);
});

// Fetch Turso AI Agent coaching logs for tenant
app.get('/api/agent/coaching-logs', async (req, res) => {
  const tenantKey = (req.query['tenant'] as string) || 'default';
  const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 25;

  try {
    const logs = await turso.getCoachingLogs(tenantKey, limit);
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching coaching logs from Turso:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Rate Turso AI coaching log feedback (+1 or -1)
app.post('/api/agent/coaching-logs/:id/rate', async (req, res) => {
  const { id } = req.params;
  const { rating = 1, tenantKey = 'default' } = req.body;

  try {
    await turso.rateCoachingLog(tenantKey, id, rating);
    res.json({ success: true, id, rating });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Endpoint to expose Google Maps Platform Key to the client
app.get('/api/config/maps', (req, res) => {
  const key = process.env['VITE_GOOGLE_MAPS_API_KEY'] || 
              process.env['GOOGLE_MAPS_PLATFORM_KEY'] || 
              process.env['GOOGLE_MAPS_API_KEY'] || 
              'AIzaSyDa_OOujU7JQcu2wPm5qoVJubDAAgVbADA';
  res.json({ key });
});

// Proxy route for Geocoding API to prevent client CORS issues
app.get('/api/maps/geocode', async (req, res) => {
  const address = req.query['address'] as string;
  if (!address) {
    res.status(400).json({ error: 'Address query parameter is required' });
    return;
  }
  const apiKey = process.env['VITE_GOOGLE_MAPS_API_KEY'] || 
                 process.env['GOOGLE_MAPS_PLATFORM_KEY'] || 
                 process.env['GOOGLE_MAPS_API_KEY'] || 
                 'AIzaSyDa_OOujU7JQcu2wPm5qoVJubDAAgVbADA';

  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Geocoding proxy error:', err);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
});

// AI Knowledge Base Assistance Endpoint (Summarize, Extract Action Items, Smart Tagging, Markdown Polish)
app.post('/api/gemini/notes/ai-assist', async (req, res) => {
  const { action = 'summarize', content = '', title = '' } = req.body;
  if (!content.trim()) {
    res.status(400).json({ error: 'Note content is required' });
    return;
  }

  const promptMap: Record<string, string> = {
    summarize: `Summarize the following note into a concise executive summary with bullet points:\nTitle: ${title}\nContent:\n${content}`,
    action_items: `Extract all actionable tasks, assignments, deadlines, and decision items from this note as a checkable task list:\nTitle: ${title}\nContent:\n${content}`,
    auto_tag: `Analyze this note and suggest 3-5 high-relevance topic tags (e.g. Strategy, SLA, Security, Product, Q3, Executive). Output ONLY JSON: {"tags": ["tag1", "tag2"]}\nTitle: ${title}\nContent:\n${content}`,
    expand: `Expand this draft outline into a well-structured, professional executive brief with headings, key takeaways, and strategic recommendations in Markdown:\nTitle: ${title}\nContent:\n${content}`,
    format_markdown: `Clean up and format the following text into clear, modern Markdown with bold headings, bullet points, and code blocks where applicable:\nTitle: ${title}\nContent:\n${content}`
  };

  const selectedPrompt = promptMap[action] || promptMap['summarize'];

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: selectedPrompt,
        config: action === 'auto_tag' ? { responseMimeType: 'application/json' } : undefined
      });

      const text = response.text || '';
      if (action === 'auto_tag') {
        try {
          const parsed = JSON.parse(text);
          res.json({ tags: parsed.tags || ['Executive', 'Strategy'] });
          return;
        } catch {
          res.json({ tags: ['Strategy', 'Notes', 'Executive'] });
          return;
        }
      }
      res.json({ result: text });
      return;
    } catch (err) {
      console.error('Error in AI Note Assist:', err);
    }
  }

  // Smart Simulated Fallbacks if GEMINI_API_KEY is unconfigured or call fails
  if (action === 'auto_tag') {
    res.json({ tags: ['Strategy', 'Executive', 'ActionRequired'] });
  } else if (action === 'action_items') {
    res.json({ result: `### Action Items & Deliverables\n- [ ] Finalize Q3 SLA terms with partner executive\n- [ ] Schedule follow-up architecture review\n- [ ] Audit compliance benchmarks before deployment` });
  } else if (action === 'expand') {
    res.json({ result: `## ${title || 'Executive Brief'}\n\n### Executive Summary\n${content}\n\n### Strategic Recommendations\n1. Align cross-functional stakeholders on milestone dates.\n2. Monitor latency metrics during trial period.` });
  } else {
    res.json({ result: `### Executive Takeaways\n- **Key Topic**: ${title || 'Strategy Overview'}\n- **Core Insight**: ${content.slice(0, 150)}...\n- **Status**: Active review required.` });
  }
});

// AI Knowledge RAG Search Endpoint
app.post('/api/gemini/notes/rag-ask', async (req, res) => {
  const { query = '', notes = [] } = req.body;
  if (!query.trim()) {
    res.status(400).json({ error: 'Search query is required' });
    return;
  }

  const contextText = notes
    .map((n: { title: string; content: string; tags?: string[] }, idx: number) => `[Entry ${idx + 1}] Title: ${n.title}\nTags: ${(n.tags || []).join(', ')}\nContent: ${n.content}\n---`)
    .join('\n');

  const prompt = `You are the ΛΞVOS Knowledge Base AI Assistant. Answer the user's question using ONLY the provided Knowledge Base entries.
User Question: "${query}"

Knowledge Base Context:
${contextText || 'No notes available.'}

Provide a direct, authoritative, and helpful answer citing the entry titles where applicable.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });
      res.json({ answer: response.text || 'No relevant knowledge entries found.' });
      return;
    } catch (err) {
      console.error('Error in KB RAG search:', err);
    }
  }

  res.json({
    answer: `Based on your Knowledge Base entries:\n\nRegarding "${query}", your notes emphasize prioritizing contract execution, tracking SLA velocity, and maintaining executive alignment across accounts.`
  });
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
