const { connect } = require('../lib/mongo');
const { ObjectId } = require('mongodb');
const { getUserFromRequest, requireAuth, requireRole } = require('../lib/auth');

// Import broadcast function for real-time updates
let broadcastUpdate;
try {
  const realtimeModule = require('./realtime/updates');
  broadcastUpdate = realtimeModule.broadcastUpdate;
} catch (e) {
  // If realtime module not available, create a no-op function
  broadcastUpdate = () => {};
}

// Notes API: supports simple CRUD and text search (title + body + tags)
module.exports = async (req, res) => {
  try {
    const db = await connect();
    const notes = db.collection('notes');
    const projects = db.collection('projects');

    // Ensure text index exists (idempotent)
    try {
      await notes.createIndex({ title: 'text', bodyMarkdown: 'text', tags: 'text' });
    } catch (e) {
      // ignore index creation errors in serverless environments
    }

    if (req.method === 'GET') {
      const { id, projectId, q, tag, page = 1, limit = 50 } = req.query || {};
      // GET single note
      if (id) {
        const doc = await notes.findOne({ _id: new ObjectId(id) });
        if (!doc) return res.status(404).json({ error: 'not found' });
        // enforce visibility
        const requestingUser = await getUserFromRequest(req);
        if (doc.visibility === 'project') {
          if (!requestingUser) return res.status(401).json({ error: 'unauthenticated' });
          const { isProjectMember } = require('../lib/auth');
          const ok = await isProjectMember(requestingUser, doc.projectId) || String(doc.authorId) === String(requestingUser._id) || requireRole(requestingUser, 'admin');
          if (!ok) return res.status(403).json({ error: 'forbidden' });
        } else if (doc.visibility === 'private') {
          const u = await getUserFromRequest(req);
          if (!u) return res.status(401).json({ error: 'unauthenticated' });
          if (String(doc.authorId) !== String(u._id) && !requireRole(u, 'admin')) return res.status(403).json({ error: 'forbidden' });
        }
        return res.status(200).json(doc);
      }

      // For lists: require authentication and filter only to notes the user can access
      const user = await getUserFromRequest(req);
      if (!user) return res.status(401).json({ error: 'unauthenticated' });

      // By default, show only user's own notes (simpler UX)
      // If projectId is provided, include project notes where user is member
      const filter = { authorId: String(user._id) };

      if (projectId) {
        // if projectId provided, ensure membership and include project notes
        const { isProjectMember } = require('../lib/auth');
        const member = await isProjectMember(user, projectId);
        if (!member && !requireRole(user, 'admin')) return res.status(403).json({ error: 'forbidden' });
        // Show both user's notes AND project notes for this project
        filter.$or = [
          { authorId: String(user._id) },
          { projectId: String(projectId) }
        ];
        delete filter.authorId;
      }

      if (tag) filter.tags = String(tag);
      if (q) filter.$text = { $search: String(q) };

      const pageNum = Math.max(1, parseInt(page, 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10))); // Max 100 per page
      const skip = (pageNum - 1) * pageSize;

      const [list, total] = await Promise.all([
        notes.find(filter).sort({ updatedAt: -1, createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
        notes.countDocuments(filter)
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
      const user = await requireAuth(req, res);
      if (!user) return null;
      const { title, bodyMarkdown, projectId, tags } = req.body || {};
      const { requireString } = require('../lib/validate');
      if (!requireString(title, 1)) return res.status(400).json({ error: 'title required' });
      const doc = {
        title: String(title).trim(),
        bodyMarkdown: bodyMarkdown ? String(bodyMarkdown) : '',
        projectId: projectId ? String(projectId) : null,
        tags: Array.isArray(tags) ? tags.map(String) : [],
        attachments: [],
        visibility: 'project',
        authorId: String(user._id),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const r = await notes.insertOne(doc);
      doc._id = r.insertedId;
      // Optionally ensure project exists (no strict enforcement here)
      if (doc.projectId) {
        await projects.updateOne({ _id: new ObjectId(doc.projectId) }, { $setOnInsert: { createdAt: new Date() } }, { upsert: false }).catch(() => {});
      }
      return res.status(201).json(doc);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const user = await requireAuth(req, res);
      if (!user) return null;
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const existing = await notes.findOne({ _id: new ObjectId(id) });
      if (!existing) return res.status(404).json({ error: 'not found' });
      // only author or admin can update
      if (String(existing.authorId) !== String(user._id) && !requireRole(user, 'admin')) {
        return res.status(403).json({ error: 'forbidden' });
      }
      const updates = req.body || {};
      if (updates.title && typeof updates.title !== 'string') return res.status(400).json({ error: 'invalid title' });
      if (updates.tags && !Array.isArray(updates.tags)) return res.status(400).json({ error: 'tags must be an array' });
      updates.updatedAt = new Date();
      await notes.updateOne({ _id: new ObjectId(id) }, { $set: updates });
      const updated = await notes.findOne({ _id: new ObjectId(id) });
      
      // Broadcast update to collaborators
      if (existing.projectId) {
        // Get all project members
        const project = await projects.findOne({ _id: new ObjectId(existing.projectId) });
        if (project && project.members) {
          project.members.forEach(memberId => {
            if (String(memberId) !== String(user._id)) { // Don't send to the editor
              broadcastUpdate(String(memberId), {
                type: 'note-updated',
                noteId: String(id),
                title: updated.title,
                projectId: existing.projectId,
                updatedBy: String(user._id)
              });
            }
          });
        }
      }
      
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const user = await requireAuth(req, res);
      if (!user) return null;
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const existing = await notes.findOne({ _id: new ObjectId(id) });
      if (!existing) return res.status(404).json({ error: 'not found' });
      if (String(existing.authorId) !== String(user._id) && !requireRole(user, 'admin')) {
        return res.status(403).json({ error: 'forbidden' });
      }
      await notes.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, PATCH, DELETE');
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
};
