import { rollItemOffers } from './playerItems'
import { pickNonWcFriendlyOpponent } from './nonWcNations'
import type { MysteryOutcome, SquadPlayer } from './types'

export function rollMysteryOutcome(): MysteryOutcome['type'] {
  const r = Math.random()
  if (r < 0.12) return 'injury'
  if (r < 0.2) return 'social_good'
  if (r < 0.28) return 'social_bad'
  if (r < 0.36) return 'item'
  if (r < 0.44) return 'callup'
  if (r < 0.5) return 'legend'
  if (r < 0.58) return 'recovery'
  if (r < 0.72) return 'friendly'
  return 'boost'
}

export function mysteryFriendlyOpponent(playerNationId: string): string {
  return pickNonWcFriendlyOpponent(playerNationId)
}

export function applySocialOutcome(
  squad: SquadPlayer[],
  playerId: string,
  good: boolean,
): { squad: SquadPlayer[]; message: string } {
  const delta = good ? 5 : -4
  const squadNext = squad.map((p) =>
    p.id === playerId
      ? {
          ...p,
          stats: {
            pace: Math.min(99, Math.max(20, p.stats.pace + delta)),
            shoot: Math.min(99, Math.max(20, p.stats.shoot + delta)),
            pass: Math.min(99, Math.max(20, p.stats.pass + delta)),
            defend: Math.min(99, Math.max(20, p.stats.defend + delta)),
          },
          hp: good ? Math.min(p.maxHp, p.hp + 12) : Math.max(8, p.hp - 15),
        }
      : p,
  )
  const name = squad.find((p) => p.id === playerId)?.name ?? 'Player'
  return {
    squad: squadNext,
    message: good
      ? `${name} was a hit with the press — stats up!`
      : `${name} had a rough night — stats and fitness down.`,
  }
}

export function applyMysteryBoost(squad: SquadPlayer[], playerId: string): SquadPlayer[] {
  return squad.map((p) =>
    p.id === playerId
      ? {
          ...p,
          stats: {
            pace: Math.min(99, p.stats.pace + 3),
            shoot: Math.min(99, p.stats.shoot + 3),
            pass: Math.min(99, p.stats.pass + 3),
            defend: Math.min(99, p.stats.defend + 3),
          },
        }
      : p,
  )
}

export function rollMysteryItems(ownedIds: Iterable<string> = []) {
  return rollItemOffers(3, ownedIds)
}
