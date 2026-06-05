import { PlayerAvatar } from '@/components/PlayerAvatar'
import { ROLE_LABELS } from '@/game/constants'
import type { SquadPlayer } from '@/game/types'

export function SquadRosterPanel({
  squad,
  nationId,
  nationName,
}: {
  squad: SquadPlayer[]
  nationId: string
  nationName: string
}) {
  return (
    <div className="rounded-xl border border-[var(--color-wc-gold)]/45 bg-gradient-to-b from-[#1a2f4a]/98 to-[#0a1628]/98 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-md">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-wc-gold)]/90 mb-2">
        Match squad
      </p>
      <ul className="space-y-1.5">
        {squad.map((p) => (
          <li key={p.id} className="flex items-center gap-2 min-w-0">
            <PlayerAvatar name={p.name} photoUrl={p.photoUrl} nationId={nationId} size={26} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white truncate leading-tight">
                {p.isLegend ? '⭐ ' : ''}
                {p.name}
              </p>
              <p className="text-[9px] text-white/45">
                {ROLE_LABELS[p.role]} · Lv.{p.level}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 pt-2 border-t border-white/10 text-[9px] text-white/35 truncate">
        {nationName}
      </p>
    </div>
  )
}
