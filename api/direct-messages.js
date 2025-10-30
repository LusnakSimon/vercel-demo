const { ObjectId } = require('mongodb');
const { getDb } = require('./db');
const { broadcastUpdate } = require('./sse');

module.exports = async (req, res) => {
  const { method } = req;
  
  try {
    // Check authentication
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const db = getDb();
    const directMessages = db.collection('direct_messages');
    const users = db.collection('users');
    const currentUserId = req.session.userId;

    if (method === 'GET') {
      const { conversationWith, conversationId, limit = '50', before } = req.query;

      // Get a specific conversation
      if (conversationWith) {
        const query = {
          $or: [
            { senderId: currentUserId, recipientId: conversationWith },
            { senderId: conversationWith, recipientId: currentUserId }
          ]
        };

        if (before) {
          query.createdAt = { $lt: new Date(before) };
        }

        const messages = await directMessages
          .find(query)
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
          .toArray();

        // Populate sender and recipient details
        const populatedMessages = await Promise.all(
          messages.map(async (msg) => {
            const sender = await users.findOne(
              { _id: new ObjectId(msg.senderId) },
              { projection: { name: 1, email: 1 } }
            );
            const recipient = await users.findOne(
              { _id: new ObjectId(msg.recipientId) },
              { projection: { name: 1, email: 1 } }
            );
            return {
              ...msg,
              sender,
              recipient
            };
          })
        );

        // Mark messages as read
        await directMessages.updateMany(
          { senderId: conversationWith, recipientId: currentUserId, read: false },
          { $set: { read: true, readAt: new Date() } }
        );

        return res.json(populatedMessages.reverse());
      }

      // List all conversations (unique people user has messaged with)
      const conversations = await directMessages
        .aggregate([
          {
            $match: {
              $or: [{ senderId: currentUserId }, { recipientId: currentUserId }]
            }
          },
          {
            $sort: { createdAt: -1 }
          },
          {
            $group: {
              _id: {
                $cond: [
                  { $eq: ['$senderId', currentUserId] },
                  '$recipientId',
                  '$senderId'
                ]
              },
              lastMessage: { $first: '$$ROOT' },
              unreadCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$recipientId', currentUserId] },
                        { $eq: ['$read', false] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          },
          {
            $sort: { 'lastMessage.createdAt': -1 }
          }
        ])
        .toArray();

      // Populate user details
      const populatedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const user = await users.findOne(
            { _id: new ObjectId(conv._id) },
            { projection: { name: 1, email: 1 } }
          );
          return {
            userId: conv._id,
            user,
            lastMessage: conv.lastMessage,
            unreadCount: conv.unreadCount
          };
        })
      );

      return res.json(populatedConversations);
    }

    if (method === 'POST') {
      const { recipientId, content } = req.body;

      if (!recipientId || !content) {
        return res.status(400).json({ error: 'Recipient and content are required' });
      }

      if (content.trim().length === 0) {
        return res.status(400).json({ error: 'Message cannot be empty' });
      }

      if (content.length > 5000) {
        return res.status(400).json({ error: 'Message too long (max 5000 characters)' });
      }

      if (recipientId === currentUserId) {
        return res.status(400).json({ error: 'Cannot send message to yourself' });
      }

      // Verify recipient exists
      const recipient = await users.findOne({ _id: new ObjectId(recipientId) });
      if (!recipient) {
        return res.status(404).json({ error: 'Recipient not found' });
      }

      const message = {
        senderId: currentUserId,
        recipientId,
        content: content.trim(),
        read: false,
        createdAt: new Date()
      };

      const result = await directMessages.insertOne(message);
      const createdMessage = { ...message, _id: result.insertedId };

      // Broadcast to recipient via SSE
      broadcastUpdate(recipientId, 'direct-message', {
        messageId: result.insertedId,
        senderId: currentUserId,
        preview: content.substring(0, 100)
      });

      return res.json(createdMessage);
    }

    if (method === 'PATCH') {
      const { conversationWith, markAsRead } = req.body;

      if (markAsRead && conversationWith) {
        // Mark all messages from this user as read
        await directMessages.updateMany(
          { senderId: conversationWith, recipientId: currentUserId, read: false },
          { $set: { read: true, readAt: new Date() } }
        );

        return res.json({ success: true });
      }

      return res.status(400).json({ error: 'Invalid request' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Direct messages error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
