/* eslint-disable @typescript-eslint/no-explicit-any */
import { Databases as TablesDB, Query, ID } from 'node-appwrite';
import { getAdminClient } from './appwrite-clients';
import { APPWRITE_DATABASE_ID_ENV, type CrmCollectionId } from './config';
import {
  buildRowPermissions,
  mapFromAppwrite,
  mapToAppwrite,
  type AppwriteTableId,
} from './appwrite-schema';
import { allowDemoData, AppwriteUnavailableError } from './env';
import { appendTeamIdQuery } from './team-query';

let tablesDB: TablesDB;

function getTablesDB() {
  if (!tablesDB) {
    tablesDB = new TablesDB(getAdminClient());
  }
  return tablesDB;
}

const localStore = new Map<string, Map<string, any>>();

function getLocalTable(tableId: string): Map<string, any> {
  if (!localStore.has(tableId)) {
    localStore.set(tableId, new Map());
  }
  return localStore.get(tableId)!;
}

function resolveTeamId(explicit: string | undefined, dataTeamId: unknown): string {
  const t = explicit || (typeof dataTeamId === 'string' ? dataTeamId : '');
  if (!t) {
    throw new Error('teamId is required');
  }
  return t;
}

function handleDbError(err: unknown): never {
  if (allowDemoData()) {
    throw err;
  }
  throw new AppwriteUnavailableError(
    err instanceof Error ? err.message : 'Appwrite request failed',
  );
}

export interface ListOptions {
  queries?: string[];
  limit?: number;
  offset?: number;
}

function createTable<T>(tableId: CrmCollectionId) {
  const appwriteTableId = tableId as AppwriteTableId;

  return {
    async create(
      data: Omit<T, '$id' | '$createdAt' | '$updatedAt'>,
      teamId?: string,
      createdBy?: string,
    ) {
      const resolvedTeam = resolveTeamId(teamId, (data as any).teamId);
      const payload = {
        ...(data as Record<string, unknown>),
        teamId: resolvedTeam,
        ...(createdBy ? { createdBy } : {}),
      };
      const mapped = mapToAppwrite(appwriteTableId, payload as Record<string, any>);
      const permissions = buildRowPermissions(appwriteTableId, resolvedTeam, payload);

      if (allowDemoData()) {
        const localId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const now = new Date().toISOString();
        const fallbackItem = {
          ...payload,
          $id: localId,
          $createdAt: now,
          $updatedAt: now,
        } as unknown as T;
        try {
          const db = getTablesDB();
          const doc = await db.createDocument(
            APPWRITE_DATABASE_ID_ENV,
            tableId,
            ID.unique(),
            mapped,
            permissions,
          );
          const created = mapFromAppwrite<T>(appwriteTableId, doc);
          getLocalTable(tableId).set((created as any).$id, created);
          return created;
        } catch (err) {
          getLocalTable(tableId).set(localId, fallbackItem);
          return fallbackItem;
        }
      }

      try {
        const db = getTablesDB();
        const doc = await db.createDocument(
          APPWRITE_DATABASE_ID_ENV,
          tableId,
          ID.unique(),
          mapped,
          permissions,
        );
        return mapFromAppwrite<T>(appwriteTableId, doc);
      } catch (err) {
        handleDbError(err);
      }
    },

    async get(id: string) {
      if (allowDemoData()) {
        try {
          const db = getTablesDB();
          const doc = await db.getDocument(APPWRITE_DATABASE_ID_ENV, tableId, id);
          return mapFromAppwrite<T>(appwriteTableId, doc);
        } catch {
          return (getLocalTable(tableId).get(id) as T) || null;
        }
      }
      try {
        const db = getTablesDB();
        const doc = await db.getDocument(APPWRITE_DATABASE_ID_ENV, tableId, id);
        return mapFromAppwrite<T>(appwriteTableId, doc);
      } catch (err) {
        handleDbError(err);
      }
    },

    async list(options: ListOptions = {}) {
      const queries = [...(options.queries ?? []), Query.orderDesc('$createdAt')];
      if (options.limit) {
        queries.push(Query.limit(options.limit));
      }
      if (options.offset) {
        queries.push(Query.offset(options.offset));
      }

      if (allowDemoData()) {
        try {
          const db = getTablesDB();
          const response = await db.listDocuments(APPWRITE_DATABASE_ID_ENV, tableId, queries);
          return response.documents.map((doc) =>
            mapFromAppwrite<T>(appwriteTableId, doc),
          );
        } catch {
          return Array.from(getLocalTable(tableId).values()) as T[];
        }
      }

      try {
        const db = getTablesDB();
        const response = await db.listDocuments(APPWRITE_DATABASE_ID_ENV, tableId, queries);
        return response.documents.map((doc) =>
          mapFromAppwrite<T>(appwriteTableId, doc),
        );
      } catch (err) {
        handleDbError(err);
      }
    },

    async listByTeam(teamId: string, options: ListOptions = {}) {
      return this.list({
        ...options,
        queries: appendTeamIdQuery(teamId, options.queries ?? []),
      });
    },

    async update(id: string, data: Partial<T>, teamId?: string) {
      const existing = (await this.get(id)) as any;
      if (!existing) {
        throw new Error('Not found');
      }
      const resolvedTeam = teamId || existing.teamId;
      if (!resolvedTeam) {
        throw new Error('teamId is required');
      }
      const merged = { ...existing, ...data, teamId: resolvedTeam };
      const mapped = mapToAppwrite(appwriteTableId, merged);

      if (allowDemoData()) {
        const now = new Date().toISOString();
        const updatedLocal = { ...merged, $id: id, $updatedAt: now } as T;
        try {
          const db = getTablesDB();
          const doc = await db.updateDocument(
            APPWRITE_DATABASE_ID_ENV,
            tableId,
            id,
            mapped,
          );
          const res = mapFromAppwrite<T>(appwriteTableId, doc);
          getLocalTable(tableId).set(id, res);
          return res;
        } catch {
          getLocalTable(tableId).set(id, updatedLocal);
          return updatedLocal;
        }
      }

      try {
        const db = getTablesDB();
        const doc = await db.updateDocument(
          APPWRITE_DATABASE_ID_ENV,
          tableId,
          id,
          mapped,
        );
        return mapFromAppwrite<T>(appwriteTableId, doc);
      } catch (err) {
        handleDbError(err);
      }
    },

    async delete(id: string) {
      if (allowDemoData()) {
        try {
          const db = getTablesDB();
          await db.deleteDocument(APPWRITE_DATABASE_ID_ENV, tableId, id);
        } catch {
          // ignore
        }
        getLocalTable(tableId).delete(id);
        return;
      }
      try {
        const db = getTablesDB();
        await db.deleteDocument(APPWRITE_DATABASE_ID_ENV, tableId, id);
      } catch (err) {
        handleDbError(err);
      }
    },
  };
}

export const db = {
  leads: createTable<any>('leads'),
  contacts: createTable<any>('contacts'),
  tasks: createTable<any>('tasks'),
  notes: createTable<any>('notes'),
  notifications: createTable<any>('notifications'),
  contracts: createTable<any>('contracts'),
  emails: createTable<any>('emails'),
  events: createTable<any>('events'),
  chatMessages: createTable<any>('chatMessages'),
  email_workflows: createTable<any>('email_workflows'),
  newsletter_subscribers: createTable<any>('newsletter_subscribers'),
};

export type DbCollectionKey = keyof typeof db;
