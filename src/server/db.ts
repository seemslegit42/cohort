/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, Databases as TablesDB, Query, ID } from 'node-appwrite';
import {
  APPWRITE_DATABASE_ID,
  buildRowPermissions,
  mapFromAppwrite,
  mapToAppwrite,
} from './appwrite-schema';

let client: Client;
let tablesDB: TablesDB;

function getClient() {
  if (!client) {
    client = new Client()
      .setEndpoint(process.env['APPWRITE_ENDPOINT'] || 'https://tor.cloud.appwrite.io/v1')
      .setProject(process.env['APPWRITE_PROJECT_ID'] || '6990e2830030cacccd98');

    if (process.env['APPWRITE_API_KEY']) {
      client.setKey(process.env['APPWRITE_API_KEY']);
    }
  }
  return client;
}

function getTablesDB() {
  if (!tablesDB) {
    tablesDB = new TablesDB(getClient());
  }
  return tablesDB;
}

const DATABASE_ID = process.env['APPWRITE_DATABASE_ID'] || APPWRITE_DATABASE_ID;

function createTable<T>(tableId: string) {
  return {
    async create(data: Omit<T, '$id' | '$createdAt' | '$updatedAt'>, teamId?: string) {
      const db = getTablesDB();
      const payload = data as Record<string, unknown>;
      const resolvedTeamId = teamId || (payload['teamId'] as string | undefined);
      if (!resolvedTeamId) {
        throw new Error('teamId is required');
      }

      const mapped = mapToAppwrite(tableId, { ...payload, teamId: resolvedTeamId });
      const permissions = buildRowPermissions(tableId, resolvedTeamId, payload);

      const doc = await db.createDocument(
        DATABASE_ID,
        tableId,
        ID.unique(),
        mapped,
        permissions
      );
      return mapFromAppwrite<T>(tableId, doc);
    },

    async get(id: string) {
      const db = getTablesDB();
      try {
        const doc = await db.getDocument(DATABASE_ID, tableId, id);
        return mapFromAppwrite<T>(tableId, doc);
      } catch {
        return null;
      }
    },

    async list(queries: string[] = []) {
      const db = getTablesDB();
      try {
        const response = await db.listDocuments(DATABASE_ID, tableId, [
          ...queries,
          Query.orderDesc('$createdAt'),
        ]);
        return response.documents.map((doc) => mapFromAppwrite<T>(tableId, doc));
      } catch (err) {
        console.error(`Error listing ${tableId}:`, err);
        return [];
      }
    },

    async listByTeam(teamId: string) {
      return this.list([Query.equal('teamId', [teamId])]);
    },

    async update(id: string, data: Partial<T>) {
      const db = getTablesDB();
      const existing = await this.get(id) as Record<string, unknown> | null;
      if (!existing) throw new Error('Not found');

      const {
        $id: _id,
        $createdAt: _c,
        $updatedAt: _u,
        ...existingData
      } = existing as Record<string, unknown> & {
        $id?: string;
        $createdAt?: string;
        $updatedAt?: string;
      };

      const updatePayload = data as Record<string, unknown>;
      const {
        $id: _uId,
        $createdAt: _uC,
        $updatedAt: _uU,
        ...updateData
      } = updatePayload as Record<string, unknown> & {
        $id?: string;
        $createdAt?: string;
        $updatedAt?: string;
      };

      const merged = { ...existingData, ...updateData };
      const doc = await db.updateDocument(
        DATABASE_ID,
        tableId,
        id,
        mapToAppwrite(tableId, merged as Record<string, any>)
      );
      return mapFromAppwrite<T>(tableId, doc);
    },

    async delete(id: string) {
      const db = getTablesDB();
      await db.deleteDocument(DATABASE_ID, tableId, id);
    },
  };
}

export const db = {
  leads: createTable<any>('leads'),
  contracts: createTable<any>('contracts'),
  contacts: createTable<any>('contacts'),
  tasks: createTable<any>('tasks'),
  notifications: createTable<any>('notifications'),
  chatMessages: createTable<any>('chatMessages'),
  notes: createTable<any>('notes'),
  events: createTable<any>('events'),
  emails: createTable<any>('emails'),
  workflows: createTable<any>('email_workflows'),
  newsletter_subscribers: createTable<any>('newsletter_subscribers'),
  campaigns: createTable<any>('campaigns'),
  sequences: createTable<any>('sequences'),
};
