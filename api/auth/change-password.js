const bcrypt = require('bcryptjs');
const { connect } = require('../../lib/mongo');
const { getUserFromRequest } = require('../../lib/auth');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'unauthenticated' });
    
    const { currentPassword, newPassword } = req.body || {};
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }
    
    const db = await connect();
    const users = db.collection('users');
    
    // Get user with password hash
    const fullUser = await users.findOne({ _id: new ObjectId(user._id) });
    if (!fullUser) return res.status(404).json({ error: 'user not found' });
    
    // Verify current password
    const valid = await bcrypt.compare(currentPassword, fullUser.passwordHash || '');
    if (!valid) {
      return res.status(401).json({ error: 'current password is incorrect' });
    }
    
    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await users.updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { passwordHash: newHash, updatedAt: new Date() } }
    );
    
    return res.status(200).json({ ok: true, message: 'password changed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
};
