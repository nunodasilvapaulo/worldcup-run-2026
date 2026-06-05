import { PlayerAvatar } from '@/components/PlayerAvatar'
import { MAX_PLAYER_LEVEL, ROLE_LABELS } from '@/game/constants'
import { nextStatTierLevel, statTierPercent } from '@/game/squad'
import { getPlayerItem } from '@/game/playerItems'
import { effectivePlayerStats, staminaMultiplier } from '@/game/squad'
import { findTournamentStats } from '@/game/tournament'
import type { ScorerEntry, SquadPlayer } from '@/game/types'

const STAT_COLS = [
  { key: 'pace' as const, label: 'PAC', color: 'text-sky-300' },
  { key: 'shoot' as const, label: 'SHO', color: 'text-rose-300' },
  { key: 'pass' as const, label: 'PAS', color: 'text-amber-200' },
  { key: 'defend' as const, label: 'DEF', color: 'text-emerald-300' },
]

export function PlayerProfilePanel({
  player,
  nationId,
  nationName,
  goldenBoot,
  inWorldCup,
}: {
  player: SquadPlayer
  nationId: string
  nationName: string
  goldenBoot: ScorerEntry[]
  inWorldCup?: boolean
}) {
  const staminaPct = Math.round((player.hp / player.maxHp) * 100)
  const staminaColor =
    staminaPct > 60 ? 'bg-emerald-400' : staminaPct > 30 ? 'bg-amber-400' : 'bg-red-400'
  const item = player.equippedItemId ? getPlayerItem(player.equippedItemId) : null
  const stats = effectivePlayerStats(player)
  const debuffed = staminaMultiplier(player) < 1
  const wcStats = findTournamentStats(goldenBoot, player.name, nationId)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <PlayerAvatar name={player.name} photoUrl={player.photoUrl} nationId={nationId} size={72} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-white truncate">
            {player.isLegend ? '⭐ ' : ''}
            {player.name}
          </p>
          <p className="text-sm text-white/55">
            {ROLE_LABELS[player.role]} · Level {player.level}/{MAX_PLAYER_LEVEL}
          </p>
          <p className="text-xs text-white/40 mt-0.5">{nationName}</p>
          {item && (
            <p className="text-xs text-[var(--color-wc-gold)]/90 mt-1">Equipped: {item.name}</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-2">
          Player stats{debuffed ? ` (${staminaPct}% stamina)` : ''}
        </p>
        {player.level < MAX_PLAYER_LEVEL && (
          <p className="text-[10px] text-white/45 mb-2">
            Stats @ {statTierPercent(player.level)}% power (tier bumps at Lv.5, 10, 15, 20)
            {nextStatTierLevel(player.level) != null && (
              <span className="text-white/35"> · next bump Lv.{nextStatTierLevel(player.level)}</span>
            )}
          </p>
        )}
        {debuffed && (
          <p className="text-[10px] text-amber-300/85 mb-2">
            Stats reduced while stamina is below 100%
          </p>
        )}
        <div className="grid grid-cols-4 gap-2 rounded-xl bg-black/35 px-3 py-3 border border-white/10">
          {STAT_COLS.map((s) => (
            <div key={s.key} className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">{s.label}</p>
              <p className={`text-xl font-black tabular-nums ${s.color}`}>{stats[s.key]}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-white/55">Stamina</span>
          <span className="tabular-nums text-white/80">
            {player.hp}/{player.maxHp} ({staminaPct}%)
          </span>
        </div>
        <div className="h-2 rounded-full bg-black/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${staminaColor}`}
            style={{ width: `${staminaPct}%` }}
          />
        </div>
      </div>

      {inWorldCup && (
        <div className="rounded-xl border border-[var(--color-wc-gold)]/30 bg-[var(--color-wc-gold)]/8 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-wc-gold)] mb-2">
            World Cup tournament
          </p>
          {wcStats ? (
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-[var(--color-wc-gold-light)] tabular-nums">
                  {wcStats.goals}
                </p>
                <p className="text-[10px] text-white/45 uppercase">Goals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-sky-300 tabular-nums">{wcStats.assists}</p>
                <p className="text-[10px] text-white/45 uppercase">Assists</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-white/45">No goals or assists recorded yet in this tournament.</p>
          )}
        </div>
      )}
    </div>
  )
}
