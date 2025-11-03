const { connect } = require('../lib/mongo');
const { requireAuth } = require('../lib/auth');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  try {
    const db = await connect();
    const user = await requireAuth(req, res);
    if (!user) return null;
    
    if (req.method === 'GET') {
      const { q, type } = req.query || {};
      
      if (!q || q.trim().length < 2) {
        return res.status(400).json({ error: 'Query must be at least 2 characters' });
      }
      
      const query = q.trim();
      const searchRegex = new RegExp(query, 'i');
      const results = {
        todos: [],
        notes: [],
        projects: [],
        contacts: []
      };
      
      // Search todos (user's own or from projects they're member of)
      if (!type || type === 'todos') {
        const todos = db.collection('todos');
        results.todos = await todos.find({
          userId: String(user._id),
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { tags: searchRegex }
          ]
        }).limit(10).toArray();
      }
      
      // Search notes
      if (!type || type === 'notes') {
        const notes = db.collection('notes');
        results.notes = await notes.find({
          userId: String(user._id),
          $or: [
            { title: searchRegex },
            { content: searchRegex },
            { tags: searchRegex }
          ]
        }).limit(10).toArray();
      }
      
      // Search projects (where user is member)
      if (!type || type === 'projects') {
        const projects = db.collection('projects');
        results.projects = await projects.find({
          members: String(user._id),
          $or: [
            { name: searchRegex },
            { description: searchRegex }
          ]
        }).limit(10).toArray();
      }
      
      // Search contacts
      if (!type || type === 'contacts') {
        const contacts = db.collection('contacts');
        const users = db.collection('users');
        
        const userContacts = await contacts.find({ 
          userId: String(user._id) 
        }).toArray();
        
        const contactIds = userContacts.map(c => c.contactId);
        
        if (contactIds.length > 0) {
          results.contacts = await users.find(
            {
              _id: { $in: contactIds.map(id => new ObjectId(id)) },
              $or: [
                { name: searchRegex },
                { email: searchRegex }
              ]
            },
            { projection: { password: 0, passwordHash: 0 } }
          ).limit(10).toArray();
        }
      }
      
      // Calculate total results
      const total = 
        results.todos.length +
        results.notes.length +
        results.projects.length +
        results.contacts.length;
      
      return res.status(200).json({
        query,
        total,
        results
      });
    }
    
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
    
  } catch (err) {
    console.error('[Search Error]:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
};
