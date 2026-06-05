import { SquadCard } from '@/components/SquadCard'
import { useGame } from '@/game/store'

export function RecruitScreen() {
  const { state, dispatch } = useGame()
  const run = state.run!
  const options = state.pendingRecruits ?? []

  return (
    <div className="min-h-dvh p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-[var(--color-wc-gold-light)]">World Cup call-up</h2>
      <p className="text-white/50 text-sm mb-6">
        Choose from your full call-up (#1 = star, higher = weaker) — then pick who they replace.
      </p>
      <div className="space-y-3">
        {options.map((p) => (
          <SquadCard
            key={p.id}
            player={p}
            nationId={run.nationId}
            onClick={() => dispatch({ type: 'PICK_RECRUIT', player: p })}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: 'SKIP_RECRUIT' })}
        className="mt-6 w-full rounded-xl border border-white/20 py-3 text-white/70"
      >
        Skip
      </button>
    </div>
  )
}
