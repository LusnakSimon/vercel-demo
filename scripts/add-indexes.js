#!/usr/bin/env node
/**
 * Add database indexes for better query performance
 * Run with: node scripts/add-indexes.js
 */

const { connect } = require('../lib/mongo');

async function addIndexes() {
  console.log('Connecting to MongoDB...');
  const db = await connect();
  
  console.log('Creating indexes...');
  
  // Users collection
  const users = db.collection('users');
  await users.createIndex({ email: 1 }, { unique: true });
  console.log('✓ users.email (unique)');
  
  // Sessions collection
  const sessions = db.collection('sessions');
  await sessions.createIndex({ sid: 1 }, { unique: true });
  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  console.log('✓ sessions.sid (unique)');
  console.log('✓ sessions.expiresAt (TTL)');
  
  // Todos collection
  const todos = db.collection('todos');
  await todos.createIndex({ ownerId: 1 });
  await todos.createIndex({ projectId: 1 });
  await todos.createIndex({ tags: 1 });
  await todos.createIndex({ dueDate: 1 });
  await todos.createIndex({ done: 1 });
  await todos.createIndex({ createdAt: -1 });
  console.log('✓ todos.ownerId');
  console.log('✓ todos.projectId');
  console.log('✓ todos.tags');
  console.log('✓ todos.dueDate');
  console.log('✓ todos.done');
  console.log('✓ todos.createdAt (desc)');
  
  // Notes collection
  const notes = db.collection('notes');
  await notes.createIndex({ authorId: 1 });
  await notes.createIndex({ projectId: 1 });
  await notes.createIndex({ tags: 1 });
  await notes.createIndex({ visibility: 1 });
  await notes.createIndex({ title: 'text', bodyMarkdown: 'text', tags: 'text' });
  await notes.createIndex({ createdAt: -1 });
  await notes.createIndex({ updatedAt: -1 });
  console.log('✓ notes.authorId');
  console.log('✓ notes.projectId');
  console.log('✓ notes.tags');
  console.log('✓ notes.visibility');
  console.log('✓ notes (text search: title, bodyMarkdown, tags)');
  console.log('✓ notes.createdAt (desc)');
  console.log('✓ notes.updatedAt (desc)');
  
  // Projects collection
  const projects = db.collection('projects');
  await projects.createIndex({ members: 1 });
  await projects.createIndex({ createdAt: -1 });
  console.log('✓ projects.members');
  console.log('✓ projects.createdAt (desc)');
  
  console.log('\n✅ All indexes created successfully!');
  process.exit(0);
}

addIndexes().catch(err => {
  console.error('❌ Error creating indexes:', err);
  process.exit(1);
});
