import { useGame } from '@/game/store'

export function NodeContinueScreen() {
  const { state, dispatch } = useGame()
  const result = state.pendingNodeResult
  if (!result) return null

  return (
    <div className="min-h-dvh p-6 max-w-lg mx-auto flex flex-col justify-center text-center">
      {result.title && (
        <h2 className="text-xl font-bold text-[var(--color-wc-gold-light)] mb-3">{result.title}</h2>
      )}
      <p className="text-lg text-white mb-8">{result.message}</p>
      <button
        type="button"
        onClick={() => dispatch({ type: 'COMPLETE_NODE' })}
        className="rounded-xl bg-[var(--color-wc-green)] py-3 font-bold text-white"
      >
        Continue
      </button>
    </div>
  )
}
