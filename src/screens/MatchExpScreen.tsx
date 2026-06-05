import { useEffect, useState } from 'react'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { BattleModal } from '@/components/BattleModal'
import { PlayerProfilePanel } from '@/components/PlayerProfilePanel'
import { NationFlag } from '@/components/NationFlag'
import { MAX_PLAYER_LEVEL } from '@/game/constants'
import { useGame } from '@/game/store'
import type { PlayerMatchExp } from '@/game/progression'
import type { SquadPlayer } from '@/game/types'

function levelBarPercent(level: number): number {
  return Math.max(0, Math.min(100, (level / MAX_PLAYER_LEVEL) * 100))
}

function ExpLevelBar({
  levelBefore,
  levelAfter,
  animateDelayMs = 0,
}: {
  levelBefore: number
  levelAfter: number
  animateDelayMs?: number
}) {
  const [fillLevel, setFillLevel] = useState(levelBefore)

  useEffect(() => {
    setFillLevel(levelBefore)
    const t = window.setTimeout(() => setFillLevel(levelAfter), animateDelayMs + 120)
    return () => window.clearTimeout(t)
  }, [levelBefore, levelAfter, animateDelayMs])

  const fillPct = levelBarPercent(fillLevel)

  return (
    <div className="mt-2">
      <div className="flex justify-between text-[9px] text-white/40 tabular-nums mb-1">
        <span>Lv.{levelBefore}</span>
        <span className={levelAfter > levelBefore ? 'text-[var(--color-wc-gold-light)]' : ''}>
          Lv.{levelAfter}
        </span>
      </div>
      <div className="h-2 rounded-full bg-black/55 border border-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-wc-green)] via-emerald-400 to-[var(--color-wc-gold)] transition-[width] duration-700 ease-out shadow-[0_0_10px_rgba(201,162,39,0.35)]"
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  )
}

function ExpPlayerCard({
  entry,
  nationId,
  onClick,
  animateDelayMs = 0,
}: {
  entry: PlayerMatchExp
  nationId: string
  onClick: () => void
  animateDelayMs?: number
}) {
  const capped = entry.levelAfter >= MAX_PLAYER_LEVEL && entry.levelGain > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-white/12 bg-black/45 hover:bg-black/55 hover:border-[var(--color-wc-gold)]/35 p-3 transition-all"
    >
      <div className="flex items-start gap-3">
        <PlayerAvatar
          name={entry.playerName}
          photoUrl={entry.photoUrl}
          nationId={nationId}
          size={44}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-white truncate">{entry.playerName}</p>
            <span className="shrink-0 text-sm font-black text-[var(--color-wc-gold-light)] tabular-nums">
              {entry.levelGain === 0 ? 'No EXP' : capped ? 'MAX' : `+${entry.levelGain} Lv`}
            </span>
          </div>
          <p className="text-[10px] text-white/45 mt-0.5">
            <span className="text-white/35">{entry.performanceScore} perf pts</span>
          </p>
          <ExpLevelBar
            levelBefore={entry.levelBefore}
            levelAfter={entry.levelAfter}
            animateDelayMs={animateDelayMs}
          />
          <p className="text-[10px] text-orange-300/90 mt-1.5">
            Stamina −{entry.staminaLost} ({entry.staminaAfter} Stamina left)
          </p>
          <ul className="mt-2 space-y-0.5">
            {(entry.breakdown ?? []).map((line, i) => (
              <li key={i} className="text-[10px] text-white/55 flex justify-between gap-2">
                <span>{line.label}</span>
                <span className="text-emerald-400/90 tabular-nums shrink-0">+{line.points}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </button>
  )
}

export function MatchExpScreen() {
  const { state, dispatch, playerNation } = useGame()
  const battle = state.lastBattle
  const run = state.run
  const [profilePlayer, setProfilePlayer] = useState<SquadPlayer | null>(null)

  useEffect(() => {
    if (!battle || !run) dispatch({ type: 'CONTINUE_AFTER_BATTLE' })
  }, [battle, run, dispatch])

  if (!battle || !run) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <p className="text-white/60 text-sm">Loading match results…</p>
      </div>
    )
  }

  const expReport = battle.expReport ?? []
  const sorted = [...expReport].sort((a, b) => b.levelGain - a.levelGain || b.performanceScore - a.performanceScore)

  return (
    <>
      <div className="min-h-dvh p-4 max-w-lg mx-auto overflow-y-auto">
        <div className="text-center mb-5">
          <p className="text-[10px] uppercase tracking-widest text-white/45">Full time</p>
          <h2
            className={`text-2xl font-black mt-1 ${battle.won ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {battle.goalsFor} – {battle.goalsAgainst}
          </h2>
          <p className="text-sm text-white/55 mt-1 flex items-center justify-center gap-2">
            vs {battle.opponentName}
            <NationFlag nationId={battle.opponentNationId} size={18} />
          </p>
          <p className="text-xs text-[var(--color-wc-gold)]/80 mt-2">
            {battle.wasBoss ? 'Tournament match' : 'Friendly'} · EXP &
            stamina report
          </p>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-wc-gold)] mb-2">
          Player experience
        </h3>
        <div className="space-y-2 mb-6">
          {sorted.map((entry, index) => {
            const player = run.squad.find((p) => p.id === entry.playerId)
            if (!player) return null
            return (
              <ExpPlayerCard
                key={entry.playerId}
                entry={entry}
                nationId={run.nationId}
                onClick={() => setProfilePlayer(player)}
                animateDelayMs={index * 90}
              />
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => dispatch({ type: 'CONTINUE_AFTER_BATTLE' })}
          className="w-full rounded-xl bg-[var(--color-wc-green)] py-3 font-bold text-white sticky bottom-4"
        >
          Continue
        </button>
      </div>

      {profilePlayer && playerNation && (
        <BattleModal title="Player profile" onClose={() => setProfilePlayer(null)}>
          <PlayerProfilePanel
            player={profilePlayer}
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
