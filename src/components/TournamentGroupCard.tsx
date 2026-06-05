import { AnchoredHoverTooltip } from '@/components/AnchoredHoverTooltip'
import { NationFlag } from '@/components/NationFlag'
import { NationStartersPanel } from '@/components/NationStartersTooltip'
import type { WorldCupGroupDef } from '@/game/groups2026'
import { getNation, getStarterNationIds } from '@/game/nations2026'

function TeamRow({
  nationId,
  playable,
  onPickNation,
}: {
  nationId: string
  playable: boolean
  onPickNation: (nationId: string) => void
}) {
  const nation = getNation(nationId)

  const row = playable ? (
    <button
      type="button"
      onClick={() => onPickNation(nationId)}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-wc-gold)]/10"
      style={{ borderLeft: `3px solid ${nation.colors[0]}` }}
    >
      <NationFlag nationId={nationId} size={32} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{nation.name}</p>
        <p className="text-[10px] text-white/45">
          Tier {nation.tier}
          {nation.isHost ? ' · Host' : ''}
          {nation.debut2026 ? ' · Debut' : ''}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-[var(--color-wc-green)]/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
        Play
      </span>
    </button>
  ) : (
    <div
      className="flex items-center gap-3 px-3 py-2.5 opacity-55"
      style={{ borderLeft: `3px solid ${nation.colors[0]}55` }}
    >
      <NationFlag nationId={nationId} size={32} className="grayscale-[0.35]" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white/80 truncate">{nation.name}</p>
        <p className="text-[10px] text-white/35">Locked</p>
      </div>
      <span className="shrink-0 text-white/25 text-sm" aria-hidden>
        🔒
      </span>
    </div>
  )

  return (
    <AnchoredHoverTooltip content={<NationStartersPanel nationId={nationId} />} width={220}>
      {row}
    </AnchoredHoverTooltip>
  )
}

export function TournamentGroupCard({
  group,
  onPickNation,
}: {
  group: WorldCupGroupDef
  onPickNation: (nationId: string) => void
}) {
  const playable = new Set(getStarterNationIds())
  return (
    <div className="rounded-xl border border-white/12 bg-[var(--color-wc-panel)]/70">
      <div className="px-3 py-2 border-b border-white/10 bg-black/25 rounded-t-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-wc-gold)]">
          Group {group.id}
        </p>
      </div>
      <ul className="divide-y divide-white/8">
        {group.nations.map((nationId) => (
          <li key={nationId}>
            <TeamRow
              nationId={nationId}
              playable={playable.has(nationId)}
              onPickNation={onPickNation}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
