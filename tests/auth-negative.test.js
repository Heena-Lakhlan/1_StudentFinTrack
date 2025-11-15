const fs = require('fs');
const path = require('path');

function loadAuth(window) {
  const authSrc = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'auth.js'), 'utf8');
  // execute the script in the window so seedUsers and initLogin run
  return new Function('window', authSrc)(window);
}

function loadCommon(window) {
  const commonSrc = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'common.js'), 'utf8');
  // evaluate and return requireAuth
  // eslint-disable-next-line no-new-func
  return new Function('window', commonSrc + '\nreturn { requireAuth };')(window);
}

describe('Auth negative cases', () => {
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

  test('invalid login shows alert and does not set current user', () => {
    // load auth which seeds users and sets up listeners
    loadAuth(window);

    // mock alert
    const alerts = [];
    window.alert = (msg) => alerts.push(msg);

    document.getElementById('email').value = 'noone@example.com';
    document.getElementById('password').value = 'badpass';

    const ev = new Event('submit');
    document.getElementById('loginForm').dispatchEvent(ev);

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toMatch(/Invalid email or password/i);
    expect(window.localStorage.getItem('sft_currentUserEmail')).toBeNull();
  });

  test('requireAuth redirects unauthenticated pages to login', () => {
    // ensure no current user
    window.localStorage.removeItem('sft_currentUserEmail');
    // mock location
    delete window.location;
    window.location = { pathname: '/dashboard.html', href: '' };

    const { requireAuth } = loadCommon(window);
    requireAuth();

    expect(window.location.href).toBe('index.html');
  });
});
