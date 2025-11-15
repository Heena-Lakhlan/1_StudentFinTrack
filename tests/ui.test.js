const fs = require('fs');
const path = require('path');

function loadCommon(window) {
  const commonSrc = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'common.js'), 'utf8');
  // eslint-disable-next-line no-new-func
  const run = new Function('window', commonSrc + '\nreturn { renderNavbar, getCurrentUser };');
  return run(window);
}

describe('UI - navbar', () => {
  beforeEach(() => {
    // create a minimal DOM for navbar
    document.body.innerHTML = '<div id="navbar"></div>';
    window.localStorage.clear();
    window.localStorage.setItem('sft_users', JSON.stringify([{ email: 'demo@studentfintrack.app', name: 'Demo User' }]));
    window.localStorage.setItem('sft_currentUserEmail', 'demo@studentfintrack.app');
  });

  test('renderNavbar injects user info and links', () => {
    const { renderNavbar } = loadCommon(window);
    renderNavbar('dashboard');
    const nav = document.getElementById('navbar');
    expect(nav).toBeTruthy();
    const html = nav.innerHTML;
    expect(html).toMatch(/Demo User/);
    expect(html).toMatch(/Dashboard/);
    expect(html).toMatch(/Logout/);
  });

  test('logout clears current user and redirects', () => {
    const { renderNavbar } = loadCommon(window);
    renderNavbar('dashboard');
    // ensure logout button exists
    const logout = document.getElementById('logoutBtn');
    expect(logout).toBeTruthy();
    // stub location
    delete window.location;
    window.location = { href: '' };
    logout.click();
    expect(window.localStorage.getItem('sft_currentUserEmail')).toBeNull();
    expect(window.location.href).toBe('index.html');
  });
});
