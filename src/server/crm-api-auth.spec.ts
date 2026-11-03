import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawn, type Subprocess } from 'bun';

describe('CRM list API (team-scoped, no demo fallback)', () => {
  let proc: Subprocess | null = null;
  let baseUrl = '';

  beforeAll(async () => {
    const port = 13301 + Math.floor(Math.random() * 500);
    baseUrl = `http://127.0.0.1:${port}`;

    proc = spawn(['bun', 'src/server/api-main.ts'], {
      env: {
        ...process.env,
        PORT: String(port),
        ALLOW_DEMO_DATA: 'false',
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
        /* booting */
      }
      await Bun.sleep(200);
    }
    throw new Error('API server did not start');
  }, 35_000);

  afterAll(() => {
    proc?.kill();
  });

  it('GET /api/leads without session returns 401 AUTH_REQUIRED', async () => {
    const res = await fetch(`${baseUrl}/api/leads`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe('AUTH_REQUIRED');
  });
});
