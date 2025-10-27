#!/usr/bin/env bash
set -euo pipefail

# Deploy to Vercel non-interactively using the vercel CLI (via npx),
# capture the deployment URL from the CLI output, then poll /.health
# until it returns HTTP 200 or a timeout is reached.

VERCEL_TOKEN="${VERCEL_TOKEN:-}"
if [ -z "$VERCEL_TOKEN" ]; then
  echo "ERROR: VERCEL_TOKEN is not set. Set the repository secret and re-run the workflow." >&2
  exit 1
fi

echo "Installing vercel (via npx) and deploying..."

# Run vercel deploy non-interactively. Use --confirm to skip prompts.
# Capture both stdout and stderr because the CLI prints useful info to both.
out=$(npx vercel --prod --confirm --token "$VERCEL_TOKEN" 2>&1) || {
  echo "Vercel CLI failed:" >&2
  echo "$out" >&2
  exit 1
}

echo "Vercel CLI output:"
echo "$out"

# Extract the first https://... URL produced by the CLI output.
url=$(printf "%s\n" "$out" | grep -oE 'https://[^[:space:]]+' | head -n1 || true)

if [ -z "$url" ]; then
  echo "ERROR: could not extract deployment URL from vercel CLI output" >&2
  exit 1
fi

echo "Deployment URL: $url"

echo "Waiting for /.health to return 200 (timeout 150s)..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url/.health" || echo "000")
  echo "Attempt $attempt: HTTP $status"
  if [ "$status" = "200" ]; then
    echo "Health check passed"
    # set output for later workflow steps (deprecated syntax may warn in GH Actions but okay)
    echo "deployment_url=$url" >> $GITHUB_OUTPUT || true
    exit 0
  fi
  attempt=$((attempt+1))
  sleep 5
done

echo "Health check did not return 200 after $((max_attempts * 5)) seconds" >&2
exit 1
