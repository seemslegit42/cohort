import { Query } from 'node-appwrite';

/** Every multi-tenant TablesDB list MUST filter by teamId (Appwrite multi-tenancy). */
export function appendTeamIdQuery(teamId: string, queries: string[] = []): string[] {
  return [...queries, Query.equal('teamId', teamId)];
}

export function readTeamIdFromRequest(
  activeTeamId: string | undefined,
  headerValue: string | string[] | undefined,
): string | undefined {
  if (activeTeamId?.trim()) {
    return activeTeamId.trim();
  }
  if (typeof headerValue === 'string' && headerValue.trim()) {
    return headerValue.trim();
  }
  return undefined;
}
