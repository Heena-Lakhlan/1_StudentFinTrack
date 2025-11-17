/**
 * Optional Node/Express server for serving static files.
 * The app also works if you just open public/index.html directly or host statically.
 * This server does NOT store data; all data is saved in browser LocalStorage per user.
 */
const express = require('express');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
// Prisma client
let prisma;
try {
  prisma = require('./server/db');
} catch (e) {
  // prisma might not be installed in environments where we only run frontend tests
  prisma = null;
}

// Demo in-memory users for optional session endpoints (not required for front-end functionality)
const users = [
  { email: 'demo@studentfintrack.app', password: 'demo123', name: 'Demo User' },
  { email: 'alex@studentfintrack.app', password: 'alex123', name: 'Alex Johnson' },
  { email: 'sam@studentfintrack.app', password: 'sam123', name: 'Sam Lee' }
];

// Basic security headers
app.use(helmet());

// Limit request body size to guard against large payloads
app.use(express.json({ limit: '10kb' }));

// Simple rate limiter for API routes
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', apiLimiter);
// Try to use a persistent file-backed session store when available. This
// improves demo / CI behavior and avoids in-memory sessions being lost when
// the server process restarts. If `session-file-store` is not installed the
// code will fall back to the default in-memory store.
let sessionStore = null;
try {
  const FileStoreFactory = require('session-file-store');
  const FileStore = FileStoreFactory(session);
  sessionStore = new FileStore({ path: path.join(__dirname, 'sessions'), retries: 1 });
} catch (e) {
  // session-file-store not installed or available; fall back to MemoryStore
  sessionStore = null;
}

// Session secret handling: prefer environment variable in non-dev environments
const sessSecret = process.env.SESSION_SECRET || 'sft_local_secret_change_me';
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET is required in production');
}

app.use(session({
  store: sessionStore || undefined,
  secret: sessSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: (process.env.NODE_ENV === 'production'),
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Minimal auth endpoints (front-end works without calling these)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const u = users.find(x => x.email === (email || '').toLowerCase() && x.password === password);
  if (!u) return res.status(401).json({ ok: false, message: 'Invalid credentials' });
  // set session user (keep backward-compatibility with LocalStorage demo flows)
  req.session.user = { email: u.email, name: u.name };
  // also set helper fields used by Prisma-backed endpoints
  req.session.userEmail = u.email;
  req.session.userName = u.name;
  res.json({ ok: true, user: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Protected endpoint to return current session user (for integration tests / API-driven auth)
app.get('/api/me', (req, res) => {
  if (!req.session || !req.session.user) return res.status(401).json({ ok: false, message: 'Unauthenticated' });
  res.json({ ok: true, user: req.session.user });
});

// Example protected data endpoint used by integration tests and to demo server-driven APIs
app.get('/api/protected', (req, res) => {
  if (!req.session || !req.session.user) return res.status(401).json({ ok: false, message: 'Unauthenticated' });
  // Return some demo JSON payload
  res.json({ ok: true, data: { secret: 'this-is-protected', timestamp: Date.now() } });
});

// Helper to fetch (or create) a Prisma user record from session
async function getUserFromSession(req) {
  if (!prisma) return null;
  const email = req.session?.userEmail || req.session?.user?.email;
  const name = req.session?.userName || req.session?.user?.name;
  if (!email) return null;
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, name } });
  }
  return user;
}

// Transactions CRUD (server-backed). These endpoints are only active when Prisma is available.
if (prisma) {
  // Small helper to validate transaction payloads
  function validateTxPayload(body) {
    const errors = [];
    if (body.amount == null || Number.isNaN(Number(body.amount)) || Number(body.amount) <= 0) errors.push('amount');
    if (!body.date) errors.push('date');
    if (!body.category) errors.push('category');
    return errors;
  }
  app.get('/api/transactions', async (req, res) => {
    try {
      const user = await getUserFromSession(req);
      if (!user) return res.status(401).json({ ok: false, message: 'Unauthenticated' });
      const { start, end } = req.query;
      const where = { userId: user.id };
      if (start || end) {
        where.date = {};
        if (start) where.date.gte = new Date(start);
        if (end) where.date.lte = new Date(end);
      }
      const txs = await prisma.transaction.findMany({ where, orderBy: { date: 'desc' } });
      res.json({ ok: true, data: txs });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, message: 'Server error' });
    }
  });

  app.post('/api/transactions', async (req, res) => {
    try {
      const user = await getUserFromSession(req);
      if (!user) return res.status(401).json({ ok: false, message: 'Unauthenticated' });
      const { amount, date, category, description } = req.body || {};
      const errs = validateTxPayload(req.body || {});
      if (errs.length) return res.status(400).json({ ok: false, message: 'Invalid fields', fields: errs });
      const tx = await prisma.transaction.create({ data: { userId: user.id, amount: Number(amount), date: new Date(date), category, description: description || '' } });
      res.status(201).json({ ok: true, tx });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, message: 'Server error' });
    }
  });

  app.put('/api/transactions/:id', async (req, res) => {
    try {
      const user = await getUserFromSession(req);
      if (!user) return res.status(401).json({ ok: false, message: 'Unauthenticated' });
      const id = Number(req.params.id);
      const existing = await prisma.transaction.findUnique({ where: { id } });
      if (!existing || existing.userId !== user.id) return res.status(404).json({ ok: false, message: 'Not found' });
      const data = {};
      if (req.body.amount != null) data.amount = Number(req.body.amount);
      if (req.body.date) data.date = new Date(req.body.date);
      if (req.body.category) data.category = req.body.category;
      if (req.body.description != null) data.description = req.body.description;
      // If amount or date or category present, validate basics
      if (Object.keys(data).length === 0) return res.status(400).json({ ok: false, message: 'No fields to update' });
      const updated = await prisma.transaction.update({ where: { id }, data });
      res.json({ ok: true, tx: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, message: 'Server error' });
    }
  });

  app.delete('/api/transactions/:id', async (req, res) => {
    try {
      const user = await getUserFromSession(req);
      if (!user) return res.status(401).json({ ok: false, message: 'Unauthenticated' });
      const id = Number(req.params.id);
      const existing = await prisma.transaction.findUnique({ where: { id } });
      if (!existing || existing.userId !== user.id) return res.status(404).json({ ok: false, message: 'Not found' });
      await prisma.transaction.delete({ where: { id } });
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, message: 'Server error' });
    }
  });
}

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