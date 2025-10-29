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
      const { title, description, projectId, ownerId } = req.body || {};
      if (!title) return res.status(400).json({ error: 'title required' });
      const doc = { title, description: description || '', projectId: projectId || null, ownerId: ownerId || null, done: false, createdAt: new Date() };
      const r = await todos.insertOne(doc);
      doc._id = r.insertedId;
      return res.status(201).json(doc);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const updates = req.body || {};
      updates.updatedAt = new Date();
      await todos.updateOne({ _id: new ObjectId(id) }, { $set: updates });
      const updated = await todos.findOne({ _id: new ObjectId(id) });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'id required' });
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
