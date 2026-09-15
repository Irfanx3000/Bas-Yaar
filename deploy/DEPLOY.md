# Deploying crewapply.com to the VPS

Server `200.141.6.212`, alongside the API (`crewapply-api`) and the admin panel.

## Read this first — two things are not what they look like

**1. crewapply.com is not on this server today. It is on Vercel.**

```
crewapply.com      → 216.198.79.1   (Vercel — the demo site)
api.crewapply.com  → 200.141.6.212  (the VPS, already serving the API)
```

Everything below prepares the VPS to serve the site, but the site will not
appear at crewapply.com until the **DNS A record is repointed** from Vercel to
`200.141.6.212`. That is done in the DNS provider's panel, not on the server, and
it is the last step on purpose — do it once the VPS is verified working, so the
cutover is a switch rather than a gamble.

Nothing needs deleting on Vercel. Repointing DNS is enough, and leaving the
Vercel project intact means reverting is a one-record change.

**2. The API will reject the new site until `ALLOWED_ORIGINS` is updated.**

The backend builds its CORS allow-list from that variable
(`src/config/index.js`), and right now `https://crewapply.com` is not on it —
verified live, a preflight from that origin gets `500`. Until this is fixed the
site loads and every single API call fails.

```bash
# on the server
nano /var/www/CrewApply-backend/.env
#   ALLOWED_ORIGINS=https://crewapply.com,https://www.crewapply.com,<whatever is already there>
pm2 reload crewapply-api --update-env
```

Keep the existing entries. Removing the Vercel origin breaks the demo site while
DNS is still pointing at it.

---

## First deploy

```bash
ssh root@200.141.6.212
```

### 1. Node

Next 16 needs Node 20+. The API may be on something older, so check before
assuming — and if you upgrade, restart the API too.

```bash
node -v
```

### 2. Clone

```bash
mkdir -p /var/log/pm2
cd /var/www
git clone https://github.com/Irfanx3000/Bas-Yaar.git crewapply-web
cd crewapply-web
```

If the repo is private, this prompts for credentials. Use a **deploy key**
(read-only, per-repo) rather than a personal token in the remote URL — a token in
`.git/config` is readable by anything that can read the directory:

```bash
ssh-keygen -t ed25519 -f /root/.ssh/crewapply-web -N ""
cat /root/.ssh/crewapply-web.pub     # add to GitHub → repo → Settings → Deploy keys
git clone git@github.com:Irfanx3000/Bas-Yaar.git crewapply-web
```

### 3. Build and start

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

`.env.production` is committed, so `NEXT_PUBLIC_API_URL` is already correct and
the script refuses to build without it. It ends by proving `:3000` answers rather
than trusting pm2's "online".

If the build is killed with no error, the box ran out of memory — Next builds are
the heaviest thing that will run on it. Add swap and retry:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 4. nginx, then the certificate

Order matters: the TLS block references certificate files that do not exist yet.

```bash
# TLS settings are ours, not certbot's — copy the snippet first or nginx -t
# fails on a missing include.
mkdir -p /etc/nginx/snippets
cp deploy/nginx/snippets/crewapply-tls.conf /etc/nginx/snippets/

# a) port-80 block only, so certbot can answer its own challenge
cp deploy/nginx/crewapply.com.conf /etc/nginx/sites-available/crewapply.com
# comment out both `listen 443` server blocks for now
ln -s /etc/nginx/sites-available/crewapply.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# b) issue the certificate
certbot --nginx -d crewapply.com -d www.crewapply.com

# c) restore the full file — its TLS paths are the ones certbot just created
cp deploy/nginx/crewapply.com.conf /etc/nginx/sites-available/crewapply.com
nginx -t && systemctl reload nginx
```

Certbot validates over HTTP, which means **it needs DNS pointing here already**.
If you would rather not cut over blind, use the DNS-01 challenge to get the
certificate in advance:

```bash
certbot certonly --manual --preferred-challenges dns -d crewapply.com -d www.crewapply.com
```

### 5. Verify on the server, before touching DNS

```bash
curl -I http://127.0.0.1:3000/                                   # Next itself
curl -I -H 'Host: crewapply.com' http://127.0.0.1/               # through nginx
pm2 logs crewapply-web --lines 30
```

You can also point your own machine at the server before the world does, by
adding to your hosts file:

```
200.141.6.212  crewapply.com www.crewapply.com
```

Then browse the real domain and confirm login, jobs, documents and subscription
all work against the live API. **This is the step that makes the cutover safe** —
remove the line afterwards.

### 6. Cut over

Repoint DNS at the provider:

| Record | Host | Value |
| --- | --- | --- |
| A | `@` | `200.141.6.212` |
| A | `www` | `200.141.6.212` |

Remove the Vercel A/CNAME records for those two hosts. Propagation is usually
minutes; TTL decides. `api` stays exactly as it is.

### 7. Survive a reboot

```bash
pm2 save
pm2 startup    # run the command it prints
```

---

## Every deploy after the first

```bash
cd /var/www/crewapply-web && ./deploy/deploy.sh
```

Same shape as the two you already use:

```bash
# Backend
cd /var/www/crewapply-backend && git pull && npm install --omit=dev && pm2 reload crewapply-api

# Admin
cd /var/www/crewapply-admin && git pull && npm install && npm run build

# Web  ← note: NOT --omit=dev; tailwind and the react-compiler plugin are
#        devDependencies and the build needs them
cd /var/www/crewapply-web && ./deploy/deploy.sh
```

## Rolling back

```bash
cd /var/www/crewapply-web
git log --oneline -5
git checkout <sha> && npm ci && npm run build && pm2 reload crewapply-web
```

And if the site itself is the problem, point DNS back at Vercel — the project is
still there.

## When something is wrong

| Symptom | Cause |
| --- | --- |
| Site loads, every API call fails | `ALLOWED_ORIGINS` — see the top of this file |
| API calls go to `localhost:5000` | Built without `.env.production`. Rebuild; a restart will not fix it, the URL is baked into the bundle |
| 502 from nginx | pm2 process is down — `pm2 logs crewapply-web` |
| Build killed, no error | Out of memory — add swap (step 3) |
| Images broken, others fine | The host must be in `remotePatterns` in `next.config.mjs`; `api.crewapply.com` already is |
| Redirect loop | `X-Forwarded-Proto` missing from the nginx proxy headers |
