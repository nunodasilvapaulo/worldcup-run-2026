import {
  checkApiHealth,
  ensureSession,
  fetchBootstrap,
  fetchSave,
  isApiEnabled,
} from './api'
import { installGameData } from './gameData'
import { buildInitialGameState } from './initGameState'
import { syncRemoteSaveToLocal } from './storage'
import type { GameState, RunState } from './types'

export type BootstrapResult = {
  gameState: ReturnType<typeof buildInitialGameState>
  usingApi: boolean
}

export async function bootstrapApp(): Promise<BootstrapResult> {
  const useApi = isApiEnabled() && (await checkApiHealth())

  if (useApi) {
    await ensureSession()
    const [data, save] = await Promise.all([fetchBootstrap(), fetchSave()])
    installGameData(data)
    syncRemoteSaveToLocal(save)
    return {
      usingApi: true,
      gameState: buildInitialGameState({
        hallOfLegends: save.hallOfLegends,
        saved: save.run
          ? {
              hallOfLegends: save.hallOfLegends,
              screen: (save.screen as GameState['screen'] | null) ?? undefined,
              run: save.run as RunState,
              lastBattle: save.lastBattle as GameState['lastBattle'],
              pendingFight: save.pendingFight as GameState['pendingFight'],
            }
          : null,
      }),
    }
  }

  return { usingApi: false, gameState: buildInitialGameState() }
}
