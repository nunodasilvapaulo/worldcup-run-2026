import { MAX_PLAYER_LEVEL } from './constants'
import type { GoalEvent, MatchLine } from './matchSim'
import type { SquadPlayer } from './types'

export interface PlayerExpLine {
  label: string
  points: number
}

export interface PlayerMatchExp {
  playerId: string
  playerName: string
  photoUrl: string
  levelBefore: number
  levelAfter: number
  levelGain: number
  performanceScore: number
  breakdown: PlayerExpLine[]
  staminaBefore: number
  staminaAfter: number
  staminaLost: number
}

function performanceToLevelGain(score: number, isBoss: boolean, won: boolean): number {
  if (!isBoss && !won) return 0
  if (!isBoss) return 1
  const minL = won ? 2 : 1
  const maxL = won ? 3 : 1
  const floor = won ? 8 : 5
  const t = Math.min(1, Math.max(0, (score - floor) / 50))
  const biased = won ? t : t * 0.75
  const gain = minL + Math.round(biased * (maxL - minL))
  return Math.max(minL, Math.min(maxL, gain))
}

function buildDetailedPerformance(
  squad: SquadPlayer[],
  nationId: string,
  goalEvents: GoalEvent[],
  lines: MatchLine[],
  won: boolean,
): Record<string, { total: number; breakdown: PlayerExpLine[] }> {
  const names = new Set(squad.map((p) => p.name))
  const data: Record<string, { total: number; breakdown: PlayerExpLine[] }> = {}
  for (const p of squad) {
    data[p.name] = { total: 0, breakdown: [] }
  }

  const add = (name: string, label: string, points: number) => {
    if (!names.has(name)) return
    data[name]!.total += points
    data[name]!.breakdown.push({ label, points })
  }

  for (const ev of goalEvents) {
    if (names.has(ev.scorerName) && ev.scorerNationId === nationId) {
      add(ev.scorerName, '⚽ Goal', 28)
    }
    if (ev.assistName && names.has(ev.assistName) && ev.assistNationId === nationId) {
      add(ev.assistName, '🅰️ Assist', 16)
    }
  }

  for (const line of lines) {
    if (!line.playerName || !names.has(line.playerName)) continue
    switch (line.kind) {
      case 'goal':
        add(line.playerName, '⚽ Goal moment', 6)
        break
      case 'tackle':
        add(line.playerName, '🛡️ Tackle', 10)
        break
      case 'save':
        add(line.playerName, '🧤 Save', 12)
        break
      case 'near':
        add(line.playerName, '📍 Close chance', 7)
        break
      case 'chance':
        add(line.playerName, '✨ Chance created', 5)
        break
      case 'miss':
        add(line.playerName, '😬 Miss', 2)
        break
      default:
        break
    }
    if (line.assistName && names.has(line.assistName)) {
      add(line.assistName, '🅰️ Build-up', 4)
    }
  }

  const teamLabel = won ? '🏆 Win bonus' : '📉 Loss bonus'
  const teamBonus = won ? 14 : 5
  for (const p of squad) {
    add(p.name, teamLabel, teamBonus)
  }

  return data
}

export function computeMatchExpReport(
  squad: SquadPlayer[],
  opts: {
    isBoss: boolean
    won: boolean
    nationId: string
    goalEvents: GoalEvent[]
    lines: MatchLine[]
  },
): PlayerMatchExp[] {
  const detailed = buildDetailedPerformance(
    squad,
    opts.nationId,
    opts.goalEvents,
    opts.lines,
    opts.won,
  )

  return squad.map((p) => {
    const entry = detailed[p.name] ?? { total: opts.won ? 8 : 5, breakdown: [] }
    const score = entry.total
    const levelGain = performanceToLevelGain(score, opts.isBoss, opts.won)
    const breakdown =
      !opts.isBoss && !opts.won
        ? [{ label: 'Friendly loss — no EXP', points: 0 }]
        : entry.breakdown
    return {
      playerId: p.id,
      playerName: p.name,
      photoUrl: p.photoUrl,
      levelBefore: p.level,
      levelAfter: Math.min(MAX_PLAYER_LEVEL, p.level + levelGain),
      levelGain,
      performanceScore: score,
      breakdown,
      staminaBefore: p.hp,
      staminaAfter: p.hp,
      staminaLost: 0,
    }
  })
}

export function awardMatchExperience(
  squad: SquadPlayer[],
  opts: {
    isBoss: boolean
    won: boolean
    nationId: string
    goalEvents: GoalEvent[]
    lines: MatchLine[]
  },
): { squad: SquadPlayer[]; expReport: PlayerMatchExp[] } {
  const expReport = computeMatchExpReport(squad, opts)
  const gainById = new Map(expReport.map((r) => [r.playerId, r.levelGain]))

  const updatedSquad = squad.map((p) => ({
    ...p,
    level: Math.min(MAX_PLAYER_LEVEL, p.level + (gainById.get(p.id) ?? 0)),
  }))

  const finalReport = expReport.map((r) => {
    const after = updatedSquad.find((p) => p.id === r.playerId)
    return {
      ...r,
      levelAfter: after?.level ?? r.levelAfter,
    }
  })

  return { squad: updatedSquad, expReport: finalReport }
}

export function attachStaminaLossToExpReport(
  report: PlayerMatchExp[],
  squadBefore: SquadPlayer[],
  squadAfter: SquadPlayer[],
): PlayerMatchExp[] {
  const before = new Map(squadBefore.map((p) => [p.id, p.hp]))
  const after = new Map(squadAfter.map((p) => [p.id, p.hp]))
  return report.map((r) => {
    const staminaBefore = before.get(r.playerId) ?? r.staminaBefore
    const staminaAfter = after.get(r.playerId) ?? r.staminaAfter
    return {
      ...r,
      staminaBefore,
      staminaAfter,
      staminaLost: Math.max(0, staminaBefore - staminaAfter),
    }
  })
}
