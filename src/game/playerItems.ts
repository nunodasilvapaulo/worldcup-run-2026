import type { PlayerItem, PlayerStats, SquadPlayer } from './types'

export const PLAYER_ITEM_POOL: PlayerItem[] = [
  {
    id: 'speed-boots',
    name: 'Speed Boots',
    description: '+10 Pace',
    kind: 'boots',
    statMods: { pace: 10 },
  },
  {
    id: 'maestro-boots',
    name: 'Maestro Boots',
    description: '+8 Pass — playmaker bias',
    kind: 'maestro',
    statMods: { pass: 8 },
    passBias: 0.15,
  },
  {
    id: 'sniper-boots',
    name: 'Sniper Boots',
    description: '+10 Shoot',
    kind: 'sniper',
    statMods: { shoot: 10 },
  },
  {
    id: 'wall-shinguards',
    name: 'Wall Shinguards',
    description: '+10 Defend',
    kind: 'wall',
    statMods: { defend: 10 },
  },
  {
    id: 'captain-armband',
    name: 'Captain Armband',
    description: '+4 all stats',
    kind: 'captain',
    statMods: { pace: 4, shoot: 4, pass: 4, defend: 4 },
  },
  {
    id: 'keeper-gloves',
    name: 'Keeper Gloves',
    description: '+12 Defend (GK/DEF)',
    kind: 'gloves',
    statMods: { defend: 12 },
  },
]

export function getPlayerItem(id: string): PlayerItem | undefined {
  return PLAYER_ITEM_POOL.find((i) => i.id === id)
}

export function collectOwnedItemIds(squad: SquadPlayer[], bag: string[]): Set<string> {
  const owned = new Set(bag)
  for (const p of squad) {
    if (p.equippedItemId) owned.add(p.equippedItemId)
  }
  return owned
}

export function rollItemOffers(count: number, ownedIds: Iterable<string>): PlayerItem[] {
  const owned = new Set(ownedIds)
  const pool = PLAYER_ITEM_POOL.filter((i) => !owned.has(i.id))
  if (pool.length === 0) return []
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, pool.length))
}

/** Equip an item on a player; previous gear goes to the bag. */
export function equipItemOnPlayer(
  squad: SquadPlayer[],
  bag: string[],
  playerId: string,
  itemId: string,
): { squad: SquadPlayer[]; bag: string[] } {
  let nextBag = [...bag]
  const nextSquad = squad.map((p) => {
    if (p.id !== playerId) return p
    if (p.equippedItemId && p.equippedItemId !== itemId) {
      nextBag.push(p.equippedItemId)
    }
    return { ...p, equippedItemId: itemId }
  })
  nextBag = nextBag.filter((id) => id !== itemId)
  return { squad: nextSquad, bag: nextBag }
}

/** Remove equipped item from a player and store it in the bag. */
export function unequipItemFromPlayer(
  squad: SquadPlayer[],
  bag: string[],
  playerId: string,
): { squad: SquadPlayer[]; bag: string[] } {
  const player = squad.find((p) => p.id === playerId)
  if (!player?.equippedItemId) return { squad, bag }
  const squadNext = squad.map((p) =>
    p.id === playerId ? { ...p, equippedItemId: null } : p,
  )
  return { squad: squadNext, bag: [...bag, player.equippedItemId] }
}

/** Move one player's equipped item onto another; displaced gear goes to the bag. */
export function transferEquippedItem(
  squad: SquadPlayer[],
  bag: string[],
  fromPlayerId: string,
  toPlayerId: string,
): { squad: SquadPlayer[]; bag: string[] } {
  const from = squad.find((p) => p.id === fromPlayerId)
  if (!from?.equippedItemId || fromPlayerId === toPlayerId) {
    return { squad, bag }
  }
  const itemId = from.equippedItemId
  const stripped = squad.map((p) =>
    p.id === fromPlayerId ? { ...p, equippedItemId: null } : p,
  )
  return equipItemOnPlayer(stripped, bag, toPlayerId, itemId)
}

export function applyItemStats(base: PlayerStats, item: PlayerItem | null): PlayerStats {
  if (!item) return base
  return {
    pace: Math.min(99, base.pace + (item.statMods.pace ?? 0)),
    shoot: Math.min(99, base.shoot + (item.statMods.shoot ?? 0)),
    pass: Math.min(99, base.pass + (item.statMods.pass ?? 0)),
    defend: Math.min(99, base.defend + (item.statMods.defend ?? 0)),
  }
}
