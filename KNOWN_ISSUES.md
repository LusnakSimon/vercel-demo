# Known Issues & Fixes

## ✅ Fixed Issues

### 1. Contacts Page - Add Contact (FIXED)
**Issue**: Adding contacts by email didn't work
**Root Cause**: API returns single user object, but code expected array
**Fix**: Changed `users.length` check to `!user || !user._id`
**Status**: ✅ Fixed in commit 40ee3fb

### 2. Contacts Page - Invite Modal (FIXED)
**Issue**: Invite to project modal didn't display
**Root Cause**: Wrong modal structure (missing `modal-overlay` wrapper) and wrong CSS classes (`active` vs `hidden`)
**Fix**: 
- Changed modal structure to use `modal-overlay` wrapper
- Updated show/hide functions to use `hidden` class + `display` style
**Status**: ✅ Fixed in commit 40ee3fb

## 🔍 Potential Issues to Monitor

### Modal Consistency
**Location**: project.html
**Description**: Uses `.classList.add('active')` instead of removing `.hidden` class
**Impact**: May not work consistently with other modals
**Recommendation**: Standardize all modals to use `.hidden` class

### Filter Button State
**Location**: todos.html
**Description**: Filter buttons now show active state clearly
**Status**: ✅ Working correctly after v3.0 UI update

### Theme Toggle
**Location**: All pages
**Description**: Event listener conflicts caused intermittent failures
**Status**: ✅ Fixed - removed inline onclick, improved listener setup

### Search & Filter
**Location**: todos.html
**Description**: Search/filter cleared todos on operations
**Status**: ✅ Fixed - Added `reloadTodos()` wrapper and proper state management

## ✅ Verified Working Features

- ✅ Authentication (login, register, logout)
- ✅ Todos (CRUD, tags, due dates, filters, search)
- ✅ Notes (Markdown editor, image upload)
- ✅ Projects (CRUD, member management)
- ✅ Dashboard (stats cards, activity feed)
- ✅ Kanban board (drag-and-drop)
- ✅ Profile page (add/remove contacts works)
- ✅ Mobile responsive design
- ✅ Dark/light theme toggle
- ✅ Command palette (Cmd+K)
- ✅ Real-time updates (SSE)
- ✅ Session management

## 🧪 Test Checklist

To verify all features work:

### Authentication
- [ ] Register new user
- [ ] Login with credentials
- [ ] View profile
- [ ] Update profile
- [ ] Change password
- [ ] Logout

### Todos
- [ ] Create todo
- [ ] Edit todo
- [ ] Delete todo (with undo)
- [ ] Mark complete/incomplete
- [ ] Add tags
- [ ] Set due date
- [ ] Filter (All/Active/Done)
- [ ] Search todos
- [ ] View in Kanban board
- [ ] Drag-and-drop in Kanban

### Notes
- [ ] Create note
- [ ] Edit note (Markdown)
- [ ] Upload image
- [ ] Add tags
- [ ] Delete note
- [ ] Export as Markdown

### Projects
- [ ] Create project
- [ ] Edit project
- [ ] Delete project
- [ ] View project details
- [ ] Add members
- [ ] Remove members
- [ ] View project todos/notes

### Contacts & Invitations
- [ ] Add contact by email (from contacts page)
- [ ] Add contact from profile page
- [ ] Remove contact
- [ ] Invite contact to project (from contacts page)
- [ ] Invite user to project (from project page)
- [ ] View invitations
- [ ] Accept invitation
- [ ] Decline invitation

### UI/UX
- [ ] Toggle dark/light theme (all pages)
- [ ] Command palette (Cmd+K)
- [ ] Mobile bottom navigation
- [ ] Pull-to-refresh
- [ ] Filter button active state
- [ ] Skeleton loaders
- [ ] Toast notifications
- [ ] FAB buttons

### Dashboard
- [ ] View todo stats
- [ ] View activity feed
- [ ] Quick access to todos/notes
- [ ] View recent projects

## 📝 Notes

- All API endpoints are working and return proper status codes
- Session management with HttpOnly cookies is functioning
- MongoDB Atlas connection is stable
- Vercel deployment auto-updates on git push
- All URLs updated to researchnotebook.vercel.app
