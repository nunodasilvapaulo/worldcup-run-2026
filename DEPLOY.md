# Deploy World Cup Run 2026

**Stack:** React (Vite) on **Vercel** + **Supabase** (Postgres) — same pattern as GD Benavente Scout.

Repo: **https://github.com/nunodasilvapaulo/worldcup-run-2026**

No login for players — Supabase **anonymous auth** gives each browser a session; saves are tied to that session.

---

## 1. Supabase (~5 min)

### Create project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Pick a name and region, set a DB password, wait for provisioning

### Run the schema

1. **SQL Editor** → **New query**
2. Paste the contents of `supabase/migrations/001_worldcup_schema.sql`
3. Click **Run**

### Enable anonymous sign-in

1. **Authentication** → **Providers** → **Anonymous sign-ins** → **Enable**

### Get API keys

**Project Settings → API:**

| Key | Use |
|-----|-----|
| Project URL | `VITE_SUPABASE_URL` |
| `anon` `public` | `VITE_SUPABASE_ANON_KEY` (Vercel + `.env.local`) |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` (seed only — never in Vercel) |

### Seed game data

On your machine, copy `.env.local.example` → `.env.local` and fill in the three values. Then:

```bash
npm install
npm run db:seed:supabase
```

You should see ~63 nations and 1200+ players seeded.

---

## 2. Vercel (~3 min)

### Deploy

```bash
npm install -g vercel
cd worldcup-run-2026
vercel --prod
```

Or connect GitHub in the [Vercel dashboard](https://vercel.com/new):

1. **Add New → Project** → import **worldcup-run-2026**
2. Framework: **Vite** (auto-detected)
3. **Environment variables** (Production + Preview):

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | your anon public key |

4. **Deploy**

`vercel.json` handles SPA routing. No Docker or custom server needed.

### Verify

1. Open your Vercel URL
2. Pick a nation, start a run, refresh — progress should persist
3. In Supabase **Table Editor → game_saves**, you should see a row after playing

---

## Local development

```bash
cp .env.local.example .env.local   # fill Supabase keys
npm install
npm run db:seed:supabase           # once
npm run dev                        # http://127.0.0.1:5173
```

### Optional: SQLite API (offline / no Supabase)

```bash
npm run db:seed
npm run dev:full    # Vite + Hono on :3001
```

Remove or leave empty `VITE_SUPABASE_*` in `.env.local` to use bundled JSON rosters only.

---

## Updating squads

```bash
npm run parse:wc-squads    # optional: refresh from Wikipedia
npm run db:seed:supabase   # push to Supabase
git push                   # redeploys Vercel automatically
```

---

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | Vercel + `.env.local` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Vercel + `.env.local` | Client API access |
| `SUPABASE_SERVICE_ROLE_KEY` | Local seed only | Bypass RLS to seed nations/players |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| “Could not connect” on load | Check Vercel env vars; confirm anonymous auth is enabled |
| “No nations in database” | Run `npm run db:seed:supabase` |
| Saves don’t persist | Anonymous auth disabled, or ad-blocker blocking Supabase |
| Blank after deploy | Check Vercel build logs; ensure `npm run build` passes |

---

## Legacy: Docker / Render / Railway

The `Dockerfile`, `render.yaml`, and `railway.toml` still work if you prefer a single container with SQLite. **Vercel + Supabase is the recommended setup.**
