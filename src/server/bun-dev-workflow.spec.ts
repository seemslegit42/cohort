import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '../..');

describe('Dev workflow (Bun HMR fullstack + parallel Angular watch)', () => {
  it('scripts/dev.ts runs Bun.serve + ng build --watch in parallel (no startup gate)', () => {
    const dev = readFileSync(join(root, 'scripts/dev.ts'), 'utf8');
    expect(dev).toContain('dev-server.ts');
    expect(dev).toContain('build --watch');
    expect(dev).toContain('@angular/cli/bin/ng.js');
    expect(dev).not.toMatch(/\bng serve\b/);
    expect(dev).not.toContain('Timed out waiting');
  });

  it('scripts/dev-server.ts uses Bun fullstack development HMR', () => {
    const ui = readFileSync(join(root, 'scripts/dev-server.ts'), 'utf8');
    expect(ui).toContain('Bun.serve');
    expect(ui).toContain('hmr: true');
    expect(ui).toContain('createExpressApp');
    expect(ui).not.toContain('process.exit(1)');
  });

  it('scripts/dev-angular.ts is optional ng serve path', () => {
    const alt = readFileSync(join(root, 'scripts/dev-angular.ts'), 'utf8');
    expect(alt).toContain('ng serve');
    expect(alt).toContain('api-main.ts');
  });

  it('package.json default dev uses orchestrator script', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['dev']).toBe('bun scripts/dev.ts');
    expect(pkg.scripts['dev:angular']).toBe('bun scripts/dev-angular.ts');
  });

  it('compile:ssr script exists for bun compile Angular SSR', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['compile:ssr']).toBe('bun scripts/compile-ssr.ts');
  });
});
