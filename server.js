/**
 * Optional Node/Express server for serving static files.
 * The app also works if you just open public/index.html directly or host statically.
 * This server does NOT store data; all data is saved in browser LocalStorage per user.
 */
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// Demo in-memory users for optional session endpoints (not required for front-end functionality)
const users = [
  { email: 'demo@studentfintrack.app', password: 'demo123', name: 'Demo User' },
  { email: 'alex@studentfintrack.app', password: 'alex123', name: 'Alex Johnson' },
  { email: 'sam@studentfintrack.app', password: 'sam123', name: 'Sam Lee' }
];

app.use(express.json());
app.use(session({
  secret: 'sft_local_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Minimal auth endpoints (front-end works without calling these)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const u = users.find(x => x.email === (email || '').toLowerCase() && x.password === password);
  if (!u) return res.status(401).json({ ok: false, message: 'Invalid credentials' });
  req.session.user = { email: u.email, name: u.name };
  res.json({ ok: true, user: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to login
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;

// Export the app for tests (supertest) and also start the server when run directly
module.exports = app;

if (require.main === module) {
  app.listen(port, () => console.log(`StudentFinTrack running at http://localhost:${port}`));
}