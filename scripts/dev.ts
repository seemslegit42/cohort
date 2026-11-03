#!/usr/bin/env bun
/**
 * Default dev — Bun fullstack HMR on :3000 + Angular watch (parallel, no startup gate):
 * 1. `ng build --watch` → dist/app/browser (Angular still compiles the app; Bun serves the output)
 * 2. `bun --hot scripts/dev-server.ts` — Bun.serve `development: { hmr, console }` + embedded /api
 *
 * Faster Angular incremental server (not Bun HMR): `bun run dev:angular`
 */
import { join } from 'node:path';
import { spawn, type Subprocess } from 'bun';

const root = join(import.meta.dir, '..');
const ngCli = join(root, 'node_modules/@angular/cli/bin/ng.js');
const children: Subprocess[] = [];

const devEnv: Record<string, string | undefined> = {
  ...process.env,
  NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--max-old-space-size=8192',
  NG_CLI_ANALYTICS: 'false',
  NG_CLI_CACHE: process.env.NG_CLI_CACHE ?? '1',
};
delete devEnv['NG_DISABLE_CACHE'];

function shutdown(code = 0): void {
  for (const child of children) {
    try {
      child.kill();
    } catch {
      /* exited */
    }
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

const watchBuild = spawn(
  ['node', ngCli, 'build', '--watch', '--configuration', 'development'],
  {
    cwd: root,
    env: devEnv,
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  },
);
children.push(watchBuild);

const fullstack = spawn(['bun', '--hot', 'scripts/dev-server.ts'], {
  cwd: root,
  env: devEnv,
  stdout: 'inherit',
  stderr: 'inherit',
  stdin: 'inherit',
});
children.push(fullstack);

console.log('[lxv dev] UI/API → Bun.serve :3000 (HMR) + embedded /api');
console.log('[lxv dev] Angular → ng build --watch → dist/app/browser (runs in parallel)');

const code = await Promise.race([watchBuild.exited, fullstack.exited]);
shutdown(typeof code === 'number' ? code : 1);
