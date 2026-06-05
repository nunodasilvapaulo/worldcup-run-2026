import { SquadCard } from '@/components/SquadCard'
import { canReplaceKeepingGk } from '@/game/squad'
import { useGame } from '@/game/store'

/** Pick who leaves the squad for the new call-up */
export function RecruitSubScreen() {
  const { state, dispatch } = useGame()
  const incoming = state.pendingRecruits?.[0]
  const warn = state.mysteryMessage

  if (!incoming || !state.run) return null

  return (
    <div className="min-h-dvh p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-[var(--color-wc-gold-light)]">Squad change</h2>
      <p className="text-white/50 text-sm mb-2">
        <strong className="text-white">{incoming.name}</strong> joins the squad.
      </p>
      <p className="text-white/50 text-sm mb-2">Who are you replacing?</p>
      {warn && (
        <p className="text-amber-300/90 text-sm mb-4 rounded-lg border border-amber-400/30 bg-amber-950/30 px-3 py-2">
          {warn}
        </p>
      )}
      <SquadCard player={incoming} nationId={state.run.nationId} />
      <div className="space-y-3 mt-4">
        {state.run.squad.map((p) => {
          const allowed = canReplaceKeepingGk(state.run!.squad, p.id, incoming)
          return (
            <div key={p.id} className={allowed ? '' : 'opacity-40 pointer-events-none'}>
              <SquadCard
                player={p}
                nationId={state.run!.nationId}
                onClick={
                  allowed
                    ? () =>
                        dispatch({
                          type: 'PICK_RECRUIT_SUB',
                          newPlayer: incoming,
                          replacePlayerId: p.id,
                        })
                    : undefined
                }
              />
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-[10px] text-white/40 text-center">
        You must always keep at least one goalkeeper
      </p>
    </div>
  )
}
