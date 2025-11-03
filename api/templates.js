const { ObjectId } = require('mongodb');
const { getDb } = require('../lib/mongo');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  console.log('[Templates API] Request:', req.method);
  
  // Require authentication
  const user = await requireAuth(req, res);
  if (!user) {
    console.log('[Templates API] Auth failed');
    return;
  }
  console.log('[Templates API] User authenticated:', user.email);

  try {
    console.log('[Templates API] Getting database connection...');
    const db = await getDb();
    console.log('[Templates API] Database connected');
    const templates = db.collection('templates');

  // GET: List all templates (built-in + user's custom templates)
  if (req.method === 'GET') {
    try {
      console.log('[Templates GET] Building built-in templates...');
      // Built-in templates (no userId means built-in)
      const builtInTemplates = [
        {
          _id: 'meeting-notes',
          name: 'Meeting Notes',
          type: 'note',
          description: 'Template for recording meeting notes',
          icon: '📝',
          content: `# Meeting Notes

**Date:** ${new Date().toLocaleDateString()}
**Attendees:** 
- 

## Agenda
1. 
2. 
3. 

## Discussion Points

### Topic 1


### Topic 2


## Action Items
- [ ] 
- [ ] 

## Next Steps

`,
          tags: ['meeting', 'notes'],
          isBuiltIn: true
        },
        {
          _id: 'research-notes',
          name: 'Research Notes',
          type: 'note',
          description: 'Template for research documentation',
          icon: '🔬',
          content: `# Research: [Topic]

**Date Started:** ${new Date().toLocaleDateString()}
**Status:** In Progress

## Objective


## Background


## Methodology


## Findings


## Key Insights
- 
- 

## References
1. 
2. 

## Next Steps
- [ ] 
- [ ] 
`,
          tags: ['research'],
          isBuiltIn: true
        },
        {
          _id: 'project-kickoff',
          name: 'Project Kickoff',
          type: 'note',
          description: 'Template for starting new projects',
          icon: '🚀',
          content: `# Project: [Name]

**Start Date:** ${new Date().toLocaleDateString()}
**Status:** Planning

## Project Overview


## Goals & Objectives
- 
- 

## Scope
### In Scope
- 

### Out of Scope
- 

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Planning | | Not Started |
| Development | | Not Started |
| Testing | | Not Started |
| Launch | | Not Started |

## Team Members
- 

## Resources Needed
- 

## Risks & Mitigation
- 

## Success Criteria
- 
`,
          tags: ['project', 'planning'],
          isBuiltIn: true
        },
        {
          _id: 'daily-standup',
          name: 'Daily Standup',
          type: 'note',
          description: 'Quick daily status update template',
          icon: '☀️',
          content: `# Daily Standup - ${new Date().toLocaleDateString()}

## Yesterday
- 

## Today
- [ ] 
- [ ] 

## Blockers
- 

## Notes

`,
          tags: ['standup', 'daily'],
          isBuiltIn: true
        },
        {
          _id: 'weekly-review',
          name: 'Weekly Review',
          type: 'note',
          description: 'Template for weekly retrospectives',
          icon: '📊',
          content: `# Weekly Review - Week of ${new Date().toLocaleDateString()}

## Accomplishments
- 
- 

## Challenges
- 

## Lessons Learned
- 

## Goals for Next Week
- [ ] 
- [ ] 
- [ ] 

## Metrics


## Action Items
- [ ] 
`,
          tags: ['review', 'weekly'],
          isBuiltIn: true
        }
      ];

      console.log('[Templates GET] Querying custom templates for user:', user._id);
      // Get user's custom templates
      const customTemplates = await templates.find({ 
        userId: new ObjectId(user._id) 
      }).toArray();
      
      console.log('[Templates GET] Found', customTemplates.length, 'custom templates');

      // Combine and return
      const allTemplates = [...builtInTemplates, ...customTemplates];
      
      console.log('[Templates GET] Returning', allTemplates.length, 'templates');
      return res.json(allTemplates);
    } catch (err) {
      console.error('[Templates GET] Error:', err);
      console.error('[Templates GET] Error stack:', err.stack);
      return res.status(500).json({ error: 'Failed to load templates', details: err.message });
    }
  }

  // POST: Create a custom template
  if (req.method === 'POST') {
    try {
      const { name, type, description, content, tags, icon } = req.body;

      if (!name || !type || !content) {
        return res.status(400).json({ error: 'Missing required fields: name, type, content' });
      }

      if (!['note', 'todo'].includes(type)) {
        return res.status(400).json({ error: 'Type must be "note" or "todo"' });
      }

      const template = {
        userId: new ObjectId(user._id),
        name: String(name).trim(),
        type: type,
        description: description ? String(description).trim() : '',
        content: String(content),
        tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(t => t) : [],
        icon: icon || '📄',
        isBuiltIn: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await templates.insertOne(template);
      template._id = result.insertedId;

      return res.json(template);
    } catch (err) {
      console.error('[Templates POST] Error:', err);
      return res.status(500).json({ error: 'Failed to create template' });
    }
  }

  // DELETE: Remove a custom template
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Template ID required' });
      }

      // Can't delete built-in templates
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(403).json({ error: 'Cannot delete built-in templates' });
      }

      const result = await templates.deleteOne({ 
        _id: new ObjectId(id),
        userId: new ObjectId(user._id) // Only delete own templates
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      return res.json({ message: 'Template deleted' });
    } catch (err) {
      console.error('[Templates DELETE] Error:', err);
      return res.status(500).json({ error: 'Failed to delete template' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[Templates] Database connection error:', err);
    return res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
};
