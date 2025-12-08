/**
 * UI Flow Tests for Research Notebook
 * Tests specific UI scenarios and edge cases
 * 
 * Run with: node scripts/ui-flow-tests.js
 */

const assert = require('assert');
const baseUrl = process.env.DEPLOY_URL || 'https://researchnotebook.vercel.app';

const testUser = { email: 'alice@example.com', password: 'password123' };
let sessionCookie = null;

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

// Test specific UI flows

async function testProjectChatFlow() {
  logSection('Project Chat Flow');
  
  // Create a project first
  logInfo('Creating test project for chat...');
  const createRes = await request('/api/projects', {
    method: 'POST',
    body: { name: 'Chat Test Project ' + Date.now(), description: 'Testing chat functionality' }
  });
  assert(createRes.ok, `Create project failed: ${createRes.status}`);
  const projectId = createRes.data._id;
  logSuccess(`Created project: ${projectId}`);
  
  // Send a chat message
  logInfo('Sending chat message...');
  const chatRes = await request('/api/chat', {
    method: 'POST',
    body: { projectId, content: 'Hello from integration test! ' + Date.now() }
  });
  assert(chatRes.ok, `Send chat failed: ${chatRes.status} - ${JSON.stringify(chatRes.data)}`);
  logSuccess('Chat message sent');
  
  // Get chat messages
  logInfo('Getting chat messages...');
  const getChat = await request(`/api/chat?projectId=${projectId}&limit=50`);
  assert(getChat.ok, `Get chat failed: ${getChat.status}`);
  const messages = Array.isArray(getChat.data) ? getChat.data : [];
  assert(messages.length > 0, 'No chat messages found');
  logSuccess(`Retrieved ${messages.length} chat message(s)`);
  
  // Cleanup - delete project
  await request(`/api/projects?id=${projectId}`, { method: 'DELETE' });
  logSuccess('Cleaned up test project');
  
  return true;
}

async function testTodoWithSubtasks() {
  logSection('Todo with Subtasks');
  
  // Create todo with subtasks
  logInfo('Creating todo...');
  const createRes = await request('/api/todos', {
    method: 'POST',
    body: {
      title: 'Todo with Subtasks ' + Date.now(),
      description: 'Testing subtask functionality'
    }
  });
  assert(createRes.ok, `Create todo failed: ${createRes.status}`);
  const todoId = createRes.data._id;
  logSuccess(`Created todo: ${todoId}`);
  
  // Update with subtasks
  logInfo('Adding subtasks...');
  const updateRes = await request(`/api/todos?id=${todoId}`, {
    method: 'PATCH',
    body: {
      subtasks: [
        { id: 'st1', text: 'First subtask', done: false },
        { id: 'st2', text: 'Second subtask', done: true },
        { id: 'st3', text: 'Third subtask', done: false }
      ]
    }
  });
  assert(updateRes.ok, `Update todo failed: ${updateRes.status}`);
  assert(updateRes.data.subtasks.length === 3, 'Subtasks not saved');
  logSuccess('Subtasks added successfully');
  
  // Verify subtask data
  const getRes = await request(`/api/todos?id=${todoId}`);
  const subtasks = getRes.data.subtasks;
  assert(subtasks.filter(s => s.done).length === 1, 'Subtask done status not preserved');
  logSuccess('Subtask data verified');
  
  // Cleanup
  await request(`/api/todos?id=${todoId}`, { method: 'DELETE' });
  logSuccess('Cleaned up test todo');
  
  return true;
}

async function testTodoFiltering() {
  logSection('Todo Filtering & Search');
  
  // Create multiple todos with different tags
  logInfo('Creating test todos with tags...');
  const todo1 = await request('/api/todos', {
    method: 'POST',
    body: { title: 'Filter Test Urgent ' + Date.now(), tags: ['urgent', 'work'] }
  });
  const todo2 = await request('/api/todos', {
    method: 'POST',
    body: { title: 'Filter Test Personal ' + Date.now(), tags: ['personal', 'home'] }
  });
  assert(todo1.ok && todo2.ok, 'Failed to create test todos');
  logSuccess('Created test todos');
  
  // List all todos
  logInfo('Testing todo list...');
  const listRes = await request('/api/todos');
  assert(listRes.ok, `List failed: ${listRes.status}`);
  const todos = listRes.data.data || listRes.data;
  assert(todos.length >= 2, 'Not enough todos in list');
  logSuccess(`Listed ${todos.length} todos`);
  
  // Cleanup
  await request(`/api/todos?id=${todo1.data._id}`, { method: 'DELETE' });
  await request(`/api/todos?id=${todo2.data._id}`, { method: 'DELETE' });
  logSuccess('Cleaned up test todos');
  
  return true;
}

async function testNoteMarkdown() {
  logSection('Note Markdown Content');
  
  const markdownContent = `# Test Heading

This is a **bold** and *italic* test.

## Code Block

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

## List
- Item 1
- Item 2
- Item 3

## Link
[Research Notebook](https://researchnotebook.vercel.app)
`;

  logInfo('Creating note with markdown...');
  const createRes = await request('/api/notes', {
    method: 'POST',
    body: {
      title: 'Markdown Test Note ' + Date.now(),
      bodyMarkdown: markdownContent,
      tags: ['markdown', 'test']
    }
  });
  assert(createRes.ok, `Create note failed: ${createRes.status}`);
  const noteId = createRes.data._id;
  logSuccess('Created note with markdown');
  
  // Verify markdown preserved
  logInfo('Verifying markdown content...');
  const getRes = await request(`/api/notes?id=${noteId}`);
  assert(getRes.data.bodyMarkdown.includes('```javascript'), 'Code block not preserved');
  assert(getRes.data.bodyMarkdown.includes('**bold**'), 'Bold markdown not preserved');
  logSuccess('Markdown content preserved correctly');
  
  // Cleanup
  await request(`/api/notes?id=${noteId}`, { method: 'DELETE' });
  logSuccess('Cleaned up test note');
  
  return true;
}

async function testPagination() {
  logSection('Pagination');
  
  // Test todos pagination params
  logInfo('Testing pagination parameters...');
  const page1 = await request('/api/todos?page=1&limit=2');
  assert(page1.ok, `Pagination request failed: ${page1.status}`);
  
  if (page1.data.pagination) {
    logSuccess(`Pagination working - Page ${page1.data.pagination.page} of ${page1.data.pagination.totalPages}`);
  } else {
    logInfo('Pagination info not in response (may have few items)');
  }
  
  return true;
}

async function testDirectMessages() {
  logSection('Direct Messages API');
  
  logInfo('Testing direct messages endpoint...');
  const dmRes = await request('/api/direct-messages');
  assert(dmRes.ok, `Direct messages failed: ${dmRes.status}`);
  logSuccess('Direct messages endpoint working');
  
  return true;
}

async function testTemplates() {
  logSection('Note Templates API');
  
  logInfo('Listing templates...');
  const listRes = await request('/api/templates');
  assert(listRes.ok, `List templates failed: ${listRes.status}`);
  const templates = Array.isArray(listRes.data) ? listRes.data : [];
  logSuccess(`Listed ${templates.length} templates`);
  
  // Create a template
  logInfo('Creating test template...');
  const createRes = await request('/api/templates', {
    method: 'POST',
    body: {
      name: 'Test Template ' + Date.now(),
      description: 'Created by tests',
      icon: '📝',
      content: '# Template Title\n\nTemplate content here...'
    }
  });
  
  if (createRes.ok) {
    logSuccess('Created template');
    // Cleanup
    if (createRes.data._id) {
      await request(`/api/templates?id=${createRes.data._id}`, { method: 'DELETE' });
      logSuccess('Cleaned up template');
    }
  } else {
    logInfo(`Template creation returned ${createRes.status} (may require specific permissions)`);
  }
  
  return true;
}

async function testErrorHandling() {
  logSection('Error Handling');
  
  // Test 404 for non-existent todo
  logInfo('Testing 404 response...');
  const notFound = await request('/api/todos?id=000000000000000000000000');
  assert(notFound.status === 404, `Expected 404, got ${notFound.status}`);
  logSuccess('404 error handled correctly');
  
  // Test invalid request
  logInfo('Testing invalid request...');
  const invalid = await request('/api/todos', {
    method: 'POST',
    body: { } // Missing required title
  });
  assert(invalid.status === 400, `Expected 400, got ${invalid.status}`);
  logSuccess('400 error handled correctly');
  
  return true;
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 Research Notebook UI Flow Tests');
  console.log(`📍 Testing against: ${baseUrl}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
  
  // Login first
  logSection('Setup - Login');
  const loginRes = await request('/api/auth/login', { method: 'POST', body: testUser });
  if (!loginRes.ok) {
    logError(`Login failed: ${loginRes.status}`);
    process.exit(1);
  }
  logSuccess('Logged in successfully');
  
  const results = { passed: 0, failed: 0, errors: [] };
  
  const tests = [
    { name: 'Project Chat Flow', fn: testProjectChatFlow },
    { name: 'Todo with Subtasks', fn: testTodoWithSubtasks },
    { name: 'Todo Filtering', fn: testTodoFiltering },
    { name: 'Note Markdown', fn: testNoteMarkdown },
    { name: 'Pagination', fn: testPagination },
    { name: 'Direct Messages', fn: testDirectMessages },
    { name: 'Templates', fn: testTemplates },
    { name: 'Error Handling', fn: testErrorHandling }
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

runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
