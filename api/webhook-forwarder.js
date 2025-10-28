// Simple Vercel Serverless function to forward Vercel deployment webhooks
// to GitHub as a repository_dispatch event so a GitHub Actions workflow
// can run post-deploy checks.
//
// Setup required from you (instructions in README.md):
// 1. Create a GitHub Personal Access Token (classic) with `repo` and `repo:status` scopes
//    or at least `repo` and `statuses:write` as needed. Save it as a Vercel env var
//    named GITHUB_PAT in your Vercel project.
// 2. Add a project webhook in Vercel that points to:
//    https://<your-project>.vercel.app/api/webhook-forwarder
//    and set a secret (any string). Save the same secret in Vercel env var
//    VERCEL_WEBHOOK_SECRET (so the function can validate payloads if provided).
// 3. Add a GitHub Actions workflow that listens for repository_dispatch with
//    event_type `vercel_deployment` (example workflow is included in .github/workflows/).

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const secret = process.env.VERCEL_WEBHOOK_SECRET || '';
  const githubPat = process.env.GITHUB_PAT || '';
  if (!githubPat) {
    console.error('GITHUB_PAT is not configured in Vercel environment variables');
    res.status(500).json({ error: 'GITHUB_PAT not configured' });
    return;
  }

  const rawBody = await getRawBody(req);
  // Vercel webhooks may send an HMAC signature in `x-vercel-signature` (sha256)
  const sigHeader = req.headers['x-vercel-signature'] || req.headers['x-vercel-signature-256'] || '';
  if (secret && sigHeader) {
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (!timingSafeEqual(expected, sigHeader)) {
      console.error('Invalid Vercel webhook signature', { expected, got: sigHeader });
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch (e) {
    console.warn('Failed to parse JSON payload, forwarding raw body');
    payload = { raw: rawBody.toString('utf8') };
  }

  // Build a lightweight dispatch payload with useful fields
  const client_payload = {
    event: payload.event || payload.type || 'vercel.deployment',
    projectId: payload.projectId || payload.project?.id || null,
    deploymentId: payload.deploymentId || payload.deployment?.id || null,
    url: payload.url || payload.deployment?.url || null,
    payload,
  };

  // Configure the target repo (dispatches the event to the same repo that hosts this code)
  // You can change these environment variables in Vercel if you want to dispatch to a
  // different repo/org.
  const repo = process.env.GITHUB_REPO || process.env.GITHUB_REPOSITORY || 'LusnakSimon/vercel-demo';
  const [owner, repoName] = repo.split('/');

  const ghUrl = `https://api.github.com/repos/${owner}/${repoName}/dispatches`;

  const body = {
    event_type: 'vercel_deployment',
    client_payload,
  };

  try {
    const r = await fetch(ghUrl, {
      method: 'POST',
      headers: {
        Authorization: `token ${githubPat}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'vercel-webhook-forwarder',
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('GitHub dispatch failed', r.status, text);
      res.status(502).json({ error: 'GitHub dispatch failed', status: r.status, text });
      return;
    }
  } catch (err) {
    console.error('Failed to call GitHub dispatch API', err);
    res.status(502).json({ error: 'Failed to call GitHub API' });
    return;
  }

  res.status(200).json({ ok: true });
}

function timingSafeEqual(a, b) {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (e) {
    return false;
  }
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
