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

module.exports = { getUserFromToken, getUserFromRequest, requireRole };
