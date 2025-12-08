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

// Sanitize a string by escaping HTML special characters
// This provides defense-in-depth against XSS (client should also escape)
function sanitizeHtml(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Strip potentially dangerous content from strings while preserving normal text
function sanitizeInput(s) {
  if (!s || typeof s !== 'string') return s;
  // Remove null bytes and other control characters (except newlines/tabs)
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Validate and sanitize an object's string fields
function sanitizeObject(obj, fieldsToSanitize = []) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = { ...obj };
  for (const field of fieldsToSanitize) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = sanitizeInput(result[field]);
    }
  }
  return result;
}

module.exports = { isEmail, requireString, sanitizeHtml, sanitizeInput, sanitizeObject };
