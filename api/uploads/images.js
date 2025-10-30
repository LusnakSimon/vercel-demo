/**
 * Image upload handler for notes
 * Stores images as base64 in MongoDB (for MVP - consider external storage for production)
 */

const { getUserFromRequest } = require('../../lib/auth');
const { connect } = require('../../lib/mongo');
const { ObjectId } = require('mongodb');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'unauthenticated' });
  }

  try {
    const { image, filename, noteId } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'image data required' });
    }

    // Check if it's already base64 or needs encoding
    let base64Data = image;
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'image must be a data URL (data:image/...)' });
    }

    // Extract base64 data and check size
    const base64Match = image.match(/^data:image\/\w+;base64,(.+)$/);
    if (!base64Match) {
      return res.status(400).json({ error: 'invalid image format' });
    }

    const base64String = base64Match[1];
    const imageSize = Buffer.from(base64String, 'base64').length;

    if (imageSize > MAX_IMAGE_SIZE) {
      return res.status(400).json({ 
        error: 'image too large',
        maxSize: '5MB',
        actualSize: `${(imageSize / 1024 / 1024).toFixed(2)}MB`
      });
    }

    const db = await connect();
    const images = db.collection('images');

    // Create image document
    const imageDoc = {
      data: base64Data,
      filename: filename || 'image.png',
      size: imageSize,
      uploadedBy: String(user._id),
      noteId: noteId || null,
      createdAt: new Date()
    };

    const result = await images.insertOne(imageDoc);
    
    // Return image ID and URL
    return res.status(201).json({
      id: result.insertedId,
      url: `/api/uploads/images/${result.insertedId}`,
      filename: imageDoc.filename,
      size: imageSize
    });

  } catch (err) {
    console.error('Image upload error:', err);
    return res.status(500).json({ error: 'upload failed' });
  }
};
