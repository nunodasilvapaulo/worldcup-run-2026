# Deploy World Cup Run 2026

One Docker container serves the game (React) and API (Hono) together. SQLite stores squads and session saves.

## Option A — Railway (recommended)

1. Create a project at [railway.app](https://railway.app)
2. **New Project → Deploy from GitHub** (push this folder to a repo first)  
   **or** install [Railway CLI](https://docs.railway.app/develop/cli) and run from the project folder:

   ```bash
   railway login
   railway init
   railway up
   ```

3. Add a **volume** (Settings → Volumes):
   - Mount path: `/app/data`
   - This keeps SQLite saves across redeploys

4. Set environment variables (if not using the volume default):
   - `DATABASE_PATH` = `/app/data/worldcup.db`
   - `NODE_ENV` = `production`

5. Railway assigns a public URL — open it in the browser.

Health check: `GET /api/health`

---

## Option B — Render

1. Push the repo to GitHub
2. [Render Dashboard](https://dashboard.render.com) → **New → Blueprint**
3. Connect the repo — Render reads `render.yaml`
4. The blueprint mounts a 1 GB disk at `/var/data` for SQLite

Or: **New Web Service → Docker**, point at this repo.

---

## Option C — Any VPS / Docker host

```bash
docker build -t worldcup-run-2026 .
docker run -d \
  --name worldcup \
  -p 3000:3000 \
  -v worldcup-data:/app/data \
  -e NODE_ENV=production \
  -e DATABASE_PATH=/app/data/worldcup.db \
  worldcup-run-2026
```

Open `http://your-server:3000`

---

## Option D — Local production test

```bash
npm install
npm run db:seed
npm run build
npm run start:prod
```

Open http://localhost:3001 (or your `PORT`)

---

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3001` | HTTP port |
| `NODE_ENV` | — | Set `production` to serve `dist/` + secure cookies |
| `DATABASE_PATH` | `./data/worldcup.db` | SQLite file (use a volume path in production) |

---

## First deploy notes

- The database **auto-seeds** on first boot if empty (48 nations, 1200+ players).
- Session saves use a cookie (`wc_sid`) — no login required.
- **Mount a persistent volume** for `DATABASE_PATH` or player saves reset on redeploy.

---

## Updating squads after deploy

Rebuild the image after editing `data/wc-squads-2026.json`:

```bash
npm run parse:wc-squads   # optional: refresh from Wikipedia
npm run db:seed           # locally, to verify
# redeploy Docker image
```

Or run `npm run db:seed` inside the container if you ship source files (Docker image includes `src/` for this).
