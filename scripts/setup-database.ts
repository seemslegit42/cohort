import { Client, Databases as TablesDB, Permission, Role } from 'node-appwrite';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://tor.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '6990e2830030cacccd98');

if (process.env.APPWRITE_API_KEY) {
    client.setKey(process.env.APPWRITE_API_KEY);
}

const tablesDB = new TablesDB(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'leadwave-main';

async function setupDatabase() {
    try {
        console.log(`Setting up database tables for ${databaseId}...`);
        
        const tables = [
            { id: 'leads', name: 'Leads' },
            { id: 'contracts', name: 'Contracts' },
            { id: 'contacts', name: 'Contacts' },
            { id: 'tasks', name: 'Tasks' },
            { id: 'notifications', name: 'Notifications' },
            { id: 'chatMessages', name: 'Chat Messages' }
        ];

        for (const table of tables) {
            try {
                await tablesDB.createCollection(
                    databaseId,
                    table.id,
                    table.name,
                    [
                        Permission.read(Role.any()),
                        Permission.write(Role.any())
                    ]
                );
                console.log(`Created collection ${table.name}`);

                await tablesDB.createStringAttribute(databaseId, table.id, 'dataPayload', 65535, false);
                await tablesDB.createStringAttribute(databaseId, table.id, 'teamId', 255, false);
                await tablesDB.createStringAttribute(databaseId, table.id, 'createdBy', 255, false);

            } catch (e: any) {
                if (e.code !== 409) {
                    console.error(`Failed to create table ${table.name}:`, e.message);
                } else {
                    console.log(`Table ${table.name} already exists.`);
                }
            }
        }

        console.log('Database setup completed successfully!');
    } catch (error) {
        console.error('Database setup failed:', error);
    }
}

setupDatabase();
