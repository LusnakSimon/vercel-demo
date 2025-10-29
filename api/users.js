const { connect } = require('../lib/mongo');
const { ObjectId } = require('mongodb');
const { getUserFromRequest, requireRole } = require('../lib/auth');

module.exports = async (req, res) => {
  try {
    const db = await connect();
    const users = db.collection('users');
    const authUser = await getUserFromRequest(req);

    if (req.method === 'GET') {
      // Only admin can list users
      if (!requireRole(authUser, 'admin')) return res.status(403).json({ error: 'forbidden' });
      const list = await users.find({}, { projection: { passwordHash: 0 } }).toArray();
      return res.status(200).json(list);
    }

    if (req.method === 'GET' && req.query && req.query.id) {
      const doc = await users.findOne({ _id: new ObjectId(req.query.id) }, { projection: { passwordHash: 0 } });
      return res.status(200).json(doc || {});
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      // allow user to update their profile or admin to update any
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      if (!authUser) return res.status(401).json({ error: 'unauthenticated' });
      if (String(authUser._id) !== String(id) && !requireRole(authUser, 'admin')) {
        return res.status(403).json({ error: 'forbidden' });
      }
      const updates = req.body || {};
      delete updates.passwordHash;
      // validation: if updating email, validate it; if updating name, ensure length
      const { isEmail, requireString } = require('../lib/validate');
      if (updates.email && !isEmail(updates.email)) return res.status(400).json({ error: 'invalid email' });
      if (updates.name && !requireString(updates.name, 2)) return res.status(400).json({ error: 'name too short' });
      // only admin can change role
      if (updates.role && !requireRole(authUser, 'admin')) delete updates.role;
      await users.updateOne({ _id: new ObjectId(id) }, { $set: updates });
      const updated = await users.findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });
      return res.status(200).json(updated);
    }

    res.setHeader('Allow', 'GET, PUT, PATCH');
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
};
