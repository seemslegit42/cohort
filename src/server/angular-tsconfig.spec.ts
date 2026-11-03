import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Angular app tsconfig', () => {
  it('excludes server-only TypeScript from the browser compilation graph', () => {
    const raw = readFileSync(join(import.meta.dir, '../../tsconfig.app.json'), 'utf8');
    expect(raw).toContain('"src/server/**/*.ts"');
    expect(raw).toContain('"src/server.ts"');
  });
});
