# Research Notebook User Guide

A comprehensive guide to using the Research Notebook application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Notes](#notes)
4. [Todos](#todos)
5. [Projects](#projects)
6. [Contacts & Messages](#contacts--messages)
7. [Search](#search)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Themes & Accessibility](#themes--accessibility)
10. [Account Management](#account-management)

---

## Getting Started

### Creating an Account

1. Navigate to the [Register page](/register.html)
2. Enter your email address
3. Create a secure password (minimum 8 characters)
4. Enter your display name
5. Click **Create Account**

### Logging In

1. Navigate to the [Login page](/login.html)
2. Enter your email and password
3. Click **Sign In**

> **Note**: After 5 failed login attempts, you'll need to wait 15 minutes before trying again.

### First Steps

After logging in, you'll see the Dashboard. Here's what to do first:

1. **Create your first project** - Click Projects in the navigation, then "+ New Project"
2. **Add some notes** - Go to Notes and start documenting your research
3. **Set up todos** - Track your tasks with due dates and tags

---

## Dashboard

The Dashboard provides an overview of your activity:

### Stats Cards

- **Total Notes** - Number of notes you've created
- **Total Todos** - Number of todos in your list
- **Completed Todos** - How many you've finished
- **Active Projects** - Projects you're working on

### Activity Feed

Shows your recent actions:
- Notes created or updated
- Todos completed
- Projects modified

### Quick Actions

- **+ Note** - Create a new note
- **+ Todo** - Add a new task
- **Command Palette** - Press `Ctrl/Cmd + K` for quick navigation

---

## Notes

### Creating a Note

1. Click **Notes** in the navigation
2. Click **+ New Note** (or use the floating action button on mobile)
3. Enter a title
4. Write your content using Markdown
5. Add tags for organization
6. Set visibility (Private, Project, or Public)
7. Click **Save**

### Markdown Support

Notes support full Markdown syntax:

```markdown
# Heading 1
## Heading 2

**Bold text** and *italic text*

- Bullet lists
- Work great

1. Numbered lists
2. Too!

`inline code` and code blocks:

```python
def hello():
    print("Hello, World!")
```

> Blockquotes for important info

[Links](https://example.com) and ![Images](url)
```

### Adding Images

1. Open a note for editing
2. Drag and drop an image onto the editor, OR
3. Click the image upload button
4. Images are automatically uploaded and embedded

> **Limit**: Maximum 5MB per image

### Visibility Settings

- **Private** - Only you can see this note
- **Project** - All project members can view it
- **Public** - Anyone logged in can read it

### Exporting Notes

1. Open the note you want to export
2. Click **Export** or **Download**
3. The note will download as a `.md` file

---

## Todos

### Creating a Todo

1. Click **Todos** in the navigation
2. Enter your task in the input field
3. Press Enter or click **Add**

### Todo Properties

- **Text** - The task description
- **Due Date** - When it needs to be done
- **Tags** - Categories for filtering
- **Description** - Additional details
- **Project** - Link to a project

### Managing Todos

- **Complete** - Check the checkbox to mark as done
- **Edit** - Click the todo to modify it
- **Delete** - Click the delete icon (with undo support)
- **Filter** - Use tags or status to filter the list

### Due Date Indicators

| Color | Meaning |
|-------|---------|
| 🔴 Red | Overdue |
| 🟡 Yellow | Due today |
| 🟢 Green | Due this week |

---

## Projects

### Creating a Project

1. Click **Projects** in the navigation
2. Click **+ New Project**
3. Enter a project name
4. Add a description
5. Invite members by email
6. Click **Create**

### Project Features

- **Notes** - Shared notes visible to all members
- **Todos** - Tasks linked to the project
- **Members** - Collaborate with team members

### Kanban Board

Access the Kanban view for visual task management:

1. Open a project
2. Click **Kanban** or go to `/kanban.html`
3. Drag and drop tasks between columns
4. Columns: To Do, In Progress, Done

---

## Contacts & Messages

### Adding Contacts

1. Go to **Contacts** in the navigation
2. Click **+ Add Contact**
3. Search for users by email or name
4. Send a contact request

### Direct Messages

1. Go to **Messages** in the navigation
2. Select a contact
3. Type your message
4. Press Enter or click **Send**

### Notifications

You'll receive notifications for:
- New messages
- Contact requests
- Project invitations
- Note mentions

---

## Search

### Global Search

1. Press `Ctrl/Cmd + K` to open the Command Palette
2. Type your search query
3. Results show notes, todos, and projects
4. Click a result to navigate to it

### Filtering

Most pages support filtering:
- **By Tag** - Click a tag to filter
- **By Project** - Select a project from the dropdown
- **By Status** - Filter by completion status (todos)
- **By Date** - Sort by created/updated date

---

## Keyboard Shortcuts

Press `?` anywhere in the app to see the shortcuts panel.

### Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open Command Palette |
| `G then D` | Go to Dashboard |
| `G then N` | Go to Notes |
| `G then T` | Go to Todos |
| `G then P` | Go to Projects |
| `G then M` | Go to Messages |

### Actions

| Shortcut | Action |
|----------|--------|
| `N` | Create new item (context-aware) |
| `E` | Edit selected item |
| `Delete/Backspace` | Delete selected item |
| `Ctrl/Cmd + S` | Save current item |
| `Escape` | Close modal/dialog |

### Notes Editor

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Bold text |
| `Ctrl/Cmd + I` | Italic text |
| `Ctrl/Cmd + K` | Insert link |
| `Tab` | Indent list item |
| `Shift + Tab` | Outdent list item |

---

## Themes & Accessibility

### Changing Themes

1. Click your profile icon (top right)
2. Select **Theme**:
   - 🌙 **Dark** - Easy on the eyes
   - ☀️ **Light** - Classic bright mode
   - 🔲 **High Contrast** - Maximum readability

### Accessibility Features

- **Skip Navigation** - Press Tab on any page to skip to main content
- **Keyboard Navigation** - Full keyboard support for all actions
- **Screen Reader Support** - ARIA labels throughout
- **Reduced Motion** - Respects system preference for reduced animations
- **Focus Indicators** - Clear visual focus for keyboard users

### Setting Preferences

1. Go to **Account** settings
2. Under **Preferences**:
   - Set default theme
   - Enable/disable animations
   - Choose notification preferences

---

## Account Management

### Updating Profile

1. Click your profile icon (top right)
2. Select **Profile**
3. Update your name or email
4. Click **Save Changes**

### Changing Password

1. Go to **Account** settings
2. Click **Change Password**
3. Enter your current password
4. Enter your new password (twice)
5. Click **Update Password**

### Logging Out

- Click your profile icon → **Logout**, OR
- Your session will automatically expire after inactivity

---

## Tips & Tricks

### Productivity Tips

1. **Use Tags Consistently** - Create a tagging system and stick to it
2. **Daily Review** - Check your dashboard each morning
3. **Project Everything** - Link notes and todos to projects
4. **Keyboard Shortcuts** - Learn them for faster navigation
5. **Export Regularly** - Download important notes as backups

### Markdown Quick Reference

| Type This | Get This |
|-----------|----------|
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `~~strike~~` | ~~strike~~ |
| `` `code` `` | `code` |
| `[link](url)` | link |
| `![alt](url)` | image |

### Organization Strategies

**For Research:**
- One project per research topic
- Notes for literature reviews, methods, results
- Todos for experiments, deadlines, reviews

**For Personal:**
- "Inbox" project for quick captures
- Tags: #personal, #work, #ideas
- Weekly review of completed todos

---

## Troubleshooting

### Can't Log In

1. Check your email and password
2. Wait 15 minutes if you've exceeded login attempts
3. Try clearing browser cookies
4. Use "Forgot Password" if needed

### Notes Not Saving

1. Check your internet connection
2. Look for error messages
3. Try refreshing the page
4. Your work auto-saves every 30 seconds

### Missing Content

1. Check the visibility settings
2. Verify you're in the right project
3. Use search to find items
4. Check the "All" filter (not just "Active")

### Need Help?

- Check the [README](/README.md) for technical details
- Review the [API documentation](/docs/API.md)
- Contact the administrator

---

## Mobile Usage

### Mobile Navigation

On mobile devices, navigation moves to the bottom of the screen for easy thumb access.

### Touch Gestures

- **Pull Down** - Refresh the current page
- **Swipe** - Navigate between items (where supported)
- **Long Press** - Access context menu

### Mobile Tips

1. Use the floating action button (+) for quick creation
2. Bottom navigation for main sections
3. Pull-to-refresh for latest data
4. Tap-friendly buttons (44px+ touch targets)

---

*Last updated: January 2025*
