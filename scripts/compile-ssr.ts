#!/usr/bin/env bun
/**
 * Bun compile for Angular SSR output (Bun docs: Libraries → Frameworks → Angular).
 * Requires production build first (`bun run build`).
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const serverEntry = join(root, 'dist/app/server/server.mjs');
const browserDir = join(root, 'dist/app/browser');
const serverDir = join(root, 'dist/app/server');
const outFile = join(root, 'dist/lxv-crm');

function listMjsExceptServer(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name);
    if (name.isDirectory()) {
      out.push(...listMjsExceptServer(full));
    } else if (name.name.endsWith('.mjs') && name.name !== 'server.mjs') {
      out.push(full);
    }
  }
  return out;
}

if (!existsSync(serverEntry)) {
  console.error('Run `bun run build` first (production SSR artifact).');
  process.exit(1);
}

const pageChunks = listMjsExceptServer(serverDir);

const proc = Bun.spawn(
  [
    'bun',
    'compile',
    serverEntry,
    ...pageChunks,
    '--asset',
    browserDir,
    '--asset',
    serverDir,
    '--outfile',
    outFile,
  ],
  { cwd: root, stdout: 'inherit', stderr: 'inherit' },
);

process.exit(await proc.exited);
