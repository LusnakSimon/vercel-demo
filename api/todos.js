const fs = require('fs');

// Simple Vercel Serverless handler for GET/POST /todos
// Uses a local file store (todos.local.json) so no external services or secrets are required.

const TODO_FILE = './todos.local.json';

function readTodos() {
  if (!fs.existsSync(TODO_FILE)) return [];
  try {
    const body = fs.readFileSync(TODO_FILE, 'utf8');
    return JSON.parse(body || '[]');
  } catch (e) {
    console.error('failed to read todos', e);
    return [];
  }
}

function writeTodos(items) {
  try {
    fs.writeFileSync(TODO_FILE, JSON.stringify(items, null, 2));
    return true;
  } catch (e) {
    console.error('failed to write todos', e);
    return false;
  }
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const items = readTodos();
      res.status(200).json(items);
      return;
    }

    if (req.method === 'POST') {
      const items = req.body || [];
      const ok = writeTodos(items);
      if (!ok) return res.status(500).json({ error: 'failed to write todos' });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  }
};
