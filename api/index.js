/**
 * Consolidated API handler to avoid Vercel Hobby plan's 12 function limit
 * Routes all API calls through a single serverless function
 */

const url = require('url');

// Import all route handlers
const authLogin = require('./auth/login');
const authRegister = require('./auth/register');
const authLogout = require('./auth/logout');
const authMe = require('./auth/me');
const authUpdateProfile = require('./auth/update-profile');
const authChangePassword = require('./auth/change-password');
const todos = require('./todos');
const notes = require('./notes');
const projects = require('./projects');
const users = require('./users');
const health = require('./health');
const realtimeUpdates = require('./realtime/updates');
const uploadImages = require('./uploads/images');
const getImage = require('./uploads/images/[id]');

module.exports = async (req, res) => {
  // Add security and caching headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Preserve query parameters
  req.query = parsedUrl.query;
  
  // Route to appropriate handler based on path
  try {
    // Auth routes
    if (pathname === '/api/auth/login') {
      return await authLogin(req, res);
    }
    if (pathname === '/api/auth/register') {
      return await authRegister(req, res);
    }
    if (pathname === '/api/auth/logout') {
      return await authLogout(req, res);
    }
    if (pathname === '/api/auth/me') {
      return await authMe(req, res);
    }
    if (pathname === '/api/auth/update-profile') {
      return await authUpdateProfile(req, res);
    }
    if (pathname === '/api/auth/change-password') {
      return await authChangePassword(req, res);
    }
    
    // Resource routes
    if (pathname === '/api/todos') {
      return await todos(req, res);
    }
    if (pathname === '/api/notes') {
      return await notes(req, res);
    }
    if (pathname === '/api/projects') {
      return await projects(req, res);
    }
    if (pathname === '/api/users') {
      return await users(req, res);
    }
    if (pathname === '/api/health') {
      return await health(req, res);
    }
    if (pathname === '/api/realtime/updates') {
      return await realtimeUpdates(req, res);
    }
    if (pathname === '/api/uploads/images') {
      return await uploadImages(req, res);
    }
    if (pathname.startsWith('/api/uploads/images/')) {
      // Extract ID from path
      const id = pathname.split('/').pop();
      req.query = { ...req.query, id };
      return await getImage(req, res);
    }
    
    // Not found
    res.status(404).json({ error: 'API endpoint not found', path: pathname });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
