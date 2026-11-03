import { afterEach, describe, expect, it } from 'bun:test';
import {
  allowDemoData,
  shouldSkipAngularSsr,
  skipSsrEnvVar,
} from './env';

describe('server env (Bun dev / API-only)', () => {
  const priorSkip = process.env[skipSsrEnvVar];
  const priorDemo = process.env['ALLOW_DEMO_DATA'];

  afterEach(() => {
    if (priorSkip === undefined) {
      delete process.env[skipSsrEnvVar];
    } else {
      process.env[skipSsrEnvVar] = priorSkip;
    }
    if (priorDemo === undefined) {
      delete process.env['ALLOW_DEMO_DATA'];
    } else {
      process.env['ALLOW_DEMO_DATA'] = priorDemo;
    }
  });

  it('shouldSkipAngularSsr is true only when LXV_SKIP_SSR=1', () => {
    delete process.env[skipSsrEnvVar];
    expect(shouldSkipAngularSsr()).toBe(false);

    process.env[skipSsrEnvVar] = '1';
    expect(shouldSkipAngularSsr()).toBe(true);

    process.env[skipSsrEnvVar] = 'true';
    expect(shouldSkipAngularSsr()).toBe(false);
  });

  it('allowDemoData accepts true and 1', () => {
    process.env['ALLOW_DEMO_DATA'] = 'true';
    expect(allowDemoData()).toBe(true);
    process.env['ALLOW_DEMO_DATA'] = '1';
    expect(allowDemoData()).toBe(true);
    process.env['ALLOW_DEMO_DATA'] = 'false';
    expect(allowDemoData()).toBe(false);
  });
});
