module.exports = async (req, res) => {
  try {
    const auth = req.headers && (req.headers.authorization || req.headers.Authorization || null);
    return res.status(200).json({ gotAuthorizationHeader: !!auth, authorization: auth ? String(auth).slice(0,20)+'...' : null, JWT_SECRET_set: !!process.env.JWT_SECRET });
  } catch (e) { return res.status(500).json({ error: String(e) }); }
};
