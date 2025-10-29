module.exports = async (req, res) => {
  try {
    return res.status(200).json({ JWT_SECRET: process.env.JWT_SECRET || null });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
