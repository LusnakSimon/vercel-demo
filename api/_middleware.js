// Middleware to add caching headers and security headers
module.exports = async (req, res) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Caching headers for API responses
  const path = req.url || '';
  
  if (path.includes('/api/auth/me')) {
    // User info can be cached briefly
    res.setHeader('Cache-Control', 'private, max-age=60');
  } else if (path.startsWith('/api/')) {
    // API responses: no cache for mutations, short cache for reads
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'private, max-age=30, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  }
  
  // Add ETag support for GET requests
  if (req.method === 'GET') {
    const originalSend = res.send;
    res.send = function(data) {
      if (data && typeof data === 'string') {
        const etag = require('crypto').createHash('md5').update(data).digest('hex');
        res.setHeader('ETag', `"${etag}"`);
        
        // Check if client has cached version
        if (req.headers['if-none-match'] === `"${etag}"`) {
          res.status(304).end();
          return;
        }
      }
      originalSend.call(this, data);
    };
  }
  
  return;
};
