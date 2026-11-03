import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawn, type Subprocess } from 'bun';

/**
 * Integration: API-only process (LXV_SKIP_SSR=1) must boot and serve /api routes.
 */
describe('API-only server (LXV_SKIP_SSR=1)', () => {
  let proc: Subprocess | null = null;
  let baseUrl = '';

  beforeAll(async () => {
    const port = 13101 + Math.floor(Math.random() * 500);
    baseUrl = `http://127.0.0.1:${port}`;

    proc = spawn(['bun', 'src/server/api-main.ts'], {
      env: {
        ...process.env,
        LXV_SKIP_SSR: '1',
        PORT: String(port),
        NODE_ENV: 'test',
      },
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${baseUrl}/api/mcp/status`);
        if (res.ok) {
          return;
        }
      } catch {
        /* not up yet */
      }
      await Bun.sleep(200);
    }
    throw new Error('API-only server did not become ready within 30s');
  }, 35_000);

  afterAll(() => {
    proc?.kill();
  });

  it('responds on MCP status without Angular SSR', async () => {
    const res = await fetch(`${baseUrl}/api/mcp/status`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      server?: { name?: string };
      serverUrl?: string;
    };
    expect(typeof body.server?.name).toBe('string');
    expect(body.server!.name!.length).toBeGreaterThan(0);
  });
});
