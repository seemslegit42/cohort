import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '../..');

describe('Appwrite development rules (JS/TS server)', () => {
  it('provisions schema via scripts/setup-database.ts and bun run db:setup', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['db:setup']).toBe('bun scripts/setup-database.ts');
    const setup = readFileSync(join(root, 'scripts/setup-database.ts'), 'utf8');
    expect(setup).toContain('APPWRITE_TABLES');
    expect(setup).toContain('getAdminClient');
  });

  it('centralizes admin/session clients in appwrite-clients.ts', () => {
    const src = readFileSync(join(import.meta.dir, 'appwrite-clients.ts'), 'utf8');
    expect(src).toContain('getAdminClient');
    expect(src).toContain('createSessionClient');
    expect(src).not.toContain('console.log');
  });

  it('auth router exposes SSR session routes including teams', () => {
    const routes = readFileSync(join(import.meta.dir, 'routes/auth.routes.ts'), 'utf8');
    expect(routes).toContain("router.post('/login'");
    expect(routes).toContain("router.get('/teams'");
  });

  it('auth uses HttpOnly a_session_<PROJECT_ID> cookies via sessionCookieName()', () => {
    const auth = readFileSync(join(import.meta.dir, 'auth.ts'), 'utf8');
    expect(auth).toContain('sessionCookieName()');
    expect(auth).toContain("sameSite: 'strict'");
    expect(auth).toContain('httpOnly: true');
  });

  it('db layer exposes listByTeam for tenant isolation', () => {
    const dbSrc = readFileSync(join(import.meta.dir, 'db.ts'), 'utf8');
    expect(dbSrc).toContain('listByTeam');
    expect(dbSrc).toContain('appendTeamIdQuery');
  });

  it('row permissions use Role.team via buildRowPermissions', () => {
    const schema = readFileSync(join(import.meta.dir, 'appwrite-schema.ts'), 'utf8');
    expect(schema).toContain('Role.team');
    expect(schema).toContain('buildRowPermissions');
  });
});
