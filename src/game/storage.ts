import { clearRemoteRun, isApiEnabled, putSave } from './api'
import type { GameState } from './types'

const KEY = 'worldcup-run-2026-v24'
let apiPersistence = false

export function setApiPersistence(enabled: boolean) {
  apiPersistence = enabled
}

/** Mirror a cloud save into localStorage for offline resume. */
export function syncRemoteSaveToLocal(payload: {
  hallOfLegends: number
  screen: string | null
  run: unknown
  lastBattle: unknown
  pendingFight: unknown
}) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      hallOfLegends: payload.hallOfLegends,
      screen: payload.screen,
      run: payload.run,
      lastBattle: payload.lastBattle,
      pendingFight: payload.pendingFight,
    }),
  )
}

function localPayload(state: GameState) {
  return {
    hallOfLegends: state.hallOfLegends,
    run: state.run,
    screen: state.screen,
    lastBattle: state.lastBattle,
    pendingFight: state.pendingFight,
  }
}

export function loadMeta(): { hallOfLegends: number } {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { hallOfLegends: 0 }
    const data = JSON.parse(raw) as { hallOfLegends?: number }
    return { hallOfLegends: data.hallOfLegends ?? 0 }
  } catch {
    return { hallOfLegends: 0 }
  }
}

export function saveRun(state: GameState) {
  const payload = localPayload(state)
  localStorage.setItem(KEY, JSON.stringify(payload))

  if (apiPersistence && isApiEnabled()) {
    void putSave({
      hallOfLegends: payload.hallOfLegends,
      screen: payload.screen,
      run: payload.run,
      lastBattle: payload.lastBattle,
      pendingFight: payload.pendingFight,
    }).catch((err) => console.warn('Cloud save failed', err))
  }
}

export function loadRun(): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<GameState>
  } catch {
    return null
  }
}

export function clearRun() {
  const meta = loadMeta()
  localStorage.setItem(KEY, JSON.stringify({ hallOfLegends: meta.hallOfLegends }))

  if (apiPersistence && isApiEnabled()) {
    void clearRemoteRun()
      .then((hall) => {
        localStorage.setItem(KEY, JSON.stringify({ hallOfLegends: hall }))
      })
      .catch((err) => console.warn('Cloud clear failed', err))
  }
}
