import { getNation } from '@/game/nations2026'
import { useGame } from '@/game/store'

export function GameOverScreen() {
  const { dispatch } = useGame()
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
      <p className="text-4xl">📉</p>
      <h2 className="text-3xl font-bold text-white mt-4">Eliminated</h2>
      <p className="text-white/50 mt-2 max-w-sm">Your World Cup run is over. Try another nation.</p>
      <button
        type="button"
        onClick={() => dispatch({ type: 'BACK_MENU' })}
        className="mt-8 rounded-xl bg-white/10 px-8 py-3 font-semibold text-white"
      >
        Main menu
      </button>
    </div>
  )
}

export function ChampionScreen() {
  const { state, dispatch } = useGame()
  const nation = state.run ? getNation(state.run.nationId) : null
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
      <p className="text-5xl">🏆</p>
      <h2 className="text-3xl font-black text-[var(--color-wc-gold)] mt-4">WORLD CHAMPIONS</h2>
      {nation && (
        <p className="text-2xl mt-2">
          {nation.flag} {nation.name}
        </p>
      )}
      <p className="text-white/60 mt-3">
        Hall of Legends: {state.hallOfLegends} title{state.hallOfLegends !== 1 ? 's' : ''}
      </p>
      <button
        type="button"
        onClick={() => dispatch({ type: 'BACK_MENU' })}
        className="mt-8 rounded-xl bg-[var(--color-wc-gold)] text-[var(--color-wc-blue)] px-8 py-3 font-bold"
      >
        Play again
      </button>
    </div>
  )
}
