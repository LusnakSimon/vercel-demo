const { connect } = require('../../lib/mongo');
const { getUserFromRequest } = require('../../lib/auth');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'unauthenticated' });
    
    const { name, email } = req.body || {};
    
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'email required' });
    }
    
    const db = await connect();
    const users = db.collection('users');
    
    // Check if email is already taken by another user
    const existing = await users.findOne({ email: email.trim(), _id: { $ne: new ObjectId(user._id) } });
    if (existing) {
      return res.status(400).json({ error: 'email already in use' });
    }
    
    // Update user profile
    const updates = {
      email: email.trim(),
      updatedAt: new Date()
    };
    
    if (name !== undefined) {
      updates.name = name.trim();
    }
    
    await users.updateOne(
      { _id: new ObjectId(user._id) },
      { $set: updates }
    );
    
    return res.status(200).json({ ok: true, message: 'profile updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
};
