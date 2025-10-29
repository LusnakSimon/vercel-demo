const { connect } = require('../lib/mongo');
const { ObjectId } = require('mongodb');
const { getUserFromRequest, requireAuth, requireRole } = require('../lib/auth');

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
      const { id, projectId, q, tag, skip = 0, limit = 50 } = req.query || {};
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

      const filter = { $or: [ { authorId: String(user._id) } ] };

      // include notes from projects where user is member
      if (projectId) {
        // if projectId provided, ensure membership
        const { isProjectMember } = require('../lib/auth');
        const member = await isProjectMember(user, projectId);
        if (!member && !requireRole(user, 'admin')) return res.status(403).json({ error: 'forbidden' });
        filter.$or.push({ projectId: String(projectId) });
      } else {
  // include user's project notes by finding projects where user is member
  const projectsCursor = await projects.find({ $or: [ { ownerId: String(user._id) } , { memberIds: { $in: [ String(user._id) ] } } ] }).project({ _id: 1 }).toArray().catch(()=>[]);
        const projectIds = projectsCursor.map(p => String(p._id));
        if (projectIds.length) filter.$or.push({ projectId: { $in: projectIds } });
      }

      if (tag) filter.tags = String(tag);
      if (q) filter.$text = { $search: String(q) };

      const cursor = notes.find(filter).sort({ updatedAt: -1, createdAt: -1 }).skip(Number(skip)).limit(Math.min(500, Number(limit)));
      const list = await cursor.toArray();
      return res.status(200).json(list);
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
