// Minimal client helper for auth + basic page wiring
const api = {
  // sessions-based client: send credentials so cookie is sent to same-origin
  async request(path, opts = {}) {
    opts.headers = opts.headers || {};
    opts.credentials = opts.credentials || 'same-origin';
    opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json';
    if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
    
    console.log('[API]', opts.method || 'GET', path, 'credentials:', opts.credentials);
    
    try {
      const res = await fetch(path, opts);
      const json = await res.json().catch(()=>null);
      
      console.log('[API]', path, 'status:', res.status, 'ok:', res.ok);
      
      if (!res.ok) {
        // Enhanced error messages
        const errorMsg = json?.error || json?.message || `Request failed (${res.status})`;
        const errorDetail = {
          error: errorMsg,
          status: res.status,
          statusText: res.statusText,
          path: path
        };
        
        // User-friendly error messages
        if (res.status === 401) {
          errorDetail.userMessage = 'You need to sign in to perform this action';
        } else if (res.status === 403) {
          errorDetail.userMessage = 'You don\'t have permission to do that';
        } else if (res.status === 404) {
          errorDetail.userMessage = 'The item you\'re looking for doesn\'t exist';
        } else if (res.status === 400) {
          errorDetail.userMessage = errorMsg;
        } else if (res.status >= 500) {
          errorDetail.userMessage = 'Server error - please try again later';
        } else {
          errorDetail.userMessage = errorMsg;
        }
        
        throw errorDetail;
      }
      return json;
    } catch (err) {
      // Network errors
      if (err.name === 'TypeError' || !err.status) {
        throw {
          error: 'Network error',
          userMessage: 'Unable to connect to server. Check your internet connection.',
          originalError: err
        };
      }
      throw err;
    }
  }
};
// expose api globally so inline page scripts can call it
window.api = api;

// Theme management
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }
}

// Initialize theme icon on load (theme already applied by inline script in HTML)
window.toggleTheme = toggleTheme;

// Update theme icon when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateThemeIcon(currentTheme);
  });
} else {
  // DOM already loaded
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateThemeIcon(currentTheme);
}

// Toast helper (exposed globally)
function showToast(message, type = 'info', timeout = 2500) {
  try {
    const id = 'app-toast';
    let el = document.getElementById(id);
    if (el) el.remove();
    el = document.createElement('div'); el.id = id; el.className = 'toast ' + (type||'info'); el.textContent = message;
    document.body.appendChild(el);
    setTimeout(()=>{ el && el.remove(); }, timeout);
  } catch(e) { console.warn('toast failed', e); }
}
window.showToast = showToast;

async function loginFormHandler(ev) {
  ev && ev.preventDefault();
  const btn = ev.target.querySelector('button[type="submit"]');
  try {
    if (btn) btn.disabled = true;
    const email = document.querySelector('#login-email').value;
    const password = document.querySelector('#login-password').value;
    const res = await api.request('/api/auth/login', { method: 'POST', body: { email, password } });
    
    if (!res || !res.user) {
      throw new Error('Login response missing user data');
    }
    
    // Verify session is set by checking /api/auth/me
    const me = await api.request('/api/auth/me');
    if (!me || !me.user) {
      throw new Error('Session not established');
    }
    
    showToast('Welcome back, ' + (me.user.name || me.user.email) + '!', 'success', 1500);
    // Small delay to ensure cookie is fully set
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 300);
  } catch (err) {
    console.warn('login failed', err);
    showToast('Login failed: ' + (err && (err.error || err.message || JSON.stringify(err))), 'error', 3000);
    if (btn) btn.disabled = false;
  }
}

async function registerFormHandler(ev) {
  ev && ev.preventDefault();
  const btn = ev.target.querySelector('button[type="submit"]');
  try {
    if (btn) btn.disabled = true;
    const email = document.querySelector('#register-email').value;
    const password = document.querySelector('#register-password').value;
    const name = document.querySelector('#register-name').value;
    
    const res = await api.request('/api/auth/register', { method: 'POST', body: { email, password, name } });
    
    if (!res || !res.user) {
      throw new Error('Registration response missing user data');
    }
    
    // Verify session is set
    const me = await api.request('/api/auth/me');
    if (!me || !me.user) {
      throw new Error('Session not established');
    }
    
    showToast('Welcome, ' + (me.user.name || me.user.email) + '!', 'success', 1500);
    // Small delay to ensure cookie is fully set
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 300);
  } catch (err) {
    console.warn('registration failed', err);
    showToast('Registration failed: ' + (err && (err.error || err.message || JSON.stringify(err))), 'error', 3000);
    if (btn) btn.disabled = false;
  }
}

async function loadTodosList() {
  const listEl = document.querySelector('#todos-list');
  if (!listEl) return;
  
  // Show loading state
  listEl.innerHTML = '<li class="muted center" style="padding: 40px;"><div class="spinner" style="margin: 0 auto 12px;"></div>Loading todos...</li>';
  
  try {
    const todos = await api.request('/api/todos');
    listEl.innerHTML = '';
    
    if (!todos || todos.length === 0) {
      listEl.innerHTML = `
        <li class="muted center" style="padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">📝</div>
          <div style="font-size: 16px; margin-bottom: 8px;">No todos yet</div>
          <div style="font-size: 14px;">Create your first todo to get started!</div>
        </li>
      `;
      return;
    }
    
    todos.forEach(t => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (t.done ? ' done' : '');
      const desc = t.description ? `<div class="todo-description">${escapeHtml(t.description)}</div>` : '';
      
      // Add checkbox for marking complete
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = t.done;
      checkbox.className = 'todo-checkbox';
      checkbox.dataset.id = t._id;
      checkbox.addEventListener('change', async (e) => {
        try {
          await api.request('/api/todos?id=' + encodeURIComponent(t._id), {
            method: 'PATCH',
            body: { done: e.target.checked }
          });
          loadTodosList();
        } catch(err) {
          showToast('Failed to update', 'error');
          e.target.checked = !e.target.checked;
        }
      });
      
      li.innerHTML = `<div class="todo-content"><div class="todo-title">${escapeHtml(t.title)}</div>${desc}</div>`;
      li.insertBefore(checkbox, li.firstChild);
      const actions = document.createElement('div');
      actions.className = 'todo-actions';
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-secondary';
      editBtn.textContent = 'Edit';
      editBtn.dataset.id = t._id;
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-sm btn-danger';
      delBtn.textContent = 'Delete';
      delBtn.dataset.id = t._id;
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      li.appendChild(actions);
      listEl.appendChild(li);
    });
  } catch (err) {
    listEl.innerHTML = '<li class="muted">Unable to load todos. Are you logged in?</li>';
  }
}

// handle clicks for edit/delete on todo list (event delegation)
document.addEventListener('click', async (ev) => {
  const btn = ev.target.closest && ev.target.closest('button');
  if (!btn) return;
  const id = btn.dataset && btn.dataset.id;
  if (!id) return;
  if (btn.textContent === 'Edit') {
    // open modal editor
    openTodoModal(id);
  } else if (btn.textContent === 'Delete') {
    // Get todo data for undo
    let todoData = null;
    try {
      todoData = await api.request('/api/todos?id=' + encodeURIComponent(id));
    } catch(e) {
      console.error('Failed to get todo data', e);
    }
    
    try {
      await api.request('/api/todos?id='+encodeURIComponent(id), { method: 'DELETE' });
      loadTodosList();
      
      // Show undo toast
      if (window.showToastWithAction && todoData) {
        showToastWithAction(
          'Todo deleted',
          'Undo',
          async () => {
            try {
              await api.request('/api/todos', {
                method: 'POST',
                body: {
                  title: todoData.title,
                  description: todoData.description,
                  tags: todoData.tags,
                  dueDate: todoData.dueDate,
                  done: todoData.done
                }
              });
              showToast('Todo restored', 'success');
              loadTodosList();
            } catch(e) {
              showToast('Failed to restore', 'error');
            }
          },
          5000
        );
      } else {
        showToast('Deleted', 'success', 1000);
      }
    } catch(e) {
      showToast('Delete failed', 'error');
    }
  }
});

// Modal editor functions
function openTodoModal(id) {
  const overlay = document.getElementById('modal-overlay');
  const titleInput = document.getElementById('modal-title-input');
  const descInput = document.getElementById('modal-description');
  const tagsInput = document.getElementById('modal-tags-input');
  const dueDateInput = document.getElementById('modal-due-date');
  overlay.classList.remove('hidden');
  overlay.style.display = 'flex';
  
  // Keyboard shortcuts for modal
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      closeTodoModal();
      document.removeEventListener('keydown', handleKeydown);
    }
  };
  document.addEventListener('keydown', handleKeydown);
  
  // load current todo
  api.request('/api/todos?id=' + encodeURIComponent(id)).then(t => {
    titleInput.value = t.title || '';
    descInput.value = t.description || '';
    if (tagsInput) {
      tagsInput.value = t.tags ? t.tags.join(', ') : '';
      updateTagsPreview('modal-tags-preview', t.tags || []);
    }
    if (dueDateInput && t.dueDate) {
      const due = new Date(t.dueDate);
      dueDateInput.value = due.toISOString().split('T')[0];
    }
    document.getElementById('modal-form').dataset.id = id;
    titleInput.focus();
  }).catch(e=>{ showToast('Unable to load todo', 'error'); });
}

function closeTodoModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('hidden');
  overlay.style.display = 'none';
  document.getElementById('modal-form').removeAttribute('data-id');
}

// handle modal form submit
document.addEventListener('submit', async (ev) => {
  if (ev.target && ev.target.id === 'modal-form') {
    ev.preventDefault();
    const id = ev.target.dataset.id;
    const title = document.getElementById('modal-title-input').value.trim();
    const description = document.getElementById('modal-description').value.trim();
    const tagsInput = document.getElementById('modal-tags-input');
    const tags = tagsInput ? tagsInput.value.split(',').map(t => t.trim()).filter(t => t) : [];
    const dueDateInput = document.getElementById('modal-due-date');
    const dueDate = dueDateInput ? dueDateInput.value || null : null;
    if (!title) { showToast('Title required', 'error'); return; }
    try {
      document.getElementById('modal-save').disabled = true;
      await api.request('/api/todos?id=' + encodeURIComponent(id), { method: 'PATCH', body: { title, description, tags, dueDate } });
      showToast('Todo updated', 'success', 1000);
      closeTodoModal();
      loadTodosList();
    } catch (e) { showToast('Update failed: '+(e.error||JSON.stringify(e)), 'error', 3000); }
    finally { document.getElementById('modal-save').disabled = false; }
  }
});

// Notes helpers
async function loadProjectNotes(projectId, q) {
  const listEl = document.querySelector('#notes-list');
  if (!listEl) return;
  try {
    const url = '/api/notes?projectId=' + encodeURIComponent(projectId || '') + '&q=' + encodeURIComponent(q || '');
    const notes = await api.request(url);
    listEl.innerHTML = '';
    notes.forEach(n => {
      const li = document.createElement('li'); li.className = 'list-item';
      li.innerHTML = `<div style="flex:1"><strong>${escapeHtml(n.title)}</strong><div class="small muted">${n.tags?escapeHtml(n.tags.join(', ')):''}</div></div><div><a class="btn" href="/note.html?id=${n._id}">Open</a></div>`;
      listEl.appendChild(li);
    });
  } catch (err) {
    listEl.innerHTML = '<li class="muted">Unable to load notes.</li>';
  }
}

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

document.addEventListener('DOMContentLoaded', ()=>{
  const loginForm = document.querySelector('#login-form');
  if (loginForm) loginForm.addEventListener('submit', loginFormHandler);
  const registerForm = document.querySelector('#register-form');
  if (registerForm) registerForm.addEventListener('submit', registerFormHandler);
  
  // Initialize modal cancel button
  const modalCancel = document.getElementById('modal-cancel');
  if (modalCancel) modalCancel.addEventListener('click', ()=>{ closeTodoModal(); });
  
  // Theme toggle button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  
  loadTodosList();
  renderAuthActions();
});

async function signOut() {
  try {
    await api.request('/api/auth/logout', { method: 'POST' });
  } catch(e) {
    console.warn('logout request failed', e);
  }
  // redirect to home
  window.location.href = '/';
}

async function renderAuthActions() {
  const el = document.querySelector('#auth-actions');
  if (!el) return;
  try {
    const res = await api.request('/api/auth/me');
    if (res && res.user) {
      // Check for pending invitations
      let notifBadge = '';
      try {
        const invitations = await api.request('/api/invitations');
        if (invitations && invitations.length > 0) {
          notifBadge = `<a href="/notifications.html" class="notification-bell" title="${invitations.length} pending invitation(s)">🔔<span class="badge">${invitations.length}</span></a>`;
        } else {
          notifBadge = '<a href="/notifications.html" class="notification-bell" title="Notifications" style="opacity: 0.5;">🔔</a>';
        }
      } catch (err) {
        console.log('Could not load notifications:', err);
      }
      
      el.innerHTML = `${notifBadge}<span class="muted">Hi, ${escapeHtml(res.user.name||res.user.email)}</span> <button class="btn btn-sm btn-secondary" onclick="signOut()">Sign Out</button>`;
    } else {
      el.innerHTML = '<a class="btn btn-sm btn-primary" href="/login.html">Sign In</a>';
    }
  } catch {
    el.innerHTML = '<a class="btn btn-sm btn-primary" href="/login.html">Sign In</a>';
  }
}

// Tag management helpers
function updateTagsPreview(previewId, tags) {
  const preview = document.getElementById(previewId);
  if (!preview) return;
  preview.innerHTML = tags && tags.length ? 
    tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('') : '';
}

// Add real-time tag preview
document.addEventListener('DOMContentLoaded', () => {
  const tagsInput = document.getElementById('tags-input');
  if (tagsInput) {
    tagsInput.addEventListener('input', (e) => {
      const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
      updateTagsPreview('tags-preview', tags);
    });
  }
  
  const modalTagsInput = document.getElementById('modal-tags-input');
  if (modalTagsInput) {
    modalTagsInput.addEventListener('input', (e) => {
      const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
      updateTagsPreview('modal-tags-preview', tags);
    });
  }
});

// Confirmation dialog
function confirmDialog(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    
    const modal = document.createElement('div');
    modal.className = 'modal confirm';
    modal.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
        <button class="btn btn-danger" id="confirm-yes">Delete</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    const cleanup = () => {
      overlay.remove();
    };
    
    document.getElementById('confirm-cancel').addEventListener('click', () => {
      cleanup();
      resolve(false);
    });
    
    document.getElementById('confirm-yes').addEventListener('click', () => {
      cleanup();
      resolve(true);
    });
    
    // ESC key
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
    
    // Click outside
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    });
  });
}
