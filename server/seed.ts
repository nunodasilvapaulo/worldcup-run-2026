/**
 * Seed SQLite from bundled TS data. Re-run anytime: npm run db:seed
 */
import { NATION_ROSTERS, NATION_LEGENDS } from '../src/game/players2026.ts'
import { NATIONS_2026 } from '../src/game/nations2026.ts'
import { NON_WC_NATIONS } from '../src/game/nonWcNations.ts'
import { WC_NATION_ROSTERS } from '../src/game/wcNationRosters.ts'
import { NON_WC_ROSTERS } from '../src/game/nonWcRosters.ts'
import type { Nation } from '../src/game/types.ts'
import type { PlayerTemplate } from '../src/game/players2026.ts'
import { getDb } from './db.ts'

function insertNation(db: ReturnType<typeof getDb>, nation: Nation, opts: { isWc: boolean }) {
  db.prepare(
    `INSERT OR REPLACE INTO nations
      (id, name, flag, confederation, tier, archetype, colors_json, is_host, debut_2026, is_wc, is_playable)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    nation.id,
    nation.name,
    nation.flag,
    nation.confederation,
    nation.tier,
    nation.archetype,
    JSON.stringify(nation.colors),
    nation.isHost ? 1 : 0,
    nation.debut2026 ? 1 : 0,
    opts.isWc ? 1 : 0,
    opts.isWc ? 1 : 0,
  )
}

function insertPlayers(
  db: ReturnType<typeof getDb>,
  nationId: string,
  players: PlayerTemplate[],
  isLegend: boolean,
) {
  const stmt = db.prepare(
    `INSERT INTO players
      (nation_id, name, role, photo_url, pace, shoot, pass, defend, squad_rank, is_legend)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  for (const p of players) {
    stmt.run(
      nationId,
      p.name,
      p.role,
      p.photoUrl ?? '',
      p.base.pace,
      p.base.shoot,
      p.base.pass,
      p.base.defend,
      p.squadRank ?? null,
      isLegend ? 1 : 0,
    )
  }
}

export function seedDatabase(db = getDb()) {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM players').run()
    db.prepare('DELETE FROM nations').run()

    for (const nation of NATIONS_2026) insertNation(db, nation, { isWc: true })
    for (const nation of NON_WC_NATIONS) insertNation(db, nation, { isWc: false })

    const rosterSources = [
      NATION_ROSTERS,
      WC_NATION_ROSTERS,
      NON_WC_ROSTERS,
    ] as Record<string, PlayerTemplate[]>[]

    const seen = new Set<string>()
    for (const source of rosterSources) {
      for (const [nationId, players] of Object.entries(source)) {
        const key = `roster:${nationId}`
        if (seen.has(key)) continue
        seen.add(key)
        insertPlayers(db, nationId, players, false)
      }
    }

    for (const [nationId, legends] of Object.entries(NATION_LEGENDS)) {
      insertPlayers(db, nationId, legends, true)
    }
  })
  tx()

  const nationCount = db.prepare('SELECT COUNT(*) AS c FROM nations').get() as { c: number }
  const playerCount = db.prepare('SELECT COUNT(*) AS c FROM players WHERE is_legend = 0').get() as {
    c: number
  }
  const legendCount = db.prepare('SELECT COUNT(*) AS c FROM players WHERE is_legend = 1').get() as {
    c: number
  }
  return { nationCount: nationCount.c, playerCount: playerCount.c, legendCount: legendCount.c }
}

export function seedDatabaseIfEmpty() {
  const db = getDb()
  const nationCount = (db.prepare('SELECT COUNT(*) AS c FROM nations').get() as { c: number }).c
  if (nationCount > 0) return false
  const stats = seedDatabase(db)
  console.log(
    `Seeded ${stats.nationCount} nations, ${stats.playerCount} call-up players, ${stats.legendCount} legends`,
  )
  return true
}

const isCli = process.argv[1]?.replace(/\\/g, '/').endsWith('server/seed.ts')
if (isCli) {
  const stats = seedDatabase()
  console.log(
    `Seeded ${stats.nationCount} nations, ${stats.playerCount} call-up players, ${stats.legendCount} legends`,
  )
}
