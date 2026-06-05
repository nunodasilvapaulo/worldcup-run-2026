/**
 * Seed Supabase from bundled game data. Requires service role key.
 * npm run db:seed:supabase
 */
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  const file = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvLocal()
import { NATION_ROSTERS, NATION_LEGENDS } from '../src/game/players2026.ts'
import { NATIONS_2026 } from '../src/game/nations2026.ts'
import { NON_WC_NATIONS } from '../src/game/nonWcNations.ts'
import { WC_NATION_ROSTERS } from '../src/game/wcNationRosters.ts'
import { NON_WC_ROSTERS } from '../src/game/nonWcRosters.ts'
import type { Nation } from '../src/game/types.ts'
import type { PlayerTemplate } from '../src/game/players2026.ts'

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

if (!url || !serviceKey) {
  console.error(
    'Missing Supabase credentials. Add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local',
  )
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
const BATCH = 400

function nationRow(nation: Nation, isWc: boolean) {
  return {
    id: nation.id,
    name: nation.name,
    flag: nation.flag,
    confederation: nation.confederation,
    tier: nation.tier,
    archetype: nation.archetype,
    colors_json: nation.colors,
    is_host: nation.isHost ?? false,
    debut_2026: nation.debut2026 ?? false,
    is_wc: isWc,
    is_playable: isWc,
  }
}

function playerRows(nationId: string, players: PlayerTemplate[], isLegend: boolean) {
  return players.map((p) => ({
    nation_id: nationId,
    name: p.name,
    role: p.role,
    photo_url: p.photoUrl ?? '',
    pace: p.base.pace,
    shoot: p.base.shoot,
    pass: p.base.pass,
    defend: p.base.defend,
    squad_rank: p.squadRank ?? null,
    is_legend: isLegend,
  }))
}

async function upsertBatches<T extends Record<string, unknown>>(table: string, rows: T[]) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const { error } = await supabase.from(table).upsert(chunk)
    if (error) throw error
  }
}

export async function seedSupabase() {
  const nationRows = [
    ...NATIONS_2026.map((n) => nationRow(n, true)),
    ...NON_WC_NATIONS.map((n) => nationRow(n, false)),
  ]

  const rosterSources = [NATION_ROSTERS, WC_NATION_ROSTERS, NON_WC_ROSTERS] as Record<
    string,
    PlayerTemplate[]
  >[]
  const allPlayers: ReturnType<typeof playerRows>[number][] = []
  const seen = new Set<string>()

  for (const source of rosterSources) {
    for (const [nationId, players] of Object.entries(source)) {
      const key = `roster:${nationId}`
      if (seen.has(key)) continue
      seen.add(key)
      allPlayers.push(...playerRows(nationId, players, false))
    }
  }

  for (const [nationId, legends] of Object.entries(NATION_LEGENDS)) {
    allPlayers.push(...playerRows(nationId, legends, true))
  }

  const { error: delPlayers } = await supabase.from('players').delete().neq('id', 0)
  if (delPlayers) throw delPlayers
  const { error: delNations } = await supabase.from('nations').delete().neq('id', '')
  if (delNations) throw delNations

  await upsertBatches('nations', nationRows)
  await upsertBatches('players', allPlayers)

  const callUps = allPlayers.filter((p) => !p.is_legend).length
  const legendCount = allPlayers.filter((p) => p.is_legend).length

  return { nationCount: nationRows.length, playerCount: callUps, legendCount }
}

const isCli = process.argv[1]?.replace(/\\/g, '/').endsWith('server/seed-supabase.ts')
if (isCli) {
  seedSupabase()
    .then((stats) => {
      console.log(
        `Seeded ${stats.nationCount} nations, ${stats.playerCount} call-up players, ${stats.legendCount} legends`,
      )
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
