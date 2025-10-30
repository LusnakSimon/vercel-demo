const { connect } = require('../lib/mongo');
const { ObjectId } = require('mongodb');
const { requireAuth } = require('../lib/auth');

// Import broadcast function for real-time chat
let broadcastUpdate;
try {
  const realtimeModule = require('./realtime/updates');
  broadcastUpdate = realtimeModule.broadcastUpdate;
} catch (e) {
  broadcastUpdate = () => {};
}

module.exports = async (req, res) => {
  try {
    const db = await connect();
    const messages = db.collection('messages');
    const projects = db.collection('projects');
    const users = db.collection('users');
    
    const user = await requireAuth(req, res);
    if (!user) return null;
    
    // GET - Get chat messages for a project
    if (req.method === 'GET') {
      const { projectId, limit = 50, before } = req.query || {};
      
      if (!projectId) {
        return res.status(400).json({ error: 'projectId required' });
      }
      
      // Verify user is member of project
      const project = await projects.findOne({ _id: new ObjectId(projectId) });
      if (!project) {
        return res.status(404).json({ error: 'project not found' });
      }
      
      if (!project.members || !project.members.includes(String(user._id))) {
        return res.status(403).json({ error: 'not a member of this project' });
      }
      
      // Build query
      const query = { projectId: String(projectId) };
      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }
      
      // Get messages
      const messageList = await messages
        .find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .toArray();
      
      // Reverse to get chronological order
      messageList.reverse();
      
      // Populate author details
      for (let msg of messageList) {
        if (msg.authorId) {
          const author = await users.findOne(
            { _id: new ObjectId(msg.authorId) },
            { projection: { password: 0, passwordHash: 0 } }
          );
          if (author) {
            msg.author = {
              _id: author._id,
              name: author.name,
              email: author.email
            };
          }
        }
      }
      
      return res.status(200).json(messageList);
    }
    
    // POST - Send a message
    if (req.method === 'POST') {
      const { projectId, content } = req.body || {};
      
      if (!projectId || !content) {
        return res.status(400).json({ error: 'projectId and content required' });
      }
      
      if (typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'content must be non-empty string' });
      }
      
      if (content.length > 5000) {
        return res.status(400).json({ error: 'message too long (max 5000 chars)' });
      }
      
      // Verify user is member of project
      const project = await projects.findOne({ _id: new ObjectId(projectId) });
      if (!project) {
        return res.status(404).json({ error: 'project not found' });
      }
      
      if (!project.members || !project.members.includes(String(user._id))) {
        return res.status(403).json({ error: 'not a member of this project' });
      }
      
      // Create message
      const message = {
        projectId: String(projectId),
        authorId: String(user._id),
        content: content.trim(),
        createdAt: new Date()
      };
      
      const result = await messages.insertOne(message);
      message._id = result.insertedId;
      
      // Add author info
      message.author = {
        _id: user._id,
        name: user.name,
        email: user.email
      };
      
      // Broadcast to all project members
      project.members.forEach(memberId => {
        if (String(memberId) !== String(user._id)) {
          broadcastUpdate(String(memberId), {
            type: 'chat-message',
            projectId: String(projectId),
            message: message
          });
        }
      });
      
      return res.status(201).json(message);
    }
    
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
};
