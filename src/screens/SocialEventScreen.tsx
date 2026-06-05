import { SquadCard } from '@/components/SquadCard'
import { useGame } from '@/game/store'

export function SocialEventScreen() {
  const { state, dispatch } = useGame()
  const run = state.run!

  return (
    <div className="min-h-dvh p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-[var(--color-wc-gold-light)]">Social event</h2>
      <p className="text-white/50 text-sm mb-6">
        Choose a player to represent the team at the media event. Outcome is unpredictable.
      </p>
      <div className="space-y-3">
        {run.squad.map((p) => (
          <SquadCard
            key={p.id}
            player={p}
            nationId={run.nationId}
            onClick={() => dispatch({ type: 'PICK_SOCIAL_PLAYER', playerId: p.id })}
          />
        ))}
      </div>
    </div>
  )
}
