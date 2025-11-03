// ============================================
// UI/UX ENHANCEMENTS
// ============================================

(function() {
  'use strict';

  // ============================================
  // STICKY HEADER WITH SCROLL EFFECT
  // ============================================
  function initStickyHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      
      lastScroll = currentScroll;
    });
  }

  // ============================================
  // ACTIVE NAVIGATION HIGHLIGHTING
  // ============================================
  function initActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav a:not(.btn)');
    
    navLinks.forEach(link => {
      const linkPath = new URL(link.href).pathname;
      if (linkPath === currentPath) {
        link.classList.add('active');
      }
    });
  }

  // ============================================
  // COMMAND PALETTE (Cmd/Ctrl + K)
  // ============================================
  let commandPalette = null;
  let commandPaletteActive = false;

  function createCommandPalette() {
    const palette = document.createElement('div');
    palette.className = 'command-palette';
    palette.innerHTML = `
      <div class="command-palette-content">
        <input 
          type="text" 
          class="command-palette-input" 
          placeholder="Type a command or search..."
          autofocus
        />
        <div class="command-palette-results" id="command-results">
          <div class="command-item" data-action="goto-dashboard">
            <span class="command-item-icon">🏠</span>
            <span class="command-item-text">Go to Dashboard</span>
            <span class="command-item-shortcut">Enter</span>
          </div>
          <div class="command-item" data-action="goto-projects">
            <span class="command-item-icon">📁</span>
            <span class="command-item-text">Go to Projects</span>
          </div>
          <div class="command-item" data-action="goto-todos">
            <span class="command-item-icon">✅</span>
            <span class="command-item-text">Go to Todos</span>
          </div>
          <div class="command-item" data-action="goto-notes">
            <span class="command-item-icon">📝</span>
            <span class="command-item-text">Go to Notes</span>
          </div>
          <div class="command-item" data-action="goto-messages">
            <span class="command-item-icon">💬</span>
            <span class="command-item-text">Go to Messages</span>
          </div>
          <div class="command-item" data-action="goto-contacts">
            <span class="command-item-icon">👥</span>
            <span class="command-item-text">Go to Contacts</span>
          </div>
          <div class="command-item" data-action="new-todo">
            <span class="command-item-icon">➕</span>
            <span class="command-item-text">Create New Todo</span>
          </div>
          <div class="command-item" data-action="new-note">
            <span class="command-item-icon">📄</span>
            <span class="command-item-text">Create New Note</span>
          </div>
          <div class="command-item" data-action="new-project">
            <span class="command-item-icon">🆕</span>
            <span class="command-item-text">Create New Project</span>
          </div>
          <div class="command-item" data-action="toggle-theme">
            <span class="command-item-icon">🌓</span>
            <span class="command-item-text">Toggle Theme</span>
            <span class="command-item-shortcut">Shift+T</span>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(palette);
    return palette;
  }

  function initCommandPalette() {
    commandPalette = createCommandPalette();
    const input = commandPalette.querySelector('.command-palette-input');
    const results = commandPalette.querySelector('.command-palette-results');
    let selectedIndex = 0;

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }
      
      // Don't trigger shortcuts if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      
      // Theme toggle (Shift + T)
      if (e.shiftKey && e.key === 'T') {
        e.preventDefault();
        if (window.toggleTheme) window.toggleTheme();
      }
      
      // New note (N)
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        window.location.href = '/note.html';
      }
      
      // New todo (T)
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        window.location.href = '/todos.html';
      }
      
      // Go to dashboard (D)
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        window.location.href = '/dashboard.html';
      }
      
      // Go to projects (P)
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        window.location.href = '/projects.html';
      }
      
      // Show shortcuts help (?)
      if (e.key === '?') {
        e.preventDefault();
        showShortcutsHelp();
      }
      
      // Close modals (Escape)
      if (e.key === 'Escape') {
        // Close any open modals
        const modals = document.querySelectorAll('.modal-overlay:not(.hidden)');
        modals.forEach(modal => {
          if (modal.style.display !== 'none') {
            modal.classList.add('hidden');
            modal.style.display = 'none';
          }
        });
      }
    });

    // Close on click outside
    commandPalette.addEventListener('click', (e) => {
      if (e.target === commandPalette) {
        closeCommandPalette();
      }
    });

    // Close on Escape
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCommandPalette();
      } else if (e.key === 'Enter') {
        executeCommand(selectedIndex);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateCommands(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateCommands(-1);
      }
    });

    // Filter commands on input
    let searchTimeout;
    input.addEventListener('input', (e) => {
      const query = e.target.value;
      filterCommands(query);
      
      // Trigger search after 300ms of no typing
      clearTimeout(searchTimeout);
      if (query.trim().length >= 2) {
        searchTimeout = setTimeout(() => performSearch(query), 300);
      }
    });

    // Click on command
    results.addEventListener('click', (e) => {
      const item = e.target.closest('.command-item');
      if (item) {
        const action = item.dataset.action;
        executeCommandAction(action);
      }
    });
  }

  function toggleCommandPalette() {
    if (commandPaletteActive) {
      closeCommandPalette();
    } else {
      openCommandPalette();
    }
  }

  function openCommandPalette() {
    commandPalette.classList.add('active');
    commandPaletteActive = true;
    const input = commandPalette.querySelector('.command-palette-input');
    input.value = '';
    input.focus();
    filterCommands('');
  }

  function closeCommandPalette() {
    commandPalette.classList.remove('active');
    commandPaletteActive = false;
  }

  function filterCommands(query) {
    const items = commandPalette.querySelectorAll('.command-item:not(.search-result)');
    const lowerQuery = query.toLowerCase();
    let visibleCount = 0;

    // Clear previous search results
    const searchResults = commandPalette.querySelectorAll('.search-result');
    searchResults.forEach(el => el.remove());

    items.forEach((item, index) => {
      const text = item.textContent.toLowerCase();
      if (text.includes(lowerQuery)) {
        item.style.display = 'flex';
        if (visibleCount === 0) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
        visibleCount++;
      } else {
        item.style.display = 'none';
        item.classList.remove('selected');
      }
    });
  }
  
  async function performSearch(query) {
    if (!window.api) return;
    
    try {
      const data = await window.api.request(`/api/search?q=${encodeURIComponent(query)}`);
      displaySearchResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }
  
  function displaySearchResults(data) {
    const results = commandPalette.querySelector('.command-palette-results');
    
    // Remove old search results
    const oldResults = results.querySelectorAll('.search-result, .search-header');
    oldResults.forEach(el => el.remove());
    
    if (!data || !data.results || data.total === 0) return;
    
    // Add search results header
    const header = document.createElement('div');
    header.className = 'search-header';
    header.style.cssText = 'padding: 8px 16px; font-size: 12px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; border-top: 1px solid var(--border);';
    header.textContent = `Search Results (${data.total})`;
    results.appendChild(header);
    
    // Add todos
    data.results.todos?.forEach(todo => {
      const item = document.createElement('div');
      item.className = 'command-item search-result';
      item.dataset.type = 'todo';
      item.dataset.id = todo._id;
      item.innerHTML = `
        <span class="command-item-icon">${todo.done ? '✅' : '⬜'}</span>
        <span class="command-item-text">${escapeHtml(todo.title)}</span>
        <span class="command-item-shortcut">Todo</span>
      `;
      item.onclick = () => {
        closeCommandPalette();
        window.location.href = '/todos.html';
      };
      results.appendChild(item);
    });
    
    // Add notes
    data.results.notes?.forEach(note => {
      const item = document.createElement('div');
      item.className = 'command-item search-result';
      item.dataset.type = 'note';
      item.dataset.id = note._id;
      item.innerHTML = `
        <span class="command-item-icon">📝</span>
        <span class="command-item-text">${escapeHtml(note.title)}</span>
        <span class="command-item-shortcut">Note</span>
      `;
      item.onclick = () => {
        closeCommandPalette();
        window.location.href = `/note.html?id=${note._id}`;
      };
      results.appendChild(item);
    });
    
    // Add projects
    data.results.projects?.forEach(project => {
      const item = document.createElement('div');
      item.className = 'command-item search-result';
      item.dataset.type = 'project';
      item.dataset.id = project._id;
      item.innerHTML = `
        <span class="command-item-icon">📁</span>
        <span class="command-item-text">${escapeHtml(project.name)}</span>
        <span class="command-item-shortcut">Project</span>
      `;
      item.onclick = () => {
        closeCommandPalette();
        window.location.href = `/project.html?id=${project._id}`;
      };
      results.appendChild(item);
    });
    
    // Add contacts
    data.results.contacts?.forEach(contact => {
      const item = document.createElement('div');
      item.className = 'command-item search-result';
      item.dataset.type = 'contact';
      item.dataset.id = contact._id;
      item.innerHTML = `
        <span class="command-item-icon">👤</span>
        <span class="command-item-text">${escapeHtml(contact.name || contact.email)}</span>
        <span class="command-item-shortcut">Contact</span>
      `;
      item.onclick = () => {
        closeCommandPalette();
        window.location.href = '/contacts.html';
      };
      results.appendChild(item);
    });
  }
  
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function navigateCommands(direction) {
    const items = Array.from(commandPalette.querySelectorAll('.command-item')).filter(
      item => item.style.display !== 'none'
    );
    
    if (items.length === 0) return;

    const currentSelected = commandPalette.querySelector('.command-item.selected');
    const currentIndex = items.indexOf(currentSelected);
    
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;

    items.forEach(item => item.classList.remove('selected'));
    items[newIndex].classList.add('selected');
  }

  function executeCommand(index) {
    const items = Array.from(commandPalette.querySelectorAll('.command-item')).filter(
      item => item.style.display !== 'none'
    );
    
    if (items[index]) {
      const action = items[index].dataset.action;
      executeCommandAction(action);
    }
  }

  function executeCommandAction(action) {
    closeCommandPalette();
    
    const actions = {
      'goto-dashboard': () => window.location.href = '/dashboard.html',
      'goto-projects': () => window.location.href = '/projects.html',
      'goto-todos': () => window.location.href = '/todos.html',
      'goto-notes': () => window.location.href = '/notes.html',
      'goto-messages': () => window.location.href = '/messages.html',
      'goto-contacts': () => window.location.href = '/contacts.html',
      'new-todo': () => window.location.href = '/todos.html',
      'new-note': () => window.location.href = '/note.html',
      'new-project': () => window.location.href = '/projects.html',
      'toggle-theme': () => {
        if (window.toggleTheme) window.toggleTheme();
      }
    };

    if (actions[action]) {
      actions[action]();
    }
  }

  // ============================================
  // SKELETON LOADER HELPER
  // ============================================
  window.createSkeletonLoader = function(count = 3, type = 'card') {
    const templates = {
      card: `
        <div class="skeleton skeleton-card"></div>
      `,
      text: `
        <div class="skeleton skeleton-text"></div>
      `,
      item: `
        <li class="list-item" style="pointer-events: none;">
          <div style="width: 100%;">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text" style="width: 80%;"></div>
            <div class="skeleton skeleton-text" style="width: 60%;"></div>
          </div>
        </li>
      `
    };

    const template = templates[type] || templates.card;
    return Array(count).fill(template).join('');
  };

  // ============================================
  // ENHANCED TOAST WITH UNDO
  // ============================================
  window.showToastWithAction = function(message, actionLabel, actionCallback, timeout = 5000) {
    const id = 'app-toast-action';
    let el = document.getElementById(id);
    if (el) el.remove();
    
    el = document.createElement('div');
    el.id = id;
    el.className = 'toast info toast-with-action';
    el.innerHTML = `
      <span>${message}</span>
      <button class="toast-action">${actionLabel}</button>
    `;
    
    document.body.appendChild(el);
    
    const button = el.querySelector('.toast-action');
    button.addEventListener('click', () => {
      actionCallback();
      el.remove();
    });
    
    setTimeout(() => {
      if (el && el.parentElement) el.remove();
    }, timeout);
  };

  // ============================================
  // FADE-IN ANIMATION FOR CONTENT
  // ============================================
  function initFadeInAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });

    // Observe cards and list items
    document.querySelectorAll('.card, .list-item, .todo-item').forEach(el => {
      observer.observe(el);
    });
  }

  // ============================================
  // AUTO-SAVE FUNCTIONALITY
  // ============================================
  window.initAutoSave = function(formId, saveCallback, interval = 3000) {
    const form = document.getElementById(formId);
    if (!form) return;

    let saveTimeout;
    let lastSaved = Date.now();

    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          saveCallback(new FormData(form));
          lastSaved = Date.now();
          showToast('Draft saved', 'success', 1000);
        }, interval);
      });
    });
  };

  // ============================================
  // TYPING INDICATOR
  // ============================================
  window.showTypingIndicator = function(containerId, userName = 'Someone') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator-element';
    indicator.innerHTML = `
      <span>${userName} is typing</span>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;

    // Remove existing indicator
    const existing = document.getElementById('typing-indicator-element');
    if (existing) existing.remove();

    container.appendChild(indicator);
  };

  window.hideTypingIndicator = function() {
    const indicator = document.getElementById('typing-indicator-element');
    if (indicator) indicator.remove();
  };

  // ============================================
  // KEYBOARD SHORTCUTS GUIDE
  // ============================================
  function showKeyboardShortcuts() {
    if (document.getElementById('shortcuts-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'shortcuts-modal';
    modal.className = 'command-palette active';
    modal.innerHTML = `
      <div class="command-palette-content" style="max-width: 500px;">
        <div style="padding: 24px; border-bottom: 1px solid var(--border);">
          <h3 style="margin: 0;">Keyboard Shortcuts</h3>
        </div>
        <div style="padding: 24px; max-height: 400px; overflow-y: auto;">
          <div style="margin-bottom: 20px;">
            <h4 style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; margin-bottom: 12px;">Navigation</h4>
            <div class="command-item">
              <span class="command-item-text">Command Palette</span>
              <span class="command-item-shortcut">⌘K / Ctrl+K</span>
            </div>
            <div class="command-item">
              <span class="command-item-text">Toggle Theme</span>
              <span class="command-item-shortcut">Shift+T</span>
            </div>
            <div class="command-item">
              <span class="command-item-text">Close Modal</span>
              <span class="command-item-shortcut">Esc</span>
            </div>
          </div>
          <div>
            <h4 style="color: var(--text-secondary); font-size: 12px; text-transform: uppercase; margin-bottom: 12px;">Actions</h4>
            <div class="command-item">
              <span class="command-item-text">Save / Submit</span>
              <span class="command-item-shortcut">⌘Enter / Ctrl+Enter</span>
            </div>
            <div class="command-item">
              <span class="command-item-text">Show This Help</span>
              <span class="command-item-shortcut">?</span>
            </div>
          </div>
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid var(--border); text-align: right;">
          <button class="btn btn-secondary" onclick="document.getElementById('shortcuts-modal').remove()">Close</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  }

  // Show shortcuts with "?"
  document.addEventListener('keydown', (e) => {
    if (e.key === '?' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      showKeyboardShortcuts();
    }
  });

  // ============================================
  // MOBILE BOTTOM NAVIGATION
  // ============================================
  function initMobileNav() {
    if (window.innerWidth > 768) return;
    if (document.querySelector('.mobile-bottom-nav')) return;

    const nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    nav.innerHTML = `
      <a href="/dashboard.html" class="mobile-nav-item ${window.location.pathname === '/dashboard.html' ? 'active' : ''}">
        <div class="mobile-nav-item-icon">🏠</div>
        <div>Home</div>
      </a>
      <a href="/projects.html" class="mobile-nav-item ${window.location.pathname === '/projects.html' ? 'active' : ''}">
        <div class="mobile-nav-item-icon">📁</div>
        <div>Projects</div>
      </a>
      <a href="/todos.html" class="mobile-nav-item ${window.location.pathname === '/todos.html' ? 'active' : ''}">
        <div class="mobile-nav-item-icon">✅</div>
        <div>Todos</div>
      </a>
      <a href="/messages.html" class="mobile-nav-item ${window.location.pathname === '/messages.html' ? 'active' : ''}">
        <div class="mobile-nav-item-icon">💬</div>
        <div>Messages</div>
      </a>
      <a href="/contacts.html" class="mobile-nav-item ${window.location.pathname === '/contacts.html' ? 'active' : ''}">
        <div class="mobile-nav-item-icon">👥</div>
        <div>Contacts</div>
      </a>
    `;

    document.body.appendChild(nav);
    document.body.classList.add('has-mobile-nav');
  }
  
  // ============================================
  // KEYBOARD SHORTCUTS HELP
  // ============================================
  function showShortcutsHelp() {
    const existing = document.getElementById('shortcuts-modal');
    if (existing) {
      existing.remove();
      return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'shortcuts-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    
    modal.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <h2 style="margin: 0 0 24px 0;">⌨️ Keyboard Shortcuts</h2>
        <div style="display: grid; gap: 12px;">
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
            <div>
              <strong>Open Command Palette</strong>
              <div class="muted small">Quick navigation and search</div>
            </div>
            <kbd>Ctrl+K</kbd>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
            <div>
              <strong>New Note</strong>
              <div class="muted small">Create a new note</div>
            </div>
            <kbd>N</kbd>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
            <div>
              <strong>New Todo</strong>
              <div class="muted small">Create a new todo</div>
            </div>
            <kbd>T</kbd>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
            <div>
              <strong>Go to Dashboard</strong>
              <div class="muted small">Navigate to dashboard</div>
            </div>
            <kbd>D</kbd>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
            <div>
              <strong>Go to Projects</strong>
              <div class="muted small">Navigate to projects</div>
            </div>
            <kbd>P</kbd>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
            <div>
              <strong>Toggle Theme</strong>
              <div class="muted small">Switch between light/dark mode</div>
            </div>
            <kbd>Shift+T</kbd>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
            <div>
              <strong>Close Modals</strong>
              <div class="muted small">Close any open modal</div>
            </div>
            <kbd>Esc</kbd>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
            <div>
              <strong>Show This Help</strong>
              <div class="muted small">Toggle shortcuts reference</div>
            </div>
            <kbd>?</kbd>
          </div>
        </div>
        
        <div style="margin-top: 24px; text-align: center;">
          <button class="btn btn-primary" onclick="document.getElementById('shortcuts-modal').remove()">
            Got it!
          </button>
        </div>
      </div>
    `;
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Close on escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    document.body.appendChild(modal);
  }

  // ============================================
  // PULL TO REFRESH (Mobile)
  // ============================================
  function initPullToRefresh() {
    if (window.innerWidth > 768) return;

    let startY = 0;
    let pulling = false;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].pageY;
        pulling = true;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      
      const currentY = e.touches[0].pageY;
      const diff = currentY - startY;

      if (diff > 100) {
        // Trigger refresh
        window.location.reload();
        pulling = false;
      }
    });

    document.addEventListener('touchend', () => {
      pulling = false;
    });
  }

  // ============================================
  // INITIALIZE EVERYTHING
  // ============================================
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    initStickyHeader();
    initActiveNav();
    initCommandPalette();
    initFadeInAnimations();
    initMobileNav();
    initPullToRefresh();

    console.log('🚀 UI Enhancements loaded!');
  }

  init();

})();
