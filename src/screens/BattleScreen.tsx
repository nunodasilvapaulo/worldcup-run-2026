import { useState } from 'react'

import { PlayerAvatar } from '@/components/PlayerAvatar'

import { BattleModal } from '@/components/BattleModal'

import { PlayerProfilePanel } from '@/components/PlayerProfilePanel'

import { TeamPagePanel } from '@/components/TeamPagePanel'

import {

  MatchBattleLayout,

  MatchCommentaryFeed,

  MATCH_LINE_STYLE,

} from '@/components/MatchBattleStage'

import { getNation } from '@/game/nations2026'
import { effectivePlayerStats } from '@/game/squad'

import { useGame } from '@/game/store'

import type { Nation, SquadPlayer } from '@/game/types'



export function BattleScreen() {

  const { state, dispatch, playerNation } = useGame()

  const battle = state.lastBattle!

  const run = state.run!

  const yourStar = [...run.squad].sort(
    (a, b) => effectivePlayerStats(b).shoot - effectivePlayerStats(a).shoot,
  )[0]!

  const oppNation = getNation(battle.opponentNationId)

  const oppSquad = battle.opponentSquad ?? []

  const oppStar =

    oppSquad.find((p) => p.name === battle.opponentStarName) ?? oppSquad[0] ?? yourStar



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



  const matchLines = battle.matchLines ?? []



  return (

    <>

      <MatchBattleLayout

        playerNation={playerNation!}

        playerSquad={run.squad}

        playerActive={yourStar}

        opponentNation={oppNation}

        opponentSquad={oppSquad}

        opponentActive={oppStar}

        caption="Battle ended!"

        subcaption={`${playerNation?.name} vs ${battle.opponentName}`}

        spotlight={battle.won ? 'player' : 'opponent'}

        score={{

          goalsFor: battle.goalsFor,

          goalsAgainst: battle.goalsAgainst,

          won: battle.won,

        }}

        onPlayerClick={(player, nation) =>

          setSelectedPlayer({

            player,

            nation,

            inWorldCup: nation.id === run.nationId || battle.wasBoss,

          })

        }

        onTeamClick={(nation, squad, label) => setSelectedTeam({ nation, squad, label })}

        center={

          <>

            <MatchCommentaryFeed

              title="Highlights"

              className="flex-1 max-h-[calc(100dvh-280px)] sm:max-h-[calc(100dvh-240px)] overflow-y-auto mb-20 sm:mb-0"

            >

              {matchLines.length > 0 ? (

                <div className="space-y-2.5">

                  {matchLines.map((line, i) => (

                    <div key={i} className="flex items-start gap-2.5">

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

                </div>

              ) : (

                <ul className="text-sm text-white/85 space-y-2">

                  {battle.log.map((line, i) => (

                    <li key={i} className="leading-relaxed">

                      {line}

                    </li>

                  ))}

                </ul>

              )}

            </MatchCommentaryFeed>



            <p className="mt-3 text-center text-[10px] text-white/45 shrink-0">

              Trophies {run.trophies}/{run.maxTrophies}

            </p>



            <button

              type="button"

              onClick={() => dispatch({ type: 'CONTINUE_AFTER_BATTLE' })}

              className="mt-4 w-full rounded-xl bg-[var(--color-wc-green)] font-bold py-3 text-white shrink-0"

            >

              Continue

            </button>

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

                  selectedTeam.nation.id === run.nationId || battle.wasBoss,

              })

            }}

          />

        </BattleModal>

      )}

    </>

  )

}

