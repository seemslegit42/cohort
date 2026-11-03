import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawn, type Subprocess } from 'bun';

describe('Auth routes (Appwrite SSR cookie flow)', () => {
  let proc: Subprocess | null = null;
  let baseUrl = '';

  beforeAll(async () => {
    const port = 13201 + Math.floor(Math.random() * 500);
    baseUrl = `http://127.0.0.1:${port}`;

    proc = spawn(['bun', 'src/server/api-main.ts'], {
      env: { ...process.env, PORT: String(port), NODE_ENV: 'test' },
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
        /* starting */
      }
      await Bun.sleep(200);
    }
    throw new Error('API server did not start');
  }, 35_000);

  afterAll(() => {
    proc?.kill();
  });

  it('GET /api/auth/me without session returns 401 AUTH_REQUIRED', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe('AUTH_REQUIRED');
  });

  it('GET /api/auth/teams without session returns 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/teams`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe('AUTH_REQUIRED');
  });
});
