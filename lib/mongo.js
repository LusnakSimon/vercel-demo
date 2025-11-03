const { MongoClient } = require('mongodb');

const uri = process.env.STORAGE_MONGODB_URI || process.env.MONGODB_URI;

if (!uri) {
  // In serverless environments the env will be provided by the platform.
  // We don't throw here to keep dev experience friendly; handlers will fail clearly when used.
  console.warn('WARNING: No MongoDB connection string provided in STORAGE_MONGODB_URI or MONGODB_URI');
}

let client;
let db;

async function connect() {
  if (db) return db;
  if (!client) {
    client = new MongoClient(uri, {});
  }
  if (!client.isConnected || client.topology?.isConnected?.() === false) {
    await client.connect();
  }
  // Use the database from the connection string, or fallback to 'vercel_demo'
  const dbName = client.s.options.dbName || (new URL(uri)).pathname.replace('/', '') || 'vercel_demo';
  db = client.db(dbName);
  return db;
}

function getClient() {
  return client;
}

async function getDb() {
  return await connect();
}

module.exports = { connect, getClient, getDb };
