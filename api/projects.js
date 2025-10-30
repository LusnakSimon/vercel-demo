const { connect } = require('../lib/mongo');
const { ObjectId } = require('mongodb');
const { getUserFromRequest, requireRole } = require('../lib/auth');

module.exports = async (req, res) => {
  try {
    const db = await connect();
    const projects = db.collection('projects');
    const authUser = await getUserFromRequest(req);

    if (req.method === 'GET') {
      const { id } = req.query || {};
      if (id) {
        const doc = await projects.findOne({ _id: new ObjectId(id) });
        return res.status(200).json(doc || {});
      }
      const list = await projects.find({}).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(list);
    }

    if (req.method === 'POST') {
      const auth = require('../lib/auth');
      const user = await auth.requireAuth(req, res);
      if (!user) return null; // response already sent by requireAuth
      const { name, description } = req.body || {};
      const { requireString } = require('../lib/validate');
      if (!requireString(name, 2)) return res.status(400).json({ error: 'name required (min 2 chars)' });
      const doc = { 
        name: name.trim(), 
        description: description ? String(description).trim() : '',
        ownerId: String(user._id), 
        members: [String(user._id)], // Creator is automatically a member
        createdAt: new Date() 
      };
      const r = await projects.insertOne(doc);
      doc._id = r.insertedId;
      return res.status(201).json(doc);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      if (!authUser) return res.status(401).json({ error: 'unauthenticated' });
      const project = await projects.findOne({ _id: new ObjectId(id) });
      if (!project) return res.status(404).json({ error: 'not found' });
      if (String(project.ownerId) !== String(authUser._id) && !requireRole(authUser, 'admin')) {
        return res.status(403).json({ error: 'forbidden' });
      }
      const updates = req.body || {};
      updates.updatedAt = new Date();
      await projects.updateOne({ _id: new ObjectId(id) }, { $set: updates });
      const updated = await projects.findOne({ _id: new ObjectId(id) });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      if (!authUser) return res.status(401).json({ error: 'unauthenticated' });
      const project = await projects.findOne({ _id: new ObjectId(id) });
      if (!project) return res.status(404).json({ error: 'not found' });
      if (String(project.ownerId) !== String(authUser._id) && !requireRole(authUser, 'admin')) {
        return res.status(403).json({ error: 'forbidden' });
      }
      await projects.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, PATCH, DELETE');
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
};
