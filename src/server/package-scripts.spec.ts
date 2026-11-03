import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const pkg = JSON.parse(
  readFileSync(join(import.meta.dir, '../../package.json'), 'utf8'),
) as {
  packageManager?: string;
  scripts: Record<string, string>;
};

describe('package scripts (Bun-first dev)', () => {
  it('pins bun package manager', () => {
    expect(pkg.packageManager).toBe('bun@1.4.2');
  });

  it('routes Angular CLI through Node (Bun breaks SSR route extraction)', () => {
    expect(pkg.scripts['ng']).toMatch(/^node /);
    expect(pkg.scripts['ng']).toContain('@angular/cli/bin/ng.js');
    expect(pkg.scripts['build']).toContain('NODE_OPTIONS');
    expect(pkg.scripts['build']).toContain('bun run ng');
  });

  it('does not put ng serve in package.json scripts (orchestrator spawns it)', () => {
    for (const script of Object.values(pkg.scripts)) {
      expect(script).not.toContain('ng serve');
    }
  });

  it('default dev uses Bun orchestrator', () => {
    expect(pkg.scripts['dev']).toBe('bun scripts/dev.ts');
    expect(pkg.scripts['dev:ui']).toBe('bun scripts/dev-server.ts');
    expect(pkg.scripts['dev:api']).toContain('bun --hot');
    expect(pkg.scripts['serve:ssr:app']).toMatch(/^bun /);
  });

  it('test:server runs bun test on server specs', () => {
    expect(pkg.scripts['test:server']).toBe('bun test ./src/server');
  });
});
