/**
 * Legacy entry point. Provisioning is defined in scripts/setup-database.ts
 * from src/server/appwrite-schema.ts (typed columns, row security).
 *
 * This wrapper does not call the Appwrite API.
 */
console.log(
  'crm database provisioning: run scripts/setup-database.ts (not this file).'
);
console.log('Schema source: src/server/appwrite-schema.ts');
process.exit(0);
