#!/usr/bin/env bun
/**
 * Optional: Angular dev server incremental rebuilds (not Bun import.meta.hot).
 * Bun hot API on :3001; UI on :3000 via ng serve + proxy.conf.json.
 */
import { join } from 'node:path';
import { spawn, type Subprocess } from 'bun';

const root = join(import.meta.dir, '..');
const ngCli = join(root, 'node_modules/@angular/cli/bin/ng.js');
const apiEntry = join(root, 'src/server/api-main.ts');
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

const api = spawn(['bun', '--hot', apiEntry], {
  cwd: root,
  env: { ...devEnv, PORT: '3001', API_HOST: '127.0.0.1' },
  stdout: 'inherit',
  stderr: 'inherit',
  stdin: 'inherit',
});
children.push(api);

const ui = spawn(
  [
    'node',
    ngCli,
    'serve',
    '--configuration',
    'development',
    '--port',
    '3000',
    '--host',
    '127.0.0.1',
  ],
  {
    cwd: root,
    env: devEnv,
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  },
);
children.push(ui);

console.log('[lxv dev:angular] API → bun --hot :3001');
console.log('[lxv dev:angular] UI  → ng serve :3000');

const code = await Promise.race([api.exited, ui.exited]);
shutdown(typeof code === 'number' ? code : 1);
