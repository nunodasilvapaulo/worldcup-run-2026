# World Cup Run 2026

Fan roguelike autobattler inspired by [Pokelike](https://pokelike.xyz). Lead one of 8 national teams through a branching World Cup 2026 path.

## Stack

- **Frontend**: React + TypeScript + Vite
- **Backend / DB**: Supabase (Postgres + anonymous auth)
- **Deploy**: Vercel

## Quick start (local)

```bash
cd worldcup-run-2026
npm install
cp .env.local.example .env.local   # add Supabase URL + anon key
npm run db:seed:supabase           # load nations + call-ups
npm run dev
```

Open http://127.0.0.1:5173

No login — Supabase anonymous auth gives your browser a session. Saves live in Postgres.

Full deploy steps: **[DEPLOY.md](./DEPLOY.md)**

## Architecture

| Layer | Role |
|--------|------|
| **React client** | Game UI + logic |
| **Supabase** | Nations, players, per-session saves (RLS) |
| **Vercel** | Static SPA hosting |

Bundled JSON/TS files are the source of truth for seeding. Edit `data/wc-squads-2026.json` and re-run `npm run db:seed:supabase`.

### Managing call-up data

Full **26-man FIFA squads** are in `data/wc-squads-2026.json` (parsed from [Wikipedia](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads)). Each player has `squadRank` (1 = star, 26 = weakest).

```bash
npm run parse:wc-squads
npm run db:seed:supabase
```

## Production deploy

```bash
vercel --prod
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project settings. See [DEPLOY.md](./DEPLOY.md).

## Features

- 48 qualified nations in the opponent pool (2026)
- All 48 World Cup nations playable
- Branching tournament map (group → knockout → final)
- Tactics: High Press / Counter / Possession
- Normal & Ironman modes
- Session-based cloud saves (no account needed)

## Legal

Unofficial fan game. Not affiliated with FIFA.
