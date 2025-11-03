const { ObjectId } = require('mongodb');
const { getDb } = require('../lib/mongo');
const { requireAuth } = require('../lib/auth');

/**
 * Parse @mentions from text
 * Supports: @email@domain.com or @Name
 */
function parseMentions(text) {
  if (!text) return [];
  
  // Match @email@domain.com or @Name (alphanumeric + underscore)
  const mentionRegex = /@([\w.+-]+@[\w.-]+|[\w]+)/g;
  const matches = text.matchAll(mentionRegex);
  
  const mentions = [];
  for (const match of matches) {
    mentions.push(match[1]); // The captured group without @
  }
  
  return [...new Set(mentions)]; // Remove duplicates
}

module.exports = async (req, res) => {
  // Require authentication
  const user = await requireAuth(req, res);
  if (!user) return;

  const db = await getDb();
  const mentions = db.collection('mentions');
  const users = db.collection('users');

  // GET: List mentions for current user (where they were mentioned)
  if (req.method === 'GET') {
    try {
      const { unreadOnly } = req.query;
      
      const query = { mentionedUserId: new ObjectId(user._id) };
      if (unreadOnly === 'true') {
        query.read = false;
      }
      
      const mentionsList = await mentions
        .find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();
      
      // Populate author info
      for (const mention of mentionsList) {
        if (mention.authorId) {
          const author = await users.findOne({ _id: new ObjectId(mention.authorId) });
          mention.author = author ? { 
            name: author.name, 
            email: author.email 
          } : null;
        }
      }
      
      return res.json(mentionsList);
    } catch (err) {
      console.error('[Mentions GET] Error:', err);
      return res.status(500).json({ error: 'Failed to load mentions' });
    }
  }

  // POST: Create mentions from text content
  if (req.method === 'POST') {
    try {
      const { text, contentType, contentId, contentTitle } = req.body;

      if (!text || !contentType || !contentId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!['note', 'todo', 'chat'].includes(contentType)) {
        return res.status(400).json({ error: 'Invalid contentType' });
      }

      // Parse mentions from text
      const mentionStrings = parseMentions(text);
      
      if (mentionStrings.length === 0) {
        return res.json({ created: 0, mentions: [] });
      }

      // Find users by email or name
      const mentionedUsers = await users.find({
        $or: [
          { email: { $in: mentionStrings } },
          { name: { $in: mentionStrings } }
        ]
      }).toArray();

      // Don't mention yourself
      const filteredUsers = mentionedUsers.filter(u => 
        String(u._id) !== String(user._id)
      );

      // Create mention records
      const mentionDocs = filteredUsers.map(mentionedUser => ({
        authorId: new ObjectId(user._id),
        mentionedUserId: new ObjectId(mentionedUser._id),
        contentType,
        contentId: String(contentId),
        contentTitle: contentTitle || '',
        text: text.substring(0, 200), // Store excerpt
        read: false,
        createdAt: new Date()
      }));

      let insertedIds = [];
      if (mentionDocs.length > 0) {
        const result = await mentions.insertMany(mentionDocs);
        insertedIds = Object.values(result.insertedIds);
      }

      return res.json({ 
        created: insertedIds.length, 
        mentions: insertedIds 
      });
    } catch (err) {
      console.error('[Mentions POST] Error:', err);
      return res.status(500).json({ error: 'Failed to create mentions' });
    }
  }

  // PATCH: Mark mention as read
  if (req.method === 'PATCH') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Mention ID required' });
      }

      const result = await mentions.updateOne(
        { 
          _id: new ObjectId(id),
          mentionedUserId: new ObjectId(user._id) // Only mark own mentions as read
        },
        { $set: { read: true, readAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Mention not found' });
      }

      return res.json({ message: 'Mention marked as read' });
    } catch (err) {
      console.error('[Mentions PATCH] Error:', err);
      return res.status(500).json({ error: 'Failed to update mention' });
    }
  }

  // DELETE: Clear old mentions
  if (req.method === 'DELETE') {
    try {
      // Delete mentions older than 30 days that have been read
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await mentions.deleteMany({
        mentionedUserId: new ObjectId(user._id),
        read: true,
        readAt: { $lt: thirtyDaysAgo }
      });

      return res.json({ deleted: result.deletedCount });
    } catch (err) {
      console.error('[Mentions DELETE] Error:', err);
      return res.status(500).json({ error: 'Failed to delete mentions' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

// Export helper for use in other modules
module.exports.parseMentions = parseMentions;
