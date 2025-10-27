# Build and run (minimal instructions)

This document describes how to build and run the minimal TODO app and how to run local checks used for verification.

Prerequisites
- Node.js >=16
- npm
- (Optional) Azure CLI + Bicep for infra deploy

Run app locally (mocked/no-Azure) — quick:

1. Install dependencies

```bash
cd app/todo
npm ci
```

2. Run tests (unit tests use mocked Azure SDKs)

```bash
npm test
```

3. To run the app against real Azure Storage (requires managed identity or credentials):

```bash
export STORAGE_ACCOUNT=<your-storage-account-name>
export PORT=8080
node index.js
```

Free/demo deployment notes
- The repository's Bicep template has been modified to use Azure's free App Service tier (F1) and to disable Application Insights and Storage usage so the deployment can be run with minimal/no cost for a school demo.
- The app is configured with the `LOCAL_MODE=true` app setting in `main.bicep`. This makes the app use a local file-backed store instead of Azure Storage. Data stored this way is ephemeral and may be lost on app restarts; it's appropriate for demos and grading but not for production.

Notes on infra
- To validate the Bicep template locally you can run (if `bicep` CLI is installed):

```bash
bicep --version
bicep build main.bicep
```

CI
- The GitHub Actions workflow `.github/workflows/deploy-bicep-and-app.yml` now runs the app unit tests before packaging and deploying the app.

Vercel (recommended, truly free for hobby/demo)
- This repo now contains Vercel serverless endpoints at `/api/todos` and `/api/health` plus a `vercel.json` that routes `/todos` and `/.health` to the functions.
- To deploy on Vercel (no Azure required):
	1. Go to https://vercel.com and sign up (free) and connect your GitHub account.
	2. Import this repository into Vercel (Add New Project → Import Git Repository). Vercel will detect Node and deploy automatically.
	3. After deployment your app will be available at `https://<your-project>.vercel.app/todos` and `https://<your-project>.vercel.app/.health`.

Notes:
- Vercel provides a free tier suitable for school demos. The endpoints use a local file-backed store (`todos.local.json`) so persistence is ephemeral (resets on redeploys).
- If you prefer a GitHub Action deployment to Vercel instead of the dashboard, I can add one that uses a `VERCEL_TOKEN` secret.

GitHub Action deployment with `VERCEL_TOKEN`
- This repository includes a workflow `.github/workflows/deploy-vercel.yml` which runs tests and deploys to Vercel using a `VERCEL_TOKEN` repository secret.
- To create a Vercel token:
	1. Sign in to https://vercel.com.
	2. In the dashboard, open Settings → Tokens (or visit https://vercel.com/account/tokens) and create a Personal Token.
	3. Copy the token value (it will only be shown once).
- To add the token to GitHub:
	1. Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret.
	2. Name it `VERCEL_TOKEN` and paste the token value.
- Once the secret is set you can trigger the `Deploy to Vercel` workflow from the Actions tab or by pushing to `main`.
