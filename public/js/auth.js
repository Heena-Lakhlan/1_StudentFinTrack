/**
 * Handles login + demo seeding + forgot password (simulated).
 * Data is stored in LocalStorage for demo purposes.
 */

// Seed demo users on first run
(function seedUsers() {
  if (!localStorage.getItem('sft_users')) {
    const users = [
      { email: 'demo@studentfintrack.app', password: 'demo123', name: 'Demo User' },
      { email: 'alex@studentfintrack.app', password: 'alex123', name: 'Alex Johnson' },
      { email: 'sam@studentfintrack.app', password: 'sam123', name: 'Sam Lee' }
    ];
    localStorage.setItem('sft_users', JSON.stringify(users));
  }
})();

(function initLogin() {
  const form = document.getElementById('loginForm');
  const demoBtn = document.getElementById('demoBtn');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const users = JSON.parse(localStorage.getItem('sft_users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return alert('Invalid email or password.');

    // Remember current user
    localStorage.setItem('sft_currentUserEmail', found.email);
    ensureUserStores(found.email);
    location.href = 'dashboard.html';
  });

  demoBtn?.addEventListener('click', () => {
    const email = 'demo@studentfintrack.app';
    const pass = 'demo123';
    const users = JSON.parse(localStorage.getItem('sft_users') || '[]');
    const found = users.find(u => u.email === email && u.password === pass);
    if (found) {
      localStorage.setItem('sft_currentUserEmail', found.email);
      ensureUserStores(found.email);
      location.href = 'dashboard.html';
    }
  });

  // Ensure per-user storage buckets exist
  function ensureUserStores(email) {
    const k = (suffix) => `sft_${email}_${suffix}`;
    if (!localStorage.getItem(k('transactions'))) localStorage.setItem(k('transactions'), JSON.stringify([]));
    if (!localStorage.getItem(k('budgets'))) localStorage.setItem(k('budgets'), JSON.stringify({ cadence: 'monthly', totalBudget: 1200, categoryBudgets: {} }));
    if (!localStorage.getItem(k('friends'))) localStorage.setItem(k('friends'), JSON.stringify(['Alex', 'Sam']));
    if (!localStorage.getItem(k('shared'))) localStorage.setItem(k('shared'), JSON.stringify([]));
    if (!localStorage.getItem(k('goals'))) localStorage.setItem(k('goals'), JSON.stringify([]));
  }
})();