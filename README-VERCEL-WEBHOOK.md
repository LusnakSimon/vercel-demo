Vercel -> GitHub dispatch webhook bridge

Overview

This repo includes a small serverless function at `api/webhook-forwarder.js` which accepts Vercel project webhooks and forwards them to GitHub as a `repository_dispatch` event. Use this if you want an event-driven post-deploy workflow in GitHub rather than polling Vercel from your Actions job.

Setup steps

1) Create a GitHub Personal Access Token (classic)
   - Scopes: `repo` (or at least repository dispatch and status permissions). Save this token somewhere.

2) Configure Vercel environment variables for the project
   - `GITHUB_PAT` = the GitHub personal access token created above
   - `GITHUB_REPOSITORY` = owner/repo (optional; defaults to the current repo)
   - `VERCEL_WEBHOOK_SECRET` = a secret string of your choice

3) Add a Vercel Project Webhook
   - Go to your Vercel project → Settings → Git → Webhooks (or Project Settings → Webhooks)
   - Add a new webhook with the URL: `https://<your-project>.vercel.app/api/webhook-forwarder`
   - Paste the same secret you set in `VERCEL_WEBHOOK_SECRET` into the Vercel webhook secret field.
   - Select events you want to forward (deployments). Save.

4) Add the GitHub Actions workflow (already in this repo)
   - The workflow `.github/workflows/post-deploy-dispatch.yml` listens for repository_dispatch with `event_type: vercel_deployment` and runs health checks.

Security notes

- The forwarding function verifies the Vercel webhook signature (if the webhook provides `x-vercel-signature` header) using `VERCEL_WEBHOOK_SECRET`.
- `GITHUB_PAT` must be kept secret. We recommend using the Vercel project environment variables UI to store it.

Limitations

- The serverless forwarder runs on Vercel and therefore needs the `GITHUB_PAT` to be available in the Vercel environment — that token can trigger actions on your GitHub repo, so scope it tightly and rotate regularly.

Troubleshooting

- If the forwarder responds with errors, inspect Vercel function logs and GitHub webhook delivery logs.

*** End of file
