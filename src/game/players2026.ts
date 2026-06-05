import { getCachedLegends, getCachedRoster, isGameDataLoaded } from './gameData'
import { NON_WC_ROSTERS } from './nonWcRosters'
import { resolvePhotoUrl, wikiPhoto as W } from './photoUrls'
import { WC_NATION_ROSTERS } from './wcNationRosters'
import type { PlayerRole, PlayerStats } from './types'

export interface PlayerTemplate {
  name: string
  role: PlayerRole
  photoUrl: string
  base: PlayerStats
  /** National squad rank: 1 = top star, higher = weaker. You set these per call-up. */
  squadRank?: number
}

/** Legacy override slot — all WC squads live in wcNationRosters / wc-squads-2026.json */
export const NATION_ROSTERS: Record<string, PlayerTemplate[]> = {}

export function getRoster(nationId: string): PlayerTemplate[] {
  if (isGameDataLoaded()) {
    const cached = getCachedRoster(nationId)
    if (cached.length) return cached
  }
  return (
    NATION_ROSTERS[nationId] ??
    WC_NATION_ROSTERS[nationId] ??
    NON_WC_ROSTERS[nationId] ??
    []
  )
}

/** Squad rank for sorting — uses `squadRank` when set, else derives from base stats. */
export function callUpRank(t: PlayerTemplate, roster: PlayerTemplate[]): number {
  if (t.squadRank != null) return t.squadRank
  const ranked = [...roster].sort((a, b) => playerRating(b) - playerRating(a))
  const idx = ranked.findIndex((p) => p.name === t.name)
  return idx >= 0 ? idx + 1 : roster.length + 1
}

/** Pick N players from a sorted pool — exactly one GK when the roster has one. */
function pickCallUpLineup(sorted: PlayerTemplate[], count: number): PlayerTemplate[] {
  const gks = sorted.filter((p) => p.role === 'GK')
  const outfield = sorted.filter((p) => p.role !== 'GK')
  const picked: PlayerTemplate[] = []
  if (gks.length > 0) picked.push(gks[0]!)
  picked.push(...outfield.slice(0, count - picked.length))
  return picked.slice(0, count)
}

/** Weakest N from the full call-up (highest squad ranks; always includes a GK when available). */
export function weakestCallUpTemplates(nationId: string, count = 5): PlayerTemplate[] {
  const roster = getRoster(nationId)
  if (roster.length === 0) return []
  const sorted = [...roster].sort(
    (a, b) => callUpRank(b, roster) - callUpRank(a, roster),
  )
  return pickCallUpLineup(sorted, count)
}

/** Strongest N from the full call-up (lowest squad ranks; always includes a GK when available). */
export function bestCallUpTemplates(nationId: string, count = 5): PlayerTemplate[] {
  const roster = getRoster(nationId)
  if (roster.length === 0) return []
  const sorted = [...roster].sort(
    (a, b) => callUpRank(a, roster) - callUpRank(b, roster),
  )
  return pickCallUpLineup(sorted, count)
}

/** Random N from the best 10 call-ups — AI opponents (always one GK). */
export function randomEliteCallUpTemplates(nationId: string, count = 5): PlayerTemplate[] {
  const roster = getRoster(nationId)
  if (roster.length === 0) return []
  const elitePool = [...roster]
    .sort((a, b) => callUpRank(a, roster) - callUpRank(b, roster))
    .slice(0, 10)
  const picked: PlayerTemplate[] = []
  const gks = elitePool.filter((p) => p.role === 'GK')
  const outfield = elitePool.filter((p) => p.role !== 'GK')
  if (gks.length > 0) {
    picked.push(gks[Math.floor(Math.random() * gks.length)]!)
  }
  const pool = [...outfield]
  while (picked.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    picked.push(pool.splice(idx, 1)[0]!)
  }
  return picked
}

/** Random N from the nation's call-up pool — friendlies always roll fresh names. */
export function randomCallUpTemplates(nationId: string, count = 5): PlayerTemplate[] {
  const roster = getRoster(nationId)
  if (roster.length === 0) return []
  const picked: PlayerTemplate[] = []
  const pool = [...roster]

  const gks = pool.filter((p) => p.role === 'GK')
  if (gks.length > 0) {
    const gk = gks[Math.floor(Math.random() * gks.length)]!
    picked.push(gk)
    pool.splice(pool.indexOf(gk), 1)
  }

  const outfield = pool.filter((p) => p.role !== 'GK')
  while (picked.length < count && outfield.length > 0) {
    const idx = Math.floor(Math.random() * outfield.length)
    picked.push(outfield.splice(idx, 1)[0]!)
  }
  return picked
}

/** Resolve a headshot from squad, nation roster, or legends pool. */
export function lookupPlayerPhoto(
  playerName: string,
  nationId: string,
  squad?: { name: string; photoUrl?: string }[],
): string {
  const fromSquad = squad?.find((p) => p.name === playerName)?.photoUrl
  if (fromSquad) return resolvePhotoUrl(fromSquad)
  const roster = getRoster(nationId)
  const hit = roster.find((p) => p.name === playerName)
  if (hit?.photoUrl) return resolvePhotoUrl(hit.photoUrl)
  const legend = (NATION_LEGENDS[nationId] ?? []).find((p) => p.name === playerName)
  return resolvePhotoUrl(legend?.photoUrl ?? '')
}

/** Top five from the national call-up (ranks 1–5 when `squadRank` is set). */
export function starterTemplates(nationId: string): PlayerTemplate[] {
  return bestCallUpTemplates(nationId, 5)
}

const PREVIEW_ROLE_ORDER: Record<PlayerRole, number> = {
  GK: 0,
  DEF: 1,
  MID: 2,
  WNG: 3,
  ST: 4,
}

/** Nation hover preview — weakest five, sorted GK → DEF → MID → FWD (WNG/ST). */
export function previewCallUpTemplates(nationId: string, count = 5): PlayerTemplate[] {
  const roster = getRoster(nationId)
  const picked = weakestCallUpTemplates(nationId, count)
  return [...picked].sort((a, b) => {
    const byRole = PREVIEW_ROLE_ORDER[a.role] - PREVIEW_ROLE_ORDER[b.role]
    if (byRole !== 0) return byRole
    return callUpRank(b, roster) - callUpRank(a, roster)
  })
}

export function randomRecruitTemplate(nationId: string, excludeNames: string[]): PlayerTemplate | null {
  const pool = getRoster(nationId).filter((p) => !excludeNames.includes(p.name))
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]!
}

/** Generic star names for AI opponents by tier */
export function genericOpponentName(nationId: string, role: PlayerRole): string {
  const roster = getRoster(nationId)
  const match = roster.find((p) => p.role === role)
  if (match) return match.name
  return `${role} — ${nationId}`
}

export function playerRating(t: PlayerTemplate): number {
  return (t.base.pace + t.base.shoot + t.base.pass + t.base.defend) / 4
}

/** @deprecated Use weakestCallUpTemplates */
export function bTeamTemplates(nationId: string): PlayerTemplate[] {
  return weakestCallUpTemplates(nationId, 5)
}

/** Full call-up minus current squad, best recruits first (lowest squad rank). */
export function worldCupRecruitTemplates(nationId: string, excludeNames: string[]): PlayerTemplate[] {
  const roster = getRoster(nationId)
  return roster
    .filter((p) => !excludeNames.includes(p.name))
    .sort((a, b) => callUpRank(a, roster) - callUpRank(b, roster))
}

export function pickWorldCupRecruitTemplates(nationId: string, excludeNames: string[], count: number): PlayerTemplate[] {
  const pool = worldCupRecruitTemplates(nationId, excludeNames)
  const out: PlayerTemplate[] = []
  const used = new Set<string>()
  while (out.length < count && out.length < pool.length) {
    const tier = Math.min(3, out.length)
    const slice = pool.filter((p) => !used.has(p.name))
    const pick = slice[Math.floor(Math.random() * Math.min(slice.length, 4 + tier))] ?? slice[0]
    if (pick) {
      out.push(pick)
      used.add(pick.name)
    } else break
  }
  return out
}

/** National team legends (special call-up) */
export const NATION_LEGENDS: Record<string, PlayerTemplate[]> = {
  argentina: [
    { name: 'Diego Maradona', role: 'MID', photoUrl: W('2/2f/Diego_Maradona_1986.jpg/220px-Diego_Maradona_1986.jpg'), base: { pace: 78, shoot: 88, pass: 92, defend: 45 } },
    { name: 'Gabriel Batistuta', role: 'ST', photoUrl: W('4/4e/Gabriel_Batistuta_1998.jpg/220px-Gabriel_Batistuta_1998.jpg'), base: { pace: 82, shoot: 94, pass: 62, defend: 40 } },
    { name: 'Javier Zanetti', role: 'DEF', photoUrl: W('4/4e/Javier_Zanetti_2007.jpg/220px-Javier_Zanetti_2007.jpg'), base: { pace: 72, shoot: 42, pass: 78, defend: 88 } },
  ],
  france: [
    { name: 'Zinedine Zidane', role: 'MID', photoUrl: W('4/4e/Zinedine_Zidane_2006.jpg/220px-Zinedine_Zidane_2006.jpg'), base: { pace: 74, shoot: 82, pass: 96, defend: 55 } },
    { name: 'Thierry Henry', role: 'ST', photoUrl: W('9/9c/Thierry_Henry_2010.jpg/220px-Thierry_Henry_2010.jpg'), base: { pace: 90, shoot: 92, pass: 78, defend: 42 } },
    { name: 'Lilian Thuram', role: 'DEF', photoUrl: W('4/4e/Lilian_Thuram_2008.jpg/220px-Lilian_Thuram_2008.jpg'), base: { pace: 68, shoot: 38, pass: 65, defend: 90 } },
  ],
  brazil: [
    { name: 'Pelé', role: 'ST', photoUrl: W('5/5e/Pel%C3%A9_1970.jpg/220px-Pel%C3%A9_1970.jpg'), base: { pace: 80, shoot: 96, pass: 88, defend: 48 } },
    { name: 'Ronaldo Nazário', role: 'ST', photoUrl: W('4/4e/Ronaldo_2002.jpg/220px-Ronaldo_2002.jpg'), base: { pace: 88, shoot: 94, pass: 72, defend: 38 } },
    { name: 'Ronaldinho', role: 'WNG', photoUrl: W('4/4e/Ronaldinho_2007.jpg/220px-Ronaldinho_2007.jpg'), base: { pace: 86, shoot: 86, pass: 90, defend: 40 } },
  ],
  usa: [
    { name: 'Clint Dempsey', role: 'MID', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 76, shoot: 80, pass: 78, defend: 52 } },
    { name: 'Landon Donovan', role: 'WNG', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 84, shoot: 82, pass: 80, defend: 45 } },
    { name: 'Tim Howard', role: 'GK', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 38, shoot: 14, pass: 48, defend: 86 } },
  ],
  mexico: [
    { name: 'Javier Hernández', role: 'ST', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 82, shoot: 86, pass: 62, defend: 40 } },
    { name: 'Rafa Márquez', role: 'DEF', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 58, shoot: 42, pass: 72, defend: 88 } },
    { name: 'Cuauhtémoc Blanco', role: 'MID', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 70, shoot: 78, pass: 84, defend: 48 } },
  ],
  curacao: [
    { name: 'Rigters Legend', role: 'ST', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 74, shoot: 78, pass: 58, defend: 42 } },
    { name: 'Curaçao Icon', role: 'MID', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 68, shoot: 70, pass: 76, defend: 55 } },
    { name: 'Island Hero', role: 'DEF', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 60, shoot: 35, pass: 58, defend: 80 } },
  ],
  uzbekistan: [
    { name: 'Uzbek Golden Gen', role: 'MID', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 70, shoot: 72, pass: 80, defend: 55 } },
    { name: 'Samarkand Star', role: 'ST', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 76, shoot: 80, pass: 58, defend: 40 } },
    { name: 'Tashkent Wall', role: 'GK', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 36, shoot: 12, pass: 44, defend: 82 } },
  ],
  jordan: [
    { name: 'Jordan Legend', role: 'WNG', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 84, shoot: 78, pass: 68, defend: 40 } },
    { name: 'Amman Captain', role: 'DEF', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 58, shoot: 32, pass: 55, defend: 82 } },
    { name: 'Desert Striker', role: 'ST', photoUrl: W('a/a1/Soccerball.svg/220px-Soccerball.svg.png'), base: { pace: 74, shoot: 80, pass: 52, defend: 42 } },
  ],
}

export function legendTemplates(nationId: string): PlayerTemplate[] {
  if (isGameDataLoaded()) {
    const cached = getCachedLegends(nationId)
    if (cached.length) return cached
  }
  return NATION_LEGENDS[nationId] ?? []
}

/** Star player for map / battle display — call-up rank #1. */
export function nationStarTemplate(nationId: string): PlayerTemplate | null {
  const roster = getRoster(nationId)
  if (roster.length === 0) return null
  const explicit = roster.find((p) => p.squadRank === 1)
  if (explicit) return explicit
  return [...roster].sort((a, b) => callUpRank(a, roster) - callUpRank(b, roster))[0] ?? null
}
