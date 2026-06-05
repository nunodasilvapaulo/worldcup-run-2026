/**
 * Parse Wikipedia 2026 World Cup squads → data/wc-squads-2026.json
 * Source: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const WIKI_PATH =
  process.argv[2] ??
  path.join(ROOT, 'data', 'source', '2026_FIFA_World_Cup_squads.md')

const NATION_NAME_TO_ID = {
  'Czech Republic': 'czechia',
  Mexico: 'mexico',
  'South Africa': 'south-africa',
  'South Korea': 'korea',
  'Bosnia and Herzegovina': 'bosnia',
  Canada: 'canada',
  Qatar: 'qatar',
  Switzerland: 'switzerland',
  Brazil: 'brazil',
  Haiti: 'haiti',
  Morocco: 'morocco',
  Scotland: 'scotland',
  Australia: 'australia',
  Paraguay: 'paraguay',
  Turkey: 'turkey',
  'United States': 'usa',
  Curaçao: 'curacao',
  Ecuador: 'ecuador',
  Germany: 'germany',
  'Ivory Coast': 'ivory-coast',
  Japan: 'japan',
  Netherlands: 'netherlands',
  Sweden: 'sweden',
  Tunisia: 'tunisia',
  Belgium: 'belgium',
  Egypt: 'egypt',
  Iran: 'iran',
  'New Zealand': 'new-zealand',
  'Cape Verde': 'cabo-verde',
  'Saudi Arabia': 'saudi',
  Spain: 'spain',
  Uruguay: 'uruguay',
  France: 'france',
  Iraq: 'iraq',
  Norway: 'norway',
  Senegal: 'senegal',
  Algeria: 'algeria',
  Argentina: 'argentina',
  Austria: 'austria',
  Jordan: 'jordan',
  Colombia: 'colombia',
  'DR Congo': 'congo-dr',
  Portugal: 'portugal',
  Uzbekistan: 'uzbekistan',
  Croatia: 'croatia',
  England: 'england',
  Ghana: 'ghana',
  Panama: 'panama',
}

const NATION_TIER = {
  argentina: 'S',
  brazil: 'S',
  france: 'S',
  germany: 'S',
  england: 'S',
  spain: 'S',
  portugal: 'S',
  japan: 'A',
  korea: 'A',
  netherlands: 'A',
  belgium: 'A',
  croatia: 'A',
  morocco: 'A',
  senegal: 'A',
  colombia: 'A',
  uruguay: 'A',
  'ivory-coast': 'A',
  usa: 'B',
  mexico: 'B',
  canada: 'B',
  australia: 'B',
  iran: 'B',
  iraq: 'B',
  qatar: 'B',
  saudi: 'B',
  algeria: 'B',
  egypt: 'B',
  ghana: 'B',
  tunisia: 'B',
  ecuador: 'B',
  paraguay: 'B',
  switzerland: 'B',
  austria: 'B',
  norway: 'B',
  scotland: 'B',
  sweden: 'B',
  turkey: 'B',
  czechia: 'B',
  bosnia: 'B',
  'south-africa': 'B',
  'congo-dr': 'B',
  jordan: 'C',
  uzbekistan: 'C',
  curacao: 'C',
  haiti: 'C',
  panama: 'C',
  'cabo-verde': 'C',
  'new-zealand': 'C',
}

const TIER_BASE = { S: 78, A: 72, B: 66, C: 60 }

function cleanName(raw) {
  return raw
    .replace(/\(captain\)/gi, '')
    .replace(/\(.*?\)/g, '')
    .trim()
}

function mapPos(wikiPos) {
  if (wikiPos === 'GK') return 'GK'
  if (wikiPos === 'DF') return 'DEF'
  if (wikiPos === 'MF') return 'MID'
  return 'FW'
}

function playerScore(p) {
  let s = p.caps * 1.2 + p.goals * 6
  if (p.captain) s += 25
  if (p.pos === 'GK') s *= 0.35
  return s
}

function buildStats(role, caps, goals, tier, squadRank) {
  const base = TIER_BASE[tier] ?? 66
  const exp = Math.min(1, caps / 80)
  const rankDrop = (squadRank - 1) * 1.1
  const b = Math.round(base + exp * 8 - rankDrop)

  if (role === 'GK') {
    return {
      pace: clamp(b - 28),
      shoot: clamp(12 + Math.floor(exp * 4)),
      pass: clamp(b - 22),
      defend: clamp(b + 6 + Math.floor(exp * 6)),
    }
  }
  if (role === 'DEF') {
    return {
      pace: clamp(b - 6 + Math.floor(exp * 4)),
      shoot: clamp(b - 28),
      pass: clamp(b - 8),
      defend: clamp(b + 4 + Math.floor(exp * 5)),
    }
  }
  if (role === 'MID') {
    return {
      pace: clamp(b - 2 + Math.floor(exp * 3)),
      shoot: clamp(b - 10 + goals * 0.8),
      pass: clamp(b + 6 + Math.floor(exp * 4)),
      defend: clamp(b - 12),
    }
  }
  if (role === 'ST') {
    return {
      pace: clamp(b + 2 + Math.floor(exp * 5)),
      shoot: clamp(b + 8 + goals * 1.2),
      pass: clamp(b - 10),
      defend: clamp(b - 28),
    }
  }
  // WNG
  return {
    pace: clamp(b + 6 + Math.floor(exp * 6)),
    shoot: clamp(b + 2 + goals * 1.0),
    pass: clamp(b - 6),
    defend: clamp(b - 30),
  }
}

function clamp(n) {
  return Math.min(99, Math.max(28, Math.round(n)))
}

function assignFwRoles(players) {
  const fws = players.filter((p) => p.wikiRole === 'FW')
  const byGoals = [...fws].sort((a, b) => b.goals - a.goals || b.caps - a.caps)
  const roleMap = new Map()
  byGoals.forEach((p, i) => {
    roleMap.set(p.name, i % 2 === 0 ? 'ST' : 'WNG')
  })
  return roleMap
}

function parseMarkdown(md) {
  const squads = {}
  const sections = md.split(/^### /m).slice(1)

  for (const section of sections) {
    const lines = section.split('\n')
    const nationName = lines[0].trim()
    const nationId = NATION_NAME_TO_ID[nationName]
    if (!nationId) {
      if (!['Age', 'Player representation by club'].includes(nationName)) {
        console.warn('Unknown nation:', nationName)
      }
      continue
    }

    const rawPlayers = []
    for (const line of lines) {
      const m = line.match(
        /^\|\s*(\d+)\s*\|\s*\d\s+(GK|DF|MF|FW)\s*\|\s*(.+?)\s*\|\s*\([^)]+\)[^|]*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(.+?)\s*\|$/,
      )
      if (!m) continue
      const name = cleanName(m[3])
      const captain = /\(captain\)/i.test(m[3])
      rawPlayers.push({
        no: Number(m[1]),
        wikiRole: m[2],
        name,
        caps: Number(m[4]),
        goals: Number(m[5]),
        club: m[6].trim(),
        captain,
      })
    }

    if (rawPlayers.length === 0) {
      console.warn('No players parsed for', nationName)
      continue
    }

    const tier = NATION_TIER[nationId] ?? 'B'
    const fwRoles = assignFwRoles(rawPlayers)
    const scored = rawPlayers.map((p) => ({ ...p, score: playerScore(p) }))
    const ranked = [...scored].sort((a, b) => b.score - a.score)

    const squad = ranked.map((p, idx) => {
      const wikiMapped = mapPos(p.wikiRole)
      let role = wikiMapped
      if (p.wikiRole === 'FW') role = fwRoles.get(p.name) ?? 'ST'

      const squadRank = idx + 1
      return {
        name: p.name,
        role,
        photoUrl: '',
        base: buildStats(role, p.caps, p.goals, tier, squadRank),
        squadRank,
      }
    })

    squads[nationId] = squad
  }

  return squads
}

function loadPhotoOverrides() {
  const photos = new Map()
  const files = [
    path.join(ROOT, 'src', 'game', 'wcNationRosters.ts'),
    path.join(ROOT, 'src', 'game', 'players2026.ts'),
  ]
  for (const file of files) {
    if (!fs.existsSync(file)) continue
    const text = fs.readFileSync(file, 'utf8')
    const re = /name:\s*'([^']+)',\s*role:\s*'[^']+',\s*photoUrl:\s*W\('([^']+)'\)/g
    let m
    while ((m = re.exec(text))) {
      if (m[2] && !m[2].includes('Soccerball')) photos.set(m[1], m[2])
    }
    const re2 = /name:\s*'([^']+)',\s*role:\s*'[^']+',\s*photoUrl:\s*W\("([^"]+)"\)/g
    while ((m = re2.exec(text))) {
      if (m[2] && !m[2].includes('Soccerball')) photos.set(m[1], m[2])
    }
  }
  return photos
}

function applyPhotos(squads, photos) {
  for (const players of Object.values(squads)) {
    for (const p of players) {
      const hit =
        photos.get(p.name) ??
        [...photos.entries()].find(([k]) => k.toLowerCase() === p.name.toLowerCase())?.[1]
      if (hit) p.photoUrl = hit
    }
  }
}

function main() {
  if (!fs.existsSync(WIKI_PATH)) {
    console.error('Wiki source not found:', WIKI_PATH)
    process.exit(1)
  }
  const md = fs.readFileSync(WIKI_PATH, 'utf8')
  const squads = parseMarkdown(md)
  applyPhotos(squads, loadPhotoOverrides())

  const outDir = path.join(ROOT, 'data')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'wc-squads-2026.json')
  fs.writeFileSync(outPath, JSON.stringify(squads, null, 2))

  const counts = Object.entries(squads).map(([id, p]) => `${id}:${p.length}`)
  console.log(`Wrote ${outPath}`)
  console.log(`Nations: ${Object.keys(squads).length}`)
  console.log(`Players: ${Object.values(squads).flat().length}`)
  if (Object.keys(squads).length !== 48) {
    console.warn('Expected 48 nations, got', Object.keys(squads).length)
    const missing = Object.values(NATION_NAME_TO_ID).filter((id) => !squads[id])
    if (missing.length) console.warn('Missing:', missing.join(', '))
  }
}

main()
