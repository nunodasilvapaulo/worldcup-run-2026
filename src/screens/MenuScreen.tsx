import { useGame } from '@/game/store'

export function MenuScreen() {
  const { state, dispatch } = useGame()

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 text-center relative"
      style={{
        backgroundImage:
          'linear-gradient(rgba(10,22,40,0.88), rgba(10,22,40,0.92)), url(https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Metlife_stadium_ext.jpg/1280px-Metlife_stadium_ext.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <p className="text-5xl mb-2">🏆</p>
      <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-wc-gold-light)]">World Cup Run 2026</h1>
      <p className="text-white/55 mt-2 max-w-md text-sm">
        Eight maps — MD1 to the Final. Friendlies, then your real group & knockout foes. Start with the five weakest from your call-up, recruit stars, one legend pick.
      </p>
      {state.hallOfLegends > 0 && (
        <p className="mt-4 text-[var(--color-wc-gold)] text-sm font-medium">
          🏛️ {state.hallOfLegends} World Cup{state.hallOfLegends !== 1 ? 's' : ''} won
        </p>
      )}
      <div className="mt-10 flex flex-col gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={() => dispatch({ type: 'NEW_RUN', mode: 'normal' })}
          className="rounded-xl bg-[var(--color-wc-green)] hover:brightness-110 text-white font-bold py-3 border border-[var(--color-wc-gold)]/30"
        >
          New Run — Normal
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'NEW_RUN', mode: 'ironman' })}
          className="rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold py-3 border border-white/10"
        >
          Ironman (weak recovery)
        </button>
      </div>
      <p className="mt-8 text-[10px] text-white/30 max-w-sm leading-relaxed">
        Fan game inspired by Pokelike. Uses the 48 qualified nations for WC 2026. Not affiliated with FIFA or any federation.
      </p>
    </div>
  )
}
