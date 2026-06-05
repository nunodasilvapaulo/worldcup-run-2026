import { MAX_PLAYER_LEVEL, ROLE_LABELS } from '@/game/constants'
import { effectivePlayerStats, statTierPercent, staminaMultiplier } from '@/game/squad'
import type { SquadPlayer } from '@/game/types'

const STAT_COLS = [
  { key: 'pace' as const, label: 'PAC', color: 'text-sky-300' },
  { key: 'shoot' as const, label: 'SHO', color: 'text-rose-300' },
  { key: 'pass' as const, label: 'PAS', color: 'text-amber-200' },
  { key: 'defend' as const, label: 'DEF', color: 'text-emerald-300' },
]

export function PlayerStatTooltipContent({ player }: { player: SquadPlayer }) {
  const staminaPct = Math.round((player.hp / player.maxHp) * 100)
  const staminaColor =
    staminaPct > 60 ? 'bg-emerald-400' : staminaPct > 30 ? 'bg-amber-400' : 'bg-red-400'
  const stats = effectivePlayerStats(player)
  const debuffed = staminaMultiplier(player) < 1

  return (
    <div className="rounded-xl border border-[var(--color-wc-gold)]/45 bg-gradient-to-b from-[#1a2f4a]/98 to-[#0a1628]/98 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-md">
      <p className="font-semibold text-white text-xs truncate pr-1">
        {player.isLegend ? '⭐ ' : ''}
        {player.name}
      </p>
      <p className="text-[10px] text-white/45 mt-0.5">
        {ROLE_LABELS[player.role]} · Lv.{player.level}/{MAX_PLAYER_LEVEL}
        {player.level < MAX_PLAYER_LEVEL && (
          <span className="text-white/35"> · {statTierPercent(player.level)}% stat power</span>
        )}
      </p>
      {debuffed && (
        <p className="text-[9px] text-amber-300/90 mt-1">
          Low stamina — stats at {staminaPct}%
        </p>
      )}

      <div className="mt-2.5 grid grid-cols-4 gap-1 rounded-lg bg-black/35 px-2 py-2 border border-white/8">
        {STAT_COLS.map((s) => (
          <div key={s.key} className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">{s.label}</p>
            <p className={`text-sm font-bold tabular-nums ${s.color}`}>{stats[s.key]}</p>
          </div>
        ))}
      </div>

      <div className="mt-2.5">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="font-medium text-white/55">Stamina</span>
          <span className="tabular-nums text-white/80">
            {player.hp}/{player.maxHp}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${staminaColor}`}
            style={{ width: `${staminaPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function PlayerStatTooltip({ player }: { player: SquadPlayer }) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute left-1/2 bottom-[calc(100%+10px)] z-50 -translate-x-1/2 w-[210px] opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100"
    >
      <PlayerStatTooltipContent player={player} />
      <div className="absolute left-1/2 -bottom-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-[var(--color-wc-gold)]/35 bg-[#0f1e32]" />
    </div>
  )
}
