#!/usr/bin/env bash
# Deploy/update the Next.js site on the VPS. Run it ON the server:
#
#   cd /var/www/crewapply-web && ./deploy/deploy.sh
#
# Deliberately the same shape as the backend and admin one-liners already in
# use, with the differences those two do not have:
#
#  · NOT `--omit=dev`. The backend can drop devDependencies because it only
#    runs; this has to BUILD, and tailwindcss, @tailwindcss/postcss and
#    babel-plugin-react-compiler are all devDependencies. Omitting them fails
#    the build, and the error points at PostCSS rather than at the flag.
#  · `npm ci`, not `npm install` — installs exactly the lockfile, so a deploy
#    cannot silently pick up a new minor of Next that was never tested.
#  · pm2 reload, not restart: reload waits for the new process to be listening
#    before retiring the old one, so a deploy does not drop requests.
set -euo pipefail

cd "$(dirname "$0")/.."
echo "▸ $(pwd)"

git pull

# The build reads .env.production and BAKES NEXT_PUBLIC_API_URL into the client
# bundle. If it is missing, app.constants.js falls back to localhost:5000 and
# every visitor's browser calls a machine that is not the server — a site that
# builds, deploys and serves perfectly while nothing on it works. Cheap to check,
# expensive to debug.
if [ ! -f .env.production ]; then
  echo "✗ .env.production is missing — the build would bake in the localhost API URL." >&2
  exit 1
fi

# .env.local OUTRANKS .env.production in Next, in every environment except test.
# So a stray one — copied over while debugging, left behind by a manual run —
# silently wins and the build ships pointing at localhost even though
# .env.production is sitting right there and correct. It is gitignored, so a
# clean clone never has one; this catches the case where something put it there.
if [ -f .env.local ]; then
  echo "✗ .env.local exists and takes priority over .env.production in Next." >&2
  echo "  It would override NEXT_PUBLIC_API_URL. Remove or rename it, then re-run." >&2
  exit 1
fi

npm ci
npm run build

# Assert rather than assume. Everything above can succeed and still produce a
# bundle whose API calls go to the wrong host — the failure only shows up in a
# visitor's browser, as every request failing at once. This is the cheapest place
# to catch it, and it fails the deploy instead of the site.
expected=$(grep -E '^NEXT_PUBLIC_API_URL=' .env.production | cut -d= -f2-)
if ! grep -rqF "$expected" .next/static 2>/dev/null; then
  echo "✗ '$expected' is not in the built client bundle — the API URL did not bake in." >&2
  exit 1
fi
echo "✓ client bundle points at $expected"

# Start on first deploy, reload on every one after.
if pm2 describe crewapply-web >/dev/null 2>&1; then
  pm2 reload crewapply-web --update-env
else
  pm2 start ecosystem.config.cjs
  pm2 save
fi

# Prove it is actually serving before claiming success — pm2 reporting "online"
# only means the process started, not that Next is answering.
sleep 2
code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ || echo 000)
if [ "$code" = "200" ] || [ "$code" = "307" ] || [ "$code" = "308" ]; then
  echo "✓ crewapply-web is serving on :3000 (HTTP $code)"
else
  echo "✗ :3000 answered HTTP $code — check: pm2 logs crewapply-web --lines 50" >&2
  exit 1
fi
