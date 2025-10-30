/**
 * Real-time updates endpoint using Server-Sent Events (SSE)
 * Clients can subscribe to updates for notes
 */

const { getUserFromRequest } = require('../../lib/auth');
const { connect } = require('../../lib/mongo');

// Store active connections per user
const connections = new Map();

module.exports = async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'unauthenticated' });
  }

  const userId = String(user._id);

  // Setup SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

  // Store connection
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId).add(res);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    const userConnections = connections.get(userId);
    if (userConnections) {
      userConnections.delete(res);
      if (userConnections.size === 0) {
        connections.delete(userId);
      }
    }
  });
};

// Function to broadcast updates to all connected clients for a user
function broadcastUpdate(userId, event) {
  const userConnections = connections.get(String(userId));
  if (!userConnections) return;

  const data = JSON.stringify(event);
  userConnections.forEach((res) => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (err) {
      console.error('Error broadcasting to client:', err);
    }
  });
}

// Export for use in other modules
module.exports.broadcastUpdate = broadcastUpdate;
