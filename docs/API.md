# Research Notebook API Documentation

Complete API reference for the Research Notebook application.

## Base URL

```
Production: https://researchnotebook.vercel.app/api
Local: http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a valid session cookie. The session is established on login and stored as an HttpOnly cookie.

### Rate Limiting

The login endpoint has rate limiting to prevent brute force attacks:
- **Limit**: 5 attempts per IP address
- **Window**: 15 minutes
- **Response when exceeded**: `429 Too Many Requests`

```json
{
  "error": "Too many login attempts. Please try again in X minutes."
}
```

---

## Auth Endpoints

### POST /api/auth/register

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Errors:**
- `400` - Email already exists or validation error
- `500` - Server error

---

### POST /api/auth/login

Authenticate and establish a session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `429` - Rate limit exceeded (5 attempts/15 min)

---

### POST /api/auth/logout

End the current session.

**Response (200 OK):**
```json
{
  "message": "Logged out"
}
```

---

### GET /api/auth/me

Get the currently authenticated user.

**Response (200 OK):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Errors:**
- `401` - Not authenticated

---

### PATCH /api/auth/update-profile

Update the current user's profile.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "newemail@example.com"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "newemail@example.com",
    "name": "Jane Doe"
  }
}
```

---

### PATCH /api/auth/change-password

Change the current user's password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newsecurepassword"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Errors:**
- `400` - Current password is incorrect
- `401` - Not authenticated

---

## Todos Endpoints

### GET /api/todos

List todos for the current user.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50, max: 100) |
| `projectId` | string | Filter by project |
| `done` | boolean | Filter by completion status |
| `tag` | string | Filter by tag |

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "text": "Complete API documentation",
      "done": false,
      "tags": ["docs", "priority"],
      "dueDate": "2025-01-20T00:00:00.000Z",
      "description": "Write comprehensive API docs",
      "projectId": "507f1f77bcf86cd799439012",
      "ownerId": "507f1f77bcf86cd799439013",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### POST /api/todos

Create a new todo.

**Request Body:**
```json
{
  "text": "Complete API documentation",
  "tags": ["docs", "priority"],
  "dueDate": "2025-01-20",
  "description": "Write comprehensive API docs",
  "projectId": "507f1f77bcf86cd799439012"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "text": "Complete API documentation",
  "done": false,
  "tags": ["docs", "priority"],
  "dueDate": "2025-01-20T00:00:00.000Z",
  "ownerId": "507f1f77bcf86cd799439013",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

---

### GET /api/todos?id={id}

Get a specific todo by ID.

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "text": "Complete API documentation",
  "done": false,
  "tags": ["docs", "priority"],
  "dueDate": "2025-01-20T00:00:00.000Z"
}
```

---

### PUT /api/todos?id={id}

Update a todo (full replacement).

**Request Body:**
```json
{
  "text": "Updated todo text",
  "done": true,
  "tags": ["completed"]
}
```

---

### PATCH /api/todos?id={id}

Partially update a todo.

**Request Body:**
```json
{
  "done": true
}
```

---

### DELETE /api/todos?id={id}

Delete a todo.

**Response (200 OK):**
```json
{
  "message": "Todo deleted"
}
```

---

## Notes Endpoints

### GET /api/notes

List notes for the current user.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50, max: 100) |
| `projectId` | string | Filter by project |
| `tag` | string | Filter by tag |
| `visibility` | string | Filter by visibility (private, project, public) |
| `search` | string | Full-text search query |

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Research Notes",
      "bodyMarkdown": "# Introduction\n\nThis is my research...",
      "tags": ["research", "draft"],
      "visibility": "private",
      "projectId": "507f1f77bcf86cd799439012",
      "authorId": "507f1f77bcf86cd799439013",
      "attachments": [],
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T11:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### POST /api/notes

Create a new note.

**Request Body:**
```json
{
  "title": "Research Notes",
  "bodyMarkdown": "# Introduction\n\nThis is my research...",
  "tags": ["research", "draft"],
  "visibility": "private",
  "projectId": "507f1f77bcf86cd799439012"
}
```

**Visibility Options:**
- `private` - Only visible to the author
- `project` - Visible to project members
- `public` - Visible to all authenticated users

---

### GET /api/notes?id={id}

Get a specific note by ID.

---

### PUT /api/notes?id={id}

Update a note (full replacement).

---

### PATCH /api/notes?id={id}

Partially update a note.

---

### DELETE /api/notes?id={id}

Delete a note.

---

## Projects Endpoints

### GET /api/projects

List projects the current user is a member of.

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Research Project",
      "description": "A collaborative research project",
      "members": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST /api/projects

Create a new project.

**Request Body:**
```json
{
  "name": "Research Project",
  "description": "A collaborative research project",
  "members": ["user1@example.com", "user2@example.com"]
}
```

---

### GET /api/projects?id={id}

Get a specific project by ID.

---

### PUT /api/projects?id={id}

Update a project.

---

### DELETE /api/projects?id={id}

Delete a project (creator only).

---

## Users Endpoint

### GET /api/users

List all users. Returns different fields based on role.

**For Admin Users:**
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**For Regular Users (restricted fields):**
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "email": "admin@example.com",
      "name": "Admin User"
    }
  ]
}
```

---

## Search Endpoint

### GET /api/search

Search across all resources.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (required) |
| `type` | string | Filter by type: notes, todos, projects |

**Response (200 OK):**
```json
{
  "results": {
    "notes": [...],
    "todos": [...],
    "projects": [...]
  }
}
```

---

## Real-time Updates

### GET /api/realtime/updates

Server-Sent Events endpoint for live updates.

**Connection:**
```javascript
const eventSource = new EventSource('/api/realtime/updates', {
  withCredentials: true
});
```

**Events:**
| Event | Description |
|-------|-------------|
| `note-created` | A new note was created |
| `note-updated` | A note was updated |
| `note-deleted` | A note was deleted |
| `todo-created` | A new todo was created |
| `todo-updated` | A todo was updated |
| `todo-deleted` | A todo was deleted |
| `project-updated` | A project was updated |

**Event Data Format:**
```json
{
  "noteId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439013",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Image Upload

### POST /api/uploads/images

Upload an image (base64 encoded).

**Request Body:**
```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "filename": "screenshot.png",
  "noteId": "507f1f77bcf86cd799439011"
}
```

**Limits:**
- Maximum file size: 5MB
- Supported formats: PNG, JPEG, GIF, WebP

**Response (201 Created):**
```json
{
  "url": "/api/uploads/images/507f1f77bcf86cd799439020",
  "id": "507f1f77bcf86cd799439020"
}
```

---

### GET /api/uploads/images/{id}

Retrieve an uploaded image.

**Response:** Binary image data with appropriate Content-Type header.

**Caching:** Images are cached with long TTL headers.

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Authentication required |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |

---

## Pagination

List endpoints support pagination with consistent response format:

**Request:**
```
GET /api/notes?page=2&limit=25
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 25,
    "total": 100,
    "totalPages": 4,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## Input Validation & Sanitization

All user input is validated and sanitized:

- **Email**: Must be valid email format
- **Password**: Minimum 8 characters
- **Text fields**: HTML entities escaped, script tags removed
- **Tags**: Array of strings, max 10 tags
- **IDs**: Must be valid MongoDB ObjectIds

---

## CORS & Credentials

When making API requests from the frontend:

```javascript
fetch('/api/endpoint', {
  method: 'POST',
  credentials: 'include', // Required for session cookies
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

---

## Architecture Note

This API uses a consolidated routing pattern for Vercel Hobby plan compatibility. All routes go through `/api/index.js` which routes to individual handlers. This maintains code organization while staying within the 12 serverless function limit.
