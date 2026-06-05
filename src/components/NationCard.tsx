import { NationFlag } from '@/components/NationFlag'
import { getNation } from '@/game/nations2026'
import type { Nation } from '@/game/types'

export function NationCard({ nation, onClick }: { nation: Nation; onClick: () => void }) {
  const n = getNation(nation.id)
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-xl border border-white/15 bg-[var(--color-wc-panel)]/90 p-4 hover:border-[var(--color-wc-gold)] hover:bg-[var(--color-wc-gold)]/5 transition-all w-full"
      style={{
        borderTopColor: n.colors[0],
        borderTopWidth: 3,
      }}
    >
      <NationFlag nationId={n.id} size={48} />
      <p className="font-bold text-white mt-2">{n.name}</p>
      <p className="text-xs text-white/50 mt-1">
        Tier {n.tier} · {n.archetype}
        {n.debut2026 ? ' · WC debut' : ''}
        {n.isHost ? ' · Host' : ''}
      </p>
    </button>
  )
}
