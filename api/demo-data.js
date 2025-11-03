const { connect } = require('../lib/mongo');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  try {
    const db = await connect();
    const projects = db.collection('projects');
    const todos = db.collection('todos');
    const notes = db.collection('notes');
    
    const user = await requireAuth(req, res);
    if (!user) return null;
    
    if (req.method === 'POST') {
      // Check if user already has the demo project
      const existing = await projects.findOne({
        name: '🚀 Getting Started',
        members: String(user._id)
      });
      
      if (existing) {
        return res.status(200).json({ message: 'Demo project already exists', projectId: existing._id });
      }
      
      // Create demo project
      const projectDoc = {
        name: '🚀 Getting Started',
        description: 'Welcome to Research Notebook! This demo project will help you get familiar with the features.',
        members: [String(user._id)],
        createdBy: String(user._id),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const projectResult = await projects.insertOne(projectDoc);
      const projectId = String(projectResult.insertedId);
      
      // Create demo todos
      const demoTodos = [
        {
          title: '✅ Complete your profile',
          description: 'Add your name and avatar in account settings',
          done: false,
          projectId: projectId,
          userId: String(user._id),
          priority: 'high',
          tags: ['onboarding'],
          createdAt: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        },
        {
          title: '📁 Create your first project',
          description: 'Projects help you organize related todos and notes together',
          done: false,
          projectId: projectId,
          userId: String(user._id),
          priority: 'medium',
          tags: ['onboarding'],
          createdAt: new Date()
        },
        {
          title: '👥 Invite a collaborator',
          description: 'Add contacts and invite them to your projects to collaborate',
          done: false,
          projectId: projectId,
          userId: String(user._id),
          priority: 'low',
          tags: ['collaboration'],
          createdAt: new Date()
        },
        {
          title: '🎨 Try the theme toggle',
          description: 'Click the sun/moon icon in the header to switch between light and dark mode',
          done: false,
          projectId: projectId,
          userId: String(user._id),
          priority: 'low',
          tags: ['ui'],
          createdAt: new Date()
        },
        {
          title: '⌨️ Use keyboard shortcuts',
          description: 'Press Ctrl+K (or Cmd+K) to open the command palette for quick navigation',
          done: false,
          projectId: projectId,
          userId: String(user._id),
          priority: 'low',
          tags: ['productivity'],
          createdAt: new Date()
        }
      ];
      
      await todos.insertMany(demoTodos);
      
      // Create demo notes
      const demoNotes = [
        {
          title: '📖 Welcome to Research Notebook',
          content: `# Welcome! 🎉

Thank you for trying Research Notebook - your collaborative research and productivity platform.

## Key Features

### 📋 Todos
- Create and organize tasks with priorities, tags, and due dates
- Filter by project, status, and priority
- Use the kanban board view for visual task management

### 📝 Notes
- Write detailed notes with rich formatting
- Attach notes to projects for better organization
- Search across all your notes instantly

### 📁 Projects
- Group related todos and notes together
- Invite team members to collaborate
- Track project progress at a glance

### 👥 Contacts
- Send friend requests to other users
- Quick invite to projects
- See who you're collaborating with

### 💬 Messages
- Direct message your contacts
- Real-time chat functionality
- Stay connected with your team

## Getting Started Tips

1. **Command Palette**: Press Ctrl+K (Cmd+K on Mac) for quick navigation
2. **Theme Toggle**: Click the 🌙/☀️ icon to switch themes
3. **Mobile Friendly**: Works great on phones and tablets
4. **Keyboard Shortcuts**: Press ? to see all shortcuts (coming soon!)

## Need Help?

- Check the dashboard for an overview of your work
- Use the search feature to find anything quickly
- Organize with tags and projects for better workflow

---

*You can delete this demo project once you're comfortable with the app!*`,
          projectId: projectId,
          userId: String(user._id),
          tags: ['welcome', 'documentation'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: '💡 Pro Tips',
          content: `# Pro Tips for Power Users

## Productivity Hacks

- **Tags**: Use tags like #urgent, #review, #research to categorize items
- **Priorities**: High/Medium/Low priorities help focus on what matters
- **Due Dates**: Set deadlines to stay on track
- **Projects**: Keep everything organized by project/topic

## Collaboration

- Add contacts before inviting them to projects
- Use the contacts page to manage your network
- Check notifications regularly for invites and updates
- Send direct messages for quick communication

## Organization

- Archive completed projects to reduce clutter
- Use descriptive names for projects and todos
- Add detailed descriptions to provide context
- Leverage the search to find anything instantly

## Coming Soon

- [ ] Markdown support in notes
- [ ] Subtasks and checklists
- [ ] Templates for common workflows
- [ ] @mentions in notes and todos
- [ ] File attachments
- [ ] Activity timeline

Happy organizing! 🚀`,
          projectId: projectId,
          userId: String(user._id),
          tags: ['tips', 'productivity'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      await notes.insertMany(demoNotes);
      
      return res.status(201).json({ 
        success: true,
        projectId,
        message: 'Demo project created successfully!'
      });
    }
    
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
    
  } catch (err) {
    console.error('[Demo Data Error]:', err);
    return res.status(500).json({ error: 'internal server error' });
  }
};
