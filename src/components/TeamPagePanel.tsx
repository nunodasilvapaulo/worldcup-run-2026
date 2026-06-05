import { NationFlag } from '@/components/NationFlag'
import { SquadCard } from '@/components/SquadCard'
import type { Nation, SquadPlayer } from '@/game/types'

function avgLevel(squad: SquadPlayer[]): number {
  if (squad.length === 0) return 1
  return Math.round(squad.reduce((s, p) => s + p.level, 0) / squad.length)
}

export function TeamPagePanel({
  nation,
  squad,
  label,
  onPlayerClick,
}: {
  nation: Nation
  squad: SquadPlayer[]
  label: string
  onPlayerClick?: (player: SquadPlayer) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <NationFlag nationId={nation.id} size={56} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">{label}</p>
          <p className="text-xl font-bold text-white">{nation.name}</p>
          <p className="text-xs text-white/45">Squad level ~{avgLevel(squad)} · {squad.length} players</p>
        </div>
      </div>

      <div className="space-y-2">
        {squad.map((p) => (
          <SquadCard
            key={p.id}
            player={p}
            nationId={nation.id}
            onClick={onPlayerClick ? () => onPlayerClick(p) : undefined}
          />
        ))}
      </div>
    </div>
  )
}
