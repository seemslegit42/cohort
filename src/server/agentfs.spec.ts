import { describe, expect, it } from 'bun:test';
import {
  DEFAULT_AGENT_TENANT,
  getAgentFsDatabasePath,
  sanitizeAgentTenantKey,
} from './agentfs';

describe('agentfs tenant helpers', () => {
  it('sanitizes tenant keys for AgentFS ids', () => {
    expect(sanitizeAgentTenantKey('laevos-crm')).toBe('laevos-crm');
    expect(sanitizeAgentTenantKey('team/with spaces')).toBe('team_with_spaces');
    expect(sanitizeAgentTenantKey('')).toBe('laevos-crm');
  });

  it('resolves database path under .agentfs', () => {
    const path = getAgentFsDatabasePath('laevos-crm');
    expect(path).toContain('.agentfs');
    expect(path.endsWith('laevos-crm.db')).toBe(true);
  });
});
