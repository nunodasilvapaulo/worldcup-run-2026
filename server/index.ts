import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie } from 'hono/cookie'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDb, resolveDbPath } from './db.ts'
import { seedDatabaseIfEmpty } from './seed.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT ?? 3001)
const IS_PROD = process.env.NODE_ENV === 'production'
const SESSION_COOKIE = 'wc_sid'
const SESSION_MAX_AGE = 60 * 60 * 24 * 90 // 90 days

const app = new Hono()

if (!IS_PROD) {
  app.use(
    '/api/*',
    cors({
      origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
      credentials: true,
    }),
  )
}

function touchSession(db: ReturnType<typeof getDb>, sessionId: string) {
  const now = Date.now()
  db.prepare(
    `INSERT INTO sessions (id, created_at, last_seen_at) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
  ).run(sessionId, now, now)
}

function ensureSession(c: Parameters<Parameters<typeof app.use>[1]>[0]): string {
  const db = getDb()
  let sessionId = getCookie(c, SESSION_COOKIE)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    setCookie(c, SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'Lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })
  }
  touchSession(db, sessionId)
  return sessionId
}

app.get('/api/health', (c) => c.json({ ok: true }))

app.post('/api/session', (c) => {
  const sessionId = ensureSession(c)
  return c.json({ sessionId })
})

app.get('/api/bootstrap', (c) => {
  ensureSession(c)
  const db = getDb()

  const nations = db
    .prepare(
      `SELECT id, name, flag, confederation, tier, archetype, colors_json,
              is_host, debut_2026, is_wc, is_playable
       FROM nations ORDER BY is_playable DESC, name ASC`,
    )
    .all()
    .map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: r.id,
        name: r.name,
        flag: r.flag,
        confederation: r.confederation,
        tier: r.tier,
        archetype: r.archetype,
        colors: JSON.parse(String(r.colors_json)),
        isHost: Boolean(r.is_host),
        debut2026: Boolean(r.debut_2026),
        isWc: Boolean(r.is_wc),
        isPlayable: Boolean(r.is_playable),
      }
    })

  const playerRows = db
    .prepare(
      `SELECT nation_id, name, role, photo_url, pace, shoot, pass, defend, squad_rank, is_legend
       FROM players ORDER BY nation_id, COALESCE(squad_rank, 999), id`,
    )
    .all() as Array<{
    nation_id: string
    name: string
    role: string
    photo_url: string
    pace: number
    shoot: number
    pass: number
    defend: number
    squad_rank: number | null
    is_legend: number
  }>

  const rosters: Record<string, unknown[]> = {}
  const legends: Record<string, unknown[]> = {}

  for (const p of playerRows) {
    const template = {
      name: p.name,
      role: p.role,
      photoUrl: p.photo_url,
      base: { pace: p.pace, shoot: p.shoot, pass: p.pass, defend: p.defend },
      ...(p.squad_rank != null ? { squadRank: p.squad_rank } : {}),
    }
    const bucket = p.is_legend ? legends : rosters
    if (!bucket[p.nation_id]) bucket[p.nation_id] = []
    bucket[p.nation_id]!.push(template)
  }

  const starterNationIds = nations.filter((n) => n.isPlayable).map((n) => n.id)

  return c.json({ nations, rosters, legends, starterNationIds })
})

app.get('/api/save', (c) => {
  const sessionId = ensureSession(c)
  const db = getDb()
  const row = db
    .prepare(
      `SELECT hall_of_legends, screen, run_json, last_battle_json, pending_fight_json
       FROM game_saves WHERE session_id = ?`,
    )
    .get(sessionId) as
    | {
        hall_of_legends: number
        screen: string | null
        run_json: string | null
        last_battle_json: string | null
        pending_fight_json: string | null
      }
    | undefined

  if (!row) {
    return c.json({ hallOfLegends: 0, run: null, screen: null, lastBattle: null, pendingFight: null })
  }

  return c.json({
    hallOfLegends: row.hall_of_legends,
    screen: row.screen,
    run: row.run_json ? JSON.parse(row.run_json) : null,
    lastBattle: row.last_battle_json ? JSON.parse(row.last_battle_json) : null,
    pendingFight: row.pending_fight_json ? JSON.parse(row.pending_fight_json) : null,
  })
})

app.put('/api/save', async (c) => {
  const sessionId = ensureSession(c)
  const body = await c.req.json<{
    hallOfLegends?: number
    screen?: string
    run?: unknown
    lastBattle?: unknown
    pendingFight?: unknown
  }>()

  const db = getDb()
  const now = Date.now()
  db.prepare(
    `INSERT INTO game_saves (session_id, hall_of_legends, screen, run_json, last_battle_json, pending_fight_json, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(session_id) DO UPDATE SET
       hall_of_legends = excluded.hall_of_legends,
       screen = excluded.screen,
       run_json = excluded.run_json,
       last_battle_json = excluded.last_battle_json,
       pending_fight_json = excluded.pending_fight_json,
       updated_at = excluded.updated_at`,
  ).run(
    sessionId,
    body.hallOfLegends ?? 0,
    body.screen ?? null,
    body.run ? JSON.stringify(body.run) : null,
    body.lastBattle ? JSON.stringify(body.lastBattle) : null,
    body.pendingFight ? JSON.stringify(body.pendingFight) : null,
    now,
  )

  return c.json({ ok: true })
})

app.delete('/api/save/run', (c) => {
  const sessionId = ensureSession(c)
  const db = getDb()
  const existing = db
    .prepare('SELECT hall_of_legends FROM game_saves WHERE session_id = ?')
    .get(sessionId) as { hall_of_legends: number } | undefined
  const hall = existing?.hall_of_legends ?? 0
  db.prepare(
    `INSERT INTO game_saves (session_id, hall_of_legends, screen, run_json, last_battle_json, pending_fight_json, updated_at)
     VALUES (?, ?, NULL, NULL, NULL, NULL, ?)
     ON CONFLICT(session_id) DO UPDATE SET
       screen = NULL, run_json = NULL, last_battle_json = NULL, pending_fight_json = NULL, updated_at = excluded.updated_at`,
  ).run(sessionId, hall, Date.now())
  return c.json({ ok: true, hallOfLegends: hall })
})

if (IS_PROD && fs.existsSync(DIST)) {
  app.use('/assets/*', serveStatic({ root: DIST }))
  app.get('*', (c) => {
    if (c.req.path.startsWith('/api/')) return c.notFound()
    return c.html(fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8'))
  })
}

seedDatabaseIfEmpty()

serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(
    `World Cup Run ${IS_PROD ? 'production' : 'dev'} → http://0.0.0.0:${info.port} (db: ${resolveDbPath()})`,
  )
})
