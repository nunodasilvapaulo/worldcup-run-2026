export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC'

export type NationTier = 'S' | 'A' | 'B' | 'C'

export type Archetype = 'flair' | 'press' | 'counter' | 'balanced' | 'underdog' | 'host'

export type Mentality = 'press' | 'counter' | 'possession'

export type PlayerRole = 'GK' | 'DEF' | 'MID' | 'WNG' | 'ST'

export type MapStageId =
  | 'md1'
  | 'md2'
  | 'md3'
  | 'r16'
  | 'qf'
  | 'sf'
  | 'semi'
  | 'final'

export type NodeKind =
  | 'start'
  | 'friendly'
  | 'warmup'
  | 'group'
  | 'knockout'
  | 'final'
  | 'recovery'
  | 'recruit'
  | 'legend'
  | 'social'
  | 'item'
  | 'mystery'
  | 'training'
  | 'training_session'
  | 'shop'
  | 'host'

export interface Nation {
  id: string
  name: string
  flag: string
  confederation: Confederation
  tier: NationTier
  archetype: Archetype
  colors: [string, string, string]
  debut2026?: boolean
  isHost?: boolean
}

export interface PlayerStats {
  pace: number
  shoot: number
  pass: number
  defend: number
}

export interface SquadPlayer {
  id: string
  name: string
  label: string
  photoUrl: string
  role: PlayerRole
  level: number
  stats: PlayerStats
  hp: number
  maxHp: number
  isLegend?: boolean
  /** National call-up rank snapshot (1 = star, higher = weaker). */
  callUpRank?: number
  /** One equipment item per player */
  equippedItemId: string | null
}

export interface RunItem {
  id: string
  name: string
  description: string
  kind: 'boots' | 'buff' | 'pot' | 'tactics'
}

export interface PlayerItem {
  id: string
  name: string
  description: string
  kind: 'boots' | 'maestro' | 'sniper' | 'wall' | 'captain' | 'gloves'
  statMods: Partial<PlayerStats>
  passBias?: number
}

export interface MapNode {
  id: string
  layer: number
  stageId: MapStageId
  kind: NodeKind
  label: string
  subtitle?: string
  difficulty?: number
  opponentId?: string
  taken: boolean
  isBoss: boolean
  /** Layout column 0–2 for Pokelike path */
  col: number
  /** Layout row 0 = path start (top), higher = closer to boss (bottom) */
  row: number
  nextIds: string[]
}

export interface GroupStanding {
  nationId: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  points: number
}

export interface TournamentGroup {
  id: string
  nationIds: string[]
  standings: GroupStanding[]
}

export interface SimMatchResult {
  homeId: string
  awayId: string
  homeGoals: number
  awayGoals: number
}

export interface ScorerEntry {
  playerName: string
  nationId: string
  goals: number
  assists: number
}

export type MysteryOutcomeType =
  | 'injury'
  | 'social_good'
  | 'social_bad'
  | 'item'
  | 'callup'
  | 'legend'
  | 'recovery'
  | 'friendly'
  | 'boost'

export interface MysteryOutcome {
  type: MysteryOutcomeType
  message: string
}

export interface TournamentState {
  groups: TournamentGroup[]
  playerGroupId: string
  groupOpponentIds: string[]
  knockoutOpponentIds: string[]
  headlines: string[]
  /** Headlines from the most recently completed matchday only */
  recentHeadlines: string[]
  eliminatedIds: string[]
  knockoutRound: number
  /** How many group MDs simulated worldwide (0–3) */
  simulatedMatchdays: number
  qualificationNote: string
}

export interface PendingFight {
  nodeId: string
  plan: import('./matchSim').LiveMatchPlan
}

export type Screen =
  | 'menu'
  | 'nation'
  | 'map'
  | 'match_live'
  | 'battle'
  | 'match_exp'
  | 'recruit'
  | 'legend'
  | 'social'
  | 'item_pick'
  | 'mystery'
  | 'golden_boot'
  | 'tournament_overview'
  | 'training'
  | 'training_session'
  | 'shop'
  | 'gameover'
  | 'champion'
  | 'tournament_report'

export interface RunState {
  nationId: string
  squad: SquadPlayer[]
  items: RunItem[]
  trophies: number
  maxTrophies: number
  map: MapNode[]
  groupOpponentIds: string[]
  tournament: TournamentState
  currentMapIndex: number
  currentNodeId: string | null
  selectedNodeId: string | null
  pendingMentality: Mentality | null
  layer: number
  mode: 'normal' | 'ironman'
  legendPickUsed: boolean
  /** MD results from boss matches [md1, md2, md3] */
  groupResults: ('win' | 'loss' | 'pending')[]
  goldenBoot: ScorerEntry[]
  /** Per-layer seed so re-entering a stage rolls fresh nodes */
  layerSeeds: number[]
  /** Unequipped player items (ids from PLAYER_ITEM_POOL) */
  itemBag: string[]
  /** Live squads for all other World Cup nations (player uses `squad`) */
  nationSquads?: Record<string, SquadPlayer[]>
  /** Sector drill buff — consumed after the next boss / official match */
  nextMatchTraining?: import('./trainingBuff').NextMatchTraining | null
}

export interface GameState {
  screen: Screen
  pendingMode: 'normal' | 'ironman'
  run: RunState | null
  lastBattle: {
    nodeId?: string
    goalsFor: number
    goalsAgainst: number
    won: boolean
    opponentName: string
    opponentNationId: string
    opponentFlag: string
    opponentStarName: string
    opponentStarPhotoUrl: string
    opponentSquad: SquadPlayer[]
    stadiumImageUrl: string
    stadiumName: string
    log: string[]
    matchLines: import('./matchSim').MatchLine[]
    wasBoss: boolean
    mapJustCompleted: boolean
    expReport?: import('./progression').PlayerMatchExp[]
  } | null
  pendingRecruits: SquadPlayer[] | null
  pendingRecruitKind: 'squad' | 'legend'
  pendingItems: RunItem[] | null
  pendingTrainingPlayerId: string | null
  pendingFight: PendingFight | null
  pendingMystery: MysteryOutcome | null
  pendingSocialPlayerId: string | null
  pendingItemOffers: PlayerItem[] | null
  pendingEquipPlayerId: string | null
  pendingRecruitSubMode: boolean
  pendingSelectedItemId: string | null
  pendingIncomingRecruit: SquadPlayer | null
  mysteryMessage: string | null
  /** Click equipped item → pick another player to wear it */
  pendingItemSwapFromPlayerId: string | null
  /** Click bag item → pick a player to equip it */
  pendingBagEquipItemId: string | null
  /** Shown after a camp action — Continue marks the node taken */
  pendingNodeResult: { title?: string; message: string } | null
  hallOfLegends: number
}
