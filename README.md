# World Cup Run 2026

Fan roguelike autobattler inspired by [Pokelike](https://pokelike.xyz). Lead one of 8 national teams through a branching World Cup 2026 path.

## Quick start (local)

```bash
cd worldcup-run-2026
npm install
npm run db:seed    # load nations + call-ups into SQLite
npm run dev        # Vite (5173) + API (3001)
```

Open http://127.0.0.1:5173

No login — your browser gets an anonymous session cookie (`wc_sid`). Saves and call-up data live in SQLite under `data/worldcup.db`.

## Architecture

| Layer | Role |
|--------|------|
| **React client** | Game UI + logic |
| **Hono API** (`server/`) | Session cookies, cloud saves, call-up data |
| **SQLite** (`data/worldcup.db`) | Nations, players, legends, per-session saves |

Bundled TS files are still the source of truth for seeding. Edit rosters in the DB directly, or update the TS files and re-run `npm run db:seed`.

### Managing call-up data

Full **26-man FIFA squads** are in `data/wc-squads-2026.json` (parsed from [Wikipedia](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads)). Each player has `squadRank` (1 = star, 26 = weakest).

To refresh from Wikipedia:

```bash
npm run parse:wc-squads
npm run db:seed
```

Or edit `data/wc-squads-2026.json` directly, then `npm run db:seed`.

## Production deploy

**Repo:** [github.com/nunodasilvapaulo/worldcup-run-2026](https://github.com/nunodasilvapaulo/worldcup-run-2026)

| Platform | How |
|----------|-----|
| **Render** (easiest) | [Dashboard → New Blueprint](https://dashboard.render.com/blueprint/new) → connect repo → **Apply** |
| **Railway** | [New project from GitHub](https://railway.app/new) → add volume at `/app/data` → set `DATABASE_PATH` |

Full click-by-click steps: **[DEPLOY.md](./DEPLOY.md)**

Local production test:

```bash
npm run build
npm run start:prod   # http://localhost:3001
```

## Features

- 48 qualified nations in the opponent pool (2026)
- 8 playable nations (favorites, hosts, underdogs)
- Branching tournament map (group → knockout → final)
- Tactics: High Press / Counter / Possession
- Normal & Ironman modes
- Session-based cloud saves (no account needed)

## Legal

Unofficial fan game. Not affiliated with FIFA.
