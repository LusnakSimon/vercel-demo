# Submission checklist (map to assignment requirements)

This file documents how the `vercel-demo` repository meets common semester-assignment requirements. Use this as evidence when preparing your submission.

1. Source code
   - Location: repository root and `api/` and `public/`.
   - Files: `api/todos.js`, `api/health.js`, `api/webhook-forwarder.js`, `public/index.html`.

2. Deployment manifest / Infrastructure
   - Location: `main.bicep` at the workspace root (useful if you must submit IaC). For the demo we also provide a Vercel deployment path (`vercel.json`).

3. CI / automated tests
   - Deployment workflow: `.github/workflows/deploy-vercel.yml` (deploys to Vercel).
   - Smoke-test workflow: `.github/workflows/smoke-test.yml` — performs a quick GET against the deployed `/api/health` endpoint.

4. Health endpoint
   - Location: `api/health.js` — returns HTTP 200 and JSON `{ "status": "ok" }`.

5. Demo UI
   - A minimal interactive client is available at the site root: `public/index.html`. It exercises the `/api/todos` API (GET/POST) and falls back to `localStorage` if the API is unreachable.

6. Documentation
   - `README.md` and `BUILD_AND_RUN.md` contain deployment and running instructions. `README-VERCEL-WEBHOOK.md` explains the optional webhook forwarder.

7. Verifiable deployment evidence
   - The smoke-test workflow (`.github/workflows/smoke-test.yml`) will verify the deployed `VERCEL_URL` (set this as a repository secret) and fail if the health endpoint does not return 200 with the expected JSON.
   - Alternatively, include a screenshot of the `/api/health` response or the CI Actions log showing a successful smoke test.

8. Grading notes & assumptions
   - This demo uses a file-backed store for todos (ephemeral) and is intentionally low-cost/free for grading. If your assignment requires persistent storage, replace the in-memory/file store with Azure Storage or a managed DB and update `main.bicep` accordingly.
      - Persistent storage: this repo now includes optional MongoDB Atlas integration. Add your Atlas connection string to Vercel as `STORAGE_MONGODB_URI` (or `MONGODB_URI`) and set `JWT_SECRET` to enable authentication. A seed script is available at `scripts/seed.js` to populate sample users, projects and todos.
   - If the assignment requires authentication, add an auth layer (OIDC or token-based) and document how to obtain credentials.

If you'd like, I can produce a small zip with the above artifacts and a short write-up mapping PDF line-by-line to files in this repo. Tell me which exact items in the PDF you must demonstrate and I will add explicit evidence (logs, screenshots, or additional tests).
