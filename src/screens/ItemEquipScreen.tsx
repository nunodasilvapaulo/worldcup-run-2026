import { SquadCard } from '@/components/SquadCard'
import { useGame } from '@/game/store'

export function ItemEquipScreen() {
  const { state, dispatch } = useGame()
  const offers = state.pendingItemOffers ?? []
  const selectedId = state.pendingSelectedItemId
  const item = offers.find((i) => i.id === selectedId)
  const run = state.run!

  if (item) {
    return (
      <div className="min-h-dvh p-6 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-[var(--color-wc-gold-light)]">Who wears {item.name}?</h2>
        <p className="text-white/50 text-sm mb-6">
          {item.description} — replaced gear goes to your bag.
        </p>
        <div className="space-y-3">
          {run.squad.map((p) => (
            <SquadCard
              key={p.id}
              player={p}
              nationId={run.nationId}
              onClick={() => dispatch({ type: 'EQUIP_ITEM', playerId: p.id, item })}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-[var(--color-wc-gold-light)]">Equipment</h2>
      <p className="text-white/50 text-sm mb-6">Pick gear, then assign it to a squad player.</p>
      <div className="space-y-3">
        {offers.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => dispatch({ type: 'SELECT_ITEM_OFFER', itemId: it.id })}
            className="w-full text-left rounded-xl border border-white/15 bg-black/50 p-4 hover:border-[var(--color-wc-gold)]"
          >
            <p className="font-semibold text-white">{it.name}</p>
            <p className="text-sm text-white/50 mt-1">{it.description}</p>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: 'SKIP_EQUIP' })}
        className="mt-6 w-full rounded-xl border border-white/20 py-3 text-white/70"
      >
        Skip
      </button>
    </div>
  )
}
