import { getPlayerItem } from '@/game/playerItems'

export function ItemBag({
  itemIds,
  selectedId,
  onSelect,
}: {
  itemIds: string[]
  selectedId: string | null
  onSelect: (itemId: string) => void
}) {
  if (itemIds.length === 0) {
    return (
      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Bag</p>
        <p className="text-[10px] text-white/30">No spare equipment</p>
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Bag</p>
      <div className="flex flex-wrap gap-1.5">
        {itemIds.map((id) => {
          const item = getPlayerItem(id)
          if (!item) return null
          const active = selectedId === id
          return (
            <button
              key={id}
              type="button"
              title={item.description}
              onClick={() => onSelect(id)}
              className={[
                'rounded-lg border px-2 py-1 text-[9px] font-medium transition-all',
                active
                  ? 'border-[var(--color-wc-gold)] bg-[var(--color-wc-gold)]/20 text-[var(--color-wc-gold-light)]'
                  : 'border-white/15 bg-black/40 text-white/70 hover:border-[var(--color-wc-gold)]/50',
              ].join(' ')}
            >
              {item.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
