const { getUserFromRequest } = require('../../lib/auth');

module.exports = async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'unauthenticated' });
    // strip sensitive fields
    if (user.passwordHash) delete user.passwordHash;
    return res.status(200).json({ ok: true, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
};
