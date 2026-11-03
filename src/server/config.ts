import { APPWRITE_DATABASE_ID } from './appwrite-schema';

export const APPWRITE_ENDPOINT =
  process.env['APPWRITE_ENDPOINT'] || 'https://tor.cloud.appwrite.io/v1';

export const APPWRITE_PROJECT_ID =
  process.env['APPWRITE_PROJECT_ID'] || '6990e2830030cacccd98';

export const APPWRITE_DATABASE_ID_ENV =
  process.env['APPWRITE_DATABASE_ID'] || APPWRITE_DATABASE_ID;

export function sessionCookieName(): string {
  return `a_session_${APPWRITE_PROJECT_ID}`;
}

/** Canonical CRM tables (matches APPWRITE_TABLES). */
export const CRM_COLLECTIONS = [
  'leads',
  'contacts',
  'tasks',
  'notes',
  'notifications',
  'contracts',
  'emails',
  'events',
  'chatMessages',
  'email_workflows',
  'newsletter_subscribers',
] as const;

export type CrmCollectionId = (typeof CRM_COLLECTIONS)[number];
