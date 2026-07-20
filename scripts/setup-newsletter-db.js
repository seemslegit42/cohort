import { Client, TablesDB, Permission, Role } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const tablesDB = new TablesDB(client);
const databaseId = 'leadwave-main';

async function setupNewsletterDatabase() {
    console.log('Starting Newsletter DB setup...');
    try {
        // Create Newsletter Subscribers table
        await tablesDB.createTable(databaseId, 'newsletter_subscribers', 'Newsletter Subscribers', [
            Permission.read(Role.team('[TEAM_ID]')),
            Permission.create(Role.team('[TEAM_ID]', 'member')),
            Permission.update(Role.team('[TEAM_ID]', 'admin')),
            Permission.delete(Role.team('[TEAM_ID]', 'owner')),
        ]);
        
        // Add columns
        await tablesDB.createEmailColumn(databaseId, 'newsletter_subscribers', 'email', true);
        await tablesDB.createVarcharColumn(databaseId, 'newsletter_subscribers', 'status', 255, true); // subscribed, unsubscribed
        await tablesDB.createVarcharColumn(databaseId, 'newsletter_subscribers', 'firstName', 255, false);
        await tablesDB.createVarcharColumn(databaseId, 'newsletter_subscribers', 'lastName', 255, false);
        await tablesDB.createVarcharColumn(databaseId, 'newsletter_subscribers', 'source', 255, false);
        await tablesDB.createVarcharColumn(databaseId, 'newsletter_subscribers', 'teamId', 255, true);
        
        // Create indexes
        await tablesDB.createIndex(databaseId, 'newsletter_subscribers', 'idx_team', 'key', ['teamId']);
        await tablesDB.createIndex(databaseId, 'newsletter_subscribers', 'idx_email', 'unique', ['email']);
        await tablesDB.createIndex(databaseId, 'newsletter_subscribers', 'idx_status', 'key', ['status']);
        
        console.log('Newsletter Subscribers table created successfully!');
    } catch (error) {
        if (error.code !== 409) {
            console.error('Database setup failed:', error);
            throw error;
        } else {
            console.log('Table already exists, skipping creation.');
        }
    }
}

setupNewsletterDatabase();
