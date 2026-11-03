import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const angularJson = JSON.parse(
  readFileSync(join(import.meta.dir, '../../angular.json'), 'utf8'),
) as {
  projects: {
    app: {
      architect: {
        build: {
          options: Record<string, unknown>;
          configurations: Record<string, Record<string, unknown>>;
        };
        serve: {
          options: Record<string, unknown>;
          configurations: Record<string, Record<string, unknown>>;
        };
      };
    };
  };
};

const build = angularJson.projects.app.architect.build;
const serve = angularJson.projects.app.architect.serve;

describe('Angular build config (fast CSR dev + production SSR)', () => {
  it('production path keeps hybrid server output with SSR entry', () => {
    const prod = build.configurations['production'];
    expect(prod['outputMode']).toBe('server');
    const ssr = prod['ssr'] as { entry?: string };
    expect(ssr?.entry).toBe('src/server.ts');
    expect(prod['server']).toBe('src/main.server.ts');
  });

  it('base build options are browser-only (SSR only in named configs)', () => {
    expect(build.options['outputMode']).toBeUndefined();
    expect(build.options['server']).toBeUndefined();
    expect(build.options['ssr']).toBeUndefined();
  });

  it('development config disables SSR/prerender and uses static output (valid ng build)', () => {
    const dev = build.configurations['development'];
    expect(dev).toBeDefined();
    expect(dev['ssr']).toBe(false);
    expect(dev['prerender']).toBe(false);
    expect(dev['outputMode']).toBe('static');
  });

  it('development-ssr config keeps server bundle for integrated SSR dev', () => {
    const devSsr = build.configurations['development-ssr'];
    expect(devSsr).toBeDefined();
    expect(devSsr['prerender']).toBe(false);
    const ssr = devSsr['ssr'] as { entry?: string };
    expect(ssr?.entry).toBe('src/server.ts');
  });

  it('dev server proxies /api to local API port', () => {
    expect(serve.options['proxyConfig']).toBe('proxy.conf.json');
    const proxy = JSON.parse(
      readFileSync(join(import.meta.dir, '../../proxy.conf.json'), 'utf8'),
    ) as Record<string, { target?: string }>;
    expect(proxy['/api']?.target).toBe('http://127.0.0.1:3001');
  });

  it('production externalizes heavy server deps (faster SSR server compile)', () => {
    const prod = build.configurations['production'];
    const external = prod['externalDependencies'] as string[];
    expect(external).toContain('express');
    expect(external).toContain('node-appwrite');
    expect(external).toContain('@google/genai');
  });

  it('CLI cache is enabled for faster rebuilds', () => {
    const cli = JSON.parse(
      readFileSync(join(import.meta.dir, '../../angular.json'), 'utf8'),
    ).cli as { cache?: { enabled?: boolean } };
    expect(cli.cache?.enabled).toBe(true);
  });

  it('dev server binds to localhost by default (not 0.0.0.0)', () => {
    expect(serve.options['host']).toBe('localhost');
  });
});
