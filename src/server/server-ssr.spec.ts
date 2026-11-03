import { describe, expect, it } from 'bun:test';
import express from 'express';
import { attachAngularSsr } from './server-ssr';

describe('attachAngularSsr', () => {
  it('accepts an injectable SSR engine factory (production uses AngularNodeAppEngine)', async () => {
    const app = express();
    await attachAngularSsr(app, '/tmp/browser-dist', () => ({
      handle: async () => null,
    }));
    expect(app).toBeDefined();
  });
});
