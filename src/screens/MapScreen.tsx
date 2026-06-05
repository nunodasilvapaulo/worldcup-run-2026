import { useEffect, useMemo, useState } from 'react'
import { BattleModal } from '@/components/BattleModal'
import { PlayerProfilePanel } from '@/components/PlayerProfilePanel'
import { MENTALITY_LABELS, MAP_STAGES, stageForLayer } from '@/game/constants'
import { firstIncompleteMapIndex } from '@/game/mapGen'
import { getNation } from '@/game/nations2026'
import { stadiumForStage } from '@/game/stadiums2026'
import { bossOpponentId } from '@/game/tournament'
import { MapPathView } from '@/components/MapPathView'
import { NationFlag } from '@/components/NationFlag'
import { StadiumPitch } from '@/components/StadiumPitch'
import { TournamentStatus } from '@/components/TournamentStatus'
import { ItemBag } from '@/components/ItemBag'
import { RunActions } from '@/components/RunActions'
import { SquadCard } from '@/components/SquadCard'
import { getPlayerItem } from '@/game/playerItems'
import { trainingBuffSummary } from '@/game/trainingBuff'
import { useGame } from '@/game/store'
import type { Mentality, SquadPlayer } from '@/game/types'

export function MapScreen() {
  const { state, dispatch, available, playerNation } = useGame()
  const [selectedPlayer, setSelectedPlayer] = useState<SquadPlayer | null>(null)
  const run = state.run
  const mapIndex = run ? firstIncompleteMapIndex(run.map) : 0
  const stage = stageForLayer(mapIndex)
  const layerNodes = run ? run.map.filter((n) => n.layer === mapIndex) : []
  const mentality = run?.pendingMentality ?? 'possession'
  const stadium = useMemo(
    () => stadiumForStage(mapIndex, stage.id === 'final'),
    [mapIndex, stage.id],
  )
  const availableIds = useMemo(() => new Set(available.map((a) => a.id)), [available])

  const startNode = layerNodes.find((n) => n.kind === 'start' && !n.taken)

  useEffect(() => {
    if (!run) return
    dispatch({ type: 'SYNC_MAP' })
  }, [run?.nationId, dispatch])

  useEffect(() => {
    if (!run || available.length > 0) return
    if (layerNodes.length === 0) dispatch({ type: 'REPAIR_MAP' })
  }, [available.length, layerNodes.length, dispatch, run])

  const startPickable = startNode ? availableIds.has(startNode.id) : false

  useEffect(() => {
    if (!run || !startNode || !startPickable) return
    dispatch({ type: 'TRAVEL_TO_NODE', nodeId: startNode.id })
  }, [mapIndex, startNode?.id, startPickable, dispatch, run, startNode])

  const itemAssignMode =
    state.pendingItemSwapFromPlayerId !== null || state.pendingBagEquipItemId !== null
  const swapSource = state.pendingItemSwapFromPlayerId
    ? run?.squad.find((p) => p.id === state.pendingItemSwapFromPlayerId)
    : null
  const bagItem = state.pendingBagEquipItemId
    ? getPlayerItem(state.pendingBagEquipItemId)
    : null

  if (!run) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <p className="text-white/70">No active run loaded.</p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'BACK_MENU' })}
          className="mt-4 rounded-xl bg-[var(--color-wc-green)] px-6 py-3 font-bold text-white"
        >
          Back to menu
        </button>
      </div>
    )
  }

  if (available.length === 0 && layerNodes.every((n) => n.taken)) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <p className="text-white/70">Run complete or map is stuck.</p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'BACK_MENU' })}
          className="mt-4 rounded-xl bg-[var(--color-wc-green)] px-6 py-3 font-bold text-white"
        >
          Back to menu
        </button>
      </div>
    )
  }

  const groupId = run.tournament.playerGroupId
  const groupNations =
    run.tournament.groups.find((g) => g.id === groupId)?.nationIds.map((id) => getNation(id)) ?? []

  return (
    <>
    <div className="h-dvh flex flex-col bg-[#0a1628] overflow-hidden">
      <header
        className="shrink-0 border-b border-[var(--color-wc-gold)]/30 px-4 py-2 flex flex-wrap justify-between gap-2 bg-black/70"
        style={{ borderTop: `3px solid ${playerNation?.colors[0]}` }}
      >
        <div>
          <p className="text-base font-bold text-[var(--color-wc-gold-light)] flex items-center gap-2">
            {playerNation && <NationFlag nationId={playerNation.id} size={28} />}
            {playerNation?.name}
          </p>
          <p className="text-[11px] text-white/55">
            Map {mapIndex + 1}/{MAP_STAGES.length} · {stage.label} · 🏆 {run.trophies}/{run.maxTrophies}
          </p>
          {run.nextMatchTraining && (
            <p className="text-[10px] text-emerald-400/90 mt-0.5">
              🏋️ {trainingBuffSummary(run.nextMatchTraining)}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[10px] text-[var(--color-wc-gold)]/80">Group {groupId}:</span>
            {groupNations.map((n) => (
              <span key={n.id} className="flex items-center gap-1 text-[10px] text-white/60">
                <NationFlag nationId={n.id} size={16} />
                {n.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <RunActions compact />
          <div className="flex gap-0.5 items-center">
            {MAP_STAGES.map((s, i) => (
              <span
                key={s.id}
                title={s.label}
                className={[
                  'w-2 h-6 rounded-sm',
                  i < mapIndex ? 'bg-[var(--color-wc-gold)]' : i === mapIndex ? 'bg-[var(--color-wc-gold)]/50' : 'bg-white/10',
                ].join(' ')}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Team panel — Pokelike left */}
        <aside className="lg:w-[200px] shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/50 p-3 flex flex-col min-h-0">
          <p className="text-[10px] uppercase tracking-widest text-white/45 mb-2">Team</p>
          {itemAssignMode && (
            <div className="mb-2 rounded-lg border border-[var(--color-wc-gold)]/40 bg-[var(--color-wc-gold)]/10 px-2 py-1.5">
              <p className="text-[9px] text-[var(--color-wc-gold-light)] leading-snug">
                {swapSource?.equippedItemId
                  ? `Tap a player to give them ${getPlayerItem(swapSource.equippedItemId)?.name ?? 'gear'}`
                  : bagItem
                    ? `Tap a player to equip ${bagItem.name}`
                    : 'Pick a player'}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {swapSource?.equippedItemId && (
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: 'UNEQUIP_ITEM', playerId: state.pendingItemSwapFromPlayerId! })
                    }
                    className="text-[9px] text-emerald-300/90 underline"
                  >
                    Unequip to bag
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'CANCEL_ITEM_UI' })}
                  className="text-[9px] text-white/50 underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <div className="space-y-2 flex-1 min-h-0 max-h-[140px] lg:max-h-[calc(100vh-280px)] overflow-auto">
            {run.squad.map((p) => (
              <SquadCard
                key={p.id}
                player={p}
                nationId={run.nationId}
                nextMatchTraining={run.nextMatchTraining}
                compact
                highlight={itemAssignMode && p.id !== state.pendingItemSwapFromPlayerId}
                onClick={
                  itemAssignMode && p.id !== state.pendingItemSwapFromPlayerId
                    ? () => dispatch({ type: 'ASSIGN_ITEM_TO_PLAYER', playerId: p.id })
                    : !itemAssignMode
                      ? () => setSelectedPlayer(p)
                      : undefined
                }
                onItemClick={
                  p.equippedItemId && !itemAssignMode
                    ? () => dispatch({ type: 'BEGIN_ITEM_SWAP', playerId: p.id })
                    : undefined
                }
              />
            ))}
          </div>
          <ItemBag
            itemIds={run.itemBag ?? []}
            selectedId={state.pendingBagEquipItemId}
            onSelect={(id) => dispatch({ type: 'SELECT_BAG_ITEM', itemId: id })}
          />
        </aside>

        {/* Central map path */}
        <main className="flex-1 min-h-0 flex flex-col relative">
          <StadiumPitch stadium={stadium}>
            <div className="p-2 lg:p-3 flex-1 min-h-0 flex flex-col">
              <MapPathView
                nodes={layerNodes}
                availableIds={availableIds}
                stageLabel={`${stage.label} — choose your path to the boss`}
                onSelect={(nodeId) => dispatch({ type: 'TRAVEL_TO_NODE', nodeId })}
                ironman={run.mode === 'ironman'}
                isHost={playerNation?.isHost}
              />
            </div>
          </StadiumPitch>
        </main>

        {/* Right panel — tactics + tournament */}
        <aside className="lg:w-[220px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-black/50 p-3 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/45 mb-2">Tactics</p>
            <div className="flex flex-wrap lg:flex-col gap-1.5">
              {(['press', 'counter', 'possession'] as Mentality[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => dispatch({ type: 'SET_MENTALITY', mentality: m })}
                  className={[
                    'rounded-lg px-2 py-1 text-[10px] font-medium border w-full text-left',
                    mentality === m
                      ? 'border-[var(--color-wc-gold)] bg-[var(--color-wc-gold)]/25 text-white'
                      : 'border-white/15 text-white/60',
                  ].join(' ')}
                >
                  {MENTALITY_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: 'OPEN_TOURNAMENT_OVERVIEW' })}
              className="w-full rounded-lg border border-[var(--color-wc-gold)]/40 bg-[var(--color-wc-gold)]/10 py-2 text-[10px] font-bold text-[var(--color-wc-gold-light)]"
            >
              Full tournament
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'OPEN_GOLDEN_BOOT' })}
              className="w-full rounded-lg border border-white/15 py-2 text-[10px] font-medium text-white/70"
            >
              Golden Boot & assists
            </button>
          </div>
          <TournamentStatus run={run} />
          {layerNodes.find((n) => n.isBoss)?.opponentId && (
            <p className="text-[10px] text-white/50 text-center flex items-center justify-center gap-1.5">
              Next boss:
              <NationFlag nationId={bossOpponentId(run.tournament, mapIndex)} size={18} />
              {getNation(bossOpponentId(run.tournament, mapIndex)).name}
            </p>
          )}
        </aside>
      </div>
    </div>

    {selectedPlayer && playerNation && (
      <BattleModal title="Player profile" onClose={() => setSelectedPlayer(null)}>
        <PlayerProfilePanel
          player={selectedPlayer}
          nationId={run.nationId}
          nationName={playerNation.name}
          goldenBoot={run.goldenBoot}
          inWorldCup
        />
      </BattleModal>
    )}
    </>
  )
}
