import type { BootstrapPayload } from './api'
import type { PlayerTemplate } from './players2026'
import type { Nation } from './types'

let loaded = false
const nationsById = new Map<string, Nation>()
let starterNationIds: string[] = []
const rostersByNation = new Map<string, PlayerTemplate[]>()
const legendsByNation = new Map<string, PlayerTemplate[]>()

function toNation(row: BootstrapPayload['nations'][number]): Nation {
  return {
    id: row.id,
    name: row.name,
    flag: row.flag,
    confederation: row.confederation as Nation['confederation'],
    tier: row.tier as Nation['tier'],
    archetype: row.archetype as Nation['archetype'],
    colors: row.colors as [string, string, string],
    isHost: row.isHost,
    debut2026: row.debut2026,
  }
}

export function installGameData(payload: BootstrapPayload) {
  nationsById.clear()
  rostersByNation.clear()
  legendsByNation.clear()

  for (const row of payload.nations) {
    nationsById.set(row.id, toNation(row))
  }
  starterNationIds = [...payload.starterNationIds]

  for (const [nationId, players] of Object.entries(payload.rosters)) {
    rostersByNation.set(nationId, players)
  }
  for (const [nationId, players] of Object.entries(payload.legends)) {
    legendsByNation.set(nationId, players)
  }
  loaded = true
}

export function isGameDataLoaded() {
  return loaded
}

export function getCachedNation(id: string): Nation | undefined {
  return nationsById.get(id)
}

export function getCachedRoster(nationId: string): PlayerTemplate[] {
  return rostersByNation.get(nationId) ?? []
}

export function getCachedLegends(nationId: string): PlayerTemplate[] {
  return legendsByNation.get(nationId) ?? []
}

export function getCachedStarterNationIds(): readonly string[] {
  return starterNationIds
}

export function getCachedAllNations(): Nation[] {
  return [...nationsById.values()]
}
