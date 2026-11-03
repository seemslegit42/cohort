import { describe, expect, it } from 'bun:test';
import { Query } from 'node-appwrite';
import { appendTeamIdQuery, readTeamIdFromRequest } from './team-query';

describe('team-scoped TablesDB queries', () => {
  it('appendTeamIdQuery adds Query.equal on teamId', () => {
    const queries = appendTeamIdQuery('team-abc', [Query.limit(10)]);
    expect(queries.length).toBe(2);
    expect(queries[1]).toBe(Query.equal('teamId', 'team-abc'));
  });

  it('readTeamIdFromRequest prefers validated activeTeamId over header', () => {
    expect(readTeamIdFromRequest('from-session', 'from-header')).toBe('from-session');
    expect(readTeamIdFromRequest(undefined, 'from-header')).toBe('from-header');
    expect(readTeamIdFromRequest(undefined, undefined)).toBeUndefined();
  });
});
