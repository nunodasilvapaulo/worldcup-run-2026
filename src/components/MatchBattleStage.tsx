import type { ReactNode } from 'react'
import { AnchoredHoverTooltip } from '@/components/AnchoredHoverTooltip'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { PlayerStatTooltipContent } from '@/components/PlayerStatTooltip'
import { NationFlag } from '@/components/NationFlag'
import type { MatchLine, MatchLineKind } from '@/game/matchSim'
import type { Nation, SquadPlayer } from '@/game/types'

export type BattleEventKind = 'goal' | 'assist' | 'tackle' | 'save' | 'miss'

const EVENT_ANIM: Record<BattleEventKind, string> = {
  goal: 'battle-anim-goal',
  assist: 'battle-anim-assist',
  tackle: 'battle-anim-tackle',
  save: 'battle-anim-save',
  miss: 'battle-anim-miss',
}

const EVENT_BADGE: Record<BattleEventKind, string> = {
  goal: '⚽ GOAL!',
  assist: '🅰️ Assist',
  tackle: '🛡️ Tackle',
  save: '🧤 Save',
  miss: '😬 Miss',
}

function staminaColor(pct: number): string {
  if (pct > 60) return 'bg-emerald-400'
  if (pct > 30) return 'bg-amber-400'
  return 'bg-red-400'
}

function avgLevel(squad: SquadPlayer[]): number {
  if (squad.length === 0) return 1
  return Math.round(squad.reduce((s, p) => s + p.level, 0) / squad.length)
}

function PlayerBattleRow({
  player,
  nationId,
  active,
  align,
  eventFlash,
  onClick,
  tooltipSide = 'center',
}: {
  player: SquadPlayer
  nationId: string
  active?: boolean
  align: 'left' | 'right'
  eventFlash?: BattleEventKind
  onClick?: () => void
  tooltipSide?: 'left' | 'right' | 'center'
}) {
  const staminaPct = Math.round((player.hp / player.maxHp) * 100)

  const row = (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      className={[
        'relative flex items-center gap-2 rounded-lg px-2 py-2 transition-all',
        active
          ? 'bg-[#f5d442]/20 ring-2 ring-[#f5d442] shadow-[0_0_12px_rgba(245,212,66,0.4)]'
          : 'bg-black/30',
        align === 'right' ? 'flex-row-reverse text-right' : '',
        eventFlash ? EVENT_ANIM[eventFlash] : '',
        onClick ? 'cursor-pointer hover:bg-black/45 hover:ring-1 hover:ring-white/20' : '',
      ].join(' ')}
    >
      {eventFlash && (
        <span
          className={[
            'battle-event-badge pointer-events-none absolute z-10 text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-md whitespace-nowrap',
            eventFlash === 'goal'
              ? 'bg-[#f5d442]/90 text-[#1a1200] left-1/2 -translate-x-1/2 -top-1'
              : eventFlash === 'assist'
                ? 'bg-sky-400/90 text-[#0a1628] left-1/2 -translate-x-1/2 -top-1'
                : eventFlash === 'save'
                  ? 'bg-cyan-400/90 text-[#0a1628] right-1 top-0'
                  : eventFlash === 'tackle'
                    ? 'bg-sky-500/85 text-white left-1 top-0'
                    : 'bg-orange-400/90 text-[#1a1200] left-1/2 -translate-x-1/2 -top-1',
          ].join(' ')}
        >
          {EVENT_BADGE[eventFlash]}
        </span>
      )}
      <PlayerAvatar
        name={player.name}
        photoUrl={player.photoUrl}
        nationId={nationId}
        size={40}
      />
      <div className={`min-w-0 flex-1 ${align === 'right' ? 'items-end' : ''}`}>
        <p className="text-xs font-semibold text-white truncate leading-tight">{player.name}</p>
        <p className="text-[9px] text-white/50">Lv.{player.level}</p>
        <div
          className={[
            'flex items-center gap-1.5 mt-1',
            align === 'right' ? 'flex-row-reverse' : '',
          ].join(' ')}
        >
          <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className={`h-full ${staminaColor(staminaPct)} transition-all duration-300`}
              style={{ width: `${staminaPct}%` }}
            />
          </div>
          <span className="text-[9px] text-white/45 tabular-nums shrink-0">{staminaPct}%</span>
        </div>
      </div>
    </div>
  )

  return (
    <AnchoredHoverTooltip
      content={<PlayerStatTooltipContent player={player} />}
      width={210}
      preferSide={tooltipSide}
    >
      {row}
    </AnchoredHoverTooltip>
  )
}

export function TeamRosterSidebar({
  label,
  nation,
  squad,
  activePlayerId,
  dimmed,
  align,
  eventFlashes,
  eventFlashKey,
  onPlayerClick,
  onTeamClick,
}: {
  label: string
  nation: Nation
  squad: SquadPlayer[]
  activePlayerId?: string
  dimmed?: boolean
  align: 'left' | 'right'
  eventFlashes?: Record<string, BattleEventKind>
  eventFlashKey?: number
  onPlayerClick?: (player: SquadPlayer) => void
  onTeamClick?: () => void
}) {
  const tooltipSide = align === 'left' ? 'right' : 'left'

  const headerInner = (
    <>
      <NationFlag nationId={nation.id} size={40} />
      <div className={`min-w-0 flex-1 ${align === 'right' ? 'text-right' : ''}`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/90">{label}</p>
        <p className="text-xs font-semibold text-white truncate">{nation.name}</p>
        <p className="text-[9px] text-white/40">
          Lv ~{avgLevel(squad)}
          {onTeamClick ? ' · click for team' : ''}
        </p>
      </div>
    </>
  )

  const header = onTeamClick ? (
    <button
      type="button"
      onClick={onTeamClick}
      className={[
        'shrink-0 w-full px-3 py-3 border-b border-white/10 flex items-center gap-2 transition-colors text-left hover:bg-white/5 cursor-pointer',
        align === 'right' ? 'flex-row-reverse text-right' : '',
      ].join(' ')}
    >
      {headerInner}
    </button>
  ) : (
    <div
      className={[
        'shrink-0 w-full px-3 py-3 border-b border-white/10 flex items-center gap-2',
        align === 'right' ? 'flex-row-reverse text-right' : '',
      ].join(' ')}
    >
      {headerInner}
    </div>
  )

  return (
    <div
      className={[
        'h-full flex flex-col rounded-xl border border-white/10 bg-[#0f1e32]/70 transition-all overflow-hidden',
        dimmed ? 'opacity-40 brightness-75' : 'opacity-100',
      ].join(' ')}
    >
      {header}

      <div className="flex-1 flex flex-col justify-center gap-1.5 p-2 bg-gradient-to-b from-[#5a9a50]/40 to-[#356830]/50">
        {squad.map((p) => (
          <PlayerBattleRow
            key={`${p.id}-${eventFlashKey ?? 0}`}
            player={p}
            nationId={nation.id}
            active={p.id === activePlayerId}
            align={align}
            eventFlash={eventFlashes?.[p.id]}
            onClick={onPlayerClick ? () => onPlayerClick(p) : undefined}
            tooltipSide={tooltipSide}
          />
        ))}
      </div>
    </div>
  )
}

export function MatchScoreCenter({
  caption,
  subcaption,
  scoreHidden,
  score,
}: {
  caption: string
  subcaption?: string
  scoreHidden?: boolean
  score?: { goalsFor: number; goalsAgainst: number; won: boolean }
}) {
  return (
    <div className="text-center py-4">
      <p className="text-base sm:text-lg font-black uppercase tracking-wide text-[#ff6b6b]">
        {caption}
      </p>
      {subcaption && <p className="text-xs text-white/55 mt-1">{subcaption}</p>}

      <div className="mt-4 mx-auto max-w-xs rounded-xl bg-gradient-to-b from-[#6faa5e]/35 via-[#4d8f45]/20 to-[#356830]/30 border border-white/10 py-6 px-4">
        {scoreHidden ? (
          <>
            <p className="text-4xl font-black text-white/25 tabular-nums">? – ?</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">Live</p>
          </>
        ) : score ? (
          <>
            <p
              className={`text-5xl font-black tabular-nums ${score.won ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {score.goalsFor} – {score.goalsAgainst}
            </p>
            <p className="text-sm font-bold text-[var(--color-wc-gold-light)] mt-2">
              {score.won ? 'Victory!' : 'Defeat…'}
            </p>
          </>
        ) : (
          <p className="text-3xl font-black text-white/30">VS</p>
        )}
      </div>
    </div>
  )
}

/** Full-width battle layout: teams on flanks, center content in the middle. */
export function MatchBattleLayout({
  playerNation,
  playerSquad,
  playerActive,
  opponentNation,
  opponentSquad,
  opponentActive,
  caption,
  subcaption,
  spotlight = 'player',
  score,
  scoreHidden,
  center,
  eventFlashes,
  eventFlashKey,
  onPlayerClick,
  onTeamClick,
}: {
  playerNation: Nation
  playerSquad: SquadPlayer[]
  playerActive: SquadPlayer
  opponentNation: Nation
  opponentSquad: SquadPlayer[]
  opponentActive: SquadPlayer
  caption: string
  subcaption?: string
  spotlight?: 'player' | 'opponent' | 'both'
  score?: { goalsFor: number; goalsAgainst: number; won: boolean }
  scoreHidden?: boolean
  center: ReactNode
  eventFlashes?: Record<string, BattleEventKind>
  /** Changes when a new commentary line triggers flashes — replays CSS animations. */
  eventFlashKey?: number
  onPlayerClick?: (player: SquadPlayer, nation: Nation) => void
  onTeamClick?: (nation: Nation, squad: SquadPlayer[], label: string) => void
}) {
  return (
    <div
      className="min-h-dvh w-full flex justify-center px-2 sm:px-4 py-3"
      style={{
        background: 'linear-gradient(180deg, #0a1628 0%, #152238 50%, #0a1628 100%)',
      }}
    >
      <div className="w-full max-w-5xl flex items-stretch gap-2 sm:gap-3 min-h-0">
        <aside className="w-[168px] sm:w-[190px] lg:w-[210px] shrink-0 hidden sm:flex flex-col">
          <TeamRosterSidebar
            label="Your team"
            nation={playerNation}
            squad={playerSquad}
            activePlayerId={playerActive.id}
            dimmed={spotlight === 'opponent'}
            align="left"
            eventFlashes={eventFlashes}
            eventFlashKey={eventFlashKey}
            onPlayerClick={
              onPlayerClick ? (p) => onPlayerClick(p, playerNation) : undefined
            }
            onTeamClick={
              onTeamClick ? () => onTeamClick(playerNation, playerSquad, 'Your team') : undefined
            }
          />
        </aside>

        <main className="flex-1 min-w-0 flex flex-col py-1">
          <MatchScoreCenter
            caption={caption}
            subcaption={subcaption}
            scoreHidden={scoreHidden}
            score={score}
          />
          {center}
        </main>

        <aside className="w-[168px] sm:w-[190px] lg:w-[210px] shrink-0 hidden sm:flex flex-col">
          <TeamRosterSidebar
            label="Enemy"
            nation={opponentNation}
            squad={opponentSquad}
            activePlayerId={opponentActive.id}
            dimmed={spotlight === 'player'}
            align="right"
            eventFlashes={eventFlashes}
            eventFlashKey={eventFlashKey}
            onPlayerClick={
              onPlayerClick ? (p) => onPlayerClick(p, opponentNation) : undefined
            }
            onTeamClick={
              onTeamClick ? () => onTeamClick(opponentNation, opponentSquad, 'Enemy') : undefined
            }
          />
        </aside>
      </div>

      {/* Mobile: compact rosters below center */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 grid grid-cols-2 gap-1 p-1 bg-[#0a1628]/95 border-t border-white/10 backdrop-blur-md max-h-[32vh] overflow-y-auto">
        <div className="space-y-1">
          {playerSquad.map((p) => (
            <PlayerBattleRow
              key={`${p.id}-${eventFlashKey ?? 0}`}
              player={p}
              nationId={playerNation.id}
              active={p.id === playerActive.id}
              align="left"
              eventFlash={eventFlashes?.[p.id]}
              onClick={onPlayerClick ? () => onPlayerClick(p, playerNation) : undefined}
            />
          ))}
        </div>
        <div className="space-y-1">
          {opponentSquad.map((p) => (
            <PlayerBattleRow
              key={`${p.id}-${eventFlashKey ?? 0}`}
              player={p}
              nationId={opponentNation.id}
              active={p.id === opponentActive.id}
              align="right"
              eventFlash={eventFlashes?.[p.id]}
              onClick={onPlayerClick ? () => onPlayerClick(p, opponentNation) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function MatchCommentaryFeed({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={[
        'rounded-xl border border-white/15 bg-[#0a1628]/92 backdrop-blur-md p-3 sm:p-4 shadow-lg',
        className,
      ].join(' ')}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-wc-gold)]/80 mb-2 pb-2 border-b border-white/10">
        {title}
      </p>
      {children}
    </div>
  )
}

export function resolveActivePlayer(
  squad: SquadPlayer[],
  name: string | undefined,
  fallback: SquadPlayer,
): SquadPlayer {
  if (!name) return fallback
  return squad.find((p) => p.name === name) ?? fallback
}

export function spotlightFromLine(
  line: { playerName?: string } | undefined,
  playerSquad: SquadPlayer[],
  defaultSpotlight: 'player' | 'opponent' = 'player',
): 'player' | 'opponent' {
  if (!line?.playerName) return defaultSpotlight
  if (playerSquad.some((p) => p.name === line.playerName)) return 'player'
  return 'opponent'
}

export function eventFlashesFromLine(
  line: MatchLine | undefined,
  playerSquad: SquadPlayer[],
  opponentSquad: SquadPlayer[],
): Record<string, BattleEventKind> {
  const flashes: Record<string, BattleEventKind> = {}
  if (!line) return flashes

  const all = [...playerSquad, ...opponentSquad]
  const idFor = (name: string | undefined) => all.find((p) => p.name === name)?.id

  if (line.kind === 'goal') {
    const scorerId = idFor(line.playerName)
    if (scorerId) flashes[scorerId] = 'goal'
    const assistId = idFor(line.assistName)
    if (assistId) flashes[assistId] = 'assist'
  } else if (
    line.kind === 'tackle' ||
    line.kind === 'save' ||
    line.kind === 'miss'
  ) {
    const id = idFor(line.playerName)
    if (id) flashes[id] = line.kind
  }

  return flashes
}

export const MATCH_LINE_STYLE: Record<MatchLineKind, string> = {
  goal: 'text-[var(--color-wc-gold-light)] font-semibold',
  near: 'text-amber-200',
  miss: 'text-orange-200',
  tackle: 'text-sky-200',
  save: 'text-cyan-200',
  chance: 'text-white/90',
  half: 'text-white/75 font-medium',
  kickoff: 'text-white font-medium',
  fulltime: 'text-white/80 font-medium',
  general: 'text-white/85',
}
