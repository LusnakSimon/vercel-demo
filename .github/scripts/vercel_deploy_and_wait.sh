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
out=$(npx vercel --prod --yes --token "$VERCEL_TOKEN" 2>&1) || {
  echo "Vercel CLI failed:" >&2
  echo "$out" >&2
  exit 1
}

echo "Vercel CLI output:"
echo "$out"

# Prefer the 'Production:' URL line if present, otherwise prefer any vercel.app URL, otherwise the last https:// URL
url=$(printf "%s\n" "$out" | sed -n 's/^Production:[[:space:]]*//p' | head -n1 || true)
if [ -z "$url" ]; then
  url=$(printf "%s\n" "$out" | grep -oE 'https://[^[:space:]]+' | grep -E '\.vercel\.app|vercel\.dev' | tail -n1 || true)
fi
if [ -z "$url" ]; then
  url=$(printf "%s\n" "$out" | grep -oE 'https://[^[:space:]]+' | tail -n1 || true)
fi

if [ -z "$url" ]; then
  echo "ERROR: could not extract deployment URL from vercel CLI output" >&2
  exit 1
fi

echo "Deployment base URL: $url"

# Try both /.health and /api/health (some projects expose health at /api/health)
echo "Waiting for health endpoints to return 200 (timeout 300s)..."
# Give Vercel a short propagation window before the first health check
sleep 10
max_attempts=60
attempt=1
while [ $attempt -le $max_attempts ]; do
  for path in "/.health" "/api/health"; do
    full="$url$path"
    status=$(curl -s -o /dev/null -w "%{http_code}" "$full" || echo "000")
    echo "Attempt $attempt: GET $full -> HTTP $status"
    if [ "$status" = "200" ]; then
      echo "Health check passed at $full"
      echo "deployment_url=$url" >> $GITHUB_OUTPUT || true
      echo "health_path=$path" >> $GITHUB_OUTPUT || true
      exit 0
    fi
  done
  # If we got HTTP 000, print diagnostic info once per attempt to help debug networking/DNS issues
  if [ "$status" = "000" ]; then
    echo "--- Diagnostic: HTTP 000 detected for $url on attempt $attempt ---"
    # extract hostname
    host=$(printf '%s\n' "$url" | sed -E 's#https?://([^/]+).*#\1#')
    echo "Hostname: $host"
    if command -v getent >/dev/null 2>&1; then
      echo "getent hosts output:"
      getent hosts "$host" || true
    fi
    if command -v nslookup >/dev/null 2>&1; then
      echo "nslookup output:"
      nslookup "$host" || true
    fi
    if command -v dig >/dev/null 2>&1; then
      echo "dig output:"
      dig +short "$host" || true
    fi
    echo "Curl verbose output (attempting IPv4 then IPv6):"
    echo "--- curl --ipv4 -v $url/.health ---"
    curl --ipv4 -v --max-time 10 "$url/.health" || true
    echo "--- curl --ipv6 -v $url/.health ---"
    curl --ipv6 -v --max-time 10 "$url/.health" || true
    echo "--- end diagnostics ---"
  fi
  attempt=$((attempt+1))
  sleep 5
done

echo "Health check did not return 200 after $((max_attempts * 5)) seconds" >&2
exit 1
