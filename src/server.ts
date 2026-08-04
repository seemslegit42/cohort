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

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json());

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

// AI Low-Latency Endpoint (gemini-3.1-flash-lite)
app.post('/api/gemini/generate-lite', async (req, res) => {
  const { prompt, systemInstruction } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'Missing prompt' });
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
    res.json({ text: response.text || '' });
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

    res.json({ text, citations });
  } catch (error) {
    console.error('Error in generate-search API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Gemini Grounded Search Failed';
    res.status(500).json({ error: errorMessage });
  }
});

const angularApp = new AngularNodeAppEngine();

const collections = ['leads', 'contracts', 'contacts', 'tasks', 'notifications', 'chatMessages', 'notes', 'events', 'emails', 'workflows'];
collections.forEach((collection) => {
  const table = db[collection as keyof typeof db];
  
  app.get(`/api/${collection}`, async (req, res) => {
    try {
      const items = await table.list();
      res.json({ items });
    } catch {
      res.status(500).json({ error: `Failed to fetch ${collection}` });
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
