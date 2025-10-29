const jwt = require('jsonwebtoken');
const { connect } = require('./mongo');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function getUserFromToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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

// Check whether a user is a member of a project (owner or in memberIds)
async function isProjectMember(user, projectId) {
  if (!user || !projectId) return false;
  try {
    const db = await connect();
    const projects = db.collection('projects');
    const p = await projects.findOne({ _id: require('mongodb').ObjectId(projectId) });
    if (!p) return false;
    if (String(p.ownerId) === String(user._id)) return true;
    if (Array.isArray(p.memberIds) && p.memberIds.map(String).includes(String(user._id))) return true;
    return false;
  } catch (e) {
    return false;
  }
}

module.exports.isProjectMember = isProjectMember;
