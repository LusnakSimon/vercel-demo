# Research Notebook

A collaborative note-taking and todo application with real-time updates, built on serverless architecture.

## Features

### Core Features
- ✅ **Authentication**: Secure session-based auth with HttpOnly cookies
- ✅ **Notes**: Markdown editor with live preview, drag-and-drop images
- ✅ **Todos**: Tasks with tags, due dates, and visual indicators
- ✅ **Projects**: Team collaboration with project management
- ✅ **Real-time Updates**: Server-Sent Events for live collaboration
- ✅ **Image Upload**: Drag-and-drop with 5MB limit, stored in MongoDB
- ✅ **Export**: Download notes as Markdown files
- ✅ **Search**: Full-text search across notes and todos
- ✅ **Themes**: Dark/light mode toggle with persistence

### Keyboard Shortcuts
- `Cmd/Ctrl + K` - Open command palette
- `Shift + T` - Toggle dark/light theme
- `Alt + N` - New note
- `Alt + T` - New todo
- `Alt + D` - Go to dashboard
- `Alt + P` - Go to projects
- `?` - Show keyboard shortcuts help
- `Esc` - Close modals and command palette

### Performance
- Pagination for large lists (up to 100 items per page)
- Database indexes for fast queries
- Caching headers with ETags
- Optimized image caching (immutable, 1 year)
- Efficient session management with TTL indexes

### UI/UX Enhancements
- **Navigation**: Sticky header with active page highlighting
- **Command Palette**: Quick navigation with Cmd/Ctrl+K
- **Dashboard**: Stats cards showing todos/completed/notes/projects with activity feed
- **Skeleton Loaders**: Professional shimmer loading states (replacing spinners)
- **Kanban Board**: Drag-and-drop todo management with 4 columns (todo, in-progress, review, done)
- **Mobile Optimization**: 
  - Bottom navigation bar for easy thumb access
  - Pull-to-refresh gesture support
  - Touch-friendly buttons (minimum 44px height)
  - Prevents iOS auto-zoom on inputs
- **Undo Functionality**: Toast notifications with undo button for delete operations
- **Floating Action Buttons (FAB)**: Quick add buttons on todos and projects pages
- **Badge System**: 5 color variants for tags and status indicators
- **Accessibility**: 
  - Focus-visible indicators
  - Reduced motion support
  - High contrast mode
  - Keyboard shortcuts (? for help menu)
- **Visual Feedback**: Smooth animations and transitions throughout
- **Empty States**: Helpful illustrations and calls-to-action

## Tech Stack

- **Platform**: Vercel Serverless (single function deployment)
- **Database**: MongoDB Atlas
- **Frontend**: Vanilla JavaScript, modern CSS
- **Authentication**: Server-side sessions (HttpOnly cookies)
- **Real-time**: Server-Sent Events (SSE)

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Vercel account

### Environment Variables

Create `.env` file:
```bash
STORAGE_MONGODB_URI=mongodb+srv://...
SESSION_SECRET=your-secret-key-here
```

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
vercel dev

# Server runs at http://localhost:3000
```

### Database Indexes

For optimal performance, create database indexes after first deployment:

```bash
# Set environment variable
export STORAGE_MONGODB_URI="your-mongodb-connection-string"

# Run index creation script
node scripts/add-indexes.js
```

This creates indexes on:
- User emails (unique)
- Session IDs (unique + TTL)
- Todo owner, project, tags, dates
- Note author, project, tags, visibility
- Full-text search on notes
- Project members

### Deployment

Push to GitHub to trigger automatic Vercel deployment:

```bash
git push origin main
```

**Note**: This app uses a consolidated API architecture to work within Vercel's Hobby plan limit (12 serverless functions). All API routes go through a single entry point (`api/index.js`).

## API Routes

All routes prefixed with `/api/`:

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/update-profile` - Update profile
- `PATCH /api/auth/change-password` - Change password

### Resources
- `GET/POST /api/todos` - List/create todos
- `GET/PUT/PATCH/DELETE /api/todos?id=...` - Todo operations
- `GET/POST /api/notes` - List/create notes
- `GET/PUT/PATCH/DELETE /api/notes?id=...` - Note operations
- `GET/POST /api/projects` - List/create projects
- `GET/PUT/DELETE /api/projects?id=...` - Project operations

### Real-time & Uploads
- `GET /api/realtime/updates` - SSE endpoint for live updates
- `POST /api/uploads/images` - Upload image (base64, 5MB max)
- `GET /api/uploads/images/:id` - Retrieve uploaded image

### Pagination

List endpoints support pagination:
```javascript
GET /api/notes?page=2&limit=50

Response:
{
  data: [...],
  pagination: {
    page: 2,
    limit: 50,
    total: 150,
    totalPages: 3,
    hasNext: true,
    hasPrev: true
  }
}
```

### Real-time Updates

Connect to SSE endpoint:
```javascript
const eventSource = new EventSource('/api/realtime/updates');

eventSource.addEventListener('note-updated', (e) => {
  const data = JSON.parse(e.data);
  console.log('Note updated:', data.noteId);
});
```

### Image Upload

Upload images via API:
```javascript
const reader = new FileReader();
reader.onload = async (e) => {
  const result = await fetch('/api/uploads/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: e.target.result, // data:image/...;base64,...
      filename: file.name,
      noteId: 'optional-note-id'
    })
  });
  
  const { url } = await result.json();
  // Use url to display image: <img src="${url}" />
};
reader.readAsDataURL(file);
```

## Architecture

### Consolidated API Pattern

To work within Vercel's Hobby plan limitation (12 serverless functions), this app uses a single entry point:

```
/api/index.js → Routes to individual handlers
├── /api/auth/* → auth handlers
├── /api/todos → todos handler
├── /api/notes → notes handler
├── /api/projects → projects handler
├── /api/realtime/updates → SSE handler
└── /api/uploads/images/* → image handlers
```

Benefits:
- ✅ Works on Vercel Hobby plan
- ✅ Maintains code organization
- ✅ Preserves query parameters
- ✅ Easy to add new routes

Trade-offs:
- All API requests go through one function
- Slightly higher cold start time
- Shared function timeout

### Database Schema

**users**
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String,
  createdAt: Date
}
```

**sessions**
```javascript
{
  _id: ObjectId,
  sid: String (unique),
  userId: String,
  expiresAt: Date (TTL index)
}
```

**todos**
```javascript
{
  _id: ObjectId,
  text: String,
  done: Boolean,
  tags: [String],
  dueDate: Date,
  projectId: String,
  ownerId: String,
  createdAt: Date
}
```

**notes**
```javascript
{
  _id: ObjectId,
  title: String,
  bodyMarkdown: String,
  tags: [String],
  projectId: String,
  authorId: String,
  visibility: String,
  attachments: [String],
  createdAt: Date,
  updatedAt: Date
}
```

**projects**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  members: [String],
  createdAt: Date
}
```

**images**
```javascript
{
  _id: ObjectId,
  data: String (base64 data URL),
  filename: String,
  size: Number,
  uploadedBy: String,
  noteId: String,
  createdAt: Date
}
```

## Recent Updates

### v3.0 (Latest - October 2025)
- ✅ **Major UI/UX Overhaul**:
  - Sticky navigation with active page highlighting
  - Command palette (Cmd/Ctrl+K) for quick navigation
  - Enhanced dashboard with stats cards and activity feed
  - Skeleton loaders with shimmer animation
  - Kanban board with drag-and-drop functionality
  - Floating action buttons (FAB)
  - Mobile bottom navigation
  - Pull-to-refresh gesture
  - Undo functionality for deletions
  - Badge system for tags and statuses
  - Comprehensive keyboard shortcuts
- ✅ **Session Cookie Fix**: Changed credentials to 'include' for proper authentication
- ✅ **Paginated API Support**: Frontend now handles { data: [], pagination: {} } responses
- ✅ **Accessibility Improvements**: Focus indicators, reduced motion, high contrast mode

### v2.0
- ✅ Consolidated API routes for Vercel Hobby plan compatibility
- ✅ Real-time collaboration via Server-Sent Events
- ✅ Image upload with drag-and-drop (5MB limit)
- ✅ Enhanced error messages throughout
- ✅ Pagination for large lists
- ✅ Export notes as Markdown
- ✅ Database indexes for performance
- ✅ Caching headers with ETags

### v1.0
- ✅ Authentication and sessions
- ✅ Notes and todos CRUD
- ✅ Project management
- ✅ Tags and categories
- ✅ Due dates with indicators
- ✅ Mobile-responsive UI
- ✅ Dark/light themes

## Feature Completeness Checklist

### Authentication & Security ✅
- [x] User registration and login
- [x] Secure password hashing
- [x] Session-based authentication (HttpOnly cookies)
- [x] Credentials: 'include' for proper cookie handling
- [x] Protected API routes
- [x] Profile management
- [x] Password change functionality
- [x] Auto-logout on session expiry

### Core Functionality ✅
- [x] Create, read, update, delete (CRUD) for:
  - [x] Todos (with tags, due dates, descriptions)
  - [x] Notes (Markdown with live preview)
  - [x] Projects (team collaboration)
- [x] Full-text search across resources
- [x] Tag-based filtering and organization
- [x] Due date tracking with visual indicators
- [x] Image upload and storage (5MB limit)
- [x] Note export (Markdown download)
- [x] Pagination for large datasets

### UI/UX Excellence ✅
- [x] Responsive design (desktop, tablet, mobile)
- [x] Touch-friendly interface (44px+ tap targets)
- [x] Dark/light theme with persistence
- [x] Sticky navigation with active highlighting
- [x] Command palette (Cmd/Ctrl+K)
- [x] Enhanced dashboard with stats
- [x] Activity feed showing recent actions
- [x] Kanban board with drag-and-drop
- [x] Skeleton loaders (no spinners)
- [x] Empty states with helpful messages
- [x] Toast notifications with undo
- [x] Floating action buttons (FAB)
- [x] Badge system for tags/status
- [x] Mobile bottom navigation
- [x] Pull-to-refresh gesture
- [x] Smooth animations and transitions
- [x] Loading states for all async operations

### Accessibility ✅
- [x] Keyboard navigation
- [x] Focus-visible indicators
- [x] Keyboard shortcuts (? for help)
- [x] Reduced motion support
- [x] High contrast mode
- [x] Semantic HTML
- [x] ARIA labels where appropriate

### Performance ✅
- [x] Database indexes for fast queries
- [x] Pagination (up to 100 items/page)
- [x] Caching headers with ETags
- [x] Optimized image caching
- [x] Efficient session management (TTL)
- [x] Consolidated API for reduced cold starts
- [x] Lazy loading of resources

### Real-time Features ✅
- [x] Server-Sent Events (SSE) for live updates
- [x] Real-time collaboration notifications
- [x] Activity feed updates
- [x] Typing indicators (helper functions)

### Developer Experience ✅
- [x] Clean, modular code structure
- [x] Environment variable configuration
- [x] Local development setup (vercel dev)
- [x] Automatic deployment (GitHub → Vercel)
- [x] Database migration scripts
- [x] Comprehensive API documentation
- [x] Error handling throughout
- [x] Console logging for debugging

### Mobile Experience ✅
- [x] Responsive breakpoints (768px, 480px)
- [x] Touch-friendly buttons (min 44px)
- [x] Bottom navigation for thumb access
- [x] Pull-to-refresh gesture
- [x] Prevents iOS input zoom
- [x] Full-width actions on small screens
- [x] Optimized spacing for mobile
- [x] Swipe gestures ready

### Production Ready ✅
- [x] Deployed on Vercel
- [x] MongoDB Atlas database
- [x] Environment variables configured
- [x] Error handling and recovery
- [x] Session timeout handling
- [x] Input validation
- [x] XSS protection (escapeHtml)
- [x] Proper HTTP status codes
- [x] Graceful error messages

## License

MIT
