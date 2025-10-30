const { connect } = require('../lib/mongo');
const { ObjectId } = require('mongodb');
const { requireAuth } = require('../lib/auth');

// Import broadcast function for real-time notifications
let broadcastUpdate;
try {
  const realtimeModule = require('./realtime/updates');
  broadcastUpdate = realtimeModule.broadcastUpdate;
} catch (e) {
  broadcastUpdate = () => {};
}

module.exports = async (req, res) => {
  try {
    const db = await connect();
    const invitations = db.collection('invitations');
    const projects = db.collection('projects');
    const users = db.collection('users');
    
    const user = await requireAuth(req, res);
    if (!user) return null;
    
    // GET - List invitations
    if (req.method === 'GET') {
      const { id } = req.query || {};
      
      if (id) {
        const invitation = await invitations.findOne({ _id: new ObjectId(id) });
        if (!invitation) return res.status(404).json({ error: 'invitation not found' });
        return res.status(200).json(invitation);
      }
      
      // Get all invitations for current user
      const list = await invitations.find({ 
        invitedUserId: String(user._id),
        status: 'pending'
      }).sort({ createdAt: -1 }).toArray();
      
      // Populate project and inviter details
      for (let inv of list) {
        if (inv.projectId) {
          inv.project = await projects.findOne({ _id: new ObjectId(inv.projectId) });
        }
        if (inv.inviterId) {
          inv.inviter = await users.findOne(
            { _id: new ObjectId(inv.inviterId) },
            { projection: { password: 0, passwordHash: 0 } }
          );
        }
      }
      
      return res.status(200).json(list);
    }
    
    // POST - Create invitation
    if (req.method === 'POST') {
      const { projectId, invitedUserEmail } = req.body || {};
      
      if (!projectId || !invitedUserEmail) {
        return res.status(400).json({ error: 'projectId and invitedUserEmail required' });
      }
      
      // Find the invited user
      const invitedUser = await users.findOne({ email: String(invitedUserEmail).toLowerCase() });
      if (!invitedUser) {
        return res.status(404).json({ error: 'user not found with that email' });
      }
      
      // Check if project exists and user is a member
      const project = await projects.findOne({ _id: new ObjectId(projectId) });
      if (!project) {
        return res.status(404).json({ error: 'project not found' });
      }
      
      if (!project.members || !project.members.includes(String(user._id))) {
        return res.status(403).json({ error: 'you are not a member of this project' });
      }
      
      // Check if user is already a member
      if (project.members.includes(String(invitedUser._id))) {
        return res.status(400).json({ error: 'user is already a member of this project' });
      }
      
      // Check if invitation already exists
      const existing = await invitations.findOne({
        projectId: String(projectId),
        invitedUserId: String(invitedUser._id),
        status: 'pending'
      });
      
      if (existing) {
        return res.status(400).json({ error: 'invitation already sent to this user' });
      }
      
      // Create invitation
      const invitation = {
        projectId: String(projectId),
        projectName: project.name,
        inviterId: String(user._id),
        inviterName: user.name || user.email,
        invitedUserId: String(invitedUser._id),
        invitedUserEmail: invitedUser.email,
        status: 'pending',
        createdAt: new Date()
      };
      
      const result = await invitations.insertOne(invitation);
      invitation._id = result.insertedId;
      
      // Send real-time notification to invited user
      broadcastUpdate(String(invitedUser._id), {
        type: 'invitation-received',
        invitation: invitation
      });
      
      return res.status(201).json(invitation);
    }
    
    // PATCH - Accept or decline invitation
    if (req.method === 'PATCH') {
      const { id, action } = req.body || {};
      
      if (!id || !action) {
        return res.status(400).json({ error: 'id and action required' });
      }
      
      if (!['accept', 'decline'].includes(action)) {
        return res.status(400).json({ error: 'action must be accept or decline' });
      }
      
      const invitation = await invitations.findOne({ _id: new ObjectId(id) });
      if (!invitation) {
        return res.status(404).json({ error: 'invitation not found' });
      }
      
      // Only the invited user can accept/decline
      if (String(invitation.invitedUserId) !== String(user._id)) {
        return res.status(403).json({ error: 'you cannot respond to this invitation' });
      }
      
      if (invitation.status !== 'pending') {
        return res.status(400).json({ error: 'invitation has already been responded to' });
      }
      
      // Update invitation status
      await invitations.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            status: action === 'accept' ? 'accepted' : 'declined',
            respondedAt: new Date()
          }
        }
      );
      
      // If accepted, add user to project
      if (action === 'accept') {
        const project = await projects.findOne({ _id: new ObjectId(invitation.projectId) });
        if (project) {
          const members = project.members || [];
          if (!members.includes(String(user._id))) {
            members.push(String(user._id));
            await projects.updateOne(
              { _id: new ObjectId(invitation.projectId) },
              { $set: { members } }
            );
          }
          
          // Notify project members
          members.forEach(memberId => {
            if (String(memberId) !== String(user._id)) {
              broadcastUpdate(String(memberId), {
                type: 'member-joined',
                projectId: invitation.projectId,
                projectName: invitation.projectName,
                userName: user.name || user.email
              });
            }
          });
        }
      }
      
      const updated = await invitations.findOne({ _id: new ObjectId(id) });
      return res.status(200).json(updated);
    }
    
    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).end('Method Not Allowed');
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
};
