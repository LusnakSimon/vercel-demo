/**
 * Comprehensive Integration Tests for Research Notebook
 * Tests all major user flows against the deployed API
 * 
 * Run with: node scripts/comprehensive-test.js
 * Or against local: DEPLOY_URL=http://localhost:3000 node scripts/comprehensive-test.js
 */

const assert = require('assert');
const baseUrl = process.env.DEPLOY_URL || 'https://researchnotebook.vercel.app';

// Test credentials (from seeded data)
const testUser = { email: 'alice@example.com', password: 'password123' };

// Store test data for cleanup
const createdItems = {
  todos: [],
  notes: [],
  projects: []
};

let sessionCookie = null;
let currentUser = null;

// Helper functions
async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(sessionCookie ? { 'Cookie': sessionCookie } : {}),
    ...options.headers
  };
  
  const response = await fetch(baseUrl + path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  
  // Capture session cookie
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }
  
  const data = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, data };
}

function log(icon, message) {
  console.log(`${icon} ${message}`);
}

function logSuccess(message) { log('✅', message); }
function logError(message) { log('❌', message); }
function logInfo(message) { log('ℹ️', message); }
function logSection(message) { console.log(`\n${'='.repeat(50)}\n📋 ${message}\n${'='.repeat(50)}`); }

// Test functions
async function testHealthCheck() {
  logSection('Health Check');
  const res = await request('/api/health');
  assert(res.ok, `Health check failed: ${res.status}`);
  assert(res.data.status === 'ok', 'Health status not ok');
  logSuccess('Health check passed');
  return true;
}

async function testAuthentication() {
  logSection('Authentication Flow');
  
  // Test login
  logInfo('Testing login...');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: testUser
  });
  assert(loginRes.ok, `Login failed: ${loginRes.status} - ${JSON.stringify(loginRes.data)}`);
  assert(loginRes.data.user, 'Login response missing user');
  assert(sessionCookie, 'No session cookie received');
  currentUser = loginRes.data.user;
  logSuccess(`Logged in as ${currentUser.email}`);
  
  // Test /auth/me
  logInfo('Testing /auth/me...');
  const meRes = await request('/api/auth/me');
  assert(meRes.ok, `Auth/me failed: ${meRes.status}`);
  assert(meRes.data.user.email === testUser.email, 'User email mismatch');
  logSuccess('Session verification passed');
  
  return true;
}

async function testTodos() {
  logSection('Todos CRUD');
  
  // Create todo
  logInfo('Creating todo...');
  const createRes = await request('/api/todos', {
    method: 'POST',
    body: {
      title: 'Test Todo ' + Date.now(),
      description: 'Created by comprehensive test',
      tags: ['test', 'integration'],
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    }
  });
  assert(createRes.ok, `Create todo failed: ${createRes.status} - ${JSON.stringify(createRes.data)}`);
  assert(createRes.data._id, 'Created todo missing _id');
  const todoId = createRes.data._id;
  createdItems.todos.push(todoId);
  logSuccess(`Created todo: ${todoId}`);
  
  // Get single todo
  logInfo('Getting single todo...');
  const getRes = await request(`/api/todos?id=${todoId}`);
  assert(getRes.ok, `Get todo failed: ${getRes.status}`);
  assert(getRes.data.title.includes('Test Todo'), 'Todo title mismatch');
  logSuccess('Get single todo passed');
  
  // List todos
  logInfo('Listing todos...');
  const listRes = await request('/api/todos');
  assert(listRes.ok, `List todos failed: ${listRes.status}`);
  const todos = listRes.data.data || listRes.data;
  assert(Array.isArray(todos), 'Todos list not an array');
  logSuccess(`Listed ${todos.length} todos`);
  
  // Update todo
  logInfo('Updating todo...');
  const updateRes = await request(`/api/todos?id=${todoId}`, {
    method: 'PATCH',
    body: { done: true, tags: ['test', 'updated'] }
  });
  assert(updateRes.ok, `Update todo failed: ${updateRes.status}`);
  assert(updateRes.data.done === true, 'Todo not marked done');
  logSuccess('Updated todo (marked done)');
  
  // Delete todo
  logInfo('Deleting todo...');
  const deleteRes = await request(`/api/todos?id=${todoId}`, { method: 'DELETE' });
  assert(deleteRes.ok, `Delete todo failed: ${deleteRes.status}`);
  createdItems.todos = createdItems.todos.filter(id => id !== todoId);
  logSuccess('Deleted todo');
  
  return true;
}

async function testNotes() {
  logSection('Notes CRUD');
  
  // Create note
  logInfo('Creating note...');
  const createRes = await request('/api/notes', {
    method: 'POST',
    body: {
      title: 'Test Note ' + Date.now(),
      bodyMarkdown: '# Test Note\n\nThis is a **test** note created by integration tests.',
      tags: ['test', 'markdown']
    }
  });
  assert(createRes.ok, `Create note failed: ${createRes.status} - ${JSON.stringify(createRes.data)}`);
  assert(createRes.data._id, 'Created note missing _id');
  const noteId = createRes.data._id;
  createdItems.notes.push(noteId);
  logSuccess(`Created note: ${noteId}`);
  
  // Get single note
  logInfo('Getting single note...');
  const getRes = await request(`/api/notes?id=${noteId}`);
  assert(getRes.ok, `Get note failed: ${getRes.status}`);
  assert(getRes.data.title.includes('Test Note'), 'Note title mismatch');
  logSuccess('Get single note passed');
  
  // List notes
  logInfo('Listing notes...');
  const listRes = await request('/api/notes');
  assert(listRes.ok, `List notes failed: ${listRes.status}`);
  const notes = listRes.data.data || listRes.data;
  assert(Array.isArray(notes), 'Notes list not an array');
  logSuccess(`Listed ${notes.length} notes`);
  
  // Update note
  logInfo('Updating note...');
  const updateRes = await request(`/api/notes?id=${noteId}`, {
    method: 'PUT',
    body: { 
      title: 'Updated Test Note',
      bodyMarkdown: '# Updated\n\nThis note was updated.',
      tags: ['test', 'updated']
    }
  });
  assert(updateRes.ok, `Update note failed: ${updateRes.status}`);
  logSuccess('Updated note');
  
  // Delete note
  logInfo('Deleting note...');
  const deleteRes = await request(`/api/notes?id=${noteId}`, { method: 'DELETE' });
  assert(deleteRes.ok, `Delete note failed: ${deleteRes.status}`);
  createdItems.notes = createdItems.notes.filter(id => id !== noteId);
  logSuccess('Deleted note');
  
  return true;
}

async function testProjects() {
  logSection('Projects CRUD');
  
  // Create project
  logInfo('Creating project...');
  const createRes = await request('/api/projects', {
    method: 'POST',
    body: {
      name: 'Test Project ' + Date.now(),
      description: 'Created by comprehensive test'
    }
  });
  assert(createRes.ok, `Create project failed: ${createRes.status} - ${JSON.stringify(createRes.data)}`);
  assert(createRes.data._id, 'Created project missing _id');
  const projectId = createRes.data._id;
  createdItems.projects.push(projectId);
  logSuccess(`Created project: ${projectId}`);
  
  // Get single project
  logInfo('Getting single project...');
  const getRes = await request(`/api/projects?id=${projectId}`);
  assert(getRes.ok, `Get project failed: ${getRes.status}`);
  assert(getRes.data.name.includes('Test Project'), 'Project name mismatch');
  logSuccess('Get single project passed');
  
  // List projects
  logInfo('Listing projects...');
  const listRes = await request('/api/projects');
  assert(listRes.ok, `List projects failed: ${listRes.status}`);
  const projects = Array.isArray(listRes.data) ? listRes.data : (listRes.data.data || []);
  assert(Array.isArray(projects), 'Projects list not an array');
  logSuccess(`Listed ${projects.length} projects`);
  
  // Update project
  logInfo('Updating project...');
  const updateRes = await request(`/api/projects?id=${projectId}`, {
    method: 'PUT',
    body: { 
      name: 'Updated Test Project',
      description: 'This project was updated'
    }
  });
  assert(updateRes.ok, `Update project failed: ${updateRes.status}`);
  logSuccess('Updated project');
  
  // Delete project
  logInfo('Deleting project...');
  const deleteRes = await request(`/api/projects?id=${projectId}`, { method: 'DELETE' });
  assert(deleteRes.ok, `Delete project failed: ${deleteRes.status}`);
  createdItems.projects = createdItems.projects.filter(id => id !== projectId);
  logSuccess('Deleted project');
  
  return true;
}

async function testContacts() {
  logSection('Contacts API');
  
  // List contacts
  logInfo('Listing contacts...');
  const listRes = await request('/api/contacts');
  assert(listRes.ok, `List contacts failed: ${listRes.status}`);
  const contacts = Array.isArray(listRes.data) ? listRes.data : [];
  logSuccess(`Listed ${contacts.length} contacts`);
  
  // List contact requests
  logInfo('Listing contact requests...');
  const requestsRes = await request('/api/contact_requests');
  assert(requestsRes.ok, `List contact requests failed: ${requestsRes.status}`);
  logSuccess('Contact requests endpoint working');
  
  return true;
}

async function testSearch() {
  logSection('Search API');
  
  // Test search
  logInfo('Testing search...');
  const searchRes = await request('/api/search?q=test');
  assert(searchRes.ok, `Search failed: ${searchRes.status}`);
  assert(searchRes.data.results !== undefined, 'Search response missing results');
  logSuccess(`Search returned ${searchRes.data.total || 0} results`);
  
  return true;
}

async function testInvitations() {
  logSection('Invitations API');
  
  // List invitations
  logInfo('Listing invitations...');
  const listRes = await request('/api/invitations');
  assert(listRes.ok, `List invitations failed: ${listRes.status}`);
  const invitations = Array.isArray(listRes.data) ? listRes.data : [];
  logSuccess(`Listed ${invitations.length} invitations`);
  
  return true;
}

async function testLogout() {
  logSection('Logout');
  
  logInfo('Testing logout...');
  const logoutRes = await request('/api/auth/logout', { method: 'POST' });
  assert(logoutRes.ok, `Logout failed: ${logoutRes.status}`);
  logSuccess('Logged out successfully');
  
  // Verify session is invalid
  logInfo('Verifying session invalidated...');
  const meRes = await request('/api/auth/me');
  assert(meRes.status === 401, 'Session should be invalid after logout');
  logSuccess('Session properly invalidated');
  
  return true;
}

async function cleanup() {
  logSection('Cleanup');
  
  // Re-login for cleanup
  await request('/api/auth/login', { method: 'POST', body: testUser });
  
  for (const todoId of createdItems.todos) {
    try {
      await request(`/api/todos?id=${todoId}`, { method: 'DELETE' });
      logInfo(`Cleaned up todo ${todoId}`);
    } catch (e) { /* ignore */ }
  }
  
  for (const noteId of createdItems.notes) {
    try {
      await request(`/api/notes?id=${noteId}`, { method: 'DELETE' });
      logInfo(`Cleaned up note ${noteId}`);
    } catch (e) { /* ignore */ }
  }
  
  for (const projectId of createdItems.projects) {
    try {
      await request(`/api/projects?id=${projectId}`, { method: 'DELETE' });
      logInfo(`Cleaned up project ${projectId}`);
    } catch (e) { /* ignore */ }
  }
  
  logSuccess('Cleanup complete');
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 Research Notebook Comprehensive Integration Tests');
  console.log(`📍 Testing against: ${baseUrl}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Todos CRUD', fn: testTodos },
    { name: 'Notes CRUD', fn: testNotes },
    { name: 'Projects CRUD', fn: testProjects },
    { name: 'Contacts', fn: testContacts },
    { name: 'Search', fn: testSearch },
    { name: 'Invitations', fn: testInvitations },
    { name: 'Logout', fn: testLogout }
  ];
  
  for (const test of tests) {
    try {
      await test.fn();
      results.passed++;
    } catch (error) {
      results.failed++;
      results.errors.push({ name: test.name, error: error.message });
      logError(`${test.name} FAILED: ${error.message}`);
    }
  }
  
  // Cleanup regardless of test results
  try {
    await cleanup();
  } catch (e) {
    logInfo('Cleanup had errors (non-fatal)');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total:  ${tests.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.errors.forEach(e => console.log(`   - ${e.name}: ${e.error}`));
  }
  
  console.log('\n' + (results.failed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed'));
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run
runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
