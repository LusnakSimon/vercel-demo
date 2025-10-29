const { connect } = require('../lib/mongo');
const { ObjectId } = require('mongodb');

// RESTful todos handler using MongoDB
module.exports = async (req, res) => {
  try {
    const db = await connect();
    const todos = db.collection('todos');

    if (req.method === 'GET') {
      // GET /api/todos or /api/todos?id=...
      const { id, projectId } = req.query || {};
      if (id) {
        const doc = await todos.findOne({ _id: new ObjectId(id) });
        return res.status(200).json(doc || {});
      }
      const q = projectId ? { projectId } : {};
      const list = await todos.find(q).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(list);
    }

    if (req.method === 'POST') {
      const authUser = await require('../lib/auth').getUserFromRequest(req);
      if (!authUser) return res.status(401).json({ error: 'unauthenticated' });
      const { title, description, projectId } = req.body || {};
      if (!title) return res.status(400).json({ error: 'title required' });
      const doc = { title, description: description || '', projectId: projectId || null, ownerId: String(authUser._id), done: false, createdAt: new Date() };
      const r = await todos.insertOne(doc);
      doc._id = r.insertedId;
      return res.status(201).json(doc);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const authUser = await require('../lib/auth').getUserFromRequest(req);
      if (!authUser) return res.status(401).json({ error: 'unauthenticated' });
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const existing = await todos.findOne({ _id: new ObjectId(id) });
      if (!existing) return res.status(404).json({ error: 'not found' });
      if (String(existing.ownerId) !== String(authUser._id) && !require('../lib/auth').requireRole(authUser, 'admin')) {
        return res.status(403).json({ error: 'forbidden' });
      }
      const updates = req.body || {};
      updates.updatedAt = new Date();
      await todos.updateOne({ _id: new ObjectId(id) }, { $set: updates });
      const updated = await todos.findOne({ _id: new ObjectId(id) });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const authUser = await require('../lib/auth').getUserFromRequest(req);
      if (!authUser) return res.status(401).json({ error: 'unauthenticated' });
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const existing = await todos.findOne({ _id: new ObjectId(id) });
      if (!existing) return res.status(404).json({ error: 'not found' });
      if (String(existing.ownerId) !== String(authUser._id) && !require('../lib/auth').requireRole(authUser, 'admin')) {
        return res.status(403).json({ error: 'forbidden' });
      }
      await todos.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, PATCH, DELETE');
    res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  }
};
