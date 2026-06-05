import { TournamentGroupCard } from '@/components/TournamentGroupCard'
import { WORLD_CUP_GROUPS_2026 } from '@/game/groups2026'
import { getStarterNationIds } from '@/game/nations2026'
import { useGame } from '@/game/store'

export function NationScreen() {
  const { dispatch } = useGame()

  return (
    <div className="min-h-dvh p-4 sm:p-6 max-w-6xl mx-auto">
      <header className="mb-6 text-center sm:text-left">
        <h2 className="text-2xl font-bold text-[var(--color-wc-gold-light)]">Choose your nation</h2>
        <p className="text-white/50 text-sm mt-1 max-w-2xl">
          Official FIFA World Cup 2026 group stage draw — all 12 groups shown below.{' '}
          <span className="text-[var(--color-wc-gold)]/90">
            {getStarterNationIds().length} nations
          </span>{' '}
          are available to play; hover any team to preview their starting XI.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {WORLD_CUP_GROUPS_2026.map((group) => (
          <TournamentGroupCard
            key={group.id}
            group={group}
            onPickNation={(nationId) => dispatch({ type: 'PICK_NATION', nationId })}
          />
        ))}
      </div>

      <p className="mt-6 text-center text-[10px] text-white/35">
        More nations unlock in future updates
      </p>
    </div>
  )
}
