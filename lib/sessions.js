const { connect } = require('./mongo');
const { randomBytes } = require('crypto');

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function createSession(userId, opts = {}) {
  const db = await connect();
  const sessions = db.collection('sessions');
  // ensure TTL index exists
  try {
    await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch (e) { /* ignore */ }
  const sid = randomBytes(24).toString('base64url');
  const now = new Date();
  const ttl = opts.ttlMs || DEFAULT_TTL_MS;
  const doc = { sid, userId: String(userId), createdAt: now, expiresAt: new Date(now.getTime() + ttl) };
  await sessions.insertOne(doc);
  return doc;
}

async function getSessionBySid(sid) {
  if (!sid) return null;
  const db = await connect();
  const sessions = db.collection('sessions');
  const s = await sessions.findOne({ sid });
  return s;
}

async function deleteSessionBySid(sid) {
  if (!sid) return null;
  const db = await connect();
  const sessions = db.collection('sessions');
  return sessions.deleteOne({ sid });
}

module.exports = { createSession, getSessionBySid, deleteSessionBySid };
