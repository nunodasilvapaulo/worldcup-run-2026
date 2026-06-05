import { useState, type ReactNode } from 'react'

import { AnchoredHoverTooltip } from '@/components/AnchoredHoverTooltip'

import { BattleModal } from '@/components/BattleModal'

import { PlayerAvatar } from '@/components/PlayerAvatar'

import { PlayerProfilePanel } from '@/components/PlayerProfilePanel'

import { PlayerStatTooltipContent } from '@/components/PlayerStatTooltip'

import { NationFlag } from '@/components/NationFlag'

import { getNation } from '@/game/nations2026'

import { lookupPlayerPhoto } from '@/game/players2026'

import { findPlayerInRun } from '@/game/squad'

import { topAssistsList, topScorersList } from '@/game/tournament'

import { useGame } from '@/game/store'

import type { ScorerEntry, SquadPlayer } from '@/game/types'



function LeaderboardPlayerRow({

  entry,

  rank,

  statLabel,

  run,

  onPlayerClick,

}: {

  entry: ScorerEntry

  rank: number

  statLabel: ReactNode

  run: import('@/game/types').RunState

  onPlayerClick: (player: SquadPlayer) => void

}) {

  const player = findPlayerInRun(run, entry.nationId, entry.playerName)

  const nation = getNation(entry.nationId)



  const row = (

    <button

      type="button"

      onClick={() => onPlayerClick(player)}

      className="w-full flex justify-between items-center bg-black/40 hover:bg-black/55 hover:ring-1 hover:ring-[var(--color-wc-gold)]/30 rounded-lg px-3 py-2 transition-all cursor-pointer text-left"

    >

      <span className="flex items-center gap-2 text-sm text-white min-w-0">

        <span className="text-white/40 w-4 shrink-0">{rank}</span>

        <PlayerAvatar

          name={entry.playerName}

          photoUrl={player.photoUrl || lookupPlayerPhoto(entry.playerName, entry.nationId, run.squad)}

          nationId={entry.nationId}

          size={32}

        />

        <span className="truncate">{entry.playerName}</span>

        <NationFlag nationId={entry.nationId} size={18} />

        <span className="text-white/40 text-xs truncate hidden sm:inline">{nation.name}</span>

      </span>

      <span className="font-bold shrink-0 ml-2">{statLabel}</span>

    </button>

  )



  return (

    <AnchoredHoverTooltip

      content={<PlayerStatTooltipContent player={player} />}

      width={210}

      preferSide="right"

    >

      {row}

    </AnchoredHoverTooltip>

  )

}



export function GoldenBootScreen() {

  const { state, dispatch } = useGame()

  const run = state.run!

  const scorers = topScorersList(run.goldenBoot, 15)

  const assisters = topAssistsList(run.goldenBoot, 15).filter((a) => a.assists > 0)

  const [selectedPlayer, setSelectedPlayer] = useState<{

    player: SquadPlayer

    nationId: string

  } | null>(null)



  const openProfile = (player: SquadPlayer, nationId: string) => {

    setSelectedPlayer({ player, nationId })

  }



  return (

    <>

      <div className="min-h-dvh p-6 max-w-lg mx-auto">

        <h2 className="text-2xl font-bold text-[var(--color-wc-gold-light)]">Golden Boot & Playmaker</h2>

        <p className="text-white/50 text-sm mb-1">Goals and assists from World Cup matches only.</p>

        <p className="text-white/35 text-[10px] mb-6">Hover for stats · click for profile</p>



        <h3 className="text-sm font-bold text-[var(--color-wc-gold)] mb-2">Top scorers</h3>

        <div className="space-y-2 mb-6">

          {scorers.length === 0 && <p className="text-white/40 text-sm">No goals yet.</p>}

          {scorers.map((s, i) => (

            <LeaderboardPlayerRow

              key={`${s.nationId}-${s.playerName}`}

              entry={s}

              rank={i + 1}

              statLabel={<span className="text-[var(--color-wc-gold-light)]">{s.goals}⚽</span>}

              run={run}

              onPlayerClick={(player) => openProfile(player, s.nationId)}

            />

          ))}

        </div>



        <h3 className="text-sm font-bold text-[var(--color-wc-gold)] mb-2">Top assists</h3>

        <div className="space-y-2 mb-8">

          {assisters.length === 0 && (

            <p className="text-white/40 text-sm">No assists tracked yet.</p>

          )}

          {assisters.map((s, i) => (

            <LeaderboardPlayerRow

              key={`a-${s.nationId}-${s.playerName}`}

              entry={s}

              rank={i + 1}

              statLabel={<span className="text-emerald-400">{s.assists} 🅰️</span>}

              run={run}

              onPlayerClick={(player) => openProfile(player, s.nationId)}

            />

          ))}

        </div>



        <button

          type="button"

          onClick={() => dispatch({ type: 'CLOSE_PANEL' })}

          className="w-full rounded-xl bg-[var(--color-wc-green)] py-3 font-bold text-white"

        >

          Back to map

        </button>

      </div>



      {selectedPlayer && (

        <BattleModal title="Player profile" onClose={() => setSelectedPlayer(null)}>

          <PlayerProfilePanel

            player={selectedPlayer.player}

            nationId={selectedPlayer.nationId}

            nationName={getNation(selectedPlayer.nationId).name}

            goldenBoot={run.goldenBoot}

            inWorldCup

          />

        </BattleModal>

      )}

    </>

  )

}


