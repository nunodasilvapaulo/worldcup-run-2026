import { SquadCard } from '@/components/SquadCard'
import { useGame } from '@/game/store'
import type { SquadPlayer } from '@/game/types'

const STATS: { key: keyof SquadPlayer['stats']; label: string }[] = [
  { key: 'pace', label: 'Pace' },
  { key: 'shoot', label: 'Shooting' },
  { key: 'pass', label: 'Passing' },
  { key: 'defend', label: 'Defending' },
]

export function TrainingScreen() {
  const { state, dispatch } = useGame()
  const run = state.run!
  const focusId = state.pendingTrainingPlayerId ?? run.squad[0]?.id
  const focus = run.squad.find((p) => p.id === focusId) ?? run.squad[0]

  if (!focus) return null

  return (
    <div className="min-h-dvh p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-[var(--color-wc-gold-light)]">Training session</h2>
      <p className="text-white/50 text-sm mb-4">Boost one stat for {focus.label}.</p>
      <SquadCard player={focus} nationId={run.nationId} />
      <div className="mt-6 grid grid-cols-2 gap-2">
        {STATS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => dispatch({ type: 'PICK_TRAINING', playerId: focus.id, stat: s.key })}
            className="rounded-xl border border-white/15 py-3 text-white font-medium hover:border-[var(--color-wc-gold)]"
          >
            +6 {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
