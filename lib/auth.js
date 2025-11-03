const jwt = require('jsonwebtoken');
const { connect } = require('./mongo');

function getJwtSecret() { return process.env.JWT_SECRET || 'dev-secret'; }

async function getUserFromToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const db = await connect();
    const users = db.collection('users');
    const user = await users.findOne({ _id: require('mongodb').ObjectId(decoded.sub) });
    if (!user) return null;
    // strip sensitive fields
    user.passwordHash && delete user.passwordHash;
    return user;
  } catch (err) {
    return null;
  }
}

async function getUserFromRequest(req) {
  const auth = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!auth) return null;
  const m = String(auth).match(/^Bearer\s+(.*)$/i);
  if (!m) return null;
  return getUserFromToken(m[1]);
}

// read sid cookie and resolve session -> user
async function getUserFromRequestWithSession(req) {
  try {
    const cookieHeader = req.headers && (req.headers.cookie || req.headers.Cookie || '');
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').map(s=>s.trim()).reduce((acc,c)=>{ const [k,v]=c.split('='); acc[k]=v; return acc; },{});
    const sid = cookies && cookies.sid;
    if (!sid) return null;
    const sessions = require('./sessions');
    const s = await sessions.getSessionBySid(sid);
    if (!s) return null;
    const db = await connect();
    const users = db.collection('users');
    const { ObjectId } = require('mongodb');
    const user = await users.findOne({ _id: new ObjectId(s.userId) });
    if (!user) return null;
    user.passwordHash && delete user.passwordHash;
    return user;
  } catch (e) {
    return null;
  }
}

// override exported getUserFromRequest to check session cookie first
async function getUserFromRequest(req) {
  const bySession = await getUserFromRequestWithSession(req);
  if (bySession) return bySession;
  // fallback to token-based flow (if present)
  const auth = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!auth) return null;
  const m = String(auth).match(/^Bearer\s+(.*)$/i);
  if (!m) return null;
  return getUserFromToken(m[1]);
}

function requireRole(user, role) {
  if (!user) return false;
  if (!user.role) return false;
  return user.role === role || user.role === 'admin';
}

async function requireAuth(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) {
    if (res) res.status(401).json({ error: 'unauthenticated' });
    return null;
  }
  return user;
}

module.exports = { getUserFromToken, getUserFromRequest, requireRole, requireAuth };

// Check whether a user is a member of a project (owner or in memberIds/members)
async function isProjectMember(user, projectId) {
  if (!user || !projectId) return false;
  try {
    const db = await connect();
    const projects = db.collection('projects');
    const p = await projects.findOne({ _id: require('mongodb').ObjectId(projectId) });
    if (!p) return false;
    
    // Check if user is the owner
    if (String(p.ownerId) === String(user._id)) return true;
    if (String(p.createdBy) === String(user._id)) return true;
    
    // Check memberIds array (legacy field)
    if (Array.isArray(p.memberIds) && p.memberIds.map(String).includes(String(user._id))) return true;
    
    // Check members array (current field)
    if (Array.isArray(p.members) && p.members.map(String).includes(String(user._id))) return true;
    
    return false;
  } catch (e) {
    return false;
  }
}

module.exports.isProjectMember = isProjectMember;
