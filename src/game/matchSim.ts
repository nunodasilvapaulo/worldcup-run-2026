import { MENTALITY_LABELS } from './constants'
import { getNation } from './nations2026'
import { lookupPlayerPhoto, nationStarTemplate } from './players2026'
import {
  buildFriendlyOpponent,
  buildOpponent,
  buildOpponentFromSquad,
  mentalityMultiplier,
  teamPower,
  type OpponentSide,
} from './battle'
import { resolveGoalsFromPowerRatio } from './matchScore'
import { effectivePlayerStats } from './squad'
import type { NextMatchTraining } from './trainingBuff'
import type { Mentality, Nation, RunItem, SquadPlayer } from './types'

export interface GoalEvent {
  minute: number
  scorerName: string
  scorerNationId: string
  assistName?: string
  assistNationId?: string
  forPlayer: boolean
}

export type MatchLineKind =
  | 'goal'
  | 'near'
  | 'miss'
  | 'tackle'
  | 'save'
  | 'chance'
  | 'half'
  | 'kickoff'
  | 'fulltime'
  | 'general'

export interface MatchLine {
  text: string
  kind: MatchLineKind
  minute?: number
  playerName?: string
  photoUrl?: string
  assistName?: string
}

export interface LiveMatchPlan {
  lines: MatchLine[]
  goalsFor: number
  goalsAgainst: number
  won: boolean
  goalEvents: GoalEvent[]
  opponent: OpponentSide
  playerStarName: string
  opponentStarName: string
}

type Side = { name: string; nationId: string; photoUrl: string }

function pickByRole(
  squad: SquadPlayer[],
  nationId: string,
  roles: SquadPlayer['role'][],
): Side {
  const pool = squad.filter((p) => roles.includes(p.role))
  const p = (pool.length ? pool : squad)[Math.floor(Math.random() * (pool.length || squad.length))]!
  return {
    name: p.name,
    nationId,
    photoUrl: p.photoUrl || lookupPlayerPhoto(p.name, nationId, squad),
  }
}

function pickAssister(squad: SquadPlayer[], _nationId: string, excludeName: string): string | undefined {
  const pool = squad.filter((p) => p.name !== excludeName && (p.role === 'MID' || p.role === 'WNG'))
  if (pool.length === 0 || Math.random() > 0.78) return undefined
  return pool[Math.floor(Math.random() * pool.length)]!.name
}

function pickScorer(squad: SquadPlayer[], nationId: string): string {
  const weights = squad.map((p) => ({
    p,
    w: (p.role === 'ST' ? 4 : p.role === 'WNG' ? 3 : p.role === 'MID' ? 2 : 0.5) *
      (effectivePlayerStats(p).shoot / 50),
  }))
  const total = weights.reduce((s, x) => s + x.w, 0)
  let r = Math.random() * total
  for (const { p, w } of weights) {
    r -= w
    if (r <= 0) return p.name
  }
  return squad[0]?.name ?? getNation(nationId).name
}

function oppSide(opponent: OpponentSide, roles?: SquadPlayer['role'][]): Side {
  const pool = roles ? opponent.squad.filter((p) => roles.includes(p.role)) : opponent.squad
  const p = (pool.length ? pool : opponent.squad)[Math.floor(Math.random() * (pool.length || opponent.squad.length))]!
  return {
    name: p.name,
    nationId: opponent.nation.id,
    photoUrl: p.photoUrl || lookupPlayerPhoto(p.name, opponent.nation.id),
  }
}

const NEAR_LINES = (a: string, b: string) => [
  `${a} meets the cross on the volley — inches wide!`,
  `${a} glances a header that flashes past the post!`,
  `${a} is through on goal… ${b} smothers it at the last second!`,
  `Heart in mouth — ${a}'s shot cannons off the inside of the post and stays out!`,
]

const MISS_LINES = (a: string) => [
  `${a} skies it from six yards — a huge miss!`,
  `${a} blazes over with the goal gaping!`,
  `${a} sends a sitter sailing into the stands.`,
  `How has ${a} missed that?! The crowd gasps.`,
]

const TACKLE_LINES = (a: string, b: string) => [
  `${a} times a sliding challenge perfectly to win the ball from ${b}.`,
  `Brilliant defending — ${a} strips ${b} with a last-ditch tackle.`,
  `${a} reads the pass and intercepts cleanly.`,
]

const SAVE_LINES = (gk: string, shooter: string) => [
  `${gk} denies ${shooter} with a fingertip save!`,
  `Superb reflexes from ${gk} to keep out ${shooter}'s strike.`,
  `${gk} throws himself at ${shooter}'s shot — corner.`,
]

const CHANCE_LINES = (a: string) => [
  `${a} carries the ball forward and wins a dangerous free kick.`,
  `Quick combination play releases ${a} into the box.`,
  `${a} whips in a cross that causes panic in the defence.`,
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function buildGoalEvents(
  goalsFor: number,
  goalsAgainst: number,
  squad: SquadPlayer[],
  playerNation: Nation,
  opponent: OpponentSide,
  opponentNationId: string,
): GoalEvent[] {
  const slots = shuffle([
    ...Array.from({ length: goalsFor }, () => true),
    ...Array.from({ length: goalsAgainst }, () => false),
  ])

  const minutes: number[] = []
  let m = 8 + Math.floor(Math.random() * 22)
  for (let i = 0; i < slots.length; i++) {
    minutes.push(Math.min(88, m))
    m += 10 + Math.floor(Math.random() * 24)
  }
  minutes.sort((a, b) => a - b)

  return slots.map((forPlayer, i) => {
    const minute = minutes[i]!
    if (forPlayer) {
      const scorerName = pickScorer(squad, playerNation.id)
      const assistName = pickAssister(squad, playerNation.id, scorerName)
      return {
        minute,
        scorerName,
        scorerNationId: playerNation.id,
        assistName,
        assistNationId: assistName ? playerNation.id : undefined,
        forPlayer: true,
      }
    }
    const scorerName = pickScorer(opponent.squad, opponentNationId)
    const assistName = pickAssister(opponent.squad, opponentNationId, scorerName)
    return {
      minute,
      scorerName,
      scorerNationId: opponentNationId,
      assistName,
      assistNationId: assistName ? opponentNationId : undefined,
      forPlayer: false,
    }
  })
}

function buildMomentLines(
  squad: SquadPlayer[],
  playerNation: Nation,
  opponent: OpponentSide,
  goalsFor: number,
  goalsAgainst: number,
  goalEvents: GoalEvent[],
): MatchLine[] {
  const momentCount = 6 + Math.floor(Math.random() * 6)
  const moments: { minute: number; build: () => MatchLine }[] = []

  for (let i = 0; i < momentCount; i++) {
    const minute = 3 + Math.floor(Math.random() * 86)
    const roll = Math.random()
    const forPlayer = roll < 0.52 + (goalsFor - goalsAgainst) * 0.04

    if (forPlayer) {
      if (roll < 0.22) {
        const atk = pickByRole(squad, playerNation.id, ['ST', 'WNG', 'MID'])
        const def = oppSide(opponent, ['DEF', 'MID'])
        moments.push({
          minute,
          build: () => ({
            minute,
            kind: 'near',
            text: pick(NEAR_LINES(atk.name, def.name)),
            playerName: atk.name,
            photoUrl: atk.photoUrl,
          }),
        })
      } else if (roll < 0.38) {
        const atk = pickByRole(squad, playerNation.id, ['ST', 'WNG'])
        moments.push({
          minute,
          build: () => ({
            minute,
            kind: 'miss',
            text: pick(MISS_LINES(atk.name)),
            playerName: atk.name,
            photoUrl: atk.photoUrl,
          }),
        })
      } else if (roll < 0.52) {
        const def = pickByRole(squad, playerNation.id, ['DEF', 'GK', 'MID'])
        const opp = oppSide(opponent, ['ST', 'WNG', 'MID'])
        moments.push({
          minute,
          build: () => ({
            minute,
            kind: 'tackle',
            text: pick(TACKLE_LINES(def.name, opp.name)),
            playerName: def.name,
            photoUrl: def.photoUrl,
          }),
        })
      } else if (roll < 0.66) {
        const gk = pickByRole(squad, playerNation.id, ['GK'])
        const opp = oppSide(opponent, ['ST', 'WNG'])
        moments.push({
          minute,
          build: () => ({
            minute,
            kind: 'save',
            text: pick(SAVE_LINES(gk.name, opp.name)),
            playerName: gk.name,
            photoUrl: gk.photoUrl,
          }),
        })
      } else {
        const mid = pickByRole(squad, playerNation.id, ['MID', 'WNG', 'DEF'])
        moments.push({
          minute,
          build: () => ({
            minute,
            kind: 'chance',
            text: pick(CHANCE_LINES(mid.name)),
            playerName: mid.name,
            photoUrl: mid.photoUrl,
          }),
        })
      }
    } else if (roll < 0.72) {
      const atk = oppSide(opponent, ['ST', 'WNG'])
      const def = pickByRole(squad, playerNation.id, ['DEF', 'GK'])
      moments.push({
        minute,
        build: () => ({
          minute,
          kind: 'near',
          text: pick(NEAR_LINES(atk.name, def.name)),
          playerName: atk.name,
          photoUrl: atk.photoUrl,
        }),
      })
    } else if (roll < 0.84) {
      const def = pickByRole(squad, playerNation.id, ['DEF', 'GK'])
      const opp = oppSide(opponent, ['ST', 'WNG'])
      moments.push({
        minute,
        build: () => ({
          minute,
          kind: 'tackle',
          text: pick(TACKLE_LINES(def.name, opp.name)),
          playerName: def.name,
          photoUrl: def.photoUrl,
        }),
      })
    } else {
      const gk = pickByRole(squad, playerNation.id, ['GK'])
      const opp = oppSide(opponent, ['ST', 'WNG'])
      moments.push({
        minute,
        build: () => ({
          minute,
          kind: 'save',
          text: pick(SAVE_LINES(gk.name, opp.name)),
          playerName: gk.name,
          photoUrl: gk.photoUrl,
        }),
      })
    }
  }

  const timeline: { minute: number; line: MatchLine }[] = moments.map((m) => ({
    minute: m.minute,
    line: m.build(),
  }))

  let gf = 0
  let ga = 0
  let htDone = false
  for (const ev of goalEvents) {
    if (!htDone && ev.minute > 45) {
      timeline.push({
        minute: 45,
        line: { kind: 'half', text: `⏱️ Half-time: ${gf} – ${ga}`, minute: 45 },
      })
      htDone = true
    }
    if (ev.forPlayer) {
      gf += 1
      const scorerPhoto = lookupPlayerPhoto(ev.scorerName, ev.scorerNationId, squad)
      const assistText = ev.assistName
        ? ` Assisted by ${ev.assistName}.`
        : ''
      timeline.push({
        minute: ev.minute,
        line: {
          minute: ev.minute,
          kind: 'goal',
          text: `⚽ ${ev.minute}' GOAL! ${ev.scorerName} scores for ${playerNation.name}!${assistText} (${gf}–${ga})`,
          playerName: ev.scorerName,
          photoUrl: scorerPhoto,
          assistName: ev.assistName,
        },
      })
    } else {
      ga += 1
      const scorerPhoto = lookupPlayerPhoto(ev.scorerName, ev.scorerNationId, opponent.squad)
      const assistText = ev.assistName ? ` Assisted by ${ev.assistName}.` : ''
      timeline.push({
        minute: ev.minute,
        line: {
          minute: ev.minute,
          kind: 'goal',
          text: `⚽ ${ev.minute}' Goal for ${opponent.nation.name} — ${ev.scorerName}!${assistText} (${gf}–${ga})`,
          playerName: ev.scorerName,
          photoUrl: scorerPhoto,
          assistName: ev.assistName,
        },
      })
    }
  }

  timeline.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

  const lines: MatchLine[] = [
    {
      kind: 'kickoff',
      text: `🏟️ Kick-off — ${playerNation.name} vs ${opponent.nation.name}`,
    },
  ]

  for (const item of timeline) {
    if (item.line.kind === 'half' && lines.some((l) => l.kind === 'half')) continue
    lines.push(item.line)
  }

  if (goalEvents.length === 0) {
    lines.push({
      kind: 'general',
      text: 'A tight, chance-starved affair — keepers untested for long spells.',
    })
  }

  lines.push({ kind: 'general', text: 'Late drama as both sides push for a winner…' })
  lines.push({ kind: 'fulltime', text: '📣 Full time — the referee blows for the end of the match.' })

  return lines
}

export function planLiveMatch(
  squad: SquadPlayer[],
  items: RunItem[],
  playerNation: Nation,
  opponentNationId: string,
  difficulty: number,
  mentality: Mentality,
  opts?: {
    friendlyCallUp?: boolean
    storedOpponentSquad?: SquadPlayer[]
    officialMatch?: boolean
    nextMatchTraining?: NextMatchTraining | null
  },
): LiveMatchPlan {
  const opponent = opts?.friendlyCallUp
    ? buildFriendlyOpponent(opponentNationId, difficulty)
    : opts?.storedOpponentSquad?.length
      ? buildOpponentFromSquad(opponentNationId, opts.storedOpponentSquad, difficulty)
      : buildOpponent(opponentNationId, difficulty)
  const theirMentality =
    opponent.nation.archetype === 'counter' || opponent.nation.archetype === 'underdog'
      ? 'counter'
      : opponent.nation.archetype === 'press'
        ? 'press'
        : 'possession'
  const mentMul = mentalityMultiplier(mentality, theirMentality)
  const training = opts?.officialMatch ? (opts.nextMatchTraining ?? null) : null
  const ourPower = teamPower(squad, items, playerNation, mentality, training) * mentMul
  const theirPower = opponent.power * (0.9 + Math.random() * 0.18)
  const ratio = ourPower / Math.max(theirPower, 1)

  let { goalsFor, goalsAgainst } = resolveGoalsFromPowerRatio(ratio)

  let won = goalsFor > goalsAgainst
  if (!won && goalsFor === goalsAgainst) {
    goalsAgainst += 1
    won = false
  }

  const goalEvents = buildGoalEvents(
    goalsFor,
    goalsAgainst,
    squad,
    playerNation,
    opponent,
    opponentNationId,
  )

  const playerStar = [...squad].sort(
    (a, b) => effectivePlayerStats(b).shoot - effectivePlayerStats(a).shoot,
  )[0]
  const oppStar = nationStarTemplate(opponentNationId)

  const lines = buildMomentLines(squad, playerNation, opponent, goalsFor, goalsAgainst, goalEvents)
  lines[1] = {
    kind: 'general',
    text: `Tactics: ${MENTALITY_LABELS[mentality]} against their ${MENTALITY_LABELS[theirMentality]}.`,
  }
  if (mentMul > 1.1) {
    lines.splice(2, 0, { kind: 'general', text: 'Early press pins them in their half.' })
  } else if (mentMul < 0.95) {
    lines.splice(2, 0, { kind: 'general', text: 'They control the tempo from the start.' })
  } else {
    lines.splice(2, 0, { kind: 'general', text: 'Even opening exchanges.' })
  }

  return {
    lines,
    goalsFor,
    goalsAgainst,
    won,
    goalEvents,
    opponent,
    playerStarName: playerStar?.name ?? playerNation.name,
    opponentStarName: oppStar?.name ?? opponent.nation.name,
  }
}
