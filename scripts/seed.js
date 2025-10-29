/*
  scripts/seed.js
  Run with: STORAGE_MONGODB_URI="..." node scripts/seed.js
  This will create sample users, projects and todos for the demo.
*/
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function run() {
  const uri = process.env.STORAGE_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('Please set STORAGE_MONGODB_URI');
    process.exit(2);
  }
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = client.s.options.dbName || (new URL(uri)).pathname.replace('/', '') || 'vercel_demo';
  const db = client.db(dbName);

  const users = db.collection('users');
  const projects = db.collection('projects');
  const todos = db.collection('todos');

  await users.deleteMany({});
  await projects.deleteMany({});
  await todos.deleteMany({});

  const pw = await bcrypt.hash('password123', 10);
  const r1 = await users.insertOne({ email: 'alice@example.com', name: 'Alice', passwordHash: pw, role: 'user', createdAt: new Date() });
  const r2 = await users.insertOne({ email: 'admin@example.com', name: 'Admin', passwordHash: pw, role: 'admin', createdAt: new Date() });

  const p1 = await projects.insertOne({ name: 'Demo Project', ownerId: r1.insertedId, createdAt: new Date() });

  await todos.insertMany([
    { title: 'First task', description: 'Demo todo', projectId: String(p1.insertedId), ownerId: String(r1.insertedId), done: false, createdAt: new Date() },
    { title: 'Second task', description: 'Another demo', projectId: String(p1.insertedId), ownerId: String(r1.insertedId), done: false, createdAt: new Date() }
  ]);

  console.log('Seed complete');
  await client.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
