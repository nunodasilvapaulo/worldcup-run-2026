import { generateMap, isValidRunShape, repairRunState, rollGroupOpponents } from './mapGen'
import { getNation } from './nations2026'
import { TROPHIES_TO_WIN } from './constants'
import { createTournament } from './tournament'
import { ensureNationSquads, migratePlayerLevel, syncSquadPhotos } from './squad'
import { loadMeta, loadRun } from './storage'
import type { GameState, RunState } from './types'

function defaultMentality(nationId: string) {
  const a = getNation(nationId).archetype
  if (a === 'counter' || a === 'underdog') return 'counter' as const
  if (a === 'press') return 'press' as const
  return 'possession' as const
}

function migrateRun(run: RunState): RunState {
  const groupOpponentIds = run.groupOpponentIds ?? rollGroupOpponents(run.nationId)
  const tournamentRaw =
    run.tournament?.groups?.length ? run.tournament : createTournament(run.nationId)
  const tournament = {
    ...tournamentRaw,
    simulatedMatchdays: tournamentRaw.simulatedMatchdays ?? 0,
    recentHeadlines: tournamentRaw.recentHeadlines ?? [],
    qualificationNote: tournamentRaw.qualificationNote ?? '',
  }
  const map =
    run.map?.length && run.map[0]?.stageId && run.map.some((n) => n.isBoss)
      ? run.map
      : generateMap(tournament, run.nationId, run.layerSeeds?.[0] ?? Date.now())
  return repairRunState({
    ...run,
    groupOpponentIds,
    tournament,
    map,
    legendPickUsed: run.legendPickUsed ?? false,
    groupResults: run.groupResults ?? ['pending', 'pending', 'pending'],
    goldenBoot: (run.goldenBoot ?? []).map((e) => ({ ...e, assists: e.assists ?? 0 })),
    layerSeeds: run.layerSeeds ?? [],
    squad: syncSquadPhotos(
      run.squad.map((p) => ({
        ...p,
        name: p.name ?? p.label ?? 'Player',
        label: p.label ?? p.name ?? 'Player',
        photoUrl: p.photoUrl ?? '',
        equippedItemId: p.equippedItemId ?? null,
        level: migratePlayerLevel(p.level),
      })),
      run.nationId,
    ),
    selectedNodeId: run.selectedNodeId ?? null,
    pendingMentality: run.pendingMentality ?? defaultMentality(run.nationId),
    maxTrophies: TROPHIES_TO_WIN,
    itemBag: run.itemBag ?? [],
    nationSquads: ensureNationSquads(run),
    nextMatchTraining: run.nextMatchTraining ?? null,
  })
}

export function emptyGameState(hallOfLegends: number): GameState {
  return {
    screen: 'menu',
    pendingMode: 'normal',
    run: null,
    lastBattle: null,
    pendingRecruits: null,
    pendingRecruitKind: 'squad',
    pendingItems: null,
    pendingTrainingPlayerId: null,
    pendingFight: null,
    pendingMystery: null,
    pendingSocialPlayerId: null,
    pendingItemOffers: null,
    pendingEquipPlayerId: null,
    pendingRecruitSubMode: false,
    pendingSelectedItemId: null,
    pendingIncomingRecruit: null,
    mysteryMessage: null,
    pendingItemSwapFromPlayerId: null,
    pendingBagEquipItemId: null,
    pendingNodeResult: null,
    hallOfLegends,
  }
}

export function buildInitialGameState(opts?: {
  hallOfLegends?: number
  saved?: Partial<GameState> | null
}): GameState {
  const meta = opts?.hallOfLegends != null ? { hallOfLegends: opts.hallOfLegends } : loadMeta()
  const saved = opts?.saved !== undefined ? opts.saved : loadRun()

  if (saved?.run && saved.screen && saved.screen !== 'menu' && saved.screen !== 'nation') {
    if (!isValidRunShape(saved.run as RunState)) {
      return emptyGameState(meta.hallOfLegends)
    }
    const run = migrateRun(saved.run as RunState)
    const savedScreen = saved.screen as GameState['screen']
    const lastBattle = saved.lastBattle ?? null
    const pendingFight = saved.pendingFight ?? null
    let screen: GameState['screen'] = savedScreen
    if (savedScreen === 'match_live' && !pendingFight) screen = 'map'
    if ((savedScreen === 'match_exp' || savedScreen === 'battle') && !lastBattle) screen = 'map'
    return {
      screen,
      pendingMode: (saved.run as RunState)?.mode ?? 'normal',
      run,
      lastBattle,
      pendingRecruits: null,
      pendingRecruitKind: 'squad',
      pendingItems: null,
      pendingTrainingPlayerId: null,
      pendingFight,
      pendingMystery: null,
      pendingSocialPlayerId: null,
      pendingItemOffers: null,
      pendingEquipPlayerId: null,
      pendingRecruitSubMode: false,
      pendingSelectedItemId: null,
      pendingIncomingRecruit: null,
      mysteryMessage: null,
      pendingItemSwapFromPlayerId: null,
      pendingBagEquipItemId: null,
      pendingNodeResult: null,
      hallOfLegends: saved.hallOfLegends ?? meta.hallOfLegends,
    }
  }
  return emptyGameState(meta.hallOfLegends)
}
