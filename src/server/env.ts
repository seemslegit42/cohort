export const skipSsrEnvVar = 'LXV_SKIP_SSR';

export function shouldSkipAngularSsr(): boolean {
  return process.env[skipSsrEnvVar] === '1';
}

export function isProduction(): boolean {
  return process.env['NODE_ENV'] === 'production';
}

export function allowDemoData(): boolean {
  return process.env['ALLOW_DEMO_DATA'] === 'true' || process.env['ALLOW_DEMO_DATA'] === '1';
}

export class AppwriteUnavailableError extends Error {
  code = 'APPWRITE_UNAVAILABLE' as const;
  constructor(message = 'Appwrite database is unavailable') {
    super(message);
    this.name = 'AppwriteUnavailableError';
  }
}
