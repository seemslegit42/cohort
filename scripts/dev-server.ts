#!/usr/bin/env bun
/**
 * Bun fullstack dev server (not Angular CLI debug server):
 * - `Bun.serve` with development HMR + browser console forwarding
 * - Embedded Express API (same process) for `/api/*`
 * - Angular CSR bundle from `ng build --watch` → `dist/app/browser`
 */
import { createServer, type Server } from 'node:http';
import { existsSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { createExpressApp } from '../src/server/express-app';

const root = join(import.meta.dir, '..');
const browserDir = join(root, 'dist/app/browser');
const host = process.env['DEV_HOST'] ?? '127.0.0.1';
const port = Number(process.env['DEV_PORT']) || 3000;

function safeFilePath(pathname: string): string | null {
  const rel = decodeURIComponent(pathname.split('?')[0] ?? '/');
  const normalized = normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '');
  const full = join(browserDir, normalized === '/' ? 'index.html' : normalized);
  if (!full.startsWith(browserDir)) {
    return null;
  }
  return full;
}

async function resolveApiOrigin(): Promise<{ origin: string; server: Server | null }> {
  const external = process.env['API_ORIGIN'];
  if (external) {
    return { origin: external, server: null };
  }

  const app = createExpressApp();
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address();
  if (!addr || typeof addr === 'string') {
    throw new Error('[lxv dev] Failed to bind embedded API server');
  }

  return { origin: `http://127.0.0.1:${addr.port}`, server };
}

const { origin: apiOrigin, server: apiServer } = await resolveApiOrigin();

function shutdown(): void {
  apiServer?.close();
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});
process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

const indexPath = join(browserDir, 'index.html');
const hasBundle = existsSync(indexPath);

const buildingPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>ΛΞV CRM — building…</title>
  <meta http-equiv="refresh" content="3" />
  <style>
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #e4e4e7;
      display: grid; place-items: center; min-height: 100vh; margin: 0; }
  </style>
</head>
<body>
  <p>Angular watch build in progress… this page refreshes when <code>dist/app/browser</code> is ready.</p>
</body>
</html>`;

if (!hasBundle) {
  console.warn(
    `[lxv dev] No ${indexPath} yet — Bun.serve is up; UI loads when ng build --watch finishes.`,
  );
}

const bunDev =
  process.env['BUN_DEV'] === '0'
    ? false
    : {
        hmr: true,
        console: true,
      };

Bun.serve({
  hostname: host,
  port,
  development: bunDev,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname.startsWith('/api')) {
      const target = new URL(`${url.pathname}${url.search}`, apiOrigin);
      return fetch(
        new Request(target, {
          method: req.method,
          headers: req.headers,
          body: req.body,
          duplex: 'half',
        } as RequestInit),
      );
    }

    const filePath = safeFilePath(url.pathname);
    if (filePath && existsSync(filePath)) {
      return new Response(Bun.file(filePath));
    }

    if (existsSync(indexPath)) {
      return new Response(Bun.file(indexPath));
    }

    return new Response(buildingPage, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
});

console.log(`[lxv dev] Bun fullstack http://${host}:${port} → ${browserDir}`);
console.log(`[lxv dev] /api → ${apiOrigin} (embedded Express)`);
