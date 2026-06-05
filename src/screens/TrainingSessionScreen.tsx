import { useGame } from '@/game/store'
import {
  TRAINING_SECTOR_LABELS,
  type TrainingSector,
} from '@/game/trainingBuff'

const SECTORS: {
  id: TrainingSector
  emoji: string
  stat: string
  bonus: string
}[] = [
  { id: 'gk', emoji: '🧤', stat: 'Defending', bonus: '+2' },
  { id: 'defender', emoji: '🛡️', stat: 'Defending', bonus: '+2' },
  { id: 'midfielder', emoji: '🎯', stat: 'Passing', bonus: '+2' },
  { id: 'forward', emoji: '⚽', stat: 'Shooting', bonus: '+2' },
  { id: 'team', emoji: '👥', stat: 'Main stat each', bonus: '+1' },
]

export function TrainingSessionScreen() {
  const { state, dispatch } = useGame()
  const run = state.run
  if (!run) return null

  return (
    <div className="min-h-dvh p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-[var(--color-wc-gold-light)]">Training Session</h2>
      <p className="text-white/50 text-sm mt-1 mb-6">
        Pick a sector to drill. Buff applies to your next official match only (boss / tournament
        game).
      </p>

      <div className="space-y-2">
        {SECTORS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => dispatch({ type: 'PICK_TRAINING_SECTOR', sector: s.id })}
            className="w-full rounded-xl border border-white/15 bg-black/45 px-4 py-3 text-left hover:border-[var(--color-wc-gold)] hover:bg-black/55 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{s.emoji}</span>
                <div>
                  <p className="font-semibold text-white">{TRAINING_SECTOR_LABELS[s.id]}</p>
                  <p className="text-[11px] text-white/50">
                    {s.bonus} {s.stat}
                    {s.id === 'team' ? ' · every player' : ' · main stat'}
                  </p>
                </div>
              </div>
              <span className="text-sm font-black text-emerald-400 shrink-0">{s.bonus}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
