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

### 3. Modal Consistency (FIXED - December 2025)
**Issue**: Modals used inconsistent patterns (`.active` class vs `.hidden` class)
**Location**: project.html, notes.html, various other pages
**Fix**: Standardized all modals to use `.modal-overlay.hidden` pattern with `display: flex/none`
**Status**: ✅ Fixed

### 4. Keyboard Shortcuts Too Aggressive (FIXED - December 2025)
**Issue**: Pressing N, T, D, P anywhere triggered navigation
**Impact**: Users couldn't type these letters anywhere without being redirected
**Fix**: Changed navigation shortcuts to require Alt key (Alt+N, Alt+T, Alt+D, Alt+P)
**Status**: ✅ Fixed

### 5. HTML Structure Issues (FIXED - December 2025)
**Issue**: Several pages had malformed HTML with extra closing tags
**Location**: notes.html, note.html
**Fix**: Removed duplicate `</div>` tags and fixed structure
**Status**: ✅ Fixed

### 6. Inconsistent Navigation (FIXED - December 2025)
**Issue**: Some pages had outdated navigation missing links and features
**Location**: note.html, account.html, admin.html, project-notes.html
**Fix**: 
- Standardized navigation across all pages
- Added Messages link where missing
- Added help toggle button (?) to all pages
- Added theme initialization script where missing
- Added enhancements.js script where missing
**Status**: ✅ Fixed

### 7. Project Page Modals Not Working (FIXED - December 2025)
**Issue**: Invite member and edit project modals didn't display properly
**Root Cause**: Used wrong modal structure (`.modal` instead of `.modal-overlay`)
**Fix**: 
- Wrapped modals with `.modal-overlay.hidden` pattern
- Updated openModal/closeModal functions to use hidden class pattern
- Fixed background click handler selector
**Status**: ✅ Fixed

## 🔍 Potential Issues to Monitor

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
- ✅ Consistent navigation across all pages
- ✅ Keyboard shortcuts (Alt+key pattern)

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
