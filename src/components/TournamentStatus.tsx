import { NationFlag } from '@/components/NationFlag'
import { stageForLayer } from '@/game/constants'
import { getNation } from '@/game/nations2026'
import {
  getPlayerGroupStandings,
  topScorersList,
  tournamentStatusSummary,
} from '@/game/tournament'
import type { RunState } from '@/game/types'

export function TournamentStatus({ run }: { run: RunState }) {
  const stage = stageForLayer(run.currentMapIndex)
  const standings = getPlayerGroupStandings(run.tournament)
  const summary = tournamentStatusSummary(run.tournament, run.nationId)
  const groupLabel = run.tournament.playerGroupId
  const scorers = topScorersList(run.goldenBoot, 4)

  return (
    <div className="rounded-xl border border-[var(--color-wc-gold)]/25 bg-black/55 backdrop-blur-md p-3 text-xs space-y-2">
      <div className="flex justify-between items-center gap-2">
        <p className="font-bold text-[var(--color-wc-gold-light)]">Tournament live</p>
        <span className="text-white/45">{stage.label}</span>
      </div>
      <p className="text-white/60">Group {groupLabel} · {summary}</p>
      {run.tournament.qualificationNote && (
        <p className="text-[10px] text-[var(--color-wc-gold)]/80">{run.tournament.qualificationNote}</p>
      )}
      <div className="space-y-1">
        {standings.map((s, i) => {
          const n = getNation(s.nationId)
          const isPlayer = s.nationId === run.nationId
          const gd = s.gf - s.ga
          return (
            <div
              key={`${s.nationId}-${s.played}-${s.points}-${s.gf}`}
              className={[
                'flex justify-between items-center gap-2 px-2 py-1 rounded',
                isPlayer ? 'bg-[var(--color-wc-gold)]/15 text-white' : 'text-white/55',
              ].join(' ')}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="text-white/40 w-3">{i + 1}</span>
                <NationFlag nationId={s.nationId} size={18} />
                <span className="truncate">{n.name}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                {s.points}p · {gd >= 0 ? '+' : ''}
                {gd}
              </span>
            </div>
          )
        })}
      </div>
      {scorers.length > 0 && (
        <div className="border-t border-white/10 pt-2">
          <p className="text-[10px] uppercase text-[var(--color-wc-gold)]/70 mb-1">Golden Boot</p>
          {scorers.map((s, i) => (
            <p key={`${s.nationId}-${s.playerName}`} className="text-white/50 flex justify-between">
              <span>
                {i + 1}. {s.playerName}{' '}
                <NationFlag nationId={s.nationId} size={14} className="inline-block align-middle" />
              </span>
              <span>
                {s.goals}⚽ {s.assists > 0 ? `${s.assists}🅰️` : ''}
              </span>
            </p>
          ))}
        </div>
      )}
      {(run.tournament.recentHeadlines?.length ?? 0) > 0 && (
        <ul className="text-white/40 space-y-0.5 max-h-20 overflow-auto border-t border-white/10 pt-2">
          {run.tournament.recentHeadlines.slice(0, 5).map((h, i) => (
            <li key={i}>• {h}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
