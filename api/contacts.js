const { connect } = require('../lib/mongo');
const { ObjectId } = require('mongodb');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  try {
    const db = await connect();
    const contacts = db.collection('contacts');
    const users = db.collection('users');
    
    const user = await requireAuth(req, res);
    if (!user) return null;
    
    // GET - List user's contacts
    if (req.method === 'GET') {
      const userContacts = await contacts.find({ 
        userId: String(user._id) 
      }).toArray();
      
      // Populate contact details
      const contactIds = userContacts.map(c => c.contactId);
      const contactUsers = await users.find(
        { _id: { $in: contactIds.map(id => new ObjectId(id)) } },
        { projection: { password: 0, passwordHash: 0 } }
      ).toArray();
      
      return res.status(200).json(contactUsers);
    }
    
    // POST - Direct contact addition is disabled. Use /api/contact_requests instead.
    if (req.method === 'POST') {
      return res.status(400).json({ 
        error: 'direct contact addition not allowed',
        message: 'Please send a contact request via /api/contact_requests'
      });
    }
    
    // DELETE - Remove contact
    if (req.method === 'DELETE') {
      const { contactId } = req.query || {};
      
      if (!contactId) {
        return res.status(400).json({ error: 'contactId required' });
      }
      
      await contacts.deleteOne({
        userId: String(user._id),
        contactId: String(contactId)
      });
      
      return res.status(200).json({ ok: true });
    }
    
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).end('Method Not Allowed');
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
};
