import { MAX_PLAYER_LEVEL, STAT_LEVEL_STEP, TIER_POWER } from './constants'
import {
  callUpRank,
  getRoster,
  legendTemplates,
  lookupPlayerPhoto,
  pickWorldCupRecruitTemplates,
  randomCallUpTemplates,
  starterTemplates,
  weakestCallUpTemplates,
  type PlayerTemplate,
} from './players2026'
import { getGroupMatchdayFixtures, WORLD_CUP_GROUPS_2026 } from './groups2026'
import { getNation } from './nations2026'
import { getNationOrNonWc } from './nonWcNations'
import { applyItemStats, getPlayerItem } from './playerItems'
import { resolvePhotoUrl } from './photoUrls'
import type { NextMatchTraining } from './trainingBuff'
import { applyNextMatchTraining } from './trainingBuff'
import type { Nation, PlayerRole, PlayerStats, RunState, SquadPlayer, TournamentState } from './types'

let idCounter = 0
export function resetSquadIdCounter() {
  idCounter = 0
}
function nextId(prefix: string) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

const ROLES: PlayerRole[] = ['GK', 'DEF', 'MID', 'WNG', 'ST']

function rollStat(base: number, spread: number): number {
  return Math.min(99, Math.max(28, base + Math.floor(Math.random() * spread * 2 - spread)))
}

function templateToPlayer(
  t: PlayerTemplate,
  level: number,
  tierBonus: number,
  opts?: { isLegend?: boolean; statMul?: number },
  nationId?: string,
): SquadPlayer {
  const mul = opts?.statMul ?? 1
  const b = Math.floor(tierBonus * mul)
  const stats: PlayerStats = {
    pace: rollStat(Math.floor(t.base.pace * mul) + b, 6),
    shoot: rollStat(Math.floor(t.base.shoot * mul) + b, 6),
    pass: rollStat(Math.floor(t.base.pass * mul) + b, 6),
    defend: rollStat(Math.floor(t.base.defend * mul) + b, 6),
  }
  const photoRaw = t.photoUrl || (nationId ? lookupPlayerPhoto(t.name, nationId) : '')
  const roster = nationId ? getRoster(nationId) : []
  return {
    id: nextId('p'),
    name: t.name,
    label: t.name,
    photoUrl: resolvePhotoUrl(photoRaw),
    role: t.role,
    level,
    stats,
    hp: 100,
    maxHp: 100,
    isLegend: opts?.isLegend,
    equippedItemId: null,
    callUpRank: roster.length ? callUpRank(t, roster) : t.squadRank,
  }
}

/** Run start — five weakest players from the full national call-up (by squad rank). */
export function createStarterSquad(nation: Nation): SquadPlayer[] {
  const tierBonus = Math.max(0, (TIER_POWER[nation.tier] ?? 0) - 6)
  const underdogBonus = nation.archetype === 'underdog' ? -2 : 0
  const bonus = tierBonus + underdogBonus
  const templates = weakestCallUpTemplates(nation.id, 5)
  if (templates.length >= 5) {
    return templates.map((t) => templateToPlayer(t, 1, bonus, undefined, nation.id))
  }
  return ROLES.map((role) =>
    templateToPlayer(
      templates[0] ?? { name: 'Squad Player', role, photoUrl: '', base: { pace: 48, shoot: 48, pass: 48, defend: 48 } },
      1,
      bonus,
      undefined,
      nation.id,
    ),
  )
}

export function createRecruitFromTemplate(t: PlayerTemplate, nationId: string, level = 2): SquadPlayer {
  const nation = getNation(nationId)
  const bonus = (TIER_POWER[nation.tier] ?? 0) - 2
  return templateToPlayer(t, level, bonus, undefined, nationId)
}

export function squadHasGoalkeeper(squad: SquadPlayer[]): boolean {
  return squad.some((p) => p.role === 'GK' && p.hp > 0)
}

/** Replacing `replaceId` with `incoming` must leave at least one goalkeeper. */
export function canReplaceKeepingGk(
  squad: SquadPlayer[],
  replaceId: string,
  incoming: Pick<SquadPlayer, 'role'>,
): boolean {
  const outgoing = squad.find((p) => p.id === replaceId)
  if (!outgoing || outgoing.role !== 'GK') return true
  const otherGks = squad.filter((p) => p.role === 'GK' && p.id !== replaceId).length
  if (otherGks > 0) return true
  return incoming.role === 'GK'
}

function shuffleTemplates<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}

export function generateRecruitOptions(
  nationId: string,
  squad: SquadPlayer[],
  count = 3,
  opts?: { injuredPlayer?: SquadPlayer },
): SquadPlayer[] {
  const squadNames = squad.map((p) => p.name)
  const injuredIsGk = opts?.injuredPlayer?.role === 'GK'

  if (injuredIsGk) {
    const gkPool = shuffleTemplates(
      getRoster(nationId).filter((p) => p.role === 'GK' && !squadNames.includes(p.name)),
    )
    return gkPool
      .slice(0, count)
      .map((t) => createRecruitFromTemplate(t, nationId, 2 + Math.floor(Math.random() * 2)))
  }

  const needsGk = !squad.some(
    (p) => p.role === 'GK' && p.id !== opts?.injuredPlayer?.id && p.hp > 0,
  )

  let templates = pickWorldCupRecruitTemplates(nationId, squadNames, count)

  if (needsGk && !templates.some((t) => t.role === 'GK')) {
    const gkPool = getRoster(nationId).filter(
      (p) => p.role === 'GK' && !squadNames.includes(p.name),
    )
    if (gkPool.length > 0) {
      templates = [gkPool[0]!, ...templates.filter((t) => t.role !== 'GK')].slice(0, count)
    }
  }

  return templates.map((t) => createRecruitFromTemplate(t, nationId, 2 + Math.floor(Math.random() * 2)))
}

export function generateLegendOptions(nationId: string, count = 3): SquadPlayer[] {
  const legends = legendTemplates(nationId).slice(0, count)
  return legends.map((t) =>
    templateToPlayer(t, 3, 4, { isLegend: true, statMul: 1.08 }, nationId),
  )
}

/** Friendly opponents — five random players from the latest call-up (always includes a GK). */
export function createFriendlyOpponentSquad(nationId: string, level: number): SquadPlayer[] {
  const nation = getNationOrNonWc(nationId)
  const bonus = (TIER_POWER[nation.tier] ?? 0) + Math.floor(level / 2)
  const templates = randomCallUpTemplates(nationId, 5)
  if (templates.length === 0) {
    return createOpponentSquad(nationId, level)
  }
  return templates.map((t) => templateToPlayer(t, level, bonus, undefined, nationId))
}

export function createOpponentSquad(nationId: string, level: number): SquadPlayer[] {
  const nation = getNation(nationId)
  const bonus = (TIER_POWER[nation.tier] ?? 0) + Math.floor(level / 2)
  const templates = starterTemplates(nationId)
  return ROLES.map((role) => {
    const t = templates.find((r) => r.role === role) ?? templates[0]
    if (!t) {
      return templateToPlayer(
        { name: `${role}`, role, photoUrl: '', base: { pace: 55, shoot: 55, pass: 55, defend: 55 } },
        level,
        bonus,
        undefined,
        nationId,
      )
    }
    return templateToPlayer(t, level, bonus, undefined, nationId)
  })
}

/** Backfill missing headshots from nation rosters (saved runs, recruits). */
export function syncSquadPhotos(squad: SquadPlayer[], nationId: string): SquadPlayer[] {
  return squad.map((p) => {
    const raw = p.photoUrl || lookupPlayerPhoto(p.name, nationId, squad)
    return { ...p, photoUrl: resolvePhotoUrl(raw) }
  })
}

/** 1.0 at full stamina, scales down linearly with HP. */
export function staminaMultiplier(player: SquadPlayer): number {
  if (player.maxHp <= 0) return 1
  return Math.max(0, Math.min(1, player.hp / player.maxHp))
}

/** Effective stat tier — jumps every 5 levels (Lv.7 uses Lv.10 power, etc.). */
export function levelStatTier(level: number): number {
  const clamped = Math.max(1, Math.min(MAX_PLAYER_LEVEL, level))
  return Math.min(
    MAX_PLAYER_LEVEL,
    Math.ceil(clamped / STAT_LEVEL_STEP) * STAT_LEVEL_STEP,
  )
}

export function nextStatTierLevel(level: number): number | null {
  const tier = levelStatTier(level)
  if (tier >= MAX_PLAYER_LEVEL) return null
  return tier + STAT_LEVEL_STEP
}

export function statTierPercent(level: number): number {
  return Math.round((levelStatTier(level) / MAX_PLAYER_LEVEL) * 100)
}

function levelStatMultiplier(level: number): number {
  return levelStatTier(level) / MAX_PLAYER_LEVEL
}

/** Base stats at the player's current level (level 20 = full `player.stats`). */
export function statsAtLevel(base: PlayerStats, level: number): PlayerStats {
  const mul = levelStatMultiplier(level)
  const scale = (n: number) => Math.max(1, Math.round(n * mul))
  return {
    pace: scale(base.pace),
    shoot: scale(base.shoot),
    pass: scale(base.pass),
    defend: scale(base.defend),
  }
}

/** Level → items → stamina → optional next-match training. */
export function effectivePlayerStats(
  player: SquadPlayer,
  nextMatchTraining?: NextMatchTraining | null,
): PlayerStats {
  const item = player.equippedItemId ? getPlayerItem(player.equippedItemId) : null
  const atLevel = statsAtLevel(player.stats, player.level)
  const withItem = applyItemStats(atLevel, item ?? null)
  const mul = staminaMultiplier(player)
  const scale = (n: number) => Math.max(1, Math.round(n * mul))
  const scaled = {
    pace: scale(withItem.pace),
    shoot: scale(withItem.shoot),
    pass: scale(withItem.pass),
    defend: scale(withItem.defend),
  }
  return applyNextMatchTraining(scaled, player, nextMatchTraining)
}

export function playerPower(p: SquadPlayer, nextMatchTraining?: NextMatchTraining | null): number {
  const s = effectivePlayerStats(p, nextMatchTraining)
  const base = (s.pace + s.shoot + s.pass + s.defend) / 4
  const legendMul = p.isLegend ? 1.1 : 1
  return base * legendMul
}

export function clampPlayerLevel(level: number): number {
  return Math.max(1, Math.min(MAX_PLAYER_LEVEL, level))
}

/** Map legacy saves (max 100) onto the new 1–20 scale. */
export function migratePlayerLevel(level: number): number {
  if (level <= MAX_PLAYER_LEVEL) return clampPlayerLevel(level)
  return clampPlayerLevel(Math.round((level / 100) * MAX_PLAYER_LEVEL))
}

export function squadAlive(squad: SquadPlayer[]): boolean {
  return squad.some((p) => p.hp > 0)
}

/** Initialize live squads for every World Cup nation except the player. */
export function createNationSquads(playerNationId: string): Record<string, SquadPlayer[]> {
  const squads: Record<string, SquadPlayer[]> = {}
  const seen = new Set<string>()
  for (const group of WORLD_CUP_GROUPS_2026) {
    for (const nationId of group.nations) {
      if (seen.has(nationId) || nationId === playerNationId) continue
      seen.add(nationId)
      squads[nationId] = syncSquadPhotos(createStarterSquad(getNation(nationId)), nationId)
    }
  }
  return squads
}

/** Backfill squads for saved runs that predate nation squad tracking. */
export function ensureNationSquads(run: RunState): Record<string, SquadPlayer[]> {
  if (run.nationSquads && Object.keys(run.nationSquads).length > 0) {
    return run.nationSquads
  }
  return createNationSquads(run.nationId)
}

/** Resolve a player by name for profiles / tooltips (live squad, then roster). */
export function findPlayerInRun(
  run: RunState,
  nationId: string,
  playerName: string,
): SquadPlayer {
  const squad = getNationSquad(run, nationId)
  const found = squad.find((p) => p.name === playerName)
  if (found) return found

  const template = getRoster(nationId).find((p) => p.name === playerName)
  if (template) return createRecruitFromTemplate(template, nationId, 2)

  return {
    id: `lookup-${nationId}-${playerName}`,
    name: playerName,
    label: playerName,
    photoUrl: resolvePhotoUrl(lookupPlayerPhoto(playerName, nationId, squad)),
    role: 'MID',
    level: 2,
    stats: { pace: 50, shoot: 50, pass: 50, defend: 50 },
    hp: 100,
    maxHp: 100,
    equippedItemId: null,
  }
}

/** Current 5 for any nation — player squad is always live from the run. */
export function getNationSquad(run: RunState, nationId: string): SquadPlayer[] {
  if (nationId === run.nationId) return run.squad
  const squads = ensureNationSquads(run)
  const squad = squads[nationId]
  if (squad?.length) return squad
  return syncSquadPhotos(createStarterSquad(getNation(nationId)), nationId)
}

/** Light call-up shuffle after background matchdays (injuries, rotation). */
export function maybeEvolveNationSquad(squad: SquadPlayer[], nationId: string): SquadPlayer[] {
  if (Math.random() > 0.22) return squad
  const outfield = squad.filter((p) => p.role !== 'GK')
  if (outfield.length === 0) return squad
  const replaceIdx = squad.findIndex((p) => p.id === outfield[Math.floor(Math.random() * outfield.length)]!.id)
  if (replaceIdx < 0) return squad

  const names = squad.map((p) => p.name)
  const recruits = pickWorldCupRecruitTemplates(nationId, names, 1)
  if (recruits.length === 0) return squad

  const next = [...squad]
  next[replaceIdx] = createRecruitFromTemplate(recruits[0]!, nationId, squad[replaceIdx]!.level)
  return syncSquadPhotos(next, nationId)
}

export function evolveNationSquadsAfterMatchday(
  nationSquads: Record<string, SquadPlayer[]>,
  tournament: TournamentState,
  mdIndex: number,
  skipPlayerGroupId: string,
): Record<string, SquadPlayer[]> {
  const next = { ...nationSquads }
  for (const group of tournament.groups) {
    if (group.id === skipPlayerGroupId) continue
    const fixtures = getGroupMatchdayFixtures(group.id, mdIndex)
    for (const [homeId, awayId] of fixtures) {
      if (next[homeId]) next[homeId] = maybeEvolveNationSquad(next[homeId], homeId)
      if (next[awayId]) next[awayId] = maybeEvolveNationSquad(next[awayId], awayId)
    }
  }
  return next
}

