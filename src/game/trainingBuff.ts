import type { PlayerRole, PlayerStats, SquadPlayer } from './types'

export type TrainingSector = 'gk' | 'defender' | 'midfielder' | 'forward' | 'team'

export interface NextMatchTraining {
  sector: TrainingSector
  bonus: number
}

export const TRAINING_SECTOR_LABELS: Record<TrainingSector, string> = {
  gk: 'Goalkeepers',
  defender: 'Defenders',
  midfielder: 'Midfielders',
  forward: 'Forwards',
  team: 'Whole team',
}

export function mainStatForRole(role: PlayerRole): keyof PlayerStats {
  switch (role) {
    case 'GK':
    case 'DEF':
      return 'defend'
    case 'MID':
      return 'pass'
    case 'WNG':
    case 'ST':
      return 'shoot'
  }
}

export function roleInSector(role: PlayerRole, sector: TrainingSector): boolean {
  switch (sector) {
    case 'gk':
      return role === 'GK'
    case 'defender':
      return role === 'DEF'
    case 'midfielder':
      return role === 'MID'
    case 'forward':
      return role === 'ST' || role === 'WNG'
    case 'team':
      return true
  }
}

export function applyNextMatchTraining(
  stats: PlayerStats,
  player: SquadPlayer,
  training: NextMatchTraining | null | undefined,
): PlayerStats {
  if (!training) return stats
  const key = mainStatForRole(player.role)
  if (training.sector === 'team') {
    return { ...stats, [key]: Math.min(99, stats[key] + training.bonus) }
  }
  if (!roleInSector(player.role, training.sector)) return stats
  return { ...stats, [key]: Math.min(99, stats[key] + training.bonus) }
}

export function trainingBuffSummary(training: NextMatchTraining): string {
  if (training.sector === 'team') {
    return `+${training.bonus} main stat for all players (next official match)`
  }
  const stat =
    training.sector === 'gk' || training.sector === 'defender'
      ? 'Defending'
      : training.sector === 'midfielder'
        ? 'Passing'
        : 'Shooting'
  return `+${training.bonus} ${stat} for ${TRAINING_SECTOR_LABELS[training.sector].toLowerCase()} (next official match)`
}
