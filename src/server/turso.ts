import { createClient, type Client as LibsqlClient } from '@libsql/client';
import {
  DEFAULT_AGENT_TENANT,
  getAgentFsDatabasePath,
  migrateLegacyAgentDatabaseIfNeeded,
  sanitizeAgentTenantKey,
} from './agentfs';

export interface AgentCoachingLogRow {
  id: string;
  lead_id: string;
  lead_name: string;
  persona: string;
  interaction_type: string;
  user_input: string | null;
  coaching_tip: string;
  witty_retort: string | null;
  psychological_insight: string | null;
  cringe_score: number;
  flagged_cliches: string | null;
  beep_commentary: string | null;
  feedback_rating: number;
  created_at: string;
}

export interface AgentConversationHistoryRow {
  id: string;
  session_id: string;
  lead_id: string | null;
  role: string;
  content: string;
  reasoning_log: string | null;
  timestamp: string;
}

const clientCache = new Map<string, LibsqlClient>();

/**
 * LibSQL client for agent/AI domain tables (coaching logs, conversation history, rules).
 * Shares the same SQLite file as AgentFS (`.agentfs/{tenant}.db`) locally, or Turso Cloud when configured.
 */
export function getTenantLibsqlClient(tenantKey = DEFAULT_AGENT_TENANT): LibsqlClient {
  const id = sanitizeAgentTenantKey(tenantKey);
  const cached = clientCache.get(id);
  if (cached) {
    return cached;
  }

  const agentUrl = process.env['AGENT_LIBSQL_URL'];
  const agentToken = process.env['AGENT_LIBSQL_AUTH_TOKEN'];

  let client: LibsqlClient;

  if (agentUrl && !agentUrl.startsWith('file:')) {
    client = createClient({
      url: agentUrl,
      authToken: agentToken,
    });
  } else {
    const legacyUrl = process.env['TURSO_DATABASE_URL'];
    const legacyToken = process.env['TURSO_AUTH_TOKEN'];
    if (legacyUrl && legacyToken) {
      client = createClient({
        url: legacyUrl,
        authToken: legacyToken,
      });
    } else {
      migrateLegacyAgentDatabaseIfNeeded(id);
      const filePath =
        agentUrl?.startsWith('file:')
          ? agentUrl.replace(/^file:/, '')
          : getAgentFsDatabasePath(id);
      client = createClient({
        url: `file:${filePath}`,
      });
    }
  }

  clientCache.set(id, client);
  return client;
}

/** @deprecated alias for callers that still use the old name */
export const getTenantTursoClient = getTenantLibsqlClient;

/** Provision agent domain tables on the tenant LibSQL database (same DB file as AgentFS when local). */
export async function initTenantTursoSchema(tenantKey = DEFAULT_AGENT_TENANT): Promise<void> {
  const db = getTenantLibsqlClient(tenantKey);

  await db.batch([
    `CREATE TABLE IF NOT EXISTS agent_coaching_logs (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      lead_name TEXT NOT NULL,
      persona TEXT NOT NULL,
      interaction_type TEXT NOT NULL,
      user_input TEXT,
      coaching_tip TEXT NOT NULL,
      witty_retort TEXT,
      psychological_insight TEXT,
      cringe_score REAL DEFAULT 0.0,
      flagged_cliches TEXT,
      beep_commentary TEXT,
      feedback_rating INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS agent_conversation_history (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      lead_id TEXT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      reasoning_log TEXT,
      timestamp TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS agent_sales_rules (
      id TEXT PRIMARY KEY,
      persona_key TEXT NOT NULL,
      rule_title TEXT NOT NULL,
      rule_content TEXT NOT NULL,
      anti_pattern TEXT,
      replacement_strategy TEXT,
      enabled INTEGER DEFAULT 1
    );`,
  ]);

  const rulesCheck = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM agent_sales_rules',
    args: [],
  });

  const count = Number(rulesCheck.rows[0]?.['count'] ?? 0);
  if (count === 0) {
    await db.batch([
      {
        sql: `INSERT INTO agent_sales_rules (id, persona_key, rule_title, rule_content, anti_pattern, replacement_strategy, enabled)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'rule-1',
          'reluctant_saviour',
          'The Anti-Check-In Decree',
          'Never say "Just checking in" or "Touching base". It signals zero value and pure desperation.',
          'Hey John, just wanted to check in and see if you had time to review...',
          'John - saw your team just expanded DevOps. Built a 2-minute breakdown on cutting their pipeline spend.',
          1,
        ],
      },
      {
        sql: `INSERT INTO agent_sales_rules (id, persona_key, rule_title, rule_content, anti_pattern, replacement_strategy, enabled)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'rule-2',
          'empathetic_strategist',
          'Unmask The Hidden Friction',
          'When they object to price, they rarely mean the dollars. They fear looking foolish if it fails.',
          'We can offer you a 15% discount if you sign before Friday.',
          'Price is always real. But usually behind it is: "What if my team refuses to adopt this and I own the fallout?" Is that part of it?',
          1,
        ],
      },
      {
        sql: `INSERT INTO agent_sales_rules (id, persona_key, rule_title, rule_content, anti_pattern, replacement_strategy, enabled)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'rule-3',
          'zen_closer',
          'The Sovereign Silence',
          'After stating terms or asking for commitment, shut up. The first person to speak concedes ground.',
          'So the annual license is $45k, and we can also bundle training and support for free if that helps?',
          'The annual investment is $45,000. [Embrace total silence until prospect answers].',
          1,
        ],
      },
    ]);
  }
}

export async function insertCoachingLog(
  tenantKey: string,
  log: Omit<AgentCoachingLogRow, 'feedback_rating'>
): Promise<void> {
  const db = getTenantLibsqlClient(tenantKey);
  await db.execute({
    sql: `INSERT INTO agent_coaching_logs (
      id, lead_id, lead_name, persona, interaction_type, user_input,
      coaching_tip, witty_retort, psychological_insight, cringe_score,
      flagged_cliches, beep_commentary, feedback_rating, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    args: [
      log.id,
      log.lead_id,
      log.lead_name,
      log.persona,
      log.interaction_type,
      log.user_input,
      log.coaching_tip,
      log.witty_retort,
      log.psychological_insight,
      log.cringe_score,
      log.flagged_cliches,
      log.beep_commentary,
      log.created_at,
    ],
  });
}

export async function getCoachingLogs(tenantKey: string, limit = 30): Promise<AgentCoachingLogRow[]> {
  const db = getTenantLibsqlClient(tenantKey);
  const result = await db.execute({
    sql: 'SELECT * FROM agent_coaching_logs ORDER BY created_at DESC LIMIT ?',
    args: [limit],
  });

  return result.rows.map((row) => ({
    id: String(row['id']),
    lead_id: String(row['lead_id']),
    lead_name: String(row['lead_name']),
    persona: String(row['persona']),
    interaction_type: String(row['interaction_type']),
    user_input: row['user_input'] !== null ? String(row['user_input']) : null,
    coaching_tip: String(row['coaching_tip']),
    witty_retort: row['witty_retort'] !== null ? String(row['witty_retort']) : null,
    psychological_insight:
      row['psychological_insight'] !== null ? String(row['psychological_insight']) : null,
    cringe_score: Number(row['cringe_score'] ?? 0),
    flagged_cliches: row['flagged_cliches'] !== null ? String(row['flagged_cliches']) : null,
    beep_commentary: row['beep_commentary'] !== null ? String(row['beep_commentary']) : null,
    feedback_rating: Number(row['feedback_rating'] ?? 0),
    created_at: String(row['created_at']),
  }));
}

export async function rateCoachingLog(tenantKey: string, id: string, rating: number): Promise<void> {
  const db = getTenantLibsqlClient(tenantKey);
  await db.execute({
    sql: 'UPDATE agent_coaching_logs SET feedback_rating = ? WHERE id = ?',
    args: [rating, id],
  });
}

export async function appendConversationHistory(
  tenantKey: string,
  row: AgentConversationHistoryRow
): Promise<void> {
  const db = getTenantLibsqlClient(tenantKey);
  await db.execute({
    sql: `INSERT INTO agent_conversation_history (
      id, session_id, lead_id, role, content, reasoning_log, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      row.id,
      row.session_id,
      row.lead_id,
      row.role,
      row.content,
      row.reasoning_log,
      row.timestamp,
    ],
  });
}

export async function getConversationHistory(
  tenantKey: string,
  sessionId: string
): Promise<AgentConversationHistoryRow[]> {
  const db = getTenantLibsqlClient(tenantKey);
  const result = await db.execute({
    sql: 'SELECT * FROM agent_conversation_history WHERE session_id = ? ORDER BY timestamp ASC',
    args: [sessionId],
  });

  return result.rows.map((row) => ({
    id: String(row['id']),
    session_id: String(row['session_id']),
    lead_id: row['lead_id'] !== null ? String(row['lead_id']) : null,
    role: String(row['role']),
    content: String(row['content']),
    reasoning_log: row['reasoning_log'] !== null ? String(row['reasoning_log']) : null,
    timestamp: String(row['timestamp']),
  }));
}
