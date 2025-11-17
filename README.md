# StudentFinTrack

[![CI](https://github.com/Heena-Lakhlan/1_StudentFinTrack/actions/workflows/nodejs.yml/badge.svg?branch=main)](https://github.com/Heena-Lakhlan/1_StudentFinTrack/actions)

This repository contains the StudentFinTrack demo web application. It is a vanilla HTML/CSS/JS multi-page app that stores data in the browser LocalStorage. A minimal Express server is included for serving static files and providing demo auth endpoints.

Quick setup

1. Install dependencies:

```powershell
npm install
```

2. Run tests:

```powershell
npm test
```

3. Start the app locally:

```powershell
npm start
# then open http://localhost:3000
```

Create a GitHub repository and push

1. Create a new (empty) repo on GitHub via the website.
2. From this project folder run:

```powershell
git init
git add .
git commit -m "Initial commit - StudentFinTrack"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

CI

A GitHub Actions workflow is included to run tests on push.

Notes

- Tests use Jest with the jsdom environment for browser-like tests and supertest for server integration tests.
- The app stores data in LocalStorage and will work without the server if you open `public/index.html` directly.

Prisma / Local SQLite (server-driven transactions)
----------------------------------------------

This project includes a small server-backed data layer using Prisma + SQLite to persist transactions for the demo user. The setup below is useful for local development and CI (no cloud services required).

1. Install dependencies (PowerShell):

```powershell
npm install
```

2. Generate Prisma client:

```powershell
npx prisma generate
```

3. Apply the schema to the local SQLite file and create `dev.db`:

```powershell
npx prisma db push --accept-data-loss
```

4. Seed the demo user (required so server endpoints accept demo login):

```powershell
node prisma/seed.js
```

5. Run the test suite (Jest) and E2E (Playwright):

```powershell
npm test           # runs Jest unit/integration tests
npm run test:e2e   # runs Playwright E2E (will start server.js automatically)
```

6. Reset DB (if needed):

```powershell
npm run db:reset
```

Notes
- CI already runs `npx prisma db push` and `node prisma/seed.js` before both unit tests and Playwright e2e so the GitHub Actions environment will have the schema and seed applied.
- The client contains an idempotent `migrateLocalToServer()` helper (in `public/js/data.js`) that will POST LocalStorage transactions to `/api/transactions` after a successful server login (see `public/js/auth.js`). The app will continue to work offline using LocalStorage as a fallback.
- For production usage replace the in-memory session store with a persistent session store (Redis / DB-backed). This demo keeps an in-memory store for simplicity.
 - The demo server will now use a file-backed session store when the `session-file-store` package is installed. This stores session files under the `sessions/` directory and is a lightweight option for development or small demos.
	 - To enable persistent sessions locally, install dependencies (already included in package.json) and set a secret if you prefer:

```powershell
npm install
# optional: export a secret
$env:SESSION_SECRET = 'change-me-to-a-strong-secret'
node server.js
```

Note: For production use a networked store such as Redis (via `connect-redis`) or a database-backed store.