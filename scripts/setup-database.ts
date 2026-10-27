import { Client, Databases as TablesDB, Permission, Role } from 'node-appwrite';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import {
  APPWRITE_DATABASE_ID,
  APPWRITE_TABLES,
  type ColumnSpec,
  type TableSpec,
} from '../src/server/appwrite-schema';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://tor.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '6990e2830030cacccd98');

if (process.env.APPWRITE_API_KEY) {
  client.setKey(process.env.APPWRITE_API_KEY);
}

const tablesDB = new TablesDB(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || APPWRITE_DATABASE_ID;

async function createColumn(tableId: string, column: ColumnSpec): Promise<void> {
  const required = !!column.required;
  const key = column.key;

  switch (column.kind) {
    case 'boolean':
      await tablesDB.createBooleanAttribute(databaseId, tableId, key, required);
      break;
    case 'integer':
      await tablesDB.createIntegerAttribute(
        databaseId,
        tableId,
        key,
        required,
        undefined,
        undefined
      );
      break;
    case 'float':
      await tablesDB.createFloatAttribute(databaseId, tableId, key, required);
      break;
    case 'datetime':
      await tablesDB.createDatetimeAttribute(databaseId, tableId, key, required);
      break;
    case 'email':
      await tablesDB.createEmailAttribute(databaseId, tableId, key, required);
      break;
    case 'enum':
      await tablesDB.createEnumAttribute(
        databaseId,
        tableId,
        key,
        column.enumValues ?? [],
        required
      );
      break;
    case 'string':
    default:
      await tablesDB.createStringAttribute(
        databaseId,
        tableId,
        key,
        column.size ?? 255,
        required,
        column.array ?? false
      );
      break;
  }
}

async function ensureTable(spec: TableSpec): Promise<void> {
  try {
    await tablesDB.createCollection(
      databaseId,
      spec.id,
      spec.name,
      [Permission.create(Role.users())],
      true
    );
    console.log(`Created table ${spec.name}`);
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    if (err.code !== 409) {
      console.error(`Failed to create table ${spec.name}:`, err.message || e);
      return;
    }
    console.log(`Table ${spec.name} already exists.`);
  }

  for (const column of spec.columns) {
    try {
      await createColumn(spec.id, column);
      console.log(`  attribute ${column.key}`);
    } catch (e: unknown) {
      const err = e as { code?: number; message?: string };
      if (err.code !== 409) {
        console.error(`  failed ${column.key}:`, err.message || e);
      }
    }
  }

  for (const index of spec.indexes ?? []) {
    try {
      if (index.type === 'unique') {
        await tablesDB.createIndex(
          databaseId,
          spec.id,
          index.key,
          'unique',
          index.attributes
        );
      } else if (index.type === 'fulltext') {
        await tablesDB.createIndex(
          databaseId,
          spec.id,
          index.key,
          'fulltext',
          index.attributes
        );
      } else {
        await tablesDB.createIndex(databaseId, spec.id, index.key, 'key', index.attributes);
      }
    } catch (e: unknown) {
      const err = e as { code?: number };
      if (err.code !== 409) {
        console.error(`  index ${index.key} failed`, e);
      }
    }
  }
}

async function setupDatabase() {
  try {
    console.log(`Setting up database tables for ${databaseId}...`);
    for (const spec of Object.values(APPWRITE_TABLES)) {
      await ensureTable(spec);
    }
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
  }
}

setupDatabase();
