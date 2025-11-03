const { connect } = require('../lib/mongo');
const { ObjectId } = require('mongodb');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  try {
    const db = await connect();
    const contactRequests = db.collection('contact_requests');
    const contacts = db.collection('contacts');
    const users = db.collection('users');
    
    const user = await requireAuth(req, res);
    if (!user) return null;
    
    // GET - List pending requests (received)
    if (req.method === 'GET') {
      const { sent } = req.query || {};
      
      let query;
      if (sent === 'true') {
        // Requests I sent
        query = { 
          fromUserId: String(user._id),
          status: 'pending'
        };
      } else {
        // Requests I received
        query = { 
          toUserId: String(user._id),
          status: 'pending'
        };
      }
      
      const requests = await contactRequests.find(query).toArray();
      
      // Populate user details
      const userIds = sent === 'true' 
        ? requests.map(r => r.toUserId)
        : requests.map(r => r.fromUserId);
      
      const requestUsers = await users.find(
        { _id: { $in: userIds.map(id => new ObjectId(id)) } },
        { projection: { password: 0, passwordHash: 0 } }
      ).toArray();
      
      // Combine request data with user info
      const populated = requests.map(req => {
        const userId = sent === 'true' ? req.toUserId : req.fromUserId;
        const userInfo = requestUsers.find(u => String(u._id) === userId);
        return {
          ...req,
          user: userInfo
        };
      });
      
      return res.status(200).json(populated);
    }
    
    // POST - Send contact request
    if (req.method === 'POST') {
      const { toUserId } = req.body || {};
      
      if (!toUserId) {
        return res.status(400).json({ error: 'toUserId required' });
      }
      
      // Can't send request to yourself
      if (String(toUserId) === String(user._id)) {
        return res.status(400).json({ error: 'cannot send request to yourself' });
      }
      
      // Check if target user exists
      const targetUser = await users.findOne({ _id: new ObjectId(toUserId) });
      if (!targetUser) {
        return res.status(404).json({ error: 'user not found' });
      }
      
      // Check if already contacts
      const existingContact = await contacts.findOne({
        userId: String(user._id),
        contactId: String(toUserId)
      });
      
      if (existingContact) {
        return res.status(400).json({ error: 'already in contacts' });
      }
      
      // Check if request already exists (either direction)
      const existingRequest = await contactRequests.findOne({
        $or: [
          { fromUserId: String(user._id), toUserId: String(toUserId), status: 'pending' },
          { fromUserId: String(toUserId), toUserId: String(user._id), status: 'pending' }
        ]
      });
      
      if (existingRequest) {
        return res.status(400).json({ error: 'request already exists' });
      }
      
      // Create request
      const request = {
        fromUserId: String(user._id),
        toUserId: String(toUserId),
        status: 'pending',
        createdAt: new Date()
      };
      
      await contactRequests.insertOne(request);
      
      return res.status(201).json({ ok: true, request });
    }
    
    // PATCH - Accept or decline request
    if (req.method === 'PATCH') {
      const { requestId, action } = req.body || {};
      
      if (!requestId || !action) {
        return res.status(400).json({ error: 'requestId and action required' });
      }
      
      if (!['accept', 'decline'].includes(action)) {
        return res.status(400).json({ error: 'action must be accept or decline' });
      }
      
      // Find request
      const request = await contactRequests.findOne({
        _id: new ObjectId(requestId),
        toUserId: String(user._id), // Only recipient can respond
        status: 'pending'
      });
      
      if (!request) {
        return res.status(404).json({ error: 'request not found' });
      }
      
      // Update request status
      await contactRequests.updateOne(
        { _id: new ObjectId(requestId) },
        { 
          $set: { 
            status: action === 'accept' ? 'accepted' : 'declined',
            respondedAt: new Date()
          } 
        }
      );
      
      // If accepted, create bilateral contact relationship
      if (action === 'accept') {
        const now = new Date();
        
        // Add both directions
        await contacts.insertMany([
          {
            userId: request.fromUserId,
            contactId: request.toUserId,
            addedAt: now
          },
          {
            userId: request.toUserId,
            contactId: request.fromUserId,
            addedAt: now
          }
        ]);
      }
      
      return res.status(200).json({ ok: true, action });
    }
    
    // DELETE - Cancel sent request
    if (req.method === 'DELETE') {
      const { requestId } = req.query || {};
      
      if (!requestId) {
        return res.status(400).json({ error: 'requestId required' });
      }
      
      // Only the sender can cancel
      const result = await contactRequests.deleteOne({
        _id: new ObjectId(requestId),
        fromUserId: String(user._id),
        status: 'pending'
      });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'request not found' });
      }
      
      return res.status(200).json({ ok: true });
    }
    
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).end('Method Not Allowed');
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
};
