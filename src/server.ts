import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { db } from './server/db';


const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json());

const angularApp = new AngularNodeAppEngine();

const collections = ['leads', 'contracts', 'contacts', 'tasks', 'notifications', 'chatMessages'];
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
