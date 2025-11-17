/**
 * Common utilities:
 * - Rendering the navbar with the required links and user dropdown.
 * - Simple auth guard (redirect to login if not authenticated).
 * - Reusable modal open/close.
 * - Date/currency helpers.
 * - A shared "Add Transaction" modal, used from multiple pages.
 */

// ========== Auth helpers ==========

function getCurrentUserEmail() {
  return localStorage.getItem('sft_currentUserEmail');
}

function getUsers() {
  return JSON.parse(localStorage.getItem('sft_users') || '[]');
}

function getCurrentUser() {
  const email = getCurrentUserEmail();
  if (!email) return null;
  return getUsers().find(u => u.email === email) || null;
}

function requireAuth() {
  // Allow login and forgot pages through; guard others
  const path = location.pathname.toLowerCase();
  const isAuthPage = path.endsWith('/index.html') || path.endsWith('/') || path.endsWith('/forgot.html');
  if (!isAuthPage && !getCurrentUser()) {
    location.href = 'index.html';
  }
}

// ========== Navbar ==========

/**
 * Build the top navbar with:
 * - Left: brand (logo + app name)
 * - Center: nav links (Dashboard, Transaction, Budgets, Saving, Shared, Analytics)
 * - Right: user dropdown (username, Profile Settings, Logout)
 */
function renderNavbar(activeKey = '') {
  const mount = document.getElementById('navbar');
  if (!mount) return;

  const user = getCurrentUser();
  const userName = user?.name || 'User';
  const avatarLetter = userName.charAt(0).toUpperCase();

  const links = [
    { key: 'dashboard', href: 'dashboard.html', text: 'Dashboard' },
    { key: 'transaction', href: 'transactions.html', text: 'Transaction' },
    { key: 'budgets', href: 'budgets.html', text: 'Budgets' },
    { key: 'saving', href: 'savings.html', text: 'Saving' },
    { key: 'shared', href: 'shared.html', text: 'Shared' },
    { key: 'analytics', href: 'analytics.html', text: 'Analytics' }
  ];

  // Navbar HTML
  mount.innerHTML = `
    <div class="navbar">
      <div class="container wrap">
        <!-- Brand (left) -->
        <a class="brand" href="dashboard.html" aria-label="StudentFinTrack home">
          <img src="assets/logo.svg" alt="logo">
          <span class="title">StudentFinTrack</span>
        </a>

        <!-- Center nav links -->
        <nav class="nav-links" aria-label="Main navigation">
          ${links.map(l => `
            <a href="${l.href}" ${activeKey===l.key?'style="border-color:#0ea5a9;background:#e6fffb"':''}>
              ${l.text}
            </a>
          `).join('')}
        </nav>

        <!-- User dropdown (right) -->
        <div class="user-area">
          <button class="user-btn" id="userMenuBtn" aria-haspopup="true" aria-expanded="false">
            <span class="avatar" aria-hidden="true">${avatarLetter}</span>
            <span>${userName}</span>
            <span aria-hidden="true">▾</span>
          </button>
          <div class="dropdown" id="userDropdown" role="menu" aria-label="User menu">
            <div class="text-muted" style="padding:6px 8px;">Signed in as <strong>${userName}</strong></div>
            <a href="account.html" role="menuitem">Profile Settings</a>
            <button id="logoutBtn" role="menuitem">Logout</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Dropdown toggle behavior (click outside closes it)
  const btn = document.getElementById('userMenuBtn');
  const dd = document.getElementById('userDropdown');
  function closeAll() { dd.style.display = 'none'; btn.setAttribute('aria-expanded', 'false'); }
  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dd.style.display === 'block';
    if (open) { closeAll(); } else { dd.style.display = 'block'; btn.setAttribute('aria-expanded', 'true'); }
  });
  document.addEventListener('click', () => closeAll());

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('sft_currentUserEmail');
    location.href = 'index.html';
  });
}

// ========== Modal helpers ==========

function openModal(innerHTML) {
  const root = document.getElementById('modalRoot');
  if (!root) return;
  root.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal">
        <div style="display:flex;justify-content:flex-end">
          <button class="btn-secondary" id="modalCloseBtn" aria-label="Close modal">Close</button>
        </div>
        ${innerHTML}
      </div>
    </div>
  `;
  document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
  // click backdrop to close
  root.querySelector('.modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  });
}

function closeModal() {
  const root = document.getElementById('modalRoot');
  if (root) root.innerHTML = '';
}

// ========== Formatting helpers ==========

function fmtUSD(n) {
  return (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function toISODateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtDateISOToMDY(iso) {
  const [y, m, d] = (iso || '').split('-');
  return `${m}/${d}/${y}`;
}

/**
 * Compute period start/end based on cadence.
 * - weekly: from Monday of current week
 * - monthly: current month
 * - annual: current year
 */
function periodRange(cadence) {
  const now = new Date();
  let start, end;
  if (cadence === 'weekly') {
    const day = now.getDay(); // 0..6, Sun..Sat
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    start = new Date(now);
    start.setDate(now.getDate() + diffToMonday);
    start.setHours(0,0,0,0);
    end = new Date(start);
    end.setDate(start.getDate() + 7);
  } else if (cadence === 'annual') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear() + 1, 0, 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  return { start, end };
}

// ========== Reusable "Add Transaction" modal (used by dashboard & transactions) ==========

function openAddTxModal(onSaved) {
  const today = toISODateString(new Date());
  const options = SFT.CATEGORIES.map(c => `<option value="${c.key}">${c.label}</option>`).join('');
  openModal(`
    <div class="box">
      <h3>Add Expense</h3>
      <form id="addTxForm" class="row">
        <div class="box" style="flex:1 1 180px">
          <label>Amount (USD)</label>
          <input id="txAmount" type="number" step="0.01" class="input" placeholder="e.g., 12.50" required>
        </div>
        <div class="box" style="flex:1 1 180px">
          <label>Date</label>
          <input id="txDate" type="date" class="input" value="${today}" required>
        </div>
        <div class="box" style="flex:1 1 220px">
          <label>Category</label>
          <select id="txCategory" class="input">${options}</select>
        </div>
        <div class="box" style="flex:1 1 100%">
          <label>Description</label>
          <input id="txDesc" type="text" class="input" placeholder="Optional note">
        </div>
        <div class="box" style="flex:1 1 100%; display:flex; gap:8px; justify-content:flex-end">
          <button type="button" class="btn-secondary" id="cancelBtn">Cancel</button>
          <button type="submit" class="btn">Save</button>
        </div>
      </form>
    </div>
  `);
  document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('addTxForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = Number(document.getElementById('txAmount').value);
    const date = document.getElementById('txDate').value;
    const category = document.getElementById('txCategory').value;
    const description = document.getElementById('txDesc').value.trim();
    if (amount <= 0) return alert('Amount must be greater than 0');
    SFT.addTransaction({ amount, date, category, description });
    closeModal();
    if (onSaved) onSaved();
  });
}

// Initialize guard on DOM ready for protected pages
document.addEventListener('DOMContentLoaded', requireAuth);

// Simple global network indicator (listens to sft:net events from data layer)
(function initNetworkIndicator() {
  let overlay = null;
  function ensure() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sftBusy';
      overlay.style = 'position:fixed;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:9999;';
      overlay.innerHTML = '<div style="background:rgba(0,0,0,0.6);color:white;padding:12px 18px;border-radius:8px;pointer-events:auto;">Saving…</div>';
      document.body.appendChild(overlay);
      overlay.style.display = 'none';
    }
    return overlay;
  }

  let pending = 0;
  document.addEventListener('sft:net:start', () => {
    pending++;
    const el = ensure();
    el.style.display = 'flex';
  });
  document.addEventListener('sft:net:done', () => {
    pending = Math.max(0, pending - 1);
    if (pending === 0 && document.getElementById('sftBusy')) document.getElementById('sftBusy').style.display = 'none';
  });
  document.addEventListener('sft:net:error', (e) => {
    pending = Math.max(0, pending - 1);
    // show briefly an error toast
    const detail = e?.detail || {};
    const toast = document.createElement('div');
    toast.style = 'position:fixed;right:16px;bottom:16px;background:#b91c1c;color:white;padding:8px 12px;border-radius:6px;z-index:10000';
    toast.textContent = 'Network error — changes saved locally';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
    if (pending === 0 && document.getElementById('sftBusy')) document.getElementById('sftBusy').style.display = 'none';
  });
})();