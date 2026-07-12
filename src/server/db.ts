/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, Databases as TablesDB, Query, ID, Permission, Role } from 'node-appwrite';

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

const DATABASE_ID = process.env['APPWRITE_DATABASE_ID'] || 'leadwave-main';

function mapToAppwrite(data: any) {
  const { teamId, createdBy, ...rest } = data;
  return {
    teamId: teamId || null,
    createdBy: createdBy || null,
    dataPayload: JSON.stringify(rest)
  };
}

function mapFromAppwrite<T>(doc: any): T {
  let payload = {};
  if (doc.dataPayload) {
    try {
      payload = JSON.parse(doc.dataPayload);
    } catch {
      // ignore parse error
    }
  }
  return {
    ...payload,
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    teamId: doc.teamId,
    createdBy: doc.createdBy
  } as T;
}

function createTable<T>(tableId: string) {
  return {
    async create(data: Omit<T, '$id' | '$createdAt' | '$updatedAt'>, teamId?: string) {
      const db = getTablesDB();
      const permissions = teamId ? [
        Permission.read(Role.team(teamId)),
        Permission.write(Role.team(teamId))
      ] : [
        Permission.read(Role.any()),
        Permission.write(Role.any())
      ];
      
      const mapped = mapToAppwrite(data);
      if (teamId) mapped.teamId = teamId;

      const doc = await db.createDocument(
        DATABASE_ID,
        tableId,
        ID.unique(),
        mapped,
        permissions
      );
      return mapFromAppwrite<T>(doc);
    },

    async get(id: string) {
      const db = getTablesDB();
      try {
        const doc = await db.getDocument(DATABASE_ID, tableId, id);
        return mapFromAppwrite<T>(doc);
      } catch {
        return null;
      }
    },

    async list(queries: string[] = []) {
      const db = getTablesDB();
      try {
        const response = await db.listDocuments(DATABASE_ID, tableId, [
          ...queries,
          Query.orderDesc('$createdAt')
        ]);
        return response.documents.map(mapFromAppwrite<T>);
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
      // First get the existing doc to merge payload
      const existing = await this.get(id) as any;
      if (!existing) throw new Error('Not found');

      // Remove immutable columns from new data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { $id: _id, $createdAt: _c, $updatedAt: _u, createdBy: _cb, teamId: _t, ...updateData } = data as any;
      
      // Merge with existing
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { $id: _eId, $createdAt: _eC, $updatedAt: _eU, createdBy: eCb, teamId: eTi, ...existingData } = existing;
      const merged = { ...existingData, ...updateData, createdBy: eCb, teamId: eTi };

      const doc = await db.updateDocument(DATABASE_ID, tableId, id, mapToAppwrite(merged));
      return mapFromAppwrite<T>(doc);
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
  workflows: createTable<any>('workflows')
};
