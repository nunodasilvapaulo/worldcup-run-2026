import { useGame } from '@/game/store'

export function RunActions({ compact }: { compact?: boolean }) {
  const { dispatch } = useGame()

  return (
    <div className={['flex gap-1.5', compact ? 'flex-row' : 'flex-col sm:flex-row'].join(' ')}>
      <button
        type="button"
        onClick={() => dispatch({ type: 'RESTART_RUN' })}
        className="rounded-lg border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/70 hover:bg-white/10 hover:text-white"
        title="Restart this nation from the beginning"
      >
        Restart
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'BACK_MENU' })}
        className="rounded-lg border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/70 hover:bg-white/10 hover:text-white"
        title="Return to main menu"
      >
        Menu
      </button>
    </div>
  )
}
