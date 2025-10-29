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
  const email = document.querySelector('#login-email').value;
  const password = document.querySelector('#login-password').value;
  const res = await api.request('/api/auth/login', { method: 'POST', body: { email, password } });
  localStorage.setItem('token', res.token);
  window.location.href = '/dashboard.html';
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
    alert('Registration failed: ' + (err && (err.error || JSON.stringify(err))));
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
      li.innerHTML = `<div><div class="todo-title">${escapeHtml(t.title)}</div><div class="small muted">${t.description||''}</div></div><div class="row"><button class="btn" data-id="${t._id}">Edit</button></div>`;
      listEl.appendChild(li);
    });
  } catch (err) {
    listEl.innerHTML = '<li class="muted">Unable to load todos. Are you logged in?</li>';
  }
}

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
