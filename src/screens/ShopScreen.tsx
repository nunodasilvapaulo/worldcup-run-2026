import { useGame } from '@/game/store'

export function ShopScreen() {
  const { state, dispatch } = useGame()
  const options = state.pendingItems ?? []

  return (
    <div className="min-h-dvh p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-[var(--color-wc-gold-light)]">Equipment drop</h2>
      <p className="text-white/50 text-sm mb-6">Pick one bonus for the run.</p>
      <div className="space-y-3">
        {options.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => dispatch({ type: 'PICK_ITEM', item })}
            className="w-full text-left rounded-xl border border-white/15 bg-[var(--color-wc-panel)] p-4 hover:border-[var(--color-wc-gold)]"
          >
            <p className="font-semibold text-white">{item.name}</p>
            <p className="text-sm text-white/50 mt-1">{item.description}</p>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: 'SKIP_ITEM' })}
        className="mt-6 w-full rounded-xl border border-white/20 py-3 text-white/70"
      >
        Skip
      </button>
    </div>
  )
}
