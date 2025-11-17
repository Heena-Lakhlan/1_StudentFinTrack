# Demo checklist

Quick steps to run the app locally for a demo (assumes Node.js installed):

1. Install dependencies

```powershell
npm install
```

2. Generate Prisma client and apply schema

```powershell
npx prisma generate
npx prisma db push --accept-data-loss
```

3. Seed demo user

```powershell
node prisma/seed.js
```

4. Start the server

```powershell
# optional: set a session secret
$env:SESSION_SECRET = 'a-strong-secret'
node server.js
# open http://localhost:3000
```

5. Run tests

```powershell
npm test         # Jest
npm run test:e2e # Playwright
```

Troubleshooting
- If Playwright E2E fails locally, ensure browsers are installed:

```powershell
npx playwright install --with-deps
```

- If sessions are not persistent between restarts, ensure `session-file-store` is installed and `sessions/` directory is writable.
- Do not commit `dev.db` or `sessions/` to the repo; they are included in `.gitignore`.
