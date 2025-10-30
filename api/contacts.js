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
    
    // POST - Add contact
    if (req.method === 'POST') {
      const { contactId } = req.body || {};
      
      if (!contactId) {
        return res.status(400).json({ error: 'contactId required' });
      }
      
      // Can't add yourself
      if (String(contactId) === String(user._id)) {
        return res.status(400).json({ error: 'cannot add yourself as contact' });
      }
      
      // Check if contact exists
      const contactUser = await users.findOne({ _id: new ObjectId(contactId) });
      if (!contactUser) {
        return res.status(404).json({ error: 'user not found' });
      }
      
      // Check if already a contact
      const existing = await contacts.findOne({
        userId: String(user._id),
        contactId: String(contactId)
      });
      
      if (existing) {
        return res.status(400).json({ error: 'already in contacts' });
      }
      
      // Add contact
      const contact = {
        userId: String(user._id),
        contactId: String(contactId),
        addedAt: new Date()
      };
      
      await contacts.insertOne(contact);
      
      return res.status(201).json({ ok: true, contact: contactUser });
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
