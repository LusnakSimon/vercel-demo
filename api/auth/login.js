const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connect } = require('../../lib/mongo');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const db = await connect();
    const users = db.collection('users');
    const user = await users.findOne({ email });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    // create server-side session and set HttpOnly cookie
    const { createSession } = require('../../lib/sessions');
    const sess = await createSession(user._id);
    // set cookie (HttpOnly, SameSite=Lax)
    const cookie = `sid=${sess.sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ ok: true, user: { _id: String(user._id), email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
};
