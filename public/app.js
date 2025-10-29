// Minimal client helper for auth + basic page wiring
const api = {
  token: () => localStorage.getItem('token') || null,
  async request(path, opts = {}) {
    opts.headers = opts.headers || {};
    if (this.token()) opts.headers['Authorization'] = 'Bearer ' + this.token();
    opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json';
    if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
    const res = await fetch(path, opts);
    const json = await res.json().catch(()=>null);
    if (!res.ok) throw json || { error: 'http ' + res.status };
    return json;
  }
};
// expose api globally so inline page scripts can call it
window.api = api;

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
  try {
    const email = document.querySelector('#login-email').value;
    const password = document.querySelector('#login-password').value;
    const res = await api.request('/api/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('token', res.token);
    showToast('Logged in', 'success', 1000);
    window.location.href = '/dashboard.html';
  } catch (err) {
    console.warn('login failed', err);
    showToast('Login failed: ' + (err && (err.error || JSON.stringify(err))), 'error', 3000);
  }
}

async function registerFormHandler(ev) {
  ev && ev.preventDefault();
  const email = document.querySelector('#register-email').value;
  const password = document.querySelector('#register-password').value;
  const name = document.querySelector('#register-name').value;
  try {
    const res = await api.request('/api/auth/register', { method: 'POST', body: { email, password, name } });
    // register returns { token }
    if (res && res.token) {
      localStorage.setItem('token', res.token);
      window.location.href = '/dashboard.html';
      return;
    }
    // fallback: attempt login
    const login = await api.request('/api/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('token', login.token);
    window.location.href = '/dashboard.html';
  } catch (err) {
    console.warn('registration failed', err);
    showToast('Registration failed: ' + (err && (err.error || JSON.stringify(err))), 'error', 3000);
  }
}

async function loadTodosList() {
  const listEl = document.querySelector('#todos-list');
  if (!listEl) return;
  try {
    const todos = await api.request('/api/todos');
    listEl.innerHTML = '';
    todos.forEach(t => {
      const li = document.createElement('li'); li.className = 'list-item';
      const desc = t.description ? `<div class="small muted">${escapeHtml(t.description)}</div>` : '';
      li.innerHTML = `<div style="flex:1"><div class="todo-title">${escapeHtml(t.title)}</div>${desc}</div>`;
      const actions = document.createElement('div'); actions.className='row';
      const editBtn = document.createElement('button'); editBtn.className='btn'; editBtn.textContent='Edit'; editBtn.dataset.id = t._id;
      const delBtn = document.createElement('button'); delBtn.className='btn secondary'; delBtn.textContent='Delete'; delBtn.style.marginLeft='8px'; delBtn.dataset.id = t._id;
      actions.appendChild(editBtn); actions.appendChild(delBtn);
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
    if (!confirm('Delete todo?')) return;
    try { await api.request('/api/todos?id='+encodeURIComponent(id), { method: 'DELETE' }); showToast('Deleted', 'success', 1000); loadTodosList(); } catch(e){ showToast('Delete failed', 'error'); }
  }
});

// Modal editor functions
function openTodoModal(id) {
  const overlay = document.getElementById('modal-overlay');
  const titleInput = document.getElementById('modal-title-input');
  const descInput = document.getElementById('modal-description');
  overlay.classList.remove('hidden');
  overlay.style.display = 'flex';
  // load current todo
  api.request('/api/todos?id=' + encodeURIComponent(id)).then(t => {
    titleInput.value = t.title || '';
    descInput.value = t.description || '';
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
    if (!title) { showToast('Title required', 'error'); return; }
    try {
      document.getElementById('modal-save').disabled = true;
      await api.request('/api/todos?id=' + encodeURIComponent(id), { method: 'PATCH', body: { title, description } });
      showToast('Todo updated', 'success', 1000);
      closeTodoModal();
      loadTodosList();
    } catch (e) { showToast('Update failed: '+(e.error||JSON.stringify(e)), 'error', 3000); }
    finally { document.getElementById('modal-save').disabled = false; }
  }
});

document.getElementById('modal-cancel') && document.getElementById('modal-cancel').addEventListener('click', ()=>{ closeTodoModal(); });

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
  loadTodosList();
  renderAuthActions();
});

function signOut() {
  localStorage.removeItem('token');
  // redirect to home
  window.location.href = '/';
}

async function renderAuthActions() {
  const container = document.getElementById('auth-actions');
  if (!container) return;
  container.innerHTML = '';
  const token = api.token();
  if (!token) {
    const a = document.createElement('a'); a.href='/account.html'; a.textContent='Account'; a.style='color:var(--muted);text-decoration:none;margin-left:8px';
    container.appendChild(a);
    return;
  }
  // try fetch user
  try {
    const res = await fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error('not ok');
    const body = await res.json();
    const name = (body && body.user && (body.user.name || body.user.email)) || 'Me';
    const span = document.createElement('span'); span.className='muted'; span.textContent = name; span.style='margin-right:8px';
    const btn = document.createElement('button'); btn.textContent='Sign out'; btn.className='btn secondary'; btn.style='margin-left:8px';
    btn.addEventListener('click', signOut);
    container.appendChild(span); container.appendChild(btn);
  } catch (e) {
    // fallback: clear token and show account link
    console.warn('failed to fetch /api/auth/me', e);
    localStorage.removeItem('token');
    const a = document.createElement('a'); a.href='/account.html'; a.textContent='Account'; a.style='color:var(--muted);text-decoration:none;margin-left:8px';
    container.appendChild(a);
  }
}
