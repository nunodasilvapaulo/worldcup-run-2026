import { useEffect, useMemo, useState } from 'react'

import { PlayerAvatar } from '@/components/PlayerAvatar'

import { BattleModal } from '@/components/BattleModal'

import { PlayerProfilePanel } from '@/components/PlayerProfilePanel'

import { TeamPagePanel } from '@/components/TeamPagePanel'

import {

  MatchBattleLayout,

  MatchCommentaryFeed,

  MATCH_LINE_STYLE,

  eventFlashesFromLine,

  resolveActivePlayer,

  spotlightFromLine,

} from '@/components/MatchBattleStage'

import type { MatchLineKind } from '@/game/matchSim'

import { stadiumForStage } from '@/game/stadiums2026'

import { useGame } from '@/game/store'

import type { Nation, SquadPlayer } from '@/game/types'



function lineDelay(kind: MatchLineKind): number {

  if (kind === 'goal') return 1500

  if (kind === 'near' || kind === 'miss') return 1100

  return 850

}



export function MatchLiveScreen() {

  const { state, dispatch, playerNation } = useGame()

  const fight = state.pendingFight
  const run = state.run

  useEffect(() => {
    if (!fight || !run) dispatch({ type: 'CONTINUE_AFTER_BATTLE' })
  }, [fight, run, dispatch])

  if (!fight || !run) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <p className="text-white/60 text-sm">Returning to map…</p>
      </div>
    )
  }

  const plan = fight.plan

  const node = run.map.find((n) => n.id === fight.nodeId)

  const [lineIndex, setLineIndex] = useState(0)

  const [scoreRevealed, setScoreRevealed] = useState(false)

  const [fastForward, setFastForward] = useState(false)

  const [selectedPlayer, setSelectedPlayer] = useState<{

    player: SquadPlayer

    nation: Nation

    inWorldCup: boolean

  } | null>(null)

  const [selectedTeam, setSelectedTeam] = useState<{

    nation: Nation

    squad: SquadPlayer[]

    label: string

  } | null>(null)



  const stadium = useMemo(

    () => stadiumForStage(node?.layer ?? run.currentMapIndex, node?.kind === 'final'),

    [node?.layer, node?.kind, run.currentMapIndex],

  )



  const playerStar =

    run.squad.find((p) => p.name === plan.playerStarName) ?? run.squad[0]!

  const oppStar =

    plan.opponent.squad.find((p) => p.name === plan.opponentStarName) ??

    plan.opponent.squad[0]!



  const visibleLines = plan.lines.slice(0, lineIndex + 1)

  const allLinesShown = lineIndex >= plan.lines.length - 1

  const lastLine = visibleLines[visibleLines.length - 1]



  const spotlight = spotlightFromLine(lastLine, run.squad)

  const playerActive = resolveActivePlayer(run.squad, lastLine?.playerName, playerStar)

  const opponentActive = resolveActivePlayer(

    plan.opponent.squad,

    lastLine?.playerName,

    oppStar,

  )



  const eventFlashes = useMemo(

    () => eventFlashesFromLine(lastLine, run.squad, plan.opponent.squad),

    [lastLine, run.squad, plan.opponent.squad],

  )



  const isTournamentMatch = Boolean(node?.isBoss)



  useEffect(() => {

    if (lineIndex < plan.lines.length - 1) {

      const next = plan.lines[lineIndex + 1]

      const delay = fastForward ? 50 : next ? lineDelay(next.kind) : 900

      const t = setTimeout(() => setLineIndex((i) => i + 1), delay)

      return () => clearTimeout(t)

    }

    if (allLinesShown && !scoreRevealed) {

      const t = setTimeout(() => setScoreRevealed(true), fastForward ? 80 : 800)

      return () => clearTimeout(t)

    }

  }, [lineIndex, plan.lines.length, allLinesShown, scoreRevealed, plan.lines, fastForward])



  function skipToResult() {

    setFastForward(true)

    setLineIndex(Math.max(0, plan.lines.length - 1))

    setScoreRevealed(true)

  }



  const oppNation = plan.opponent.nation



  return (

    <>

      <MatchBattleLayout

        playerNation={playerNation!}

        playerSquad={run.squad}

        playerActive={playerActive}

        opponentNation={oppNation}

        opponentSquad={plan.opponent.squad}

        opponentActive={opponentActive}

        caption={`${oppNation.name} wants to battle!`}

        subcaption={`${stadium.name} · 5 vs 5`}

        spotlight={scoreRevealed ? (plan.won ? 'player' : 'opponent') : spotlight}

        scoreHidden={!scoreRevealed}

        score={

          scoreRevealed

            ? { goalsFor: plan.goalsFor, goalsAgainst: plan.goalsAgainst, won: plan.won }

            : undefined

        }

        eventFlashes={eventFlashes}
        eventFlashKey={lineIndex}
        onPlayerClick={(player, nation) =>

          setSelectedPlayer({

            player,

            nation,

            inWorldCup:

              nation.id === run.nationId || (isTournamentMatch && nation.id !== run.nationId),

          })

        }

        onTeamClick={(nation, squad, label) => setSelectedTeam({ nation, squad, label })}

        center={

          <>

            <MatchCommentaryFeed

              title="Match feed"

              className="flex-1 min-h-0 max-h-[calc(100dvh-280px)] sm:max-h-[calc(100dvh-240px)] overflow-y-auto mb-20 sm:mb-0"

            >

              <div className="space-y-2.5">

                {visibleLines.map((line, i) => (

                  <div

                    key={i}

                    className={[

                      'flex items-start gap-2.5',

                      i === visibleLines.length - 1 && !allLinesShown ? 'feed-line-new' : '',

                    ].join(' ')}

                  >

                    {line.photoUrl && line.playerName ? (

                      <PlayerAvatar

                        name={line.playerName}

                        photoUrl={line.photoUrl}

                        nationId={

                          run.squad.some((p) => p.name === line.playerName)

                            ? playerNation!.id

                            : oppNation.id

                        }

                        size={28}

                      />

                    ) : (

                      <span className="w-7 shrink-0" />

                    )}

                    <p

                      className={[

                        'text-sm leading-relaxed flex-1',

                        MATCH_LINE_STYLE[line.kind],

                      ].join(' ')}

                    >

                      {line.text}

                    </p>

                  </div>

                ))}

                {!allLinesShown && (

                  <p className="text-white/40 text-sm animate-pulse pl-9">▶ …</p>

                )}

              </div>

            </MatchCommentaryFeed>



            <div className="mt-4 flex flex-col gap-2 shrink-0">

              {!scoreRevealed && (

                <button

                  type="button"

                  onClick={skipToResult}

                  className="w-full rounded-xl border border-white/25 py-2.5 text-sm font-semibold text-white/75 hover:bg-white/10"

                >

                  Skip to result

                </button>

              )}

              {scoreRevealed && (

                <button

                  type="button"

                  onClick={() => dispatch({ type: 'FINISH_MATCH' })}

                  className="w-full rounded-xl bg-[var(--color-wc-green)] font-bold py-3 text-white"

                >

                  Continue

                </button>

              )}

            </div>

          </>

        }

      />



      {selectedPlayer && (

        <BattleModal title="Player profile" onClose={() => setSelectedPlayer(null)}>

          <PlayerProfilePanel

            player={selectedPlayer.player}

            nationId={selectedPlayer.nation.id}

            nationName={selectedPlayer.nation.name}

            goldenBoot={run.goldenBoot}

            inWorldCup={selectedPlayer.inWorldCup}

          />

        </BattleModal>

      )}



      {selectedTeam && (

        <BattleModal

          title={selectedTeam.label}

          onClose={() => setSelectedTeam(null)}

          wide

        >

          <TeamPagePanel

            nation={selectedTeam.nation}

            squad={selectedTeam.squad}

            label={selectedTeam.label}

            onPlayerClick={(player) => {

              setSelectedTeam(null)

              setSelectedPlayer({

                player,

                nation: selectedTeam.nation,

                inWorldCup:

                  selectedTeam.nation.id === run.nationId ||

                  (isTournamentMatch && selectedTeam.nation.id !== run.nationId),

              })

            }}

          />

        </BattleModal>

      )}

    </>

  )

}

