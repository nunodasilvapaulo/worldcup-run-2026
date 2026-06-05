import { MAP_STAGES } from '@/game/constants'
import { getNation } from '@/game/nations2026'
import { getPlayerGroupStandings } from '@/game/tournament'
import { useGame } from '@/game/store'

export function TournamentReportScreen() {
  const { state, dispatch } = useGame()
  const run = state.run
  if (!run) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <p className="text-white/60 text-sm">No run loaded.</p>
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
  const completed = Math.max(0, Math.min(run.currentMapIndex - 1, MAP_STAGES.length - 1))
  const stage = MAP_STAGES[completed]!

  return (
    <div className="min-h-dvh p-6 max-w-lg mx-auto flex flex-col">
      <h2 className="text-2xl font-bold text-[var(--color-wc-gold-light)]">{stage.label} complete</h2>
      <p className="text-white/50 text-sm mt-1 mb-6">World Cup 2026 — live standings</p>

      <div className="rounded-xl border border-white/15 bg-black/50 p-4 space-y-3 flex-1">
        <p className="text-sm font-semibold text-white">Your group</p>
        {getPlayerGroupStandings(run.tournament).map((s, i) => {
          const n = getNation(s.nationId)
          return (
            <div key={s.nationId} className="flex justify-between text-sm text-white/80">
              <span>
                {i + 1}. {n.flag} {n.name}
              </span>
              <span>
                {s.points} pts · {s.gf}-{s.ga}
              </span>
            </div>
          )
        })}
        <p className="text-xs text-white/45 pt-2 border-t border-white/10">Latest results</p>
        <ul className="text-xs text-white/55 space-y-1">
          {run.tournament.headlines.map((h, i) => (
            <li key={i}>• {h}</li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: 'DISMISS_TOURNAMENT_REPORT' })}
        className="mt-6 w-full rounded-xl bg-[var(--color-wc-green)] font-bold py-3 text-white"
      >
        Continue to {MAP_STAGES[run.currentMapIndex]?.label ?? 'next map'}
      </button>
    </div>
  )
}
