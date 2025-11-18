# Configuration Management Report

Project: StudentFinTrack (web application)
Repository: https://github.com/Heena-Lakhlan/1_StudentFinTrack
Release tag created for this deliverable: `v1.0.0`

Prepared by: (your name)
Date: 2025-11-17

---

## 1. Introduction

This report documents the configuration management activities performed for the StudentFinTrack semester project. It explains how version control (Git/GitHub) was used, the branching and change control process, how releases were tagged, and how a submission (source ZIP + report) was produced.

## 2. Version Control System

- System used: Git (local) and GitHub (remote): https://github.com/Heena-Lakhlan/1_StudentFinTrack
- All source code, configuration files, test suites, and CI workflows are tracked in the repository.
- The repository contains the following important files and folders relevant to configuration management:
  - `package.json` — project manifest, scripts and dependencies
  - `prisma/` — Prisma schema and seed script
  - `public/` — front-end static files and JS modules
  - `server.js` and `server/` — Express server and database client wrapper
  - `.github/workflows/nodejs.yml` — CI workflow for tests and e2e
  - `.gitignore` — ignores runtime artifacts (`sessions/`, `dev.db`, etc.)

## 3. Branching and Change Control Process

The project follows a simple, formal change control process implemented using Git branches and pull requests (PRs):

1. Create a feature branch for each change (branch name prefixed with `feat/`, `fix/`, or `chore/`). Examples from this repo:
   - `feat/prisma-readme` — README and Prisma setup docs
   - `feat/persistent-session` — file-backed session store support
   - `chore/demo-hardening` — demo hygiene, security headers, UI network UX

2. Implement the change on the branch. Run local tests and validate behavior:
   - Unit & integration tests: `npm test` (Jest)
   - Playwright E2E tests: `npm run test:e2e` (ensure `npx playwright install --with-deps` is run first)

3. Push the branch to GitHub and open a Pull Request describing the change, testing performed, and any required reviewer notes.

4. Continuous Integration (GitHub Actions) runs automatically on the PR:
   - Installs dependencies
   - Ensures Prisma DB schema and seed are applied (`npx prisma db push` and `node prisma/seed.js`)
   - Runs Jest unit/integration tests and Playwright E2E tests

5. After CI passes and reviewers approve the PR, the branch is merged into `main` (the working baseline). This establishes a new working baseline.

6. If an issue is discovered after merge, a follow-up branch is created (e.g., `fix/…`) and the same process is used.

This process enforces review, CI verification, and traceability for each change introduced into the working baseline.

## 4. Release / Tagging Process

When a tested version of the software is ready for submission or deployment, the repository is tagged using Git's annotated tags. For this deliverable I created an annotated tag named `v1.0.0` that marks the working baseline used to produce the ZIP submission.

Commands used to create and push the tag (already executed):

```powershell
git tag -a v1.0.0 -m "Release v1.0.0 - config management deliverable"
git push origin v1.0.0
```

This tag is an immutable pointer to the exact commit that represents the released version. The ZIP submission shipped with this report was produced from this tag to ensure the exact code delivered is reproducible.

## 5. CI and Reproducibility

- CI workflow: `.github/workflows/nodejs.yml` installs dependencies, pushes Prisma schema, seeds the DB, runs Jest tests, installs Playwright browsers, and runs Playwright E2E. This guarantees the same verification steps run on PRs and merges.
- The repository includes `prisma/seed.js` to create a demo user so tests and E2E can run deterministically in CI.

## 6. Configuration Items (CIs) Tracked

The following items are treated as configuration items (part of the configuration baseline):
- Source code (frontend and backend)
- `package.json` (dependencies and scripts)
- Prisma schema (`prisma/schema.prisma`) and migration/seed scripts
- CI workflows (`.github/workflows/*`)
- Test suites (Jest & Playwright)
- Documentation (`README.md`, `DEMO.md`, this report)

## 7. Security & Secrets

- Secrets (session secrets, API keys) are not committed to the repository. The server reads `SESSION_SECRET` from environment variables. `.env` is ignored.
- Runtime artifacts (like `dev.db` and `sessions/`) are ignored via `.gitignore` to avoid leaking state or user data.

## 8. Rollback and Hotfix Process

- If a fault is discovered in `main`, the team should open a `fix/` branch from `main`, implement a hotfix, validate using the same test process, and open a PR. After CI + approval, merge the fix and create a new release tag (e.g., `v1.0.1`).
- If immediate rollback is needed, the previous release tag can be checked out and deployed.

## 9. Submission (ZIP) — what I provided

- A ZIP archive of the repository at tag `v1.0.0` was produced using Git and included with this deliverable. The file name in the workspace is:

```
studentfintrack_v1.0.0.zip
```

- The ZIP contains the repository content for the tagged release (excluding files ignored by `.gitignore`). It is suitable for submission to the instructor.

## 10. Evidence & Commands Run (selected)

Below are the main commands executed while preparing this configuration management deliverable (you can re-run these locally):

```powershell
# Standard development workflow (branch -> develop -> PR -> merge)
git checkout -b feat/prisma-readme
git add README.md
git commit -m "docs: add Prisma/SQLite dev setup and CI notes"
git push -u origin feat/prisma-readme

# Create release tag and push
git tag -a v1.0.0 -m "Release v1.0.0 - config management deliverable"
git push origin v1.0.0

# Produce ZIP from tag
git archive --format zip --output studentfintrack_v1.0.0.zip v1.0.0

# Run tests locally
npm install
npx prisma generate
npx prisma db push --accept-data-loss
node prisma/seed.js
npm test
npx playwright install --with-deps
npm run test:e2e
```

## 11. How the instructor can access the code

- Repository URL: https://github.com/Heena-Lakhlan/1_StudentFinTrack
- A tagged release `v1.0.0` exists and the ZIP `studentfintrack_v1.0.0.zip` is included in the project workspace. You may also review the PRs used during development on GitHub for a trace of changes.

## 12. Conclusion

This configuration management approach enforces traceability, reproducibility, and a formal change control process using standard Git/GitHub practices (branching, PRs, CI verification, and release tagging). The archived ZIP and the `v1.0.0` tag provide a reproducible submission for grading.

---

If you want, I can produce a short one-page handout summarizing the steps to reproduce and explain the change control process for presentations.
