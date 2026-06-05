import { TIER_POWER } from './constants'
import {
  getGroupMatchdayFixtures,
  getPlayerWorldCupGroup,
  WORLD_CUP_GROUPS_2026,
} from './groups2026'
import { getNation } from './nations2026'
import { getRoster, nationStarTemplate } from './players2026'
import type {
  GroupStanding,
  ScorerEntry,
  SimMatchResult,
  TournamentGroup,
  TournamentState,
} from './types'

function nationStrength(nationId: string): number {
  const n = getNation(nationId)
  return (TIER_POWER[n.tier] ?? 0) + 50 + Math.floor(Math.random() * 12)
}

export function simulateQuickMatch(homeId: string, awayId: string): SimMatchResult {
  const h = nationStrength(homeId)
  const a = nationStrength(awayId)
  const homeExp = h / (h + a)
  const totalGoals = 1 + Math.floor(Math.random() * 4)
  const homeGoals = Math.min(
    totalGoals,
    Math.round(totalGoals * homeExp + (Math.random() < 0.2 ? 1 : 0)),
  )
  const awayGoals = Math.max(0, totalGoals - homeGoals + (Math.random() < 0.15 ? 1 : 0))
  return { homeId, awayId, homeGoals, awayGoals }
}

function applyResult(
  standings: GroupStanding[],
  homeId: string,
  awayId: string,
  hg: number,
  ag: number,
) {
  const home = standings.find((s) => s.nationId === homeId)!
  const away = standings.find((s) => s.nationId === awayId)!
  home.played += 1
  away.played += 1
  home.gf += hg
  home.ga += ag
  away.gf += ag
  away.ga += hg
  if (hg > ag) {
    home.won += 1
    home.points += 3
    away.lost += 1
  } else if (ag > hg) {
    away.won += 1
    away.points += 3
    home.lost += 1
  } else {
    home.drawn += 1
    away.drawn += 1
    home.points += 1
    away.points += 1
  }
}

function emptyStanding(nationId: string): GroupStanding {
  return { nationId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function drawGroupOpponents(playerNationId: string): string[] {
  return [...getPlayerWorldCupGroup(playerNationId).groupOpponentIds]
}

function buildAllGroups(playerNationId: string, playerGroupId: string): TournamentGroup[] {
  const playerInfo = getPlayerWorldCupGroup(playerNationId)
  return WORLD_CUP_GROUPS_2026.map((g) => {
    const nationIds =
      g.id === playerGroupId ? [...playerInfo.groupNationIds] : [...g.nations]
    return {
      id: g.id,
      nationIds,
      standings: nationIds.map(emptyStanding),
    }
  })
}

export function playerBossOpponentForMd(tournament: TournamentState, mdIndex: number): string {
  return tournament.groupOpponentIds[mdIndex]!
}

/** FIFA group stage: 3 pts win, 1 draw, 0 loss; tie-break GD, GF */
export function sortStandings(standings: GroupStanding[]): GroupStanding[] {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const gdA = a.gf - a.ga
    const gdB = b.gf - b.ga
    if (gdB !== gdA) return gdB - gdA
    return b.gf - a.gf
  })
}

interface ThirdPlaceCandidate {
  nationId: string
  groupId: string
  points: number
  gd: number
  gf: number
}

/** Eight best third-placed teams by points, GD, GF (live standings). */
export function computeThirdQualifiers(groups: TournamentGroup[]): string[] {
  const thirds: ThirdPlaceCandidate[] = []
  for (const g of groups) {
    const sorted = sortStandings(g.standings)
    const third = sorted[2]
    if (!third) continue
    thirds.push({
      nationId: third.nationId,
      groupId: g.id,
      points: third.points,
      gd: third.gf - third.ga,
      gf: third.gf,
    })
  }
  thirds.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
  return thirds.slice(0, 8).map((t) => t.nationId)
}

/** Top 2 per group (24) + 8 best third-placed = 32 (WC 2026 rules) */
export function qualifyKnockout32(
  groups: TournamentGroup[],
  playerNationId: string,
): { qualifiers: string[]; thirdQualifiers: string[] } {
  const auto: string[] = []
  const thirds: ThirdPlaceCandidate[] = []

  for (const g of groups) {
    const sorted = sortStandings(g.standings)
    auto.push(sorted[0]!.nationId, sorted[1]!.nationId)
    const third = sorted[2]!
    thirds.push({
      nationId: third.nationId,
      groupId: g.id,
      points: third.points,
      gd: third.gf - third.ga,
      gf: third.gf,
    })
  }

  thirds.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
  const thirdQualifiers = thirds.slice(0, 8).map((t) => t.nationId)
  let qualifiers = [...new Set([...auto, ...thirdQualifiers])]

  if (!qualifiers.includes(playerNationId)) {
    qualifiers = [playerNationId, ...qualifiers.filter((id) => id !== playerNationId)].slice(0, 32)
  } else {
    qualifiers = qualifiers.slice(0, 32)
  }

  return { qualifiers, thirdQualifiers }
}

function buildKnockoutPath(playerNationId: string, qualifiers: string[]): string[] {
  const bracket = shuffle(qualifiers.filter((id) => id !== playerNationId))
  const opponents: string[] = []
  let pool = [...bracket]
  for (let round = 0; round < 5; round++) {
    const opp = pool[Math.floor(Math.random() * pool.length)] ?? bracket[0]!
    opponents.push(opp)
    pool = pool.filter((id) => id !== opp)
    if (pool.length === 0) pool = [...bracket]
  }
  return opponents
}

function pickNationAssister(nationId: string, scorerName: string): string | undefined {
  const pool = getRoster(nationId).filter(
    (p) => p.name !== scorerName && (p.role === 'MID' || p.role === 'WNG'),
  )
  if (pool.length === 0 || Math.random() > 0.78) return undefined
  return pool[Math.floor(Math.random() * pool.length)]!.name
}

function goalStatsFromSimMatch(homeId: string, awayId: string, hg: number, ag: number) {
  const scorerEvents: { scorerName: string; scorerNationId: string }[] = []
  const assistEvents: { playerName: string; nationId: string }[] = []

  const pushGoals = (nationId: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const star = nationStarTemplate(nationId)
      const scorerName = star?.name ?? getNation(nationId).name
      scorerEvents.push({ scorerName, scorerNationId: nationId })
      const assistName = pickNationAssister(nationId, scorerName)
      if (assistName) assistEvents.push({ playerName: assistName, nationId })
    }
  }

  pushGoals(homeId, hg)
  pushGoals(awayId, ag)
  return { scorerEvents, assistEvents }
}

function fixtureKey(homeId: string, awayId: string): string {
  return [homeId, awayId].sort().join('|')
}

/** Simulate one matchday across all 12 groups; skip one fixture already played by the user. */
export function simWorldMatchday(
  tournament: TournamentState,
  mdIndex: number,
  skipFixture?: [string, string] | null,
): {
  headlines: string[]
  scorerEvents: { scorerName: string; scorerNationId: string }[]
  assistEvents: { playerName: string; nationId: string }[]
  groups: TournamentGroup[]
} {
  const headlines: string[] = []
  const scorerEvents: { scorerName: string; scorerNationId: string }[] = []
  const assistEvents: { playerName: string; nationId: string }[] = []
  const groups = tournament.groups.map((g) => ({
    ...g,
    standings: g.standings.map((s) => ({ ...s })),
  }))
  const skipKey = skipFixture ? fixtureKey(skipFixture[0], skipFixture[1]) : null
  for (const group of groups) {
    const fixtures = getGroupMatchdayFixtures(group.id, mdIndex)
    for (const [homeId, awayId] of fixtures) {
      if (skipKey && fixtureKey(homeId, awayId) === skipKey) continue
      const r = simulateQuickMatch(homeId, awayId)
      applyResult(group.standings, r.homeId, r.awayId, r.homeGoals, r.awayGoals)
      const stats = goalStatsFromSimMatch(r.homeId, r.awayId, r.homeGoals, r.awayGoals)
      scorerEvents.push(...stats.scorerEvents)
      assistEvents.push(...stats.assistEvents)
      headlines.push(
        `G${group.id}: ${getNation(r.homeId).name} ${r.homeGoals}–${r.awayGoals} ${getNation(r.awayId).name}`,
      )
    }
  }
  return { headlines: headlines.slice(0, 10), scorerEvents, assistEvents, groups }
}

function upsertStatRow(
  table: ScorerEntry[],
  playerName: string,
  nationId: string,
  goals: number,
  assists: number,
): ScorerEntry[] {
  const next = table.map((e) => ({ ...e, assists: e.assists ?? 0 }))
  const found = next.find((e) => e.playerName === playerName && e.nationId === nationId)
  if (found) {
    found.goals += goals
    found.assists += assists
  } else {
    next.push({ playerName, nationId, goals, assists })
  }
  return next
}

export function addScorerGoals(
  table: ScorerEntry[],
  events: { scorerName: string; scorerNationId: string }[],
): ScorerEntry[] {
  let next = table.map((e) => ({ ...e, assists: e.assists ?? 0 }))
  for (const ev of events) {
    next = upsertStatRow(next, ev.scorerName, ev.scorerNationId, 1, 0)
  }
  return next.sort((a, b) => b.goals - a.goals || b.assists - a.assists)
}

export function addAssistEntries(
  table: ScorerEntry[],
  events: { playerName: string; nationId: string }[],
): ScorerEntry[] {
  let next = table.map((e) => ({ ...e, assists: e.assists ?? 0 }))
  for (const ev of events) {
    next = upsertStatRow(next, ev.playerName, ev.nationId, 0, 1)
  }
  return next.sort((a, b) => b.goals - a.goals || b.assists - a.assists)
}

export function createTournament(playerNationId: string): TournamentState {
  const info = getPlayerWorldCupGroup(playerNationId)
  const groups = buildAllGroups(playerNationId, info.groupId)
  const { qualifiers } = qualifyKnockout32(groups, playerNationId)
  const groupLabel = info.groupNationIds.map((id) => getNation(id).name).join(', ')
  return {
    groups,
    playerGroupId: info.groupId,
    groupOpponentIds: [...info.groupOpponentIds],
    knockoutOpponentIds: buildKnockoutPath(playerNationId, qualifiers),
    headlines: [
      `WC 2026 — Group ${info.groupId}: ${groupLabel}`,
      'Top 2 + 8 best third-placed teams advance to Round of 32.',
    ],
    eliminatedIds: [],
    knockoutRound: 0,
    simulatedMatchdays: 0,
    qualificationNote: '',
  }
}

function cloneGroupsWithStandingUpdate(
  groups: TournamentGroup[],
  playerGroupId: string,
  playerNationId: string,
  oppId: string,
  hg: number,
  ag: number,
): TournamentGroup[] {
  return groups.map((g) => {
    if (g.id !== playerGroupId) return g
    const standings = g.standings.map((s) => ({ ...s }))
    applyResult(standings, playerNationId, oppId, hg, ag)
    return { ...g, standings }
  })
}

export function recordPlayerGroupResult(
  tournament: TournamentState,
  playerNationId: string,
  mdIndex: number,
  hg: number,
  ag: number,
): {
  tournament: TournamentState
  extraScorers: { scorerName: string; scorerNationId: string }[]
  extraAssists: { playerName: string; nationId: string }[]
} {
  const oppId = tournament.groupOpponentIds[mdIndex]!
  const groups = cloneGroupsWithStandingUpdate(
    tournament.groups,
    tournament.playerGroupId,
    playerNationId,
    oppId,
    hg,
    ag,
  )
  const group = groups.find((g) => g.id === tournament.playerGroupId)!

  let t: TournamentState = { ...tournament, groups }
  const opp = getNation(oppId)
  const headlines = [
    `Your result: ${getNation(playerNationId).flag} ${hg}–${ag} ${opp.flag} ${opp.name}`,
  ]

  let extraScorers: { scorerName: string; scorerNationId: string }[] = []
  let extraAssists: { playerName: string; nationId: string }[] = []
  if (t.simulatedMatchdays <= mdIndex) {
    const bg = simWorldMatchday(t, mdIndex, [playerNationId, oppId])
    extraScorers = bg.scorerEvents
    extraAssists = bg.assistEvents
    t = {
      ...t,
      groups: bg.groups,
      simulatedMatchdays: mdIndex + 1,
      headlines: [...headlines, ...bg.headlines],
    }
  } else {
    t = { ...t, headlines: [...headlines, ...t.headlines] }
  }

  const sorted = sortStandings(group.standings)
  const pos = sorted.findIndex((s) => s.nationId === playerNationId) + 1
  t.qualificationNote = `Group ${t.playerGroupId}: ${pos}${pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'} — top 2 qualify; 3rd may advance as best runners-up.`

  return { tournament: { ...t, headlines: t.headlines.slice(0, 12) }, extraScorers, extraAssists }
}

export function advanceBackgroundAfterMap(
  tournament: TournamentState,
  playerNationId: string,
  completedMapIndex: number,
): TournamentState {
  let t = { ...tournament, headlines: [...tournament.headlines] }

  if (completedMapIndex === 2) {
    const { qualifiers, thirdQualifiers } = qualifyKnockout32(t.groups, playerNationId)
    t.knockoutOpponentIds = buildKnockoutPath(playerNationId, qualifiers)
    const youIn = qualifiers.includes(playerNationId)
    t.qualificationNote = youIn
      ? `Qualified for Round of 32 (${qualifiers.length} teams).`
      : 'Eliminated in group stage (sim).'
    t.headlines = [
      youIn ? '✅ Round of 32 — you are through!' : '❌ Out in the group stage.',
      `Best 3rd places include: ${thirdQualifiers.slice(0, 4).map((id) => getNation(id).flag).join(' ')}`,
      `Next: ${getNation(t.knockoutOpponentIds[0]!).flag} ${getNation(t.knockoutOpponentIds[0]!).name}`,
      ...t.headlines,
    ].slice(0, 12)
    t.knockoutRound = 1
    return t
  }

  const koIdx = completedMapIndex - 3
  const eliminated = t.knockoutOpponentIds[koIdx]
  if (eliminated) {
    t.eliminatedIds = [...t.eliminatedIds, eliminated]
  }
  const simHeadlines: string[] = []
  const pool = t.knockoutOpponentIds.filter((id) => !t.eliminatedIds.includes(id) && id !== playerNationId)
  for (let i = 0; i < 3; i++) {
    const a = pool[Math.floor(Math.random() * pool.length)] ?? 'brazil'
    let b = pool[Math.floor(Math.random() * pool.length)] ?? 'germany'
    if (a === b) b = pool[(i + 1) % pool.length] ?? 'spain'
    const r = simulateQuickMatch(a, b)
    simHeadlines.push(
      `KO: ${getNation(r.homeId).flag} ${r.homeGoals}–${r.awayGoals} ${getNation(r.awayId).flag}`,
    )
  }
  t.knockoutRound = Math.min(5, t.knockoutRound + 1)
  t.headlines = [...simHeadlines, ...t.headlines].slice(0, 12)
  return t
}

export function bossOpponentId(tournament: TournamentState, mapIndex: number): string {
  if (mapIndex <= 2) return playerBossOpponentForMd(tournament, mapIndex)
  return tournament.knockoutOpponentIds[mapIndex - 3] ?? tournament.knockoutOpponentIds[0]!
}

export function getPlayerGroupStandings(tournament: TournamentState): GroupStanding[] {
  const g = tournament.groups.find((gr) => gr.id === tournament.playerGroupId)
  if (!g) return []
  return sortStandings(g.standings)
}

export function tournamentStatusSummary(tournament: TournamentState, playerNationId: string): string {
  const group = getPlayerGroupStandings(tournament)
  const pos = group.findIndex((s) => s.nationId === playerNationId) + 1
  const pts = group.find((s) => s.nationId === playerNationId)?.points ?? 0
  const gd = (group.find((s) => s.nationId === playerNationId)?.gf ?? 0) - (group.find((s) => s.nationId === playerNationId)?.ga ?? 0)
  return `${pos}${pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'} · ${pts} pts · GD ${gd >= 0 ? '+' : ''}${gd}`
}

export function findTournamentStats(
  table: ScorerEntry[],
  playerName: string,
  nationId: string,
): { goals: number; assists: number } | null {
  const entry = table.find((e) => e.playerName === playerName && e.nationId === nationId)
  if (!entry) return null
  return { goals: entry.goals, assists: entry.assists ?? 0 }
}

export function topScorersList(table: ScorerEntry[], limit = 5): ScorerEntry[] {
  return [...table]
    .map((e) => ({ ...e, assists: e.assists ?? 0 }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .slice(0, limit)
}

export function topAssistsList(table: ScorerEntry[], limit = 5): ScorerEntry[] {
  return [...table]
    .map((e) => ({ ...e, assists: e.assists ?? 0 }))
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
    .slice(0, limit)
}
