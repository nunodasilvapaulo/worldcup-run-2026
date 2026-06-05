/**
 * Official FIFA World Cup 2026 group stage draw (Dec 2025).
 * Source: FIFA / NBC Sports confirmed groups A–L.
 */
export interface WorldCupGroupDef {
  id: string
  /** Four nation ids in draw order */
  nations: [string, string, string, string]
}

/** Confirmed 12 × 4 groups */
export const WORLD_CUP_GROUPS_2026: WorldCupGroupDef[] = [
  { id: 'A', nations: ['mexico', 'korea', 'south-africa', 'czechia'] },
  { id: 'B', nations: ['canada', 'bosnia', 'qatar', 'switzerland'] },
  { id: 'C', nations: ['brazil', 'morocco', 'scotland', 'haiti'] },
  { id: 'D', nations: ['usa', 'paraguay', 'australia', 'turkey'] },
  { id: 'E', nations: ['germany', 'ecuador', 'ivory-coast', 'curacao'] },
  { id: 'F', nations: ['netherlands', 'japan', 'tunisia', 'sweden'] },
  { id: 'G', nations: ['belgium', 'iran', 'egypt', 'new-zealand'] },
  { id: 'H', nations: ['spain', 'uruguay', 'saudi', 'cabo-verde'] },
  { id: 'I', nations: ['france', 'senegal', 'norway', 'iraq'] },
  { id: 'J', nations: ['argentina', 'austria', 'algeria', 'jordan'] },
  { id: 'K', nations: ['portugal', 'colombia', 'uzbekistan', 'congo-dr'] },
  { id: 'L', nations: ['england', 'croatia', 'panama', 'ghana'] },
]

/**
 * Real MD1–MD3 opponents per nation (FIFA published fixtures where available).
 * Fallback: standard round-robin for other teams in sim.
 */
const MD_OPPONENTS: Record<string, [string, string, string]> = {
  // Group I — France
  france: ['senegal', 'iraq', 'norway'],
  senegal: ['france', 'iraq', 'norway'],
  norway: ['iraq', 'senegal', 'france'],
  iraq: ['norway', 'france', 'senegal'],
  // Group J
  argentina: ['austria', 'algeria', 'jordan'],
  austria: ['argentina', 'algeria', 'jordan'],
  algeria: ['argentina', 'austria', 'jordan'],
  jordan: ['argentina', 'austria', 'algeria'],
  // Group C — Brazil
  brazil: ['morocco', 'scotland', 'haiti'],
  morocco: ['brazil', 'scotland', 'haiti'],
  scotland: ['brazil', 'morocco', 'haiti'],
  haiti: ['brazil', 'morocco', 'scotland'],
  // Group D — USA
  usa: ['paraguay', 'australia', 'turkey'],
  paraguay: ['usa', 'australia', 'turkey'],
  australia: ['usa', 'paraguay', 'turkey'],
  turkey: ['usa', 'paraguay', 'australia'],
  // Group A — Mexico
  mexico: ['korea', 'south-africa', 'czechia'],
  korea: ['mexico', 'south-africa', 'czechia'],
  'south-africa': ['mexico', 'korea', 'czechia'],
  czechia: ['mexico', 'korea', 'south-africa'],
  // Group E — Curaçao
  curacao: ['germany', 'ecuador', 'ivory-coast'],
  germany: ['ecuador', 'ivory-coast', 'curacao'],
  ecuador: ['germany', 'ivory-coast', 'curacao'],
  'ivory-coast': ['germany', 'ecuador', 'curacao'],
  // Group K — Uzbekistan
  uzbekistan: ['portugal', 'colombia', 'congo-dr'],
  portugal: ['colombia', 'uzbekistan', 'congo-dr'],
  colombia: ['portugal', 'uzbekistan', 'congo-dr'],
  'congo-dr': ['portugal', 'colombia', 'uzbekistan'],
}

function standardMdOpponents(
  nations: [string, string, string, string],
  nationId: string,
): [string, string, string] {
  const idx = nations.indexOf(nationId as (typeof nations)[number])
  if (idx < 0) return [nations[1], nations[2], nations[3]]
  const other = nations.filter((n) => n !== nationId)
  return [other[0]!, other[1]!, other[2]!]
}

export function findGroupForNation(nationId: string): WorldCupGroupDef | undefined {
  return WORLD_CUP_GROUPS_2026.find((g) => g.nations.includes(nationId as never))
}

export function getMdOpponentsForNation(nationId: string): [string, string, string] {
  const override = MD_OPPONENTS[nationId]
  if (override) return override
  const group = findGroupForNation(nationId)
  if (!group) return ['brazil', 'germany', 'spain']
  return standardMdOpponents(group.nations, nationId)
}

/** Standard 4-team schedule (pair indices into group.nations order) */
const RR_MD: [number, number][][] = [
  [
    [0, 1],
    [2, 3],
  ],
  [
    [0, 2],
    [1, 3],
  ],
  [
    [0, 3],
    [1, 2],
  ],
]

/** FIFA-published pairs for Group I */
const GROUP_I_FIXTURES: [string, string][][] = [
  [
    ['france', 'senegal'],
    ['iraq', 'norway'],
  ],
  [
    ['france', 'iraq'],
    ['senegal', 'norway'],
  ],
  [
    ['norway', 'france'],
    ['senegal', 'iraq'],
  ],
]

export function getGroupMatchdayFixtures(groupId: string, mdIndex: number): [string, string][] {
  const g = WORLD_CUP_GROUPS_2026.find((x) => x.id === groupId)
  if (!g) return []
  if (groupId === 'I') return GROUP_I_FIXTURES[mdIndex] ?? []
  const pairs = RR_MD[mdIndex] ?? []
  return pairs.map(([a, b]) => [g.nations[a]!, g.nations[b]!])
}

export function getPlayerWorldCupGroup(nationId: string): {
  groupId: string
  groupNationIds: string[]
  groupOpponentIds: [string, string, string]
} {
  const group = findGroupForNation(nationId)
  if (!group) {
    return {
      groupId: '?',
      groupNationIds: [nationId, 'brazil', 'germany', 'spain'],
      groupOpponentIds: ['brazil', 'germany', 'spain'],
    }
  }
  const md = getMdOpponentsForNation(nationId)
  return {
    groupId: group.id,
    groupNationIds: [...group.nations],
    groupOpponentIds: md,
  }
}
