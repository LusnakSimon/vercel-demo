const bcrypt = require('bcryptjs');
const { connect } = require('../../lib/mongo');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  try {
    const { email, password, name } = req.body || {};
    const { isEmail, requireString } = require('../../lib/validate');
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    if (!isEmail(email)) return res.status(400).json({ error: 'invalid email' });
    if (!requireString(password, 8)) return res.status(400).json({ error: 'password too short (min 8)' });

    const db = await connect();
    const users = db.collection('users');

    const exists = await users.findOne({ email });
    if (exists) return res.status(409).json({ error: 'user exists' });

    const pwHash = await bcrypt.hash(password, 10);
    const user = {
      email,
      name: name || null,
      passwordHash: pwHash,
      role: 'user',
      createdAt: new Date()
    };

    const r = await users.insertOne(user);
    user._id = r.insertedId;
    delete user.passwordHash;
    return res.status(201).json({ ok: true, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
};
