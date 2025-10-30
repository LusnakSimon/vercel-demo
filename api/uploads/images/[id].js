/**
 * Image retrieval endpoint
 * Serves uploaded images by ID
 */

const { connect } = require('../../../lib/mongo');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract image ID from query or path
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'image ID required' });
    }

    const db = await connect();
    const images = db.collection('images');
    
    const image = await images.findOne({ _id: new ObjectId(id) });
    
    if (!image) {
      return res.status(404).json({ error: 'image not found' });
    }

    // Parse the data URL to get content type
    const matches = image.data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return res.status(500).json({ error: 'invalid image data' });
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Set caching headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Length', buffer.length);
    
    return res.status(200).send(buffer);

  } catch (err) {
    console.error('Image retrieval error:', err);
    return res.status(500).json({ error: 'failed to retrieve image' });
  }
};
