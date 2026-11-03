import { Client } from 'node-appwrite';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from './config';

let adminClient: Client | undefined;

/**
 * Admin client (API key) — singleton for server-side auth and TablesDB.
 * Matches Appwrite SSR guidance: reusable admin client with setKey().
 */
export function getAdminClient(): Client {
  if (!adminClient) {
    adminClient = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID);
    const key = process.env['APPWRITE_API_KEY'];
    if (key) {
      adminClient.setKey(key);
    }
  }
  return adminClient;
}

/**
 * Session client — create per request; never share across users.
 * Optionally forward the browser user-agent for Appwrite session diagnostics.
 */
export function createSessionClient(
  sessionSecret: string,
  forwardedUserAgent?: string,
): Client {
  const sessionClient = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setSession(sessionSecret);

  if (forwardedUserAgent) {
    sessionClient.setForwardedUserAgent(forwardedUserAgent);
  }

  return sessionClient;
}
