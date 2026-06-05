import { SquadCard } from '@/components/SquadCard'
import { useGame } from '@/game/store'

export function MysteryScreen() {
  const { state, dispatch } = useGame()
  const outcome = state.pendingMystery
  const msg = state.mysteryMessage
  const recruits = state.pendingRecruits

  if (recruits?.length && outcome?.type === 'injury') {
    return (
      <div className="min-h-dvh p-6 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-red-400">Injury — emergency call-up</h2>
        <p className="text-white/50 text-sm mb-2">{msg}</p>
        {msg?.includes('goalkeeper') && (
          <p className="text-amber-300/90 text-sm mb-4 rounded-lg border border-amber-400/30 bg-amber-950/30 px-3 py-2">
            Only goalkeepers are available for this emergency call-up.
          </p>
        )}
        <div className="space-y-3">
          {recruits.map((p) => (
            <SquadCard
              key={p.id}
              player={p}
              nationId={state.run!.nationId}
              onClick={() => dispatch({ type: 'PICK_INJURY_REPLACEMENT', player: p })}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh p-6 max-w-lg mx-auto flex flex-col justify-center text-center">
      <span className="text-6xl mb-4">❓</span>
      <p className="text-lg text-white mb-2">{outcome?.type.replace(/_/g, ' ') ?? 'Mystery'}</p>
      <p className="text-white/60 mb-8">{msg ?? 'Something happened…'}</p>
      <button
        type="button"
        onClick={() => dispatch({ type: 'COMPLETE_NODE' })}
        className="rounded-xl bg-[var(--color-wc-green)] py-3 font-bold text-white"
      >
        Continue
      </button>
    </div>
  )
}
