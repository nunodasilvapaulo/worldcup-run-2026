# Deploy World Cup Run 2026

Repo: **https://github.com/nunodasilvapaulo/worldcup-run-2026**

One Docker container serves the React game and Hono API. SQLite stores squads and session saves. Pick **Render** (easiest — volume is automatic) or **Railway** (also fine — one extra click for the volume).

---

## Option A — Render (recommended, ~5 minutes)

Everything is pre-configured in `render.yaml` (Docker, health check, 1 GB disk for saves).

### Step 1 — Create a Render account

1. Go to [render.com](https://render.com) and sign up (GitHub login works).
2. Open the [Render Dashboard](https://dashboard.render.com).

### Step 2 — Connect GitHub (first time only)

1. Click your profile (top right) → **Account Settings** → **GitHub**.
2. Click **Connect GitHub** and authorize Render.
3. When asked, grant access to **worldcup-run-2026** (or all repos).

### Step 3 — Deploy from Blueprint

1. Dashboard → **New +** → **Blueprint**.
2. Under **Connect a repository**, find **nunodasilvapaulo/worldcup-run-2026**.
3. Click **Connect**. Render reads `render.yaml` and shows:
   - Web service `worldcup-run-2026` (Docker)
   - Disk `worldcup-data` mounted at `/var/data`
   - Env: `NODE_ENV=production`, `DATABASE_PATH=/var/data/worldcup.db`
4. Click **Apply**. First build takes **5–10 minutes** (native module compile for SQLite).
5. When status is **Live**, open the URL at the top (e.g. `https://worldcup-run-2026.onrender.com`).

### Step 4 — Verify

- Health: `https://YOUR-URL.onrender.com/api/health` → `{"ok":true}`
- Open the site, pick a nation, start a run — refresh the page; progress should persist.

### After code changes

Push to GitHub → Render redeploys automatically. Saves stay on the disk.

---

## Option B — Railway (~5 minutes)

`railway.toml` configures Docker build and health checks. You add the volume once (dashboard or CLI).

### Path 1 — Dashboard (no CLI)

1. Go to [railway.app](https://railway.app) and sign up with GitHub.
2. **New Project** → **Deploy from GitHub repo** → select **worldcup-run-2026**.
3. Wait for the first deploy to finish (may fail health check until step 4 — that's OK).
4. Click the service → **Settings** → **Volumes** → **Add volume**:
   - Mount path: `/app/data`
5. **Variables** tab → add:
   - `DATABASE_PATH` = `/app/data/worldcup.db`
   - `NODE_ENV` = `production`
6. **Settings** → **Networking** → **Generate Domain**.
7. Open the public URL.

### Path 2 — CLI (Windows PowerShell)

From the project folder:

```powershell
npm install -g @railway/cli
railway login          # opens browser — approve access
railway init           # create/link project
railway up             # first deploy
railway volume add --mount-path /app/data
railway variables set DATABASE_PATH=/app/data/worldcup.db NODE_ENV=production
railway domain         # create public URL
```

Or run the helper script:

```powershell
.\scripts\setup-railway.ps1
```

### Verify

- `https://YOUR-DOMAIN.up.railway.app/api/health` → `{"ok":true}`

---

## Environment variables

| Variable | Render (default) | Railway (set manually) |
|----------|------------------|------------------------|
| `NODE_ENV` | `production` | `production` |
| `DATABASE_PATH` | `/var/data/worldcup.db` | `/app/data/worldcup.db` |
| `PORT` | Set by platform | Set by platform |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on `better-sqlite3` | Normal on first Docker build; wait for full compile. Ensure using Dockerfile (not Nixpacks-only). |
| Site loads but saves reset | Volume/disk not mounted — check `DATABASE_PATH` matches mount path. |
| 502 / not healthy yet | Wait 1–2 min after first deploy; check logs for `World Cup Run production →`. |
| Render free tier sleeps | First visit after idle may take ~30s to wake. |

---

## Local production test

```bash
npm install
npm run db:seed
npm run build
npm run start:prod
```

Open http://localhost:3001 — health at `/api/health`.

---

## Updating squads after deploy

```bash
npm run parse:wc-squads   # optional: refresh from Wikipedia
npm run db:seed           # verify locally
git push                  # triggers redeploy
```

The server auto-seeds an empty database on boot (48 nations, 1200+ players).
