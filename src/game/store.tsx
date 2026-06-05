import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import { ITEM_POOL, MAP_COUNT, MAX_SQUAD, TROPHIES_TO_WIN } from './constants'
import {
  applyMatchDamage,
  stripDifficultyBoost,
  updateNationSquadAfterFight,
} from './battle'
import { attachStaminaLossToExpReport, awardMatchExperience } from './progression'
import { planLiveMatch } from './matchSim'
import { trainingBuffSummary } from './trainingBuff'
import {
  appendNextLayer,
  availableNodes,
  firstIncompleteMapIndex,
  generateMap,
  isFightNode,
  isMapComplete,
  repairRunState,
  rollGroupOpponents,
  syncRunMapState,
} from './mapGen'
import {
  applyMysteryBoost,
  applySocialOutcome,
  mysteryFriendlyOpponent,
  rollMysteryOutcome,
} from './mysteryEvents'
import {
  collectOwnedItemIds,
  equipItemOnPlayer,
  rollItemOffers,
  transferEquippedItem,
  unequipItemFromPlayer,
} from './playerItems'
import { getNation } from './nations2026'
import { stadiumForStage } from './stadiums2026'
import {
  addAssistEntries,
  addScorerGoals,
  advanceBackgroundAfterMap,
  createTournament,
  recordPlayerGroupResult,
} from './tournament'
import {
  createNationSquads,
  createStarterSquad,
  effectivePlayerStats,
  ensureNationSquads,
  evolveNationSquadsAfterMatchday,
  generateLegendOptions,
  canReplaceKeepingGk,
  generateRecruitOptions,
  getNationSquad,
  resetSquadIdCounter,
  squadAlive,
  syncSquadPhotos,
} from './squad'
import { buildInitialGameState, emptyGameState } from './initGameState'
import { clearRun, saveRun } from './storage'
import type {
  GameState,
  MapNode,
  Mentality,
  PlayerItem,
  RunItem,
  RunState,
  SquadPlayer,
} from './types'

type Action =
  | { type: 'INIT' }
  | { type: 'NEW_RUN'; mode: RunState['mode'] }
  | { type: 'PICK_NATION'; nationId: string }
  | { type: 'SET_MENTALITY'; mentality: Mentality }
  | { type: 'TRAVEL_TO_NODE'; nodeId: string }
  | { type: 'CONTINUE_AFTER_BATTLE' }
  | { type: 'FINISH_MATCH' }
  | { type: 'DISMISS_TOURNAMENT_REPORT' }
  | { type: 'PICK_RECRUIT'; player: SquadPlayer }
  | { type: 'SKIP_RECRUIT' }
  | { type: 'PICK_TRAINING'; playerId: string; stat: keyof SquadPlayer['stats'] }
  | { type: 'PICK_TRAINING_SECTOR'; sector: import('./trainingBuff').TrainingSector }
  | { type: 'PICK_ITEM'; item: RunItem }
  | { type: 'SKIP_ITEM' }
  | { type: 'SKIP_EQUIP' }
  | { type: 'BACK_MENU' }
  | { type: 'RESTART_RUN' }
  | { type: 'REPAIR_MAP' }
  | { type: 'SYNC_MAP' }
  | { type: 'OPEN_GOLDEN_BOOT' }
  | { type: 'OPEN_TOURNAMENT_OVERVIEW' }
  | { type: 'CLOSE_PANEL' }
  | { type: 'COMPLETE_NODE' }
  | { type: 'PICK_SOCIAL_PLAYER'; playerId: string }
  | { type: 'SELECT_ITEM_OFFER'; itemId: string }
  | { type: 'EQUIP_ITEM'; playerId: string; item: PlayerItem }
  | { type: 'BEGIN_ITEM_SWAP'; playerId: string }
  | { type: 'SELECT_BAG_ITEM'; itemId: string }
  | { type: 'ASSIGN_ITEM_TO_PLAYER'; playerId: string }
  | { type: 'CANCEL_ITEM_UI' }
  | { type: 'UNEQUIP_ITEM'; playerId: string }
  | { type: 'PICK_RECRUIT_SUB'; newPlayer: SquadPlayer; replacePlayerId: string }
  | { type: 'PICK_INJURY_REPLACEMENT'; player: SquadPlayer }

function defaultMentality(nationId: string): Mentality {
  const a = getNation(nationId).archetype
  if (a === 'counter' || a === 'underdog') return 'counter'
  if (a === 'press') return 'press'
  return 'possession'
}

function markTaken(map: MapNode[], nodeId: string): MapNode[] {
  return map.map((n) => (n.id === nodeId ? { ...n, taken: true } : n))
}

function pickable(run: RunState): MapNode[] {
  return availableNodes(run)
}

function createFreshRun(nationId: string, mode: RunState['mode']): RunState {
  resetSquadIdCounter()
  const groupOpponentIds = rollGroupOpponents(nationId)
  const tournament = createTournament(nationId)
  const nation = getNation(nationId)
  return repairRunState({
    nationId,
    squad: syncSquadPhotos(createStarterSquad(nation), nationId),
    items: [],
    trophies: 0,
    maxTrophies: TROPHIES_TO_WIN,
    map: generateMap(tournament, nationId, Date.now()),
    groupOpponentIds,
    tournament,
    currentMapIndex: 0,
    currentNodeId: null,
    selectedNodeId: null,
    pendingMentality: defaultMentality(nationId),
    layer: 0,
    mode,
    legendPickUsed: false,
    groupResults: ['pending', 'pending', 'pending'],
    goldenBoot: [],
    layerSeeds: [Date.now()],
    itemBag: [],
    nationSquads: createNationSquads(nationId),
    nextMatchTraining: null,
  })
}

function advanceMapIfComplete(run: RunState, completedLayerIndex?: number): RunState {
  let completedIndex = completedLayerIndex ?? run.currentMapIndex
  if (completedLayerIndex === undefined) {
    for (let m = 0; m < MAP_COUNT; m++) {
      if (isMapComplete(run.map, m)) completedIndex = m
    }
  }

  if (!isMapComplete(run.map, completedIndex)) {
    const idx = firstIncompleteMapIndex(run.map)
    return syncRunMapState({ ...run, currentMapIndex: idx, layer: idx })
  }

  let next: RunState = { ...run, currentMapIndex: completedIndex, layer: completedIndex }
  const nextLayer = completedIndex + 1
  if (nextLayer < MAP_COUNT && !next.map.some((n) => n.layer === nextLayer)) {
    const tournament = advanceBackgroundAfterMap(next.tournament, next.nationId, completedIndex)
    next = {
      ...next,
      tournament,
      map: appendNextLayer(next, completedIndex),
      layerSeeds: [...(next.layerSeeds ?? []), Date.now()],
    }
  }

  const viewIndex = Math.min(MAP_COUNT - 1, nextLayer < MAP_COUNT ? nextLayer : completedIndex)
  return syncRunMapState({
    ...next,
    currentMapIndex: viewIndex,
    layer: viewIndex,
  })
}

function clearNodePending(): Partial<GameState> {
  return {
    pendingRecruits: null,
    pendingRecruitKind: 'squad',
    pendingItems: null,
    pendingItemOffers: null,
    pendingSelectedItemId: null,
    pendingMystery: null,
    pendingSocialPlayerId: null,
    pendingRecruitSubMode: false,
    pendingIncomingRecruit: null,
    mysteryMessage: null,
    pendingTrainingPlayerId: null,
    pendingNodeResult: null,
  }
}

function showNodeResult(
  state: GameState,
  run: RunState,
  result: { title?: string; message: string },
): GameState {
  return {
    ...state,
    run,
    pendingNodeResult: result,
    pendingRecruits: null,
    pendingRecruitKind: 'squad',
    pendingItems: null,
    pendingItemOffers: null,
    pendingSelectedItemId: null,
    pendingIncomingRecruit: null,
    pendingRecruitSubMode: false,
    pendingTrainingPlayerId: null,
    mysteryMessage: null,
  }
}

function completeCurrentNode(state: GameState): GameState {
  if (!state.run?.currentNodeId) {
    return { ...state, screen: 'map', ...clearNodePending() }
  }
  let run: RunState = {
    ...state.run,
    map: markTaken(state.run.map, state.run.currentNodeId),
    currentNodeId: null,
  }
  run = advanceMapIfComplete(run)
  return {
    ...state,
    screen: 'map',
    run: syncRunMapState(run),
    ...clearNodePending(),
  }
}

function applyFightResult(
  state: GameState,
  node: MapNode,
  mentality: Mentality,
  goalsFor: number,
  goalsAgainst: number,
  won: boolean,
  opponent: ReturnType<typeof planLiveMatch>['opponent'],
  goalEvents: ReturnType<typeof planLiveMatch>['goalEvents'],
  matchLines: ReturnType<typeof planLiveMatch>['lines'],
): GameState {
  if (!state.run) return state

  const isBoss = node.isBoss
  let goldenBoot = state.run.goldenBoot

  const isGroupBoss = isBoss && node.kind === 'group'
  const markNodeTaken = !isBoss || won || isGroupBoss // friendlies & side nodes always clear on play
  let runBase: RunState = {
    ...state.run,
    map: markNodeTaken ? markTaken(state.run.map, node.id) : state.run.map,
    layer: node.layer,
    currentNodeId: node.id,
    selectedNodeId: null,
    pendingMentality: mentality,
    goldenBoot,
  }

  const fwd = opponent.squad.filter((p) => p.role === 'ST' || p.role === 'WNG')
  const star = [...(fwd.length ? fwd : opponent.squad)].sort(
    (a, b) => effectivePlayerStats(b).shoot - effectivePlayerStats(a).shoot,
  )[0]!
  const stadium = stadiumForStage(node.layer, node.kind === 'final')

  const harsh = isBoss && (node.kind === 'knockout' || node.kind === 'final')
  const squadBeforeExp = runBase.squad.map((p) => ({ ...p }))
  const { squad: squadWithExp, expReport: rawExpReport } = awardMatchExperience(runBase.squad, {
    isBoss,
    won,
    nationId: runBase.nationId,
    goalEvents,
    lines: matchLines,
  })
  let squad = applyMatchDamage(squadWithExp, !won, harsh, isBoss)
  const expReport = attachStaminaLossToExpReport(rawExpReport, squadBeforeExp, squad)

  if (isBoss) {
    goldenBoot = addScorerGoals(
      goldenBoot,
      goalEvents.map((e) => ({ scorerName: e.scorerName, scorerNationId: e.scorerNationId })),
    )
    goldenBoot = addAssistEntries(
      goldenBoot,
      goalEvents
        .filter((e) => e.assistName && e.assistNationId)
        .map((e) => ({ playerName: e.assistName!, nationId: e.assistNationId! })),
    )
  }
  let nationSquads = ensureNationSquads(runBase)
  let tournament = runBase.tournament
  let groupResults = [...runBase.groupResults]
  const groupMdIdx =
    isGroupBoss && node.layer >= 0 && node.layer <= 2
      ? node.layer
      : node.stageId === 'md1'
        ? 0
        : node.stageId === 'md2'
          ? 1
          : node.stageId === 'md3'
            ? 2
            : -1
  if (isBoss && groupMdIdx >= 0) {
    groupResults[groupMdIdx] = won ? 'win' : 'loss'
  }

  if (isBoss && groupMdIdx >= 0) {
    const mdIdx = groupMdIdx
    const prevSimMd = tournament.simulatedMatchdays
    const recorded = recordPlayerGroupResult(
      tournament,
      runBase.nationId,
      mdIdx,
      goalsFor,
      goalsAgainst,
    )
    tournament = recorded.tournament
    goldenBoot = addScorerGoals(goldenBoot, recorded.extraScorers)
    goldenBoot = addAssistEntries(goldenBoot, recorded.extraAssists)
    if (tournament.simulatedMatchdays > prevSimMd) {
      nationSquads = evolveNationSquadsAfterMatchday(
        nationSquads,
        tournament,
        mdIdx,
        tournament.playerGroupId,
      )
    }
  }

  if (isBoss) {
    const baseOpp = stripDifficultyBoost(opponent.squad, node.difficulty ?? 2)
    nationSquads = updateNationSquadAfterFight(
      nationSquads,
      opponent.nation.id,
      baseOpp,
      !won,
      harsh,
      { isBoss, goalEvents, lines: matchLines },
    )
  }

  let trophies = runBase.trophies
  if (won && isBoss) trophies += 1

  const mapJustCompleted =
    isBoss && (won || isGroupBoss) && isMapComplete(runBase.map, node.layer)
  if (mapJustCompleted) {
    runBase = advanceMapIfComplete(
      {
        ...runBase,
        squad,
        tournament,
        groupResults,
        trophies,
        goldenBoot,
        nationSquads,
      },
      node.layer,
    )
  } else if (isGroupBoss && isMapComplete(runBase.map, node.layer)) {
    runBase = advanceMapIfComplete(
      { ...runBase, squad, tournament, groupResults, trophies, goldenBoot, nationSquads },
      node.layer,
    )
  } else {
    runBase = { ...runBase, squad, tournament, groupResults, trophies, goldenBoot, nationSquads }
  }
  if (isBoss) {
    runBase = { ...runBase, nextMatchTraining: null }
  }
  runBase = syncRunMapState({ ...runBase, currentNodeId: null })

  const lastBattle = {
    nodeId: node.id,
    goalsFor,
    goalsAgainst,
    won,
    opponentName: opponent.nation.name,
    opponentNationId: opponent.nation.id,
    opponentFlag: opponent.nation.flag,
    opponentStarName: star.name,
    opponentStarPhotoUrl: star.photoUrl,
    opponentSquad: opponent.squad,
    stadiumImageUrl: stadium.imageUrl,
    stadiumName: stadium.name,
    log: matchLines.map((l) => l.text),
    matchLines,
    wasBoss: isBoss,
    mapJustCompleted,
    expReport,
  }

  const eliminated =
    !won && isBoss && (node.kind === 'knockout' || node.kind === 'final' || node.kind === 'group')
  if (eliminated && (node.kind === 'knockout' || node.kind === 'final')) {
    return {
      ...state,
      screen: 'gameover',
      run: runBase,
      pendingFight: null,
      lastBattle: { ...lastBattle, log: [...lastBattle.log, 'Eliminated from the World Cup.'] },
    }
  }
  if (!won && !squadAlive(squad) && isBoss) {
    return {
      ...state,
      screen: 'gameover',
      run: { ...runBase, squad },
      pendingFight: null,
      lastBattle,
    }
  }

  if (won && node.kind === 'final') {
    return {
      ...state,
      screen: 'champion',
      run: runBase,
      pendingFight: null,
      hallOfLegends: state.hallOfLegends + 1,
      lastBattle,
    }
  }

  return {
    ...state,
    screen: 'match_exp',
    run: runBase,
    pendingFight: null,
    lastBattle,
  }
}

function resolveMystery(state: GameState, run: RunState, node: MapNode): GameState {
  const type = rollMysteryOutcome()
  const base = { ...state, run: { ...run, currentNodeId: node.id, layer: node.layer } }

  switch (type) {
    case 'injury': {
      const injured = run.squad[Math.floor(Math.random() * run.squad.length)]!
      const squad = run.squad.map((p) =>
        p.id === injured.id ? { ...p, hp: 0 } : p,
      )
      return {
        ...base,
        run: { ...run, squad, currentNodeId: node.id },
        screen: 'mystery',
        pendingMystery: { type, message: '' },
        mysteryMessage:
          injured.role === 'GK'
            ? `${injured.name} injured — pick a goalkeeper replacement.`
            : `${injured.name} injured — pick a replacement.`,
        pendingRecruits: generateRecruitOptions(run.nationId, squad, 3, { injuredPlayer: injured }),
      }
    }
    case 'social_good':
    case 'social_bad':
      return {
        ...base,
        screen: 'social',
        pendingMystery: { type, message: '' },
        mysteryMessage: null,
      }
    case 'item': {
      const offers = rollItemOffers(3, collectOwnedItemIds(run.squad, run.itemBag ?? []))
      if (offers.length === 0) {
        return {
          ...base,
          screen: 'mystery',
          pendingMystery: { type, message: 'Equipment cache — but you already own every item.' },
          mysteryMessage: 'Nothing new in the kit room.',
        }
      }
      return {
        ...base,
        screen: 'item_pick',
        pendingItemOffers: offers,
        pendingMystery: { type, message: 'Equipment cache found!' },
      }
    }
    case 'callup':
      return {
        ...base,
        screen: 'recruit',
        pendingRecruits: generateRecruitOptions(run.nationId, run.squad, 3),
        pendingRecruitKind: 'squad',
        pendingRecruitSubMode: true,
        pendingMystery: { type, message: 'Emergency call-up!' },
      }
    case 'legend':
      return {
        ...base,
        screen: 'legend',
        pendingRecruits: generateLegendOptions(run.nationId, 3),
        pendingRecruitKind: 'legend',
        pendingMystery: { type, message: 'A legend visits camp!' },
      }
    case 'recovery': {
      const heal = run.mode === 'ironman' ? 20 : 35
      const squad = run.squad.map((p) => ({
        ...p,
        hp: Math.min(p.maxHp, p.hp + heal),
      }))
      return {
        ...base,
        run: { ...run, squad, currentNodeId: node.id },
        screen: 'mystery',
        pendingMystery: { type, message: 'Mystery physio session — squad healed.' },
        mysteryMessage: 'The squad feels refreshed (+HP).',
      }
    }
    case 'friendly': {
      const oppId = mysteryFriendlyOpponent(run.nationId)
      const plan = planLiveMatch(
        run.squad,
        run.items,
        getNation(run.nationId),
        oppId,
        1,
        run.pendingMentality ?? defaultMentality(run.nationId),
        { friendlyCallUp: true },
      )
      return {
        ...base,
        screen: 'match_live',
        pendingFight: { nodeId: node.id, plan },
        pendingMystery: { type, message: 'Surprise friendly arranged!' },
      }
    }
    case 'boost': {
      const target = run.squad[Math.floor(Math.random() * run.squad.length)]!
      const squad = applyMysteryBoost(run.squad, target.id)
      return {
        ...base,
        run: { ...run, squad, currentNodeId: node.id },
        screen: 'mystery',
        pendingMystery: { type, message: '' },
        mysteryMessage: `${target.name} finds form in training (+stats).`,
      }
    }
    default:
      return { ...base, screen: 'map' }
  }
}

function resolveNode(state: GameState, node: MapNode, mentality: Mentality): GameState {
  if (!state.run || node.taken) return state

  const playerNation = getNation(state.run.nationId)
  const runBase: RunState = {
    ...state.run,
    layer: node.layer,
    currentNodeId: node.id,
    selectedNodeId: null,
    pendingMentality: mentality,
  }

  if (node.kind === 'start') {
    return completeCurrentNode({ ...state, run: runBase })
  }

  if (node.kind === 'recovery') {
    const heal = state.run.mode === 'ironman' ? 18 : 32
    const hostBonus = playerNation.isHost ? 8 : 0
    const total = heal + hostBonus
    const squad = runBase.squad.map((p) => ({
      ...p,
      hp: Math.min(p.maxHp, p.hp + total),
    }))
    return showNodeResult(
      { ...state, screen: 'map' },
      { ...runBase, squad },
      { title: 'Recovery', message: `Squad rested and healed (+${total} HP each).` },
    )
  }

  if (node.kind === 'recruit') {
    return {
      ...state,
      screen: 'recruit',
      run: runBase,
      pendingRecruits: generateRecruitOptions(runBase.nationId, runBase.squad, 3),
      pendingRecruitKind: 'squad',
      pendingRecruitSubMode: true,
    }
  }

  if (node.kind === 'legend') {
    if (runBase.legendPickUsed) {
      return showNodeResult(
        { ...state, screen: 'legend' },
        runBase,
        { message: 'Legend call-up already used this run.' },
      )
    }
    return {
      ...state,
      screen: 'legend',
      run: runBase,
      pendingRecruits: generateLegendOptions(runBase.nationId, 3),
      pendingRecruitKind: 'legend',
      pendingRecruitSubMode: true,
    }
  }

  if (node.kind === 'social') {
    return { ...state, screen: 'social', run: runBase, mysteryMessage: null }
  }

  if (node.kind === 'item') {
    const offers = rollItemOffers(3, collectOwnedItemIds(runBase.squad, runBase.itemBag ?? []))
    if (offers.length === 0) {
      return showNodeResult(
        { ...state, screen: 'item_pick' },
        runBase,
        { title: 'Equipment', message: 'You already own every piece of gear. Swap from the team panel or bag on the map.' },
      )
    }
    return {
      ...state,
      screen: 'item_pick',
      run: runBase,
      pendingItemOffers: offers,
    }
  }

  if (node.kind === 'mystery') {
    return resolveMystery(state, runBase, node)
  }

  if (node.kind === 'training') {
    return {
      ...state,
      screen: 'training',
      run: runBase,
      pendingTrainingPlayerId: runBase.squad[0]?.id ?? null,
    }
  }

  if (node.kind === 'training_session') {
    return {
      ...state,
      screen: 'training_session',
      run: runBase,
    }
  }

  if (node.kind === 'shop') {
    const shuffled = [...ITEM_POOL].sort(() => Math.random() - 0.5).slice(0, 3)
    return { ...state, screen: 'shop', run: runBase, pendingItems: shuffled }
  }

  if (isFightNode(node.kind) && node.opponentId) {
    const storedOpponentSquad =
      node.kind === 'friendly' ? undefined : getNationSquad(runBase, node.opponentId)
    const plan = planLiveMatch(
      runBase.squad,
      runBase.items,
      playerNation,
      node.opponentId,
      node.difficulty ?? 2,
      mentality,
      {
        friendlyCallUp: node.kind === 'friendly',
        storedOpponentSquad,
        officialMatch: node.isBoss,
        nextMatchTraining: node.isBoss ? (runBase.nextMatchTraining ?? null) : null,
      },
    )
    return {
      ...state,
      screen: 'match_live',
      run: runBase,
      pendingFight: { nodeId: node.id, plan },
    }
  }

  return completeCurrentNode({ ...state, run: runBase })
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'INIT':
      return buildInitialGameState()
    case 'BACK_MENU':
      clearRun()
      return emptyGameState(state.hallOfLegends)
    case 'SYNC_MAP':
      if (!state.run) return state
      return { ...state, run: syncRunMapState(state.run) }
    case 'REPAIR_MAP':
      if (!state.run) return state
      return { ...state, run: repairRunState(state.run) }
    case 'NEW_RUN':
      clearRun()
      return { ...emptyGameState(state.hallOfLegends), screen: 'nation', pendingMode: action.mode }
    case 'RESTART_RUN': {
      if (!state.run) return state
      const { nationId, mode } = state.run
      clearRun()
      const run = createFreshRun(nationId, mode)
      return {
        ...emptyGameState(state.hallOfLegends),
        screen: 'map',
        run,
        lastBattle: null,
        pendingFight: null,
        ...clearNodePending(),
      }
    }
    case 'PICK_NATION': {
      const run = createFreshRun(action.nationId, state.pendingMode)
      return { ...state, screen: 'map', run, lastBattle: null, pendingFight: null, ...clearNodePending() }
    }
    case 'FINISH_MATCH': {
      if (!state.run || !state.pendingFight) return state
      const fight = state.pendingFight
      const mapIdx = firstIncompleteMapIndex(state.run.map)
      let node =
        state.run.map.find((n) => n.id === fight.nodeId && n.layer === mapIdx) ??
        state.run.map.find((n) => n.id === fight.nodeId)
      if (!node) {
        node = state.run.map.find(
          (n) => n.isBoss && n.layer === mapIdx && !n.taken,
        )
      }
      if (!node || node.taken) {
        return {
          ...state,
          screen: 'map',
          run: syncRunMapState(state.run),
          pendingFight: null,
          lastBattle: null,
        }
      }
      const mentality = state.run.pendingMentality ?? defaultMentality(state.run.nationId)
      const { plan } = fight
      return applyFightResult(
        state,
        node,
        mentality,
        plan.goalsFor,
        plan.goalsAgainst,
        plan.won,
        plan.opponent,
        plan.goalEvents,
        plan.lines,
      )
    }
    case 'SET_MENTALITY':
      if (!state.run) return state
      return { ...state, run: { ...state.run, pendingMentality: action.mentality } }
    case 'TRAVEL_TO_NODE': {
      if (!state.run) return state
      const node = pickable(state.run).find((n) => n.id === action.nodeId)
      if (!node) return state
      const mentality = state.run.pendingMentality ?? defaultMentality(state.run.nationId)
      return resolveNode(state, node, mentality)
    }
    case 'CONTINUE_AFTER_BATTLE': {
      if (!state.run) return state
      if (!squadAlive(state.run.squad)) {
        return { ...state, screen: 'gameover', run: state.run }
      }
      let run = state.run
      const foughtId = state.lastBattle?.nodeId
      if (foughtId) {
        const mapIdx = firstIncompleteMapIndex(run.map)
        const fought =
          run.map.find((n) => n.id === foughtId && n.layer === mapIdx) ??
          run.map.find((n) => n.id === foughtId)
        if (fought && !fought.taken) {
          run = {
            ...run,
            map: markTaken(run.map, foughtId),
            currentNodeId: null,
          }
          if (fought.isBoss && fought.kind === 'group') {
            run = advanceMapIfComplete(run, fought.layer)
          }
        }
      }
      if (state.lastBattle?.mapJustCompleted) {
        return { ...state, screen: 'tournament_report', run: syncRunMapState(run), lastBattle: null }
      }
      return { ...state, screen: 'map', run: syncRunMapState(run), lastBattle: null }
    }
    case 'DISMISS_TOURNAMENT_REPORT':
      return { ...state, screen: 'map', run: state.run ? syncRunMapState(state.run) : null }
    case 'PICK_RECRUIT': {
      if (!state.run) return state
      if (state.pendingRecruitSubMode) {
        return {
          ...state,
          pendingIncomingRecruit: action.player,
          pendingRecruits: [action.player],
        }
      }
      let squad = [...state.run.squad]
      if (squad.length < MAX_SQUAD) squad.push(action.player)
      else squad[squad.length - 1] = action.player
      const legendPickUsed =
        state.pendingRecruitKind === 'legend' ? true : state.run.legendPickUsed
      return showNodeResult(
        state,
        { ...state.run, squad, legendPickUsed },
        { message: `${action.player.name} joined the squad.` },
      )
    }
    case 'PICK_RECRUIT_SUB': {
      if (!state.run) return state
      if (!canReplaceKeepingGk(state.run.squad, action.replacePlayerId, action.newPlayer)) {
        return {
          ...state,
          mysteryMessage: 'You must keep at least one goalkeeper in the squad.',
        }
      }
      const replaced = state.run.squad.find((p) => p.id === action.replacePlayerId)
      const squad = state.run.squad.map((p) =>
        p.id === action.replacePlayerId ? action.newPlayer : p,
      )
      const legendPickUsed =
        state.pendingRecruitKind === 'legend' ? true : state.run.legendPickUsed
      return showNodeResult(
        state,
        { ...state.run, squad, legendPickUsed },
        {
          message: replaced
            ? `${action.newPlayer.name} replaced ${replaced.name}.`
            : `${action.newPlayer.name} joined the squad.`,
        },
      )
    }
    case 'PICK_INJURY_REPLACEMENT': {
      if (!state.run) return state
      const injuredIdx = state.run.squad.findIndex((p) => p.hp <= 0)
      const injured = injuredIdx >= 0 ? state.run.squad[injuredIdx] : null
      if (
        injured &&
        !canReplaceKeepingGk(state.run.squad, injured.id, action.player)
      ) {
        return {
          ...state,
          mysteryMessage: 'Your injured player was the only goalkeeper — pick a GK.',
        }
      }
      const squad = state.run.squad.map((p, i) => (i === injuredIdx ? action.player : p))
      return showNodeResult(
        state,
        { ...state.run, squad },
        { title: 'Emergency call-up', message: `${action.player.name} steps in for the injured player.` },
      )
    }
    case 'SKIP_RECRUIT':
      return state.run
        ? showNodeResult(state, state.run, { message: 'Call-up skipped.' })
        : state
    case 'PICK_TRAINING_SECTOR': {
      if (!state.run) return state
      const bonus = action.sector === 'team' ? 1 : 2
      const training = { sector: action.sector, bonus }
      return showNodeResult(
        state,
        { ...state.run, nextMatchTraining: training },
        {
          title: 'Training Session',
          message: trainingBuffSummary(training),
        },
      )
    }
    case 'PICK_TRAINING': {
      if (!state.run) return state
      const player = state.run.squad.find((p) => p.id === action.playerId)
      const statLabels: Record<keyof SquadPlayer['stats'], string> = {
        pace: 'Pace',
        shoot: 'Shooting',
        pass: 'Passing',
        defend: 'Defending',
      }
      const squad = state.run.squad.map((p) =>
        p.id === action.playerId
          ? {
              ...p,
              stats: {
                ...p.stats,
                [action.stat]: Math.min(99, p.stats[action.stat] + 6),
              },
            }
          : p,
      )
      return showNodeResult(
        state,
        { ...state.run, squad },
        {
          title: 'Training',
          message: player
            ? `${player.name}: +6 ${statLabels[action.stat]}`
            : `+6 ${statLabels[action.stat]}`,
        },
      )
    }
    case 'PICK_ITEM':
      if (!state.run) return state
      return showNodeResult(
        state,
        { ...state.run, items: [...state.run.items, action.item] },
        { title: 'Equipment drop', message: `Picked up ${action.item.name}.` },
      )
    case 'SKIP_ITEM':
      return state.run
        ? showNodeResult(state, state.run, { message: 'Skipped the equipment drop.' })
        : state
    case 'SKIP_EQUIP':
      return state.run
        ? showNodeResult(state, state.run, { message: 'Left the gear behind.' })
        : state
    case 'OPEN_GOLDEN_BOOT':
      return { ...state, screen: 'golden_boot' }
    case 'OPEN_TOURNAMENT_OVERVIEW':
      return { ...state, screen: 'tournament_overview' }
    case 'CLOSE_PANEL':
      return { ...state, screen: 'map' }
    case 'COMPLETE_NODE':
      return completeCurrentNode(state)
    case 'PICK_SOCIAL_PLAYER': {
      if (!state.run) return state
      const good = Math.random() < 0.55
      const { squad, message } = applySocialOutcome(state.run.squad, action.playerId, good)
      return showNodeResult(
        state,
        { ...state.run, squad },
        { title: 'Social event', message },
      )
    }
    case 'SELECT_ITEM_OFFER':
      return { ...state, pendingSelectedItemId: action.itemId }
    case 'EQUIP_ITEM': {
      if (!state.run) return state
      const player = state.run.squad.find((p) => p.id === action.playerId)
      const { squad, bag } = equipItemOnPlayer(
        state.run.squad,
        state.run.itemBag ?? [],
        action.playerId,
        action.item.id,
      )
      return showNodeResult(
        state,
        { ...state.run, squad, itemBag: bag },
        {
          title: 'Equipment',
          message: player
            ? `${player.name} equipped ${action.item.name}.`
            : `Equipped ${action.item.name}.`,
        },
      )
    }
    case 'BEGIN_ITEM_SWAP':
      if (!state.run) return state
      return {
        ...state,
        pendingItemSwapFromPlayerId: action.playerId,
        pendingBagEquipItemId: null,
      }
    case 'SELECT_BAG_ITEM':
      return {
        ...state,
        pendingBagEquipItemId: action.itemId,
        pendingItemSwapFromPlayerId: null,
      }
    case 'ASSIGN_ITEM_TO_PLAYER': {
      if (!state.run) return state
      let squad = state.run.squad
      let bag = state.run.itemBag ?? []

      if (state.pendingItemSwapFromPlayerId) {
        const result = transferEquippedItem(
          squad,
          bag,
          state.pendingItemSwapFromPlayerId,
          action.playerId,
        )
        squad = result.squad
        bag = result.bag
      } else if (state.pendingBagEquipItemId) {
        const result = equipItemOnPlayer(squad, bag, action.playerId, state.pendingBagEquipItemId)
        squad = result.squad
        bag = result.bag
      } else {
        return state
      }

      return {
        ...state,
        run: { ...state.run, squad, itemBag: bag },
        pendingItemSwapFromPlayerId: null,
        pendingBagEquipItemId: null,
      }
    }
    case 'CANCEL_ITEM_UI':
      return {
        ...state,
        pendingItemSwapFromPlayerId: null,
        pendingBagEquipItemId: null,
      }
    case 'UNEQUIP_ITEM': {
      if (!state.run) return state
      const { squad, bag } = unequipItemFromPlayer(
        state.run.squad,
        state.run.itemBag ?? [],
        action.playerId,
      )
      return {
        ...state,
        run: { ...state.run, squad, itemBag: bag },
        pendingItemSwapFromPlayerId: null,
        pendingBagEquipItemId: null,
      }
    }
    default:
      return state
  }
}

type GameContextValue = {
  state: GameState
  dispatch: React.Dispatch<Action>
  persist: () => void
  available: MapNode[]
  playerNation: ReturnType<typeof getNation> | null
}

const GameContext = createContext<GameContextValue | null>(null)

function resolveInitialState(bootState?: GameState): GameState {
  if (import.meta.hot?.data.gameState) {
    return import.meta.hot.data.gameState as GameState
  }
  return bootState ?? buildInitialGameState()
}

export function GameProvider({
  children,
  initialState: bootState,
}: {
  children: ReactNode
  initialState?: GameState
}) {
  const [state, dispatch] = useReducer(reducer, bootState, resolveInitialState)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (!import.meta.hot) return
    import.meta.hot.dispose((data) => {
      data.gameState = stateRef.current
    })
  }, [])

  const persist = useCallback(() => {
    saveRun(state)
  }, [state])

  const value = useMemo((): GameContextValue => {
    const available = state.run ? pickable(state.run) : []
    const playerNation = state.run ? getNation(state.run.nationId) : null
    return { state, dispatch, persist, available, playerNation }
  }, [state])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame outside provider')
  return ctx
}
