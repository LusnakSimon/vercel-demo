function isEmail(s) {
  if (!s || typeof s !== 'string') return false;
  // simple RFC-lite check
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
}

function requireString(s, min = 1, max = 1024) {
  if (typeof s !== 'string') return false;
  const len = s.trim().length;
  if (len < min) return false;
  if (max && len > max) return false;
  return true;
}

module.exports = { isEmail, requireString };
