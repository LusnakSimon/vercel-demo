/*
  Integration tests that invoke serverless handlers directly (no HTTP) against the live MongoDB Atlas.
  Run with:
    STORAGE_MONGODB_URI="..." node scripts/integration-test.js
  Requires that the DB is seeded (scripts/seed.js) or contains a user alice@example.com.
*/
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');

function makeRes() {
  let resolve; const p = new Promise(r=>resolve=r);
  const res = {
    statusCode: 200,
    body: null,
    status(code){ this.statusCode = code; return this; },
    json(obj){ this.body = obj; resolve({ status: this.statusCode||200, body: obj }); return this; },
    end(msg){ this.body = msg; resolve({ status: this.statusCode||200, body: msg }); return this; },
  };
  res._promise = p; return res;
}

async function callHandler(handler, req) {
  const res = makeRes();
  // ensure handler returns (some handlers don't return the promise)
  const maybe = handler(req, res);
  // wait for either handler to resolve the response or for an async return
  const r = await Promise.race([res._promise, Promise.resolve(maybe).then(()=>res._promise)]);
  return r;
}

async function run() {
  const uri = process.env.STORAGE_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) { console.error('Please set STORAGE_MONGODB_URI'); process.exit(2); }
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = client.s.options.dbName || (new URL(uri)).pathname.replace('/', '') || 'vercel_demo';
  const db = client.db(dbName);

  const users = db.collection('users');
  const alice = await users.findOne({ email: 'alice@example.com' });
  if (!alice) { console.error('Missing seeded user alice@example.com (run npm run seed)'); process.exit(1); }

  const secret = process.env.JWT_SECRET || 'dev-secret';
  const token = jwt.sign({ sub: String(alice._id), role: alice.role || 'user', email: alice.email }, secret, { expiresIn: '1h' });

  const projectsHandler = require('../api/projects');
  const todosHandler = require('../api/todos');

  console.log('Creating project (authenticated)');
  let req = { method: 'POST', headers: { authorization: 'Bearer ' + token }, body: { name: 'IT Integration Test Project' } };
  let r = await callHandler(projectsHandler, req);
  console.log('->', r.status, r.body);
  if (r.status !== 201) throw new Error('create project failed');
  const projectId = String(r.body._id);

  console.log('Creating todo (authenticated)');
  req = { method: 'POST', headers: { authorization: 'Bearer ' + token }, body: { title: 'Integration todo', description: 'created by test', projectId } };
  r = await callHandler(todosHandler, req);
  console.log('->', r.status, r.body);
  if (r.status !== 201) throw new Error('create todo failed');
  const todoId = String(r.body._id);

  console.log('Updating todo (owner)');
  req = { method: 'PATCH', headers: { authorization: 'Bearer ' + token }, query: { id: todoId }, body: { done: true } };
  r = await callHandler(todosHandler, req);
  console.log('->', r.status, r.body);
  if (r.status !== 200 || r.body.done !== true) throw new Error('update todo failed');

  console.log('Deleting todo (owner)');
  req = { method: 'DELETE', headers: { authorization: 'Bearer ' + token }, query: { id: todoId } };
  r = await callHandler(todosHandler, req);
  console.log('->', r.status, r.body);
  if (r.status !== 200) throw new Error('delete todo failed');

  console.log('Attempt create project without auth (should fail)');
  req = { method: 'POST', headers: {}, body: { name: 'Should Fail' } };
  r = await callHandler(projectsHandler, req);
  console.log('->', r.status, r.body);
  if (r.status === 201) throw new Error('unauthenticated create succeeded unexpectedly');

  console.log('Integration tests passed');
  await client.close();
}

run().catch(err => { console.error(err); process.exit(1); });
