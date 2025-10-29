// Simple integration test runner using global fetch (node 18+)
// It tests the deployed API (or override with DEPLOY_URL env)
const assert = require('assert');
const url = process.env.DEPLOY_URL || 'https://dongfeng400.vercel.app';
console.log('Running integration tests against', url);
const seeded = { email: 'alice@example.com', password: 'password123' };
(async ()=>{
  try {
    // login and capture Set-Cookie
    const r1 = await fetch(url + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(seeded) });
    assert(r1.ok, 'login endpoint returned non-ok: ' + r1.status);
    const setCookie = r1.headers.get('set-cookie') || r1.headers.get('Set-Cookie');
    assert(setCookie, 'no set-cookie in login response');
    console.log('Login OK, session cookie received');

    // include cookie in subsequent requests
    const cookie = setCookie.split(';')[0];

    // try to create a todo
    const todo = { title: 'integration-test ' + Date.now().toString().slice(-6), description: 'created by test' };
    const r2 = await fetch(url + '/api/todos', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Cookie': cookie }, body: JSON.stringify(todo) });
    assert(r2.ok, 'create todo failed: '+r2.status);
    const j2 = await r2.json();
    assert(j2 && j2._id, 'created todo missing _id');
    console.log('Todo created', j2._id);

    // cleanup: delete it
    const del = await fetch(url + '/api/todos?id=' + encodeURIComponent(j2._id), { method: 'DELETE', headers: { 'Cookie': cookie } });
    assert(del.ok, 'delete returned not ok');
    console.log('Todo deleted, integration tests passed');
    process.exit(0);
  } catch (err) {
    console.error('Integration tests failed:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
