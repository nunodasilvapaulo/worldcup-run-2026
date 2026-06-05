import type { Nation } from './types'
import { WORLD_CUP_GROUPS_2026 } from './groups2026'
import { getNation } from './nations2026'

/** National teams not at WC 2026 — valid friendly opponents only */
export const NON_WC_NATIONS: Nation[] = [
  { id: 'italy', name: 'Italy', flag: '🇮🇹', confederation: 'UEFA', tier: 'A', archetype: 'balanced', colors: ['#009246', '#FFFFFF', '#CE2B37'] },
  { id: 'poland', name: 'Poland', flag: '🇵🇱', confederation: 'UEFA', tier: 'B', archetype: 'counter', colors: ['#FFFFFF', '#DC143C', '#FFFFFF'] },
  { id: 'ukraine', name: 'Ukraine', flag: '🇺🇦', confederation: 'UEFA', tier: 'B', archetype: 'counter', colors: ['#005BBB', '#FFD500', '#005BBB'] },
  { id: 'denmark', name: 'Denmark', flag: '🇩🇰', confederation: 'UEFA', tier: 'B', archetype: 'press', colors: ['#C8102E', '#FFFFFF', '#C8102E'] },
  { id: 'wales', name: 'Wales', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', confederation: 'UEFA', tier: 'C', archetype: 'underdog', colors: ['#FFFFFF', '#00AB39', '#D30731'] },
  { id: 'serbia', name: 'Serbia', flag: '🇷🇸', confederation: 'UEFA', tier: 'B', archetype: 'balanced', colors: ['#C6363C', '#0C4076', '#FFFFFF'] },
  { id: 'chile', name: 'Chile', flag: '🇨🇱', confederation: 'CONMEBOL', tier: 'B', archetype: 'flair', colors: ['#D52B1E', '#FFFFFF', '#0039A6'] },
  { id: 'peru', name: 'Peru', flag: '🇵🇪', confederation: 'CONMEBOL', tier: 'B', archetype: 'balanced', colors: ['#D91023', '#FFFFFF', '#D91023'] },
  { id: 'venezuela', name: 'Venezuela', flag: '🇻🇪', confederation: 'CONMEBOL', tier: 'C', archetype: 'underdog', colors: ['#FFCC00', '#00247D', '#CF142B'] },
  { id: 'nigeria', name: 'Nigeria', flag: '🇳🇬', confederation: 'CAF', tier: 'B', archetype: 'flair', colors: ['#008751', '#FFFFFF', '#008751'] },
  { id: 'cameroon', name: 'Cameroon', flag: '🇨🇲', confederation: 'CAF', tier: 'B', archetype: 'flair', colors: ['#007A5E', '#CE1126', '#FCD116'] },
  { id: 'costa-rica', name: 'Costa Rica', flag: '🇨🇷', confederation: 'CONCACAF', tier: 'B', archetype: 'counter', colors: ['#002B7F', '#FFFFFF', '#CE1126'] },
  { id: 'jamaica', name: 'Jamaica', flag: '🇯🇲', confederation: 'CONCACAF', tier: 'C', archetype: 'underdog', colors: ['#009B3A', '#FED100', '#000000'] },
  { id: 'china', name: 'China PR', flag: '🇨🇳', confederation: 'AFC', tier: 'C', archetype: 'underdog', colors: ['#DE2910', '#FFDE00', '#DE2910'] },
  { id: 'thailand', name: 'Thailand', flag: '🇹🇭', confederation: 'AFC', tier: 'C', archetype: 'underdog', colors: ['#A51931', '#FFFFFF', '#2D2A4A'] },
]

const WC_IDS = new Set(WORLD_CUP_GROUPS_2026.flatMap((g) => g.nations))

export function isWorldCupNation(nationId: string): boolean {
  return WC_IDS.has(nationId)
}

export function pickNonWcFriendlyOpponent(playerNationId: string): string {
  const pool = NON_WC_NATIONS.filter((n) => n.id !== playerNationId)
  return pool[Math.floor(Math.random() * pool.length)]!.id
}

export function getNationOrNonWc(nationId: string): Nation {
  const non = NON_WC_NATIONS.find((n) => n.id === nationId)
  if (non) return non
  return getNation(nationId)
}
