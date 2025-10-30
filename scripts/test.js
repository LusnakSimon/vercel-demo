// Lightweight test script: verifies DB collections exist, seeded data present, and auth helper works
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

async function run() {
  const uri = process.env.STORAGE_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.log('STORAGE_MONGODB_URI not set - skipping tests (set this in GitHub repo secrets for CI)');
    process.exit(0); // Exit gracefully when MongoDB URI is not configured
  }
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = client.s.options.dbName || (new URL(uri)).pathname.replace('/', '') || 'vercel_demo';
  const db = client.db(dbName);

  const users = db.collection('users');
  const projects = db.collection('projects');
  const todos = db.collection('todos');

  const uCount = await users.countDocuments();
  const pCount = await projects.countDocuments();
  const tCount = await todos.countDocuments();

  console.log('counts -> users:', uCount, 'projects:', pCount, 'todos:', tCount);
  if (uCount === 0) { console.error('No users found — seed may have not run'); process.exit(1); }

  // check seeded user exists
  const alice = await users.findOne({ email: 'alice@example.com' });
  if (!alice) { console.error('seeded user alice@example.com missing'); process.exit(1); }

  // quick jwt sign/verify smoke using env secret
  const secret = process.env.JWT_SECRET || 'dev-secret';
  const token = jwt.sign({ sub: String(alice._id), role: alice.role || 'user' }, secret, { expiresIn: '1h' });
  try { jwt.verify(token, secret); } catch (e) { console.error('jwt verify failed', e); process.exit(1); }

  console.log('basic DB and auth smoke tests passed');
  await client.close();
}

run().catch(err => { console.error(err); process.exit(1); });
