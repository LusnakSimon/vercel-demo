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
      
      const { id, projectId, page = 1, limit = 50 } = req.query || {};
      if (id) {
        const doc = await todos.findOne({ _id: new ObjectId(id) });
        if (!doc) return res.status(404).json({ error: 'not found' });
        // Verify ownership or admin
        if (String(doc.ownerId) !== String(authUser._id) && authUser.role !== 'admin') {
          return res.status(403).json({ error: 'forbidden' });
        }
        return res.status(200).json(doc);
      }
      
      // List todos - filter by current user's ownership with pagination
      // If projectId is provided and user is a project member, show all project todos
      let q = { ownerId: String(authUser._id) };
      
      if (projectId) {
        const { isProjectMember } = require('../lib/auth');
        const isMember = await isProjectMember(authUser, projectId);
        if (isMember || authUser.role === 'admin') {
          // Show all todos for this project (from any member)
          q = { projectId: String(projectId) };
        } else {
          // Not a member, only show own todos for this project
          q.projectId = String(projectId);
        }
      }
      
      const pageNum = Math.max(1, parseInt(page, 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10))); // Max 100 per page
      const skip = (pageNum - 1) * pageSize;
      
      const [list, total] = await Promise.all([
        todos.find(q).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
        todos.countDocuments(q)
      ]);
      
      return res.status(200).json({
        data: list,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total: total,
          totalPages: Math.ceil(total / pageSize),
          hasNext: pageNum < Math.ceil(total / pageSize),
          hasPrev: pageNum > 1
        }
      });
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
        userId: String(authUser._id), // For compatibility
        done: false, 
        tags: tagArray,
        dueDate: dueDateObj,
        subtasks: [], // Initialize empty subtasks array
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
      
      // Process subtasks if provided
      if (updates.subtasks !== undefined) {
        if (!Array.isArray(updates.subtasks)) {
          return res.status(400).json({ error: 'subtasks must be an array' });
        }
        // Validate subtasks structure
        const validSubtasks = updates.subtasks.map((st, idx) => ({
          id: st.id || `subtask-${Date.now()}-${idx}`,
          text: String(st.text || '').trim(),
          done: Boolean(st.done)
        })).filter(st => st.text);
        updates.subtasks = validSubtasks;
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
