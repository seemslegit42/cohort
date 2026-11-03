import { describe, expect, it } from 'bun:test';
import { APPWRITE_PROJECT_ID, sessionCookieName } from './config';
import { createSessionClient, getAdminClient } from './appwrite-clients';

describe('Appwrite clients (SSR / TablesDB)', () => {
  it('uses a_session_<PROJECT_ID> cookie name per Appwrite SSR auth', () => {
    expect(sessionCookieName()).toBe(`a_session_${APPWRITE_PROJECT_ID}`);
  });

  it('returns a singleton admin client with endpoint and project', () => {
    const a = getAdminClient();
    const b = getAdminClient();
    expect(a).toBe(b);
  });

  it('creates a distinct session client per secret', () => {
    const one = createSessionClient('secret-one', 'TestAgent/1.0');
    const two = createSessionClient('secret-two');
    expect(one).not.toBe(two);
  });
});
