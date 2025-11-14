const fs = require('fs');
const path = require('path');

function loadAuth(window) {
  const authSrc = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'auth.js'), 'utf8');
  // eslint-disable-next-line no-new-func
  return new Function('window', authSrc)(window);
}

describe('Auth front-end', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="loginForm">
        <input id="email" />
        <input id="password" />
        <button type="submit">Login</button>
      </form>
      <button id="demoBtn">Demo</button>
    `;
    window.localStorage.clear();
  });

  test('seedUsers populates sft_users and login form submits', () => {
    // Load auth (seedUsers runs immediately)
    loadAuth(window);
    const users = JSON.parse(window.localStorage.getItem('sft_users'));
    expect(Array.isArray(users)).toBe(true);

    // Fill form with demo credentials and submit
    document.getElementById('email').value = 'demo@studentfintrack.app';
    document.getElementById('password').value = 'demo123';
    // stub location
    delete window.location;
    window.location = { href: '' };

    // trigger submit
    const form = document.getElementById('loginForm');
    const ev = new Event('submit');
    form.dispatchEvent(ev);

    expect(window.localStorage.getItem('sft_currentUserEmail')).toBe('demo@studentfintrack.app');
    expect(window.location.href).toBe('dashboard.html');
  });

  test('demo button sets demo user and redirects', () => {
    loadAuth(window);
    delete window.location;
    window.location = { href: '' };
    const btn = document.getElementById('demoBtn');
    btn.click();
    expect(window.localStorage.getItem('sft_currentUserEmail')).toBe('demo@studentfintrack.app');
    expect(window.location.href).toBe('dashboard.html');
  });
});
