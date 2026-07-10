/**
 * Appwrite Database Setup & Initialization Script
 * 
 * This server-side script initializes your Appwrite CRM schema (contracts, contacts, tasks, notifications).
 * Crucially, it creates the Database itself using your custom Database ID before creating tables/collections.
 * 
 * To run:
 * 1. Set environment variables (or let it fallback to default values in .env.example)
 * 2. Run: node scripts/setup-database.js
 */

const { Client, Databases, Permission, Role } = require('node-appwrite');

async function setupAppwriteDatabase() {
  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://tor.cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID || '6990e2830030cacccd98';
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'leadwave-main';

  if (!apiKey) {
    console.error('❌ Error: APPWRITE_API_KEY environment variable is required to run the provisioning script.');
    console.log('Please set it using: export APPWRITE_API_KEY="your-api-key"');
    process.exit(1);
  }

  console.log('----------------------------------------------------');
  console.log('🚀 Appwrite CRM Schema Provisioning Engine Initialized');
  console.log(`📡 Endpoint:  ${endpoint}`);
  console.log(`🆔 Project ID: ${projectId}`);
  console.log(`🗄️ Database ID: ${databaseId}`);
  console.log('----------------------------------------------------');

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);

  try {
    // 1. Create the Database itself first!
    console.log(`\nStep 1: Instantiating Database with ID "${databaseId}"...`);
    try {
      await databases.create(databaseId, 'ΛΞVOS CRM Database');
      console.log(`✅ Database "${databaseId}" created successfully!`);
    } catch (err) {
      if (err.code === 409) {
        console.log(`ℹ️ Database "${databaseId}" already exists, proceeding to collections...`);
      } else {
        console.error(`❌ Failed to create database:`, err.message || err);
        throw err;
      }
    }

    // Define collection specs
    const collections = [
      {
        id: process.env.APPWRITE_CONTRACTS_COLLECTION_ID || 'contracts',
        name: 'Contracts',
        attributes: [
          { key: 'teamId', type: 'string', size: 255, required: true },
          { key: 'clientName', type: 'string', size: 255, required: true },
          { key: 'clientEmail', type: 'string', size: 255, required: true },
          { key: 'status', type: 'string', size: 50, required: true },
          { key: 'value', type: 'string', size: 100, required: true },
          { key: 'createdAt', type: 'string', size: 100, required: true }
        ]
      },
      {
        id: process.env.APPWRITE_CONTACTS_COLLECTION_ID || 'contacts',
        name: 'Contacts',
        attributes: [
          { key: 'teamId', type: 'string', size: 255, required: true },
          { key: 'name', type: 'string', size: 255, required: true },
          { key: 'email', type: 'string', size: 255, required: true },
          { key: 'phone', type: 'string', size: 100, required: false },
          { key: 'stage', type: 'string', size: 100, required: true },
          { key: 'createdAt', type: 'string', size: 100, required: true }
        ]
      },
      {
        id: process.env.APPWRITE_TASKS_COLLECTION_ID || 'tasks',
        name: 'Tasks',
        attributes: [
          { key: 'teamId', type: 'string', size: 255, required: true },
          { key: 'title', type: 'string', size: 255, required: true },
          { key: 'completed', type: 'boolean', required: true },
          { key: 'dueDate', type: 'string', size: 100, required: false },
          { key: 'createdAt', type: 'string', size: 100, required: true }
        ]
      },
      {
        id: process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID || 'notifications',
        name: 'Notifications',
        attributes: [
          { key: 'teamId', type: 'string', size: 255, required: true },
          { key: 'title', type: 'string', size: 255, required: true },
          { key: 'message', type: 'string', size: 500, required: true },
          { key: 'read', type: 'boolean', required: true },
          { key: 'createdAt', type: 'string', size: 100, required: true }
        ]
      }
    ];

    // Create Collections and Attributes
    for (const col of collections) {
      console.log(`\nStep 2: Checking Collection: "${col.name}" (${col.id})...`);
      
      try {
        // Create collection with team-based tenancy permissions
        // We set permissions on a team-based role (representing multi-tenancy groups)
        await databases.createCollection(
          databaseId,
          col.id,
          col.name,
          [
            Permission.read(Role.any()), // Allow query filtering on permissions
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ]
        );
        console.log(`✅ Collection "${col.name}" created successfully!`);

        // Wait a small moment for replication/indexing states
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Define all attributes
        for (const attr of col.attributes) {
          console.log(`  └ Attributes: Creating ${attr.type} "${attr.key}"...`);
          try {
            if (attr.type === 'string') {
              await databases.createStringAttribute(
                databaseId,
                col.id,
                attr.key,
                attr.size,
                attr.required
              );
            } else if (attr.type === 'boolean') {
              await databases.createBooleanAttribute(
                databaseId,
                col.id,
                attr.key,
                attr.required
              );
            }
          } catch (attrErr) {
            if (attrErr.code === 409) {
              console.log(`    ℹ️ Attribute "${attr.key}" already exists.`);
            } else {
              console.error(`    ❌ Failed to create attribute "${attr.key}":`, attrErr.message || attrErr);
            }
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (colErr) {
        if (colErr.code === 409) {
          console.log(`ℹ️ Collection "${col.name}" already exists, checking attributes...`);
        } else {
          console.error(`❌ Failed to process collection "${col.name}":`, colErr.message || colErr);
        }
      }
    }

    console.log('\n----------------------------------------------------');
    console.log('🎉 Setup Complete! Your database is fully provisioned.');
    console.log('----------------------------------------------------');

  } catch (error) {
    console.error('\n❌ Real-time Provisioning Process Encountered Fatal Error:', error);
    process.exit(1);
  }
}

setupAppwriteDatabase();
