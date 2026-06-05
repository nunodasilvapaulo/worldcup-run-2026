import type { MapStageId, Mentality, NodeKind, RunItem } from './types'

export const MAX_SQUAD = 5
export const MAX_PLAYER_LEVEL = 20
/** Stats tier up every N levels (Lv.1–4 → 25%, Lv.5–9 → 50%, Lv.10–14 → 75%, Lv.15–20 → 100%). */
export const STAT_LEVEL_STEP = 5
export const MAP_COUNT = 8
export const MAX_LAYERS = MAP_COUNT
export const TROPHIES_TO_WIN = MAP_COUNT
export const FRIENDLIES_PER_MAP = 2

/** Eight maps: MD1 → MD3 → R16 → QF → SF → Semi → Final */
export const MAP_STAGES: {
  id: MapStageId
  index: number
  label: string
  shortLabel: string
  phase: 'group' | 'knockout' | 'final'
}[] = [
  { id: 'md1', index: 0, label: 'Matchday 1', shortLabel: 'MD1', phase: 'group' },
  { id: 'md2', index: 1, label: 'Matchday 2', shortLabel: 'MD2', phase: 'group' },
  { id: 'md3', index: 2, label: 'Matchday 3', shortLabel: 'MD3', phase: 'group' },
  { id: 'r16', index: 3, label: 'Round of 16', shortLabel: 'R16', phase: 'knockout' },
  { id: 'qf', index: 4, label: 'Quarter-finals', shortLabel: '8 finals', phase: 'knockout' },
  { id: 'sf', index: 5, label: 'Semi-finals', shortLabel: '4 finals', phase: 'knockout' },
  { id: 'semi', index: 6, label: 'Semi-final', shortLabel: 'Semi', phase: 'knockout' },
  { id: 'final', index: 7, label: 'World Cup Final', shortLabel: 'Final', phase: 'final' },
]

export function stageForLayer(layer: number) {
  return MAP_STAGES[Math.min(layer, MAP_STAGES.length - 1)]!
}

export const TIER_POWER: Record<string, number> = {
  S: 12,
  A: 8,
  B: 4,
  C: 0,
}

export const MENTALITY_BEATS: Record<Mentality, Mentality> = {
  press: 'counter',
  counter: 'possession',
  possession: 'press',
}

export const MENTALITY_LABELS: Record<Mentality, string> = {
  press: 'High Press',
  counter: 'Counter Attack',
  possession: 'Possession',
}

export const ROLE_LABELS = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  WNG: 'Winger',
  ST: 'Striker',
} as const

export const ITEM_POOL: RunItem[] = [
  { id: 'boots', name: 'Speed Session', description: '+8 Pace to squad until next match', kind: 'boots' },
  { id: 'buff', name: 'Captain Speech', description: '+5 to all stats next match', kind: 'buff' },
  { id: 'pot', name: 'Medical Staff', description: 'Restore 30 fitness to whole squad', kind: 'pot' },
  { id: 'tactics', name: 'Analyst Briefing', description: '+15% team power next match', kind: 'tactics' },
]

export const NODE_META: Record<NodeKind, { emoji: string; title: string }> = {
  start: { emoji: '🏁', title: 'Starting Point' },
  friendly: { emoji: '🤝', title: 'Friendly' },
  warmup: { emoji: '🤝', title: 'Warm-up' },
  group: { emoji: '🏟️', title: 'Group Stage' },
  knockout: { emoji: '⚔️', title: 'Knockout' },
  final: { emoji: '🏆', title: 'World Cup Final' },
  recovery: { emoji: '💧', title: 'Recovery Camp' },
  recruit: { emoji: '📋', title: 'Call-up' },
  legend: { emoji: '⭐', title: 'Legend Call-up' },
  social: { emoji: '🎤', title: 'Social Event' },
  item: { emoji: '👟', title: 'Equipment' },
  mystery: { emoji: '❓', title: 'Mystery' },
  training: { emoji: '🏋️', title: 'Training' },
  training_session: { emoji: '🏋️', title: 'Training Session' },
  shop: { emoji: '🛒', title: 'Equipment' },
  host: { emoji: '🏠', title: 'Host City' },
}
