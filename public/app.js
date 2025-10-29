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

async function loginFormHandler(ev) {
  ev && ev.preventDefault();
  const email = document.querySelector('#login-email').value;
  const password = document.querySelector('#login-password').value;
  const res = await api.request('/api/auth/login', { method: 'POST', body: { email, password } });
  localStorage.setItem('token', res.token);
  window.location.href = '/dashboard.html';
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

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

document.addEventListener('DOMContentLoaded', ()=>{
  const loginForm = document.querySelector('#login-form');
  if (loginForm) loginForm.addEventListener('submit', loginFormHandler);
  loadTodosList();
});
