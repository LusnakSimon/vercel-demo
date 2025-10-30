const { connect } = require('../lib/mongo');
const { ObjectId } = require('mongodb');

// RESTful todos handler using MongoDB
module.exports = async (req, res) => {
  try {
    const db = await connect();
    const todos = db.collection('todos');

    if (req.method === 'GET') {
      // GET /api/todos or /api/todos?id=...
      const authUser = await require('../lib/auth').getUserFromRequest(req);
      if (!authUser) return res.status(401).json({ error: 'unauthenticated' });
      
      const { id, projectId } = req.query || {};
      if (id) {
        const doc = await todos.findOne({ _id: new ObjectId(id) });
        if (!doc) return res.status(404).json({ error: 'not found' });
        // Verify ownership or admin
        if (String(doc.ownerId) !== String(authUser._id) && authUser.role !== 'admin') {
          return res.status(403).json({ error: 'forbidden' });
        }
        return res.status(200).json(doc);
      }
      
      // List todos - filter by current user's ownership
      const q = { ownerId: String(authUser._id) };
      if (projectId) q.projectId = projectId;
      const list = await todos.find(q).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(list);
    }

    if (req.method === 'POST') {
      const authUser = await require('../lib/auth').getUserFromRequest(req);
      if (!authUser) return res.status(401).json({ error: 'unauthenticated' });
      const { title, description, projectId, tags, dueDate } = req.body || {};
      const { requireString } = require('../lib/validate');
      if (!requireString(title, 1)) return res.status(400).json({ error: 'title required' });
      if (projectId && typeof projectId !== 'string') return res.status(400).json({ error: 'projectId must be a string' });
      
      // Validate and process tags
      let tagArray = [];
      if (tags) {
        if (Array.isArray(tags)) {
          tagArray = tags.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim());
        } else if (typeof tags === 'string') {
          tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
        }
      }
      
      // Validate due date
      let dueDateObj = null;
      if (dueDate) {
        dueDateObj = new Date(dueDate);
        if (isNaN(dueDateObj.getTime())) {
          return res.status(400).json({ error: 'invalid dueDate' });
        }
      }
      
      const doc = { 
        title: title.trim(), 
        description: description ? String(description).trim() : '', 
        projectId: projectId || null, 
        ownerId: String(authUser._id), 
        done: false, 
        tags: tagArray,
        dueDate: dueDateObj,
        createdAt: new Date() 
      };
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
      const { requireString } = require('../lib/validate');
      if (updates.title && !requireString(updates.title, 1)) return res.status(400).json({ error: 'invalid title' });
      if (updates.projectId && typeof updates.projectId !== 'string') return res.status(400).json({ error: 'projectId must be a string' });
      
      // Process tags if provided
      if (updates.tags !== undefined) {
        let tagArray = [];
        if (Array.isArray(updates.tags)) {
          tagArray = updates.tags.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim());
        } else if (typeof updates.tags === 'string') {
          tagArray = updates.tags.split(',').map(t => t.trim()).filter(t => t);
        }
        updates.tags = tagArray;
      }
      
      // Process due date if provided
      if (updates.dueDate !== undefined) {
        if (updates.dueDate === null || updates.dueDate === '') {
          updates.dueDate = null;
        } else {
          const dueDateObj = new Date(updates.dueDate);
          if (isNaN(dueDateObj.getTime())) {
            return res.status(400).json({ error: 'invalid dueDate' });
          }
          updates.dueDate = dueDateObj;
        }
      }
      
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
