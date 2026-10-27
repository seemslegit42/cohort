import { AgentFS } from 'agentfs-sdk';
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const DEFAULT_AGENT_TENANT = process.env['AGENT_DEFAULT_TENANT'] || 'laevos-crm';

export function sanitizeAgentTenantKey(tenantKey: string): string {
  const trimmed = (tenantKey || DEFAULT_AGENT_TENANT).trim();
  const sanitized = trimmed.replace(/[^a-zA-Z0-9_-]/g, '_');
  return sanitized || 'laevos-crm';
}

export function getAgentFsRoot(): string {
  return process.env['AGENTFS_DIR'] ? resolve(process.env['AGENTFS_DIR']) : resolve(process.cwd(), '.agentfs');
}

export function getAgentFsDatabasePath(tenantKey: string): string {
  const id = sanitizeAgentTenantKey(tenantKey);
  return resolve(getAgentFsRoot(), `${id}.db`);
}

export function legacyAgentDatabasePath(tenantKey: string): string {
  const id = sanitizeAgentTenantKey(tenantKey);
  return resolve(process.cwd(), `agent_tenant_${id}.db`);
}

export function migrateLegacyAgentDatabaseIfNeeded(tenantKey: string): void {
  const target = getAgentFsDatabasePath(tenantKey);
  if (existsSync(target)) {
    return;
  }
  const legacy = legacyAgentDatabasePath(tenantKey);
  if (!existsSync(legacy)) {
    return;
  }
  try {
    copyFileSync(legacy, target);
    console.info(`[AgentFS] Migrated legacy agent DB to ${target}`);
  } catch (err) {
    console.warn('[AgentFS] Could not migrate legacy agent database:', err);
  }
}

function resolveOpenOptions(tenantKey: string): { id: string; path?: string } {
  const id = sanitizeAgentTenantKey(tenantKey);
  const url = process.env['AGENT_LIBSQL_URL'];

  if (url?.startsWith('file:')) {
    return { id, path: resolve(url.replace(/^file:/, '')) };
  }

  const remoteUrl = url && !url.startsWith('file:');
  const hasRemote =
    remoteUrl ||
    (process.env['TURSO_DATABASE_URL'] && process.env['TURSO_AUTH_TOKEN']);
  if (hasRemote) {
    return { id };
  }

  migrateLegacyAgentDatabaseIfNeeded(id);
  return { id, path: getAgentFsDatabasePath(id) };
}

const agentInstances = new Map<string, Promise<AgentFS>>();

/** AgentFS SDK: tool audit timeline, kv, and virtual fs in the same SQLite DB as LibSQL domain tables. */
export async function getTenantAgentFS(tenantKey: string): Promise<AgentFS> {
  const id = sanitizeAgentTenantKey(tenantKey);
  let pending = agentInstances.get(id);
  if (!pending) {
    pending = AgentFS.open(resolveOpenOptions(id));
    agentInstances.set(id, pending);
  }
  return pending;
}

export async function recordAgentTool(
  tenantKey: string,
  name: string,
  startedAtSec: number,
  parameters?: unknown,
  result?: unknown,
  error?: string
): Promise<number> {
  const agent = await getTenantAgentFS(tenantKey);
  return agent.tools.record(
    name,
    startedAtSec,
    Date.now() / 1000,
    parameters,
    result,
    error
  );
}
