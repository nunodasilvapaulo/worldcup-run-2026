import { useEffect, useState } from 'react'
import { GameProvider, useGame } from '@/game/store'
import { bootstrapApp } from '@/game/bootstrap'
import { setApiPersistence } from '@/game/storage'
import type { GameState } from '@/game/types'
import { MenuScreen } from '@/screens/MenuScreen'
import { NationScreen } from '@/screens/NationScreen'
import { MapScreen } from '@/screens/MapScreen'
import { BattleScreen } from '@/screens/BattleScreen'
import { MatchExpScreen } from '@/screens/MatchExpScreen'
import { MatchLiveScreen } from '@/screens/MatchLiveScreen'
import { RecruitScreen } from '@/screens/RecruitScreen'
import { LegendRecruitScreen } from '@/screens/LegendRecruitScreen'
import { TournamentReportScreen } from '@/screens/TournamentReportScreen'
import { GoldenBootScreen } from '@/screens/GoldenBootScreen'
import { TournamentOverviewScreen } from '@/screens/TournamentOverviewScreen'
import { SocialEventScreen } from '@/screens/SocialEventScreen'
import { ItemEquipScreen } from '@/screens/ItemEquipScreen'
import { MysteryScreen } from '@/screens/MysteryScreen'
import { RecruitSubScreen } from '@/screens/RecruitSubScreen'
import { TrainingScreen } from '@/screens/TrainingScreen'
import { TrainingSessionScreen } from '@/screens/TrainingSessionScreen'
import { ShopScreen } from '@/screens/ShopScreen'
import { NodeContinueScreen } from '@/screens/NodeContinueScreen'
import { GameOverScreen, ChampionScreen } from '@/screens/EndScreens'

function Router() {
  const { state, persist } = useGame()

  useEffect(() => {
    if (state.screen !== 'menu' && state.screen !== 'nation' && state.run) persist()
  }, [state, persist])

  if (state.pendingNodeResult) return <NodeContinueScreen />

  switch (state.screen) {
    case 'menu':
      return <MenuScreen />
    case 'nation':
      return <NationScreen />
    case 'map':
      return <MapScreen />
    case 'match_live':
      return <MatchLiveScreen />
    case 'match_exp':
      return <MatchExpScreen />
    case 'battle':
      return <BattleScreen />
    case 'recruit':
      return state.pendingIncomingRecruit ? <RecruitSubScreen /> : <RecruitScreen />
    case 'social':
      return <SocialEventScreen />
    case 'item_pick':
      return <ItemEquipScreen />
    case 'mystery':
      return <MysteryScreen />
    case 'golden_boot':
      return <GoldenBootScreen />
    case 'tournament_overview':
      return <TournamentOverviewScreen />
    case 'legend':
      return state.pendingIncomingRecruit ? <RecruitSubScreen /> : <LegendRecruitScreen />
    case 'tournament_report':
      return <TournamentReportScreen />
    case 'training':
      return <TrainingScreen />
    case 'training_session':
      return <TrainingSessionScreen />
    case 'shop':
      return <ShopScreen />
    case 'gameover':
      return <GameOverScreen />
    case 'champion':
      return <ChampionScreen />
    default:
      return <MenuScreen />
  }
}

function BootScreen({ message }: { message: string }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-4xl">🏆</p>
      <p className="text-white/70 text-sm">{message}</p>
    </div>
  )
}

export default function App() {
  const [boot, setBoot] = useState<{ state: GameState; usingApi: boolean } | null>(null)
  const [bootError, setBootError] = useState<string | null>(null)

  useEffect(() => {
    bootstrapApp()
      .then((result) => {
        setApiPersistence(result.usingApi)
        setBoot({ state: result.gameState, usingApi: result.usingApi })
      })
      .catch((err) => {
        console.error(err)
        setBootError('Could not connect — try refreshing.')
      })
  }, [])

  if (bootError) {
    return <BootScreen message={bootError} />
  }

  if (!boot) {
    return <BootScreen message="Loading World Cup Run…" />
  }

  return (
    <GameProvider initialState={boot.state}>
      <Router />
    </GameProvider>
  )
}
