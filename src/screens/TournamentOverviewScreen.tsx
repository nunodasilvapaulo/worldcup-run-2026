import { useMemo, useState } from 'react'
import { AnchoredHoverTooltip } from '@/components/AnchoredHoverTooltip'
import { BattleModal } from '@/components/BattleModal'
import { NationFlag } from '@/components/NationFlag'
import { PlayerProfilePanel } from '@/components/PlayerProfilePanel'
import { SquadRosterPanel } from '@/components/SquadRosterPanel'
import { TeamPagePanel } from '@/components/TeamPagePanel'
import { getNation } from '@/game/nations2026'
import { getNationSquad } from '@/game/squad'
import { useGame } from '@/game/store'
import { computeThirdQualifiers, sortStandings } from '@/game/tournament'
import type { GroupStanding, Nation, SquadPlayer } from '@/game/types'

function TournamentTeamRow({
  nationId,
  rank,
  standing,
  isYou,
  squad,
  qualTag,
  onTeamClick,
}: {
  nationId: string
  rank: number
  standing: GroupStanding
  isYou: boolean
  squad: SquadPlayer[]
  qualTag?: 'auto' | 'best-third' | null
  onTeamClick: () => void
}) {
  const nation = getNation(nationId)

  const row = (
    <button
      type="button"
      onClick={onTeamClick}
      className={[
        'w-full flex justify-between items-center py-1.5 px-1 -mx-1 rounded-lg transition-colors text-left',
        isYou ? 'text-white font-medium hover:bg-white/10' : 'text-white/55 hover:bg-white/5 hover:text-white/75',
        qualTag === 'auto' ? 'bg-[var(--color-wc-green)]/10' : '',
        qualTag === 'best-third' ? 'bg-amber-500/15 ring-1 ring-amber-400/35' : '',
      ].join(' ')}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="tabular-nums text-white/40 w-4 shrink-0">{rank}.</span>
        <NationFlag nationId={nationId} size={16} />
        <span className="truncate">{nation.name}</span>
        {isYou && (
          <span className="shrink-0 text-[8px] font-bold uppercase tracking-wide text-[var(--color-wc-gold)]">
            You
          </span>
        )}
        {qualTag === 'best-third' && (
          <span className="shrink-0 text-[7px] font-bold uppercase tracking-wide text-amber-300/90">
            Best 3rd
          </span>
        )}
      </span>
      <span className="tabular-nums shrink-0 ml-2">
        {standing.points}p · {standing.gf}-{standing.ga}
      </span>
    </button>
  )

  return (
    <AnchoredHoverTooltip
      content={<SquadRosterPanel squad={squad} nationId={nationId} nationName={nation.name} />}
      width={220}
      preferSide="right"
    >
      {row}
    </AnchoredHoverTooltip>
  )
}

export function TournamentOverviewScreen() {
  const { state, dispatch, playerNation } = useGame()
  const run = state.run!
  const t = run.tournament

  const [selectedTeam, setSelectedTeam] = useState<{
    nation: Nation
    squad: SquadPlayer[]
  } | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<{
    player: SquadPlayer
    nation: Nation
  } | null>(null)

  const bestThirds = useMemo(() => new Set(computeThirdQualifiers(t.groups)), [t.groups])

  return (
    <>
      <div className="min-h-dvh p-4 max-w-2xl mx-auto overflow-y-auto">
        <h2 className="text-2xl font-bold text-[var(--color-wc-gold-light)] sticky top-0 bg-[#0a1628] py-2 z-10">
          World Cup 2026 — Live
        </h2>
        <p className="text-white/50 text-sm mb-1">{t.qualificationNote}</p>
        <p className="text-white/35 text-[10px] mb-2">
          Hover a team for their current squad · click for full team page
        </p>
        <div className="flex flex-wrap gap-3 text-[9px] text-white/45 mb-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-[var(--color-wc-green)]/25 border border-[var(--color-wc-green)]/40" />
            Top 2 per group
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-400/40" />
            8 best 3rd places
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {t.groups.map((g) => (
            <div
              key={g.id}
              className={[
                'rounded-xl border p-3 text-xs',
                g.id === t.playerGroupId
                  ? 'border-[var(--color-wc-gold)]/50 bg-[var(--color-wc-gold)]/5'
                  : 'border-white/10 bg-black/40',
              ].join(' ')}
            >
              <p className="font-bold text-[var(--color-wc-gold-light)] mb-2">Group {g.id}</p>
              {sortStandings(g.standings).map((s, i) => {
                const rank = i + 1
                const isYou = s.nationId === playerNation?.id
                const squad = getNationSquad(run, s.nationId)
                const qualTag =
                  rank <= 2 ? 'auto' : rank === 3 && bestThirds.has(s.nationId) ? 'best-third' : null

                return (
                  <div key={s.nationId}>
                    {rank === 3 && (
                      <div
                        className="my-1.5 border-t border-dashed border-[var(--color-wc-green)]/45 pt-1"
                        aria-hidden
                      >
                        <p className="text-[8px] uppercase tracking-widest text-[var(--color-wc-green)]/75 text-center">
                          Top 2 qualify
                        </p>
                      </div>
                    )}
                    <TournamentTeamRow
                      nationId={s.nationId}
                      rank={rank}
                      standing={s}
                      isYou={isYou}
                      squad={squad}
                      qualTag={qualTag}
                      onTeamClick={() => setSelectedTeam({ nation: getNation(s.nationId), squad })}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {t.headlines.length > 0 && (
          <div className="mt-4 rounded-xl border border-white/10 p-3">
            <p className="text-xs font-bold text-white/50 mb-2">Latest</p>
            <ul className="text-xs text-white/45 space-y-1">
              {t.headlines.map((h, i) => (
                <li key={i}>• {h}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={() => dispatch({ type: 'CLOSE_PANEL' })}
          className="mt-6 w-full rounded-xl bg-[var(--color-wc-green)] py-3 font-bold text-white sticky bottom-4"
        >
          Back to map
        </button>
      </div>

      {selectedTeam && (
        <BattleModal title={selectedTeam.nation.name} onClose={() => setSelectedTeam(null)} wide>
          <TeamPagePanel
            nation={selectedTeam.nation}
            squad={selectedTeam.squad}
            label="World Cup squad"
            onPlayerClick={(player) => {
              setSelectedTeam(null)
              setSelectedPlayer({ player, nation: selectedTeam.nation })
            }}
          />
        </BattleModal>
      )}

      {selectedPlayer && (
        <BattleModal title="Player profile" onClose={() => setSelectedPlayer(null)}>
          <PlayerProfilePanel
            player={selectedPlayer.player}
            nationId={selectedPlayer.nation.id}
            nationName={selectedPlayer.nation.name}
            goldenBoot={run.goldenBoot}
            inWorldCup
          />
        </BattleModal>
      )}
    </>
  )
}
