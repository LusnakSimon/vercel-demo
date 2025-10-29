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
  const notes = db.collection('notes');

  await users.deleteMany({});
  await projects.deleteMany({});
  await todos.deleteMany({});

  const pw = await bcrypt.hash('password123', 10);
  const r1 = await users.insertOne({ email: 'alice@example.com', name: 'Alice', passwordHash: pw, role: 'user', createdAt: new Date() });
  const r2 = await users.insertOne({ email: 'admin@example.com', name: 'Admin', passwordHash: pw, role: 'admin', createdAt: new Date() });

  const p1 = await projects.insertOne({ name: 'Demo Project', ownerId: r1.insertedId, createdAt: new Date() });
  // add a small members array for collaborative demo (owner + admin)
  await projects.updateOne({ _id: p1.insertedId }, { $set: { memberIds: [String(r1.insertedId), String(r2.insertedId)] } });

  await todos.insertMany([
    { title: 'First task', description: 'Demo todo', projectId: String(p1.insertedId), ownerId: String(r1.insertedId), done: false, createdAt: new Date() },
    { title: 'Second task', description: 'Another demo', projectId: String(p1.insertedId), ownerId: String(r1.insertedId), done: false, createdAt: new Date() }
  ]);

  // create sample notes for Collaborative Research Notebook demo
  await notes.deleteMany({});
  await notes.insertMany([
    {
      title: 'Welcome to the Research Notebook',
      bodyMarkdown: '# Research Notebook\n\nThis is a demo note. Add your observations, links, and snippets here.',
      projectId: String(p1.insertedId),
      tags: ['welcome','demo'],
      attachments: [],
      visibility: 'project',
      authorId: String(r1.insertedId),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Literature notes: Example Paper',
      bodyMarkdown: 'Summary of *Example Paper* by Someone et al.\n\n- Key idea: ...\n- Notes: ...',
      projectId: String(p1.insertedId),
      tags: ['literature','summary'],
      attachments: [],
      visibility: 'project',
      authorId: String(r2.insertedId),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // ensure text index on notes for search
  try {
    await notes.createIndex({ title: 'text', bodyMarkdown: 'text', tags: 'text' });
  } catch (e) {
    console.warn('Could not create notes text index', e.message || e);
  }

  console.log('Seed complete');
  await client.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
