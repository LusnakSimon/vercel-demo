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

### Performance
- Pagination for large lists (up to 100 items per page)
- Database indexes for fast queries
- Caching headers with ETags
- Optimized image caching (immutable, 1 year)

### UI/UX
- Mobile-responsive design with touch-friendly buttons (44px)
- Modern dark theme with smooth animations
- Empty states and helpful error messages
- Visual feedback for all actions
- Delete confirmations to prevent accidents

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

### v2.0 (Latest)
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

## License

MIT
