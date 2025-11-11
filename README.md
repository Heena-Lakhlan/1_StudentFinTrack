# StudentFinTrack

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