/* eslint-disable @typescript-eslint/no-explicit-any */
import { Permission, Role } from 'node-appwrite';

export const APPWRITE_DATABASE_ID = 'crm-main';

export type AppwriteTableId =
  | 'leads'
  | 'contacts'
  | 'tasks'
  | 'notes'
  | 'notifications'
  | 'contracts'
  | 'emails'
  | 'events'
  | 'chatMessages'
  | 'email_workflows'
  | 'newsletter_subscribers';

export type ColumnKind =
  | 'string'
  | 'email'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'datetime'
  | 'enum';

export type PermissionProfile =
  | 'crm'
  | 'notifications'
  | 'events'
  | 'chat'
  | 'email_workflows'
  | 'newsletter';

export interface ColumnSpec {
  key: string;
  kind: ColumnKind;
  size?: number;
  required?: boolean;
  enumValues?: string[];
  array?: boolean;
}

export interface TableSpec {
  id: AppwriteTableId;
  name: string;
  columns: ColumnSpec[];
  jsonKeys: string[];
  /** When missing on a row, legacy `dataPayload` is applied before column overlay. */
  legacyScalarKey: string;
  permissionProfile: PermissionProfile;
  indexes?: { key: string; type: 'key' | 'unique' | 'fulltext'; attributes: string[] }[];
}

const CRM_COLUMNS = (keys: ColumnSpec[]): ColumnSpec[] => keys;

export const APPWRITE_TABLES: Record<AppwriteTableId, TableSpec> = {
  leads: {
    id: 'leads',
    name: 'Leads',
    legacyScalarKey: 'name',
    permissionProfile: 'crm',
    jsonKeys: ['activities', 'history', 'scoreFactors', 'downloads', 'webinarsAttended'],
    indexes: [
      { key: 'idx_leads_team_status', type: 'key', attributes: ['teamId', 'status'] },
      { key: 'idx_leads_email', type: 'key', attributes: ['email'] },
      { key: 'idx_leads_score', type: 'key', attributes: ['score'] },
      { key: 'idx_leads_name', type: 'fulltext', attributes: ['name'] },
    ],
    columns: CRM_COLUMNS([
      { key: 'teamId', kind: 'string', size: 36, required: true },
      { key: 'name', kind: 'string', size: 255, required: true },
      { key: 'email', kind: 'email', size: 254, required: true },
      { key: 'phone', kind: 'string', size: 40 },
      { key: 'company', kind: 'string', size: 255 },
      { key: 'source', kind: 'string', size: 80, required: true },
      {
        key: 'status',
        kind: 'enum',
        required: true,
        enumValues: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed', 'Lost'],
      },
      { key: 'priority', kind: 'enum', required: true, enumValues: ['High', 'Medium', 'Low'] },
      { key: 'value', kind: 'float', required: true },
      { key: 'industry', kind: 'string', size: 80 },
      { key: 'region', kind: 'string', size: 80 },
      { key: 'jobTitle', kind: 'string', size: 120 },
      {
        key: 'companySize',
        kind: 'enum',
        enumValues: ['Enterprise', 'Mid-Market', 'Small Business', 'Startup'],
      },
      { key: 'annualRevenue', kind: 'float' },
      { key: 'budgetTier', kind: 'string', size: 80 },
      { key: 'lat', kind: 'float' },
      { key: 'lng', kind: 'float' },
      { key: 'websiteActivity', kind: 'enum', enumValues: ['High', 'Medium', 'Low'] },
      { key: 'emailEngagement', kind: 'enum', enumValues: ['High', 'Medium', 'Low'] },
      { key: 'websiteVisits', kind: 'integer' },
      { key: 'emailOpens', kind: 'integer' },
      { key: 'emailClicks', kind: 'integer' },
      { key: 'expectedCloseDate', kind: 'string', size: 10 },
      { key: 'aiInsights', kind: 'string', size: 16383 },
      { key: 'activities', kind: 'string', size: 16777215 },
      { key: 'history', kind: 'string', size: 16777215 },
      { key: 'score', kind: 'integer' },
      { key: 'demographicScore', kind: 'integer' },
      { key: 'activityScore', kind: 'integer' },
      { key: 'scoreCategory', kind: 'enum', enumValues: ['Hot', 'Warm', 'Cold'] },
      { key: 'grade', kind: 'enum', enumValues: ['A+', 'A', 'B', 'C', 'D'] },
      { key: 'scoreFactors', kind: 'string', size: 16777215 },
      { key: 'createdBy', kind: 'string', size: 36 },
    ]),
  },
  contacts: {
    id: 'contacts',
    name: 'Contacts',
    legacyScalarKey: 'name',
    permissionProfile: 'crm',
    jsonKeys: ['associatedDeals'],
    indexes: [
      { key: 'idx_contacts_team_status', type: 'key', attributes: ['teamId', 'status'] },
      { key: 'idx_contacts_email', type: 'key', attributes: ['email'] },
      { key: 'idx_contacts_company', type: 'key', attributes: ['company'] },
    ],
    columns: CRM_COLUMNS([
      { key: 'teamId', kind: 'string', size: 36, required: true },
      { key: 'name', kind: 'string', size: 255, required: true },
      { key: 'email', kind: 'email', size: 254, required: true },
      { key: 'phone', kind: 'string', size: 40 },
      { key: 'company', kind: 'string', size: 255, required: true },
      { key: 'address', kind: 'string', size: 500 },
      { key: 'notes', kind: 'string', size: 16383 },
      { key: 'status', kind: 'enum', required: true, enumValues: ['Lead', 'Opportunity', 'Customer'] },
      { key: 'dealValue', kind: 'float', required: true },
      { key: 'lastContacted', kind: 'string', size: 80 },
      { key: 'associatedDeals', kind: 'string', size: 16777215 },
    ]),
  },
  tasks: {
    id: 'tasks',
    name: 'Tasks',
    legacyScalarKey: 'title',
    permissionProfile: 'crm',
    jsonKeys: [],
    indexes: [
      { key: 'idx_tasks_team_status', type: 'key', attributes: ['teamId', 'status'] },
      { key: 'idx_tasks_lead', type: 'key', attributes: ['leadId'] },
      { key: 'idx_tasks_due', type: 'key', attributes: ['dueDate'] },
    ],
    columns: CRM_COLUMNS([
      { key: 'teamId', kind: 'string', size: 36, required: true },
      { key: 'title', kind: 'string', size: 255, required: true },
      { key: 'category', kind: 'string', size: 80, required: true },
      { key: 'status', kind: 'enum', required: true, enumValues: ['todo', 'in-progress', 'done'] },
      { key: 'priority', kind: 'enum', enumValues: ['High', 'Medium', 'Low'] },
      { key: 'dueDate', kind: 'string', size: 10 },
      { key: 'description', kind: 'string', size: 16383 },
      { key: 'completed', kind: 'boolean', required: true },
      { key: 'leadId', kind: 'string', size: 36 },
      { key: 'leadName', kind: 'string', size: 255 },
    ]),
  },
  notes: {
    id: 'notes',
    name: 'Notes',
    legacyScalarKey: 'title',
    permissionProfile: 'crm',
    jsonKeys: ['tags'],
    indexes: [
      { key: 'idx_notes_team', type: 'key', attributes: ['teamId'] },
      { key: 'idx_notes_title', type: 'fulltext', attributes: ['title'] },
    ],
    columns: CRM_COLUMNS([
      { key: 'teamId', kind: 'string', size: 36, required: true },
      { key: 'title', kind: 'string', size: 255, required: true },
      { key: 'content', kind: 'string', size: 4194303, required: true },
      { key: 'date', kind: 'string', size: 40 },
      { key: 'color', kind: 'string', size: 80 },
      { key: 'tags', kind: 'string', size: 4096 },
    ]),
  },
  notifications: {
    id: 'notifications',
    name: 'Notifications',
    legacyScalarKey: 'title',
    permissionProfile: 'notifications',
    jsonKeys: [],
    indexes: [{ key: 'idx_notifications_team_read', type: 'key', attributes: ['teamId', 'isRead'] }],
    columns: CRM_COLUMNS([
      { key: 'teamId', kind: 'string', size: 36, required: true },
      { key: 'title', kind: 'string', size: 255, required: true },
      { key: 'message', kind: 'string', size: 1000, required: true },
      { key: 'isRead', kind: 'boolean', required: true },
      { key: 'type', kind: 'enum', required: true, enumValues: ['success', 'warning', 'info', 'error'] },
      { key: 'timestamp', kind: 'datetime' },
    ]),
  },
  contracts: {
    id: 'contracts',
    name: 'Contracts',
    legacyScalarKey: 'name',
    permissionProfile: 'crm',
    jsonKeys: [],
    indexes: [{ key: 'idx_contracts_team_status', type: 'key', attributes: ['teamId', 'status'] }],
    columns: CRM_COLUMNS([
      { key: 'teamId', kind: 'string', size: 36, required: true },
      { key: 'name', kind: 'string', size: 255, required: true },
      { key: 'clientName', kind: 'string', size: 255, required: true },
      { key: 'value', kind: 'string', size: 100, required: true },
      { key: 'status', kind: 'string', size: 50, required: true },
      { key: 'createdAt', kind: 'datetime' },
    ]),
  },
  emails: {
    id: 'emails',
    name: 'Emails',
    legacyScalarKey: 'subject',
    permissionProfile: 'crm',
    jsonKeys: [],
    indexes: [
      { key: 'idx_emails_team_status', type: 'key', attributes: ['teamId', 'status'] },
      { key: 'idx_emails_contact', type: 'key', attributes: ['contactId'] },
    ],
    columns: CRM_COLUMNS([
      { key: 'teamId', kind: 'string', size: 36, required: true },
      { key: 'recipient', kind: 'string', size: 255, required: true },
      { key: 'recipientEmail', kind: 'email', size: 254 },
      { key: 'sender', kind: 'string', size: 255 },
      { key: 'senderEmail', kind: 'email', size: 254 },
      { key: 'company', kind: 'string', size: 255, required: true },
      { key: 'subject', kind: 'string', size: 500, required: true },
      { key: 'body', kind: 'string', size: 4194303, required: true },
      { key: 'snippet', kind: 'string', size: 280 },
      { key: 'contactId', kind: 'string', size: 36 },
      { key: 'contactName', kind: 'string', size: 255 },
      { key: 'dealId', kind: 'string', size: 36 },
      { key: 'dealName', kind: 'string', size: 255 },
      {
        key: 'status',
        kind: 'enum',
        required: true,
        enumValues: ['Sent', 'Delivered', 'Replied', 'Bounced', 'Draft', 'Pending Review'],
      },
      { key: 'direction', kind: 'enum', required: true, enumValues: ['inbound', 'outbound'] },
      { key: 'sentAt', kind: 'string', size: 40 },
      { key: 'isRead', kind: 'boolean' },
      { key: 'humanApproved', kind: 'boolean', required: true },
      { key: 'approvedBy', kind: 'string', size: 255 },
      { key: 'approvedAt', kind: 'datetime' },
      { key: 'hitlNotes', kind: 'string', size: 16383 },
    ]),
  },
  events: {
    id: 'events',
    name: 'Events',
    legacyScalarKey: 'title',
    permissionProfile: 'events',
    jsonKeys: [],
    indexes: [{ key: 'idx_events_team', type: 'key', attributes: ['teamId'] }],
    columns: CRM_COLUMNS([
      { key: 'teamId', kind: 'string', size: 36, required: true },
      { key: 'title', kind: 'string', size: 255, required: true },
      { key: 'month', kind: 'string', size: 12, required: true },
      { key: 'day', kind: 'string', size: 2, required: true },
      { key: 'time', kind: 'string', size: 20, required: true },
      { key: 'contact', kind: 'string', size: 255, required: true },
      { key: 'type', kind: 'string', size: 40, required: true },
    ]),
  },
  chatMessages: {
    id: 'chatMessages',
    name: 'Chat Messages',
    legacyScalarKey: 'dealId',
    permissionProfile: 'chat',
    jsonKeys: ['user'],
    indexes: [
      { key: 'idx_chat_deal', type: 'key', attributes: ['dealId'] },
      { key: 'idx_chat_team', type: 'key', attributes: ['teamId'] },
    ],
    columns: CRM_COLUMNS([
      { key: 'teamId', kind: 'string', size: 36, required: true },
      { key: 'dealId', kind: 'string', size: 64, required: true },
      { key: 'message', kind: 'string', size: 16383, required: true },
      { key: 'user', kind: 'string', size: 16383, required: true },
      { key: 'timestamp', kind: 'datetime', required: true },
    ]),
  },
  email_workflows: {
    id: 'email_workflows',
    name: 'Email Workflows',
    legacyScalarKey: 'name',
    permissionProfile: 'email_workflows',
    jsonKeys: ['trigger', 'steps', 'tags'],
    indexes: [{ key: 'idx_workflows_team_status', type: 'key', attributes: ['teamId', 'status'] }],
    columns: CRM_COLUMNS([
      { key: 'teamId', kind: 'string', size: 36, required: true },
      { key: 'name', kind: 'string', size: 255, required: true },
      { key: 'description', kind: 'string', size: 1000 },
      { key: 'status', kind: 'enum', required: true, enumValues: ['active', 'draft', 'paused', 'archived'] },
      { key: 'trigger', kind: 'string', size: 16383, required: true },
      { key: 'steps', kind: 'string', size: 4194303, required: true },
      { key: 'enrolledCount', kind: 'integer', required: true },
      { key: 'completedCount', kind: 'integer', required: true },
      { key: 'convertedCount', kind: 'integer', required: true },
      { key: 'replyRate', kind: 'float', required: true },
      { key: 'openRate', kind: 'float', required: true },
      { key: 'tags', kind: 'string', size: 4096 },
      { key: 'createdAt', kind: 'datetime', required: true },
      { key: 'updatedAt', kind: 'datetime', required: true },
    ]),
  },
  newsletter_subscribers: {
    id: 'newsletter_subscribers',
    name: 'Newsletter Subscribers',
    legacyScalarKey: 'email',
    permissionProfile: 'newsletter',
    jsonKeys: [],
    indexes: [
      { key: 'idx_email', type: 'unique', attributes: ['email'] },
      { key: 'idx_team', type: 'key', attributes: ['teamId'] },
      { key: 'idx_status', type: 'key', attributes: ['status'] },
    ],
    columns: CRM_COLUMNS([
      { key: 'email', kind: 'email', size: 254, required: true },
      { key: 'status', kind: 'enum', required: true, enumValues: ['subscribed', 'unsubscribed'] },
      { key: 'firstName', kind: 'string', size: 255 },
      { key: 'lastName', kind: 'string', size: 255 },
      { key: 'source', kind: 'string', size: 255 },
      { key: 'teamId', kind: 'string', size: 36, required: true },
    ]),
  },
};

export function getTableSpec(tableId: string): TableSpec | undefined {
  return APPWRITE_TABLES[tableId as AppwriteTableId];
}

export function tableColumnKeys(tableId: string): string[] {
  const spec = getTableSpec(tableId);
  if (!spec) return [];
  return spec.columns.map((c) => c.key);
}

function serializeJsonValue(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? null);
}

function parseJsonValue(raw: unknown): unknown {
  if (raw === undefined || raw === null || raw === '') return raw;
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function mapToAppwrite(tableId: string, data: Record<string, any>): Record<string, unknown> {
  const spec = getTableSpec(tableId);
  if (!spec) {
    const { teamId, createdBy, dataPayload: _drop, ...rest } = data;
    return { teamId: teamId ?? null, createdBy: createdBy ?? null, ...rest };
  }

  const out: Record<string, unknown> = {};
  const allowed = new Set(spec.columns.map((c) => c.key));

  for (const key of allowed) {
    if (!(key in data) || data[key] === undefined) continue;
    const value = data[key];
    if (spec.jsonKeys.includes(key)) {
      out[key] = serializeJsonValue(value);
      continue;
    }
    if (value !== null && typeof value === 'object') continue;
    out[key] = value;
  }

  if (data['createdBy'] !== undefined && allowed.has('createdBy')) {
    out['createdBy'] = data['createdBy'];
  }
  if (data['teamId'] !== undefined && allowed.has('teamId')) {
    out['teamId'] = data['teamId'];
  }

  return out;
}

export function mapFromAppwrite<T>(tableId: string, doc: Record<string, any>): T {
  const spec = getTableSpec(tableId);
  let legacy: Record<string, unknown> = {};
  if (doc['dataPayload']) {
    try {
      legacy = JSON.parse(String(doc['dataPayload'])) as Record<string, unknown>;
    } catch {
      legacy = {};
    }
  }

  const useLegacy =
    !!doc['dataPayload'] &&
    (!spec ||
      doc[spec.legacyScalarKey] === undefined ||
      doc[spec.legacyScalarKey] === null ||
      doc[spec.legacyScalarKey] === '');

  const merged: Record<string, unknown> = useLegacy ? { ...legacy } : {};

  if (spec) {
    for (const col of spec.columns) {
      if (doc[col.key] !== undefined && doc[col.key] !== null) {
        merged[col.key] = doc[col.key];
      }
    }
    for (const jsonKey of spec.jsonKeys) {
      if (merged[jsonKey] !== undefined) {
        merged[jsonKey] = parseJsonValue(merged[jsonKey]);
      }
    }
  } else {
    Object.assign(merged, doc);
    delete merged['dataPayload'];
  }

  delete merged['dataPayload'];

  return {
    ...merged,
    $id: doc['$id'],
    $createdAt: doc['$createdAt'],
    $updatedAt: doc['$updatedAt'],
  } as T;
}

export function buildRowPermissions(
  tableId: string,
  teamId: string,
  data?: Record<string, unknown>
): string[] {
  const spec = getTableSpec(tableId);
  const profile = spec?.permissionProfile ?? 'crm';

  switch (profile) {
    case 'chat': {
      const userId =
        (data?.['user'] as { id?: string } | undefined)?.id ??
        (typeof data?.['userId'] === 'string' ? data['userId'] : undefined);
      const perms = [Permission.read(Role.team(teamId))];
      if (userId) {
        perms.push(Permission.update(Role.user(userId)), Permission.delete(Role.user(userId)));
      }
      return perms;
    }
    case 'newsletter':
      return [
        Permission.read(Role.team(teamId)),
        Permission.update(Role.team(teamId, 'admin')),
        Permission.delete(Role.team(teamId, 'owner')),
      ];
    case 'email_workflows':
      return [
        Permission.read(Role.team(teamId)),
        Permission.update(Role.team(teamId, 'member')),
        Permission.delete(Role.team(teamId, 'admin')),
      ];
    case 'notifications':
    case 'events':
      return [
        Permission.read(Role.team(teamId)),
        Permission.update(Role.team(teamId)),
        Permission.delete(Role.team(teamId)),
      ];
    case 'crm':
    default:
      return [
        Permission.read(Role.team(teamId)),
        Permission.update(Role.team(teamId)),
        Permission.delete(Role.team(teamId, 'admin')),
      ];
  }
}
