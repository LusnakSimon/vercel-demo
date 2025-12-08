const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connect } = require('../../lib/mongo');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Simple in-memory rate limiting (resets on server restart)
// For production, use Redis or MongoDB for persistence across serverless invocations
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getRateLimitKey(req) {
  // Use IP address as key (from X-Forwarded-For for Vercel, or remoteAddress)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
  return ip;
}

function checkRateLimit(key) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  
  if (!record) {
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }
  
  // Reset if window has passed
  if (now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(key);
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }
  
  if (record.attempts >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.firstAttempt + WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }
  
  return { allowed: true, remaining: MAX_ATTEMPTS - record.attempts - 1 };
}

function recordAttempt(key) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  
  if (!record || now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(key, { firstAttempt: now, attempts: 1 });
  } else {
    record.attempts++;
  }
}

function clearAttempts(key) {
  loginAttempts.delete(key);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  
  const rateLimitKey = getRateLimitKey(req);
  const rateLimit = checkRateLimit(rateLimitKey);
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_ATTEMPTS);
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
  
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', rateLimit.retryAfter);
    return res.status(429).json({ 
      error: 'too many login attempts', 
      message: `Too many login attempts. Please try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.`,
      retryAfter: rateLimit.retryAfter 
    });
  }
  
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const db = await connect();
    const users = db.collection('users');
    const user = await users.findOne({ email });
    
    if (!user) {
      recordAttempt(rateLimitKey);
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) {
      recordAttempt(rateLimitKey);
      return res.status(401).json({ error: 'invalid credentials' });
    }

    // Successful login - clear rate limit
    clearAttempts(rateLimitKey);

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
