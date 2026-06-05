import { MENTALITY_BEATS, MENTALITY_LABELS, TIER_POWER } from './constants'
import { getNation } from './nations2026'
import { getNationOrNonWc } from './nonWcNations'
import { resolveGoalsFromPowerRatio } from './matchScore'
import type { GoalEvent, MatchLine } from './matchSim'
import { awardMatchExperience } from './progression'
import {
  createFriendlyOpponentSquad,
  createOpponentSquad,
  playerPower,
  syncSquadPhotos,
} from './squad'
import type { NextMatchTraining } from './trainingBuff'
import type { Mentality, Nation, RunItem, SquadPlayer } from './types'

export interface OpponentSide {
  nation: Nation
  squad: SquadPlayer[]
  power: number
}

function archetypeMentality(n: Nation): Mentality {
  switch (n.archetype) {
    case 'press':
      return 'press'
    case 'counter':
    case 'underdog':
      return 'counter'
    case 'flair':
    case 'host':
      return 'press'
    default:
      return 'possession'
  }
}

export function mentalityMultiplier(ours: Mentality, theirs: Mentality): number {
  if (MENTALITY_BEATS[ours] === theirs) return 1.2
  if (MENTALITY_BEATS[theirs] === ours) return 0.88
  return 1
}

function boostSquadStats(squad: SquadPlayer[], difficulty: number) {
  return squad.map((p) => ({
    ...p,
    stats: {
      pace: Math.min(99, p.stats.pace + difficulty),
      shoot: Math.min(99, p.stats.shoot + difficulty),
      pass: Math.min(99, p.stats.pass + difficulty),
      defend: Math.min(99, p.stats.defend + difficulty),
    },
  }))
}

/** Friendly — opponent's best 5 from their call-up squad. */
export function buildFriendlyOpponent(nationId: string, difficulty: number): OpponentSide {
  const nation = getNationOrNonWc(nationId)
  const level = 2 + difficulty
  const squad = boostSquadStats(createFriendlyOpponentSquad(nationId, level), difficulty)
  const power = teamPower(squad, [], nation, archetypeMentality(nation))
  return { nation, squad, power }
}

export function buildOpponent(nationId: string, difficulty: number): OpponentSide {
  const nation = getNation(nationId)
  const level = 2 + difficulty
  const squad = boostSquadStats(createOpponentSquad(nationId, level), difficulty)
  const power = teamPower(squad, [], nation, archetypeMentality(nation))
  return { nation, squad, power }
}

/** Use a persisted nation squad (e.g. from tournament tracking) for a fight. */
export function buildOpponentFromSquad(
  nationId: string,
  baseSquad: SquadPlayer[],
  difficulty: number,
): OpponentSide {
  const nation = getNation(nationId)
  const squad = boostSquadStats(
    baseSquad.map((p) => ({ ...p, stats: { ...p.stats } })),
    difficulty,
  )
  const power = teamPower(squad, [], nation, archetypeMentality(nation))
  return { nation, squad, power }
}

export function teamPower(
  squad: SquadPlayer[],
  items: RunItem[],
  nation?: Nation,
  mentality?: Mentality,
  nextMatchTraining?: NextMatchTraining | null,
): number {
  if (squad.length === 0) return 0
  let sum = 0
  for (const p of squad) {
    sum += playerPower(p, nextMatchTraining)
  }
  let avg = sum / squad.length
  if (nation) avg += TIER_POWER[nation.tier] ?? 0
  let itemMul = 1
  if (items.some((i) => i.kind === 'buff')) itemMul += 0.08
  if (items.some((i) => i.kind === 'boots')) itemMul += 0.05
  if (items.some((i) => i.kind === 'tactics')) itemMul += 0.15
  if (mentality) avg *= 1.02
  return avg * itemMul * (0.92 + Math.random() * 0.14)
}

export interface MatchResult {
  goalsFor: number
  goalsAgainst: number
  won: boolean
  log: string[]
}

export function simulateMatch(
  squad: SquadPlayer[],
  items: RunItem[],
  playerNation: Nation,
  opponent: OpponentSide,
  mentality: Mentality,
): MatchResult {
  const theirMentality = archetypeMentality(opponent.nation)
  const mentMul = mentalityMultiplier(mentality, theirMentality)
  const ourPower = teamPower(squad, items, playerNation, mentality) * mentMul
  const theirPower = opponent.power * (0.9 + Math.random() * 0.18)
  const ratio = ourPower / Math.max(theirPower, 1)
  const log: string[] = [
    `${opponent.nation.flag} ${opponent.nation.name} — strength ${Math.round(theirPower)}`,
    `Your ${MENTALITY_LABELS[mentality]} vs their ${MENTALITY_LABELS[theirMentality]}`,
    `Team rating: ${Math.round(ourPower)}`,
  ]
  if (mentMul > 1.1) log.push('Tactical edge — shape worked perfectly.')
  if (mentMul < 0.95) log.push('Caught by their game plan.')

  let { goalsFor, goalsAgainst } = resolveGoalsFromPowerRatio(ratio)
  if (ratio > 1.25) log.push('Dominant performance — chances converted.')
  else if (ratio > 1.05) log.push('Tight win — marginal gains.')
  else if (ratio > 0.9) log.push('Even contest — lottery finish.')
  else log.push('Outplayed — defensive collapse.')

  let won = goalsFor > goalsAgainst
  if (!won && goalsFor === goalsAgainst) {
    goalsAgainst += 1
    log.push('Lost on penalties.')
    won = false
  }
  const xgFor = (goalsFor * 0.9 + Math.random() * 0.8).toFixed(1)
  const xgAgainst = (goalsAgainst * 0.9 + Math.random() * 0.8).toFixed(1)
  log.push(`xG ${xgFor} – ${xgAgainst}`)
  log.push(`Full time: ${goalsFor} – ${goalsAgainst}`)

  return { goalsFor, goalsAgainst, won, log }
}

export function applyMatchDamage(
  squad: SquadPlayer[],
  lost: boolean,
  harsh: boolean,
  isBoss = false,
): SquadPlayer[] {
  const base = isBoss
    ? harsh
      ? 38
      : lost
        ? 30
        : 22
    : harsh
      ? 32
      : lost
        ? 24
        : 16
  const spread = isBoss ? (harsh ? 24 : lost ? 18 : 14) : harsh ? 20 : lost ? 16 : 12
  return squad.map((p) => {
    const roll = base + Math.floor(Math.random() * spread)
    const mitigation = Math.floor(p.level / 4)
    const cost = Math.max(12, roll - mitigation) + Math.floor(Math.random() * 6)
    return {
      ...p,
      hp: Math.max(0, p.hp - cost),
    }
  })
}

export function stripDifficultyBoost(squad: SquadPlayer[], difficulty: number): SquadPlayer[] {
  const trim = (n: number) => Math.max(28, Math.min(99, n - difficulty))
  return squad.map((p) => ({
    ...p,
    stats: {
      pace: trim(p.stats.pace),
      shoot: trim(p.stats.shoot),
      pass: trim(p.stats.pass),
      defend: trim(p.stats.defend),
    },
  }))
}

/** Persist opponent squad after a boss/tournament fight. */
export function updateNationSquadAfterFight(
  nationSquads: Record<string, SquadPlayer[]>,
  nationId: string,
  squad: SquadPlayer[],
  won: boolean,
  harsh: boolean,
  match: { isBoss: boolean; goalEvents: GoalEvent[]; lines: MatchLine[] },
): Record<string, SquadPlayer[]> {
  let updated = squad.map((p) => ({
    ...p,
    stats: { ...p.stats },
  }))
  const { squad: withExp } = awardMatchExperience(updated, {
    isBoss: match.isBoss,
    won,
    nationId,
    goalEvents: match.goalEvents,
    lines: match.lines,
  })
  updated = applyMatchDamage(withExp, !won, harsh, match.isBoss)
  return {
    ...nationSquads,
    [nationId]: syncSquadPhotos(updated, nationId),
  }
}
