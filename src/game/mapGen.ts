import { MAP_STAGES, stageForLayer } from './constants'
import { getNation } from './nations2026'
import { pickNonWcFriendlyOpponent } from './nonWcNations'
import { advanceBackgroundAfterMap, bossOpponentId, drawGroupOpponents } from './tournament'
import type { MapNode, MapStageId, NodeKind, RunState, TournamentState } from './types'

let nodeId = 0
function nid() {
  nodeId += 1
  return `node-${nodeId}`
}
export function resetMapIdCounter() {
  nodeId = 0
}

function maxNodeIdFromMap(map: MapNode[]): number {
  let max = 0
  for (const n of map) {
    const m = /^node-(\d+)$/.exec(n.id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max
}

/** Continue node-* ids when appending layers so MD2 nodes never collide with MD1. */
export function seedNodeIdCounterFromMap(map: MapNode[]) {
  nodeId = maxNodeIdFromMap(map)
}

/** Fix saves where each layer was generated with duplicate node-1, node-2, … ids. */
export function fixDuplicateNodeIds(map: MapNode[]): MapNode[] {
  const byId = new Map<string, MapNode[]>()
  for (const n of map) {
    const arr = byId.get(n.id) ?? []
    arr.push(n)
    byId.set(n.id, arr)
  }

  const dupes = [...byId.entries()].filter(([, nodes]) => nodes.length > 1)
  if (dupes.length === 0) return map

  let next = map
  seedNodeIdCounterFromMap(next)

  for (const [id, nodes] of dupes) {
    const sorted = [...nodes].sort((a, b) => a.layer - b.layer || a.row - b.row || a.col - b.col)
    for (let i = 1; i < sorted.length; i++) {
      const target = sorted[i]!
      const newId = nid()
      const layer = target.layer
      next = next.map((n) => {
        if (n.layer === layer && n.id === id && n.row === target.row && n.col === target.col) {
          return { ...n, id: newId }
        }
        if (n.layer === layer) {
          return { ...n, nextIds: n.nextIds.map((to) => (to === id ? newId : to)) }
        }
        return n
      })
    }
  }
  return next
}

function bossKindForStage(stageId: MapStageId): NodeKind {
  if (stageId === 'final') return 'final'
  if (stageId === 'md1' || stageId === 'md2' || stageId === 'md3') return 'group'
  return 'knockout'
}

function difficultyFor(stageIndex: number, isBoss: boolean): number {
  const base = 1 + Math.floor(stageIndex / 2)
  return isBoss ? base + (stageIndex >= 3 ? 2 : 1) : Math.max(1, base - 1)
}

type SideNodeKind =
  | 'friendly'
  | 'social'
  | 'recruit'
  | 'legend'
  | 'item'
  | 'mystery'
  | 'training_session'

const MAX_FRIENDLIES_PER_LAYER = 5
/** Fixed camp grid between start and boss: 2 → 3 → 4 → 3 → 4 → 3 → 2 */
const ROW_WIDTHS = [2, 3, 4, 3, 4, 3, 2] as const
const RECOVERY_ROW_INDEX = ROW_WIDTHS.length - 1

function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleWithRng<T>(items: T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

function pickFinalSecondNode(rng: () => number): SideNodeKind {
  const r = rng()
  if (r < 0.25) return 'friendly'
  if (r < 0.45) return 'social'
  if (r < 0.6) return 'item'
  if (r < 0.75) return 'mystery'
  if (r < 0.88) return 'recruit'
  return 'legend'
}

function pickSideEventKind(
  rng: () => number,
  layer: number,
  legendPlaced: boolean,
  friendlyPlaced: number,
): SideNodeKind {
  if (layer >= 2 && !legendPlaced && rng() < 0.14) return 'legend'
  if (friendlyPlaced < MAX_FRIENDLIES_PER_LAYER && rng() < 0.1) return 'friendly'
  const pool: SideNodeKind[] = [
    'social',
    'social',
    'recruit',
    'item',
    'mystery',
    'training_session',
  ]
  return pool[Math.floor(rng() * pool.length)]!
}

function labelForKind(kind: SideNodeKind): string {
  switch (kind) {
    case 'friendly':
      return 'Friendly'
    case 'social':
      return 'Social event'
    case 'recruit':
      return 'Call-up'
    case 'legend':
      return 'Legend call-up'
    case 'item':
      return 'Equipment'
    case 'mystery':
      return '???'
    case 'training_session':
      return 'Training Session'
    default:
      return 'Event'
  }
}

/**
 * Seeded event shuffle on a fixed 7-row grid (2-3-4-3-4-3-2).
 * Recovery camp is always on row 7 (one of its two slots).
 */
function pathGridRows(
  isFinal: boolean,
  layer: number,
  seed: number,
): (SideNodeKind | 'recovery')[][] {
  const rng = mulberry32(seed ^ layer * 9973)

  if (isFinal) {
    return [['recovery', pickFinalSecondNode(rng)]]
  }

  const rows: (SideNodeKind | 'recovery')[][] = ROW_WIDTHS.map(() => [])
  const positions: { row: number; col: number }[] = []
  for (let r = 0; r < RECOVERY_ROW_INDEX; r++) {
    for (let c = 0; c < ROW_WIDTHS[r]!; c++) positions.push({ row: r, col: c })
  }
  // Row 7's non-recovery slot can also roll events (including friendlies)
  const recoveryCol = rng() < 0.5 ? 0 : 1
  const otherCol = recoveryCol === 0 ? 1 : 0
  positions.push({ row: RECOVERY_ROW_INDEX, col: otherCol })

  const shuffled = shuffleWithRng(positions, rng)
  const friendlyCount = Math.floor(rng() * (MAX_FRIENDLIES_PER_LAYER + 1))
  const friendlyKeys = new Set(
    shuffled.slice(0, friendlyCount).map((p) => `${p.row},${p.col}`),
  )

  let legendPlaced = false
  let friendlyPlaced = friendlyCount

  for (let r = 0; r < RECOVERY_ROW_INDEX; r++) {
    for (let c = 0; c < ROW_WIDTHS[r]!; c++) {
      const key = `${r},${c}`
      if (friendlyKeys.has(key)) {
        rows[r]!.push('friendly')
        continue
      }
      const kind = pickSideEventKind(rng, layer, legendPlaced, friendlyPlaced)
      if (kind === 'legend') legendPlaced = true
      if (kind === 'friendly') friendlyPlaced += 1
      rows[r]!.push(kind)
    }
  }

  for (let c = 0; c < ROW_WIDTHS[RECOVERY_ROW_INDEX]!; c++) {
    if (c === recoveryCol) {
      rows[RECOVERY_ROW_INDEX]!.push('recovery')
      continue
    }
    const key = `${RECOVERY_ROW_INDEX},${c}`
    if (friendlyKeys.has(key)) {
      rows[RECOVERY_ROW_INDEX]!.push('friendly')
      continue
    }
    const kind = pickSideEventKind(rng, layer, legendPlaced, friendlyPlaced)
    if (kind === 'legend') legendPlaced = true
    if (kind === 'friendly') friendlyPlaced += 1
    rows[RECOVERY_ROW_INDEX]!.push(kind)
  }

  return rows
}

function createStartNode(layer: number, stageId: MapStageId): MapNode {
  return {
    id: nid(),
    layer,
    stageId,
    kind: 'start',
    label: 'Starting Point',
    taken: false,
    isBoss: false,
    col: 0,
    row: 0,
    nextIds: [],
  }
}

function createSideNode(
  kind: SideNodeKind | 'recovery',
  layer: number,
  stageId: MapStageId,
  row: number,
  col: number,
  playerNationId: string,
): MapNode {
  const node: MapNode = {
    id: nid(),
    layer,
    stageId,
    kind: kind === 'recovery' ? 'recovery' : kind,
    label: kind === 'recovery' ? 'Recovery camp' : labelForKind(kind as SideNodeKind),
    taken: false,
    isBoss: false,
    col,
    row,
    nextIds: [],
  }
  if (kind === 'friendly') {
    const oppId = pickNonWcFriendlyOpponent(playerNationId)
    node.opponentId = oppId
    node.subtitle = getNation(oppId).name
    node.difficulty = difficultyFor(layer, false)
    node.label = `Friendly vs ${node.subtitle}`
  }
  return node
}

function normCol(index: number, len: number): number {
  return (index + 0.5) / len
}

/** Precomputed STS link patterns for our fixed row sizes (max 2 edges per node). */
const WIRE_PATTERNS: Record<string, number[][]> = {
  '1-2': [[0, 1]],
  '2-3': [
    [0, 1],
    [1, 2],
  ],
  '3-4': [
    [0, 1],
    [1, 2],
    [2, 3],
  ],
  '4-3': [[0], [0, 1], [1, 2], [2]],
  '3-2': [[0], [0, 1], [1]],
}

function tryAddLink(
  node: MapNode,
  j: number,
  lower: MapNode[],
  incoming: Map<string, number>,
): boolean {
  if (j < 0 || j >= lower.length || node.nextIds.length >= 2) return false
  const id = lower[j]!.id
  if (node.nextIds.includes(id) || (incoming.get(id) ?? 0) >= 2) return false
  node.nextIds.push(id)
  incoming.set(id, (incoming.get(id) ?? 0) + 1)
  return true
}

function wireRowsWithPattern(
  upper: MapNode[],
  lower: MapNode[],
  pattern: number[][],
): boolean {
  const incoming = new Map<string, number>()
  for (const n of lower) incoming.set(n.id, 0)
  for (const node of upper) node.nextIds = []

  for (let i = 0; i < upper.length; i++) {
    const targets = pattern[i]
    if (!targets) return false
    for (const j of targets) {
      if (!tryAddLink(upper[i]!, j, lower, incoming)) return false
    }
  }

  return lower.every((n) => (incoming.get(n.id) ?? 0) > 0)
}

function wireRowsFallback(upper: MapNode[], lower: MapNode[]) {
  const uLen = upper.length
  const lLen = lower.length
  const incoming = new Map<string, number>()
  for (const n of lower) incoming.set(n.id, 0)
  for (const node of upper) node.nextIds = []

  const add = (node: MapNode, j: number) => tryAddLink(node, j, lower, incoming)

  for (let i = 0; i < uLen; i++) {
    const left = Math.floor((i * lLen) / uLen)
    let right = Math.floor(((i + 1) * lLen) / uLen)
    if (right <= left) right = left + 1
    for (let j = left; j < Math.min(right, lLen) && upper[i]!.nextIds.length < 2; j++) {
      add(upper[i]!, j)
    }
  }

  for (let j = 0; j < lLen; j++) {
    if ((incoming.get(lower[j]!.id) ?? 0) > 0) continue
    const x = normCol(j, lLen)
    const ranked = upper
      .map((u, idx) => ({
        u,
        dist: Math.abs(normCol(idx, uLen) - x),
        out: u.nextIds.length,
      }))
      .filter((r) => r.out < 2)
      .sort((a, b) => a.dist - b.dist || a.out - b.out)
    for (const { u } of ranked) {
      if (add(u, j)) break
    }
  }
}

/**
 * STS wiring for 1→2→3→4→3→4→3→2→boss using known-good patterns per row size.
 */
function wireRows(upper: MapNode[], lower: MapNode[]) {
  const uLen = upper.length
  const lLen = lower.length
  if (!uLen || !lLen) return

  const key = `${uLen}-${lLen}`
  const pattern = WIRE_PATTERNS[key]
  if (pattern && wireRowsWithPattern(upper, lower, pattern)) return

  wireRowsFallback(upper, lower)
}

function wireToBoss(lastRow: MapNode[], boss: MapNode) {
  for (const node of lastRow) {
    node.nextIds = [boss.id]
  }
}

function buildPathGraph(sideRows: MapNode[][], boss: MapNode) {
  for (let r = 0; r < sideRows.length - 1; r++) {
    wireRows(sideRows[r]!, sideRows[r + 1]!)
  }
  wireToBoss(sideRows[sideRows.length - 1]!, boss)
}

export function rollGroupOpponents(playerNationId: string): string[] {
  return drawGroupOpponents(playerNationId)
}

/** Generate one stage: grid rows (start → events → prep → boss). */
export function generateLayerNodes(
  tournament: TournamentState,
  playerNationId: string,
  layer: number,
  seed = Date.now(),
  existingMap?: MapNode[],
): MapNode[] {
  if (existingMap?.length) seedNodeIdCounterFromMap(existingMap)
  else resetMapIdCounter()
  const stage = stageForLayer(layer)
  const isFinal = stage.id === 'final'
  const gridTemplates = pathGridRows(isFinal, layer, seed)
  const sideRows: MapNode[][] = []

  if (!isFinal) {
    sideRows.push([createStartNode(layer, stage.id)])
  }

  gridTemplates.forEach((kinds, i) => {
    const rowIndex = isFinal ? i : i + 1
    const row = kinds.map((kind, col) =>
      createSideNode(kind, layer, stage.id, rowIndex, col, playerNationId),
    )
    sideRows.push(row)
  })

  const bossRow = sideRows.length
  const maxCols = Math.max(...sideRows.map((r) => r.length), 1)
  const bossCol = Math.floor((maxCols - 1) / 2)

  const bossOpp = bossOpponentId(tournament, layer)
  const boss: MapNode = {
    id: nid(),
    layer,
    stageId: stage.id,
    kind: bossKindForStage(stage.id),
    label:
      stage.id === 'md1' || stage.id === 'md2' || stage.id === 'md3'
        ? `${stage.shortLabel} — ${getNation(bossOpp).name}`
        : stage.label,
    subtitle: getNation(bossOpp).name,
    difficulty: difficultyFor(layer, true),
    opponentId: bossOpp,
    taken: false,
    isBoss: true,
    col: bossCol,
    row: bossRow,
    nextIds: [],
  }

  buildPathGraph(sideRows, boss)
  return [...sideRows.flat(), boss]
}

export function layerSeed(run: RunState, layer: number): number {
  return run.layerSeeds?.[layer] ?? Date.now()
}

export function generateMap(
  tournament: TournamentState,
  playerNationId: string,
  seed = Date.now(),
): MapNode[] {
  return generateLayerNodes(tournament, playerNationId, 0, seed)
}

export function refreshCurrentLayerNodes(run: RunState): MapNode[] {
  const mapIndex = firstIncompleteMapIndex(run.map)
  const past = run.map.filter((n) => n.layer < mapIndex)
  const fresh = generateLayerNodes(
    run.tournament,
    run.nationId,
    mapIndex,
    layerSeed(run, mapIndex),
    run.map,
  )
  return [...past, ...fresh]
}

function nodesInMap(map: MapNode[], mapIndex: number): MapNode[] {
  return map.filter((n) => n.layer === mapIndex)
}

/** Boss unlocks when your path tip (last taken node) links to the boss — not all grid nodes. */
function bossReady(layerNodes: MapNode[]): boolean {
  const boss = layerNodes.find((n) => n.isBoss)
  if (!boss || boss.taken) return false
  const tip = pathTip(layerNodes)
  if (!tip || tip.isBoss) return false
  return tip.nextIds.includes(boss.id)
}

/** Current position on the chosen branch (highest taken row). */
export function pathTip(layerNodes: MapNode[]): MapNode | null {
  const taken = layerNodes.filter((n) => n.taken)
  if (taken.length === 0) return null
  return taken.reduce((best, n) => (n.row > best.row ? n : best), taken[0]!)
}

/** One node per row — only children of your current path tip are pickable. */
export function isNodeReachable(layerNodes: MapNode[], node: MapNode): boolean {
  if (node.taken) return false
  const start = layerNodes.find((n) => n.kind === 'start')
  if (start && !start.taken) return node.id === start.id

  const tip = pathTip(layerNodes)
  if (!tip) {
    const entry = Math.min(...layerNodes.filter((n) => !n.isBoss).map((n) => n.row))
    return !node.isBoss && node.row === entry
  }

  return tip.nextIds.includes(node.id)
}

export function firstIncompleteMapIndex(map: MapNode[]): number {
  for (let m = 0; m < MAP_STAGES.length; m++) {
    if (!isMapComplete(map, m)) return m
  }
  return MAP_STAGES.length - 1
}

export function availableNodes(run: RunState): MapNode[] {
  const mapIndex = firstIncompleteMapIndex(run.map)
  const layerNodes = nodesInMap(run.map, mapIndex)
  const ready = bossReady(layerNodes)

  return layerNodes.filter((n) => {
    if (n.taken) return false
    if (n.isBoss) return ready
    return isNodeReachable(layerNodes, n)
  })
}

export function isMapComplete(map: MapNode[], mapIndex: number): boolean {
  const layer = nodesInMap(map, mapIndex)
  if (layer.length === 0) return false
  const boss = layer.find((n) => n.isBoss)
  if (boss) return boss.taken
  return layer.every((n) => n.taken)
}

function groupMdPlayed(
  mdIndex: number,
  groupResults: ('win' | 'loss' | 'pending')[],
  simulatedMatchdays: number,
): boolean {
  return groupResults[mdIndex] !== 'pending' || simulatedMatchdays > mdIndex
}

/** Mark group bosses done when MD was played (win/loss) — fixes stuck MD1/MD2/MD3 saves. */
export function repairPlayedGroupBosses(
  map: MapNode[],
  groupResults: ('win' | 'loss' | 'pending')[],
  simulatedMatchdays = 0,
): MapNode[] {
  const stages: MapStageId[] = ['md1', 'md2', 'md3']
  let next = map
  for (let i = 0; i < stages.length; i++) {
    if (!groupMdPlayed(i, groupResults, simulatedMatchdays)) continue
    const bosses = next.filter(
      (n) =>
        n.isBoss &&
        n.kind === 'group' &&
        !n.taken &&
        (n.layer === i || n.stageId === stages[i]),
    )
    for (const boss of bosses) {
      next = next.map((n) => (n.id === boss.id ? { ...n, taken: true } : n))
    }
  }
  return next
}

function appendAllMissingLayers(run: RunState): RunState {
  let r = run
  for (let guard = 0; guard < MAP_STAGES.length; guard++) {
    let progressed = false
    for (let m = 0; m < MAP_STAGES.length - 1; m++) {
      if (!isMapComplete(r.map, m)) continue
      const next = m + 1
      if (next >= MAP_STAGES.length || r.map.some((n) => n.layer === next)) continue
      r = {
        ...r,
        tournament: advanceBackgroundAfterMap(r.tournament, r.nationId, m),
        map: appendNextLayer(r, m),
        layerSeeds: [...(r.layerSeeds ?? []), Date.now()],
      }
      progressed = true
    }
    if (!progressed) break
  }
  const idx = firstIncompleteMapIndex(r.map)
  return { ...r, currentMapIndex: idx, layer: idx }
}

export function appendNextLayer(run: RunState, completedLayerIndex: number): MapNode[] {
  const nextLayer = completedLayerIndex + 1
  if (nextLayer >= MAP_STAGES.length) return run.map
  const kept = run.map.filter((n) => n.layer <= completedLayerIndex)
  const nextNodes = generateLayerNodes(
    run.tournament,
    run.nationId,
    nextLayer,
    layerSeed(run, nextLayer),
    run.map,
  )
  return [...kept, ...nextNodes]
}

function layerWiringBroken(layerNodes: MapNode[]): boolean {
  const boss = layerNodes.find((n) => n.isBoss)
  const side = layerNodes.filter((n) => !n.isBoss)
  const ids = new Set(layerNodes.map((n) => n.id))
  const incoming = new Map(side.map((n) => [n.id, 0]))

  for (const n of side) {
    for (const to of n.nextIds) {
      if (ids.has(to)) incoming.set(to, (incoming.get(to) ?? 0) + 1)
    }
  }

  for (const n of side) {
    if (n.kind !== 'start' && (incoming.get(n.id) ?? 0) === 0) return true
    const linksBoss = boss && n.nextIds.length === 1 && n.nextIds[0] === boss.id
    if (!linksBoss && n.nextIds.length === 0) return true
  }

  if (boss) {
    const preBossRow = boss.row - 1
    const preBoss = side.filter((n) => n.row === preBossRow)
    if (preBoss.length > 0 && preBoss.some((n) => !n.nextIds.includes(boss.id))) return true
  }

  return false
}

/** Rebuild path links on an existing layer without resetting node progress. */
export function rewireLayerPaths(map: MapNode[], mapIndex: number): MapNode[] {
  const layerNodes = nodesInMap(map, mapIndex)
  const boss = layerNodes.find((n) => n.isBoss)
  if (!boss) return map

  const side = layerNodes.filter((n) => !n.isBoss)
  const linksMissing = side.some((n) => n.nextIds.length === 0)
  if (!linksMissing && !layerWiringBroken(layerNodes)) return map

  const rowNums = [...new Set(side.map((n) => n.row))].sort((a, b) => a - b)
  const sideRows = rowNums.map((r) =>
    side
      .filter((n) => n.row === r)
      .sort((a, b) => a.col - b.col)
      .map((n) => ({ ...n, nextIds: [] as string[] })),
  )
  const bossCopy = { ...boss, nextIds: [] as string[] }
  buildPathGraph(sideRows, bossCopy)

  const nextById = new Map<string, string[]>([
    ...sideRows.flat().map((n) => [n.id, n.nextIds] as const),
    [bossCopy.id, bossCopy.nextIds],
  ])
  return map.map((n) => {
    if (n.layer !== mapIndex) return n
    const nextIds = nextById.get(n.id)
    return nextIds ? { ...n, nextIds } : n
  })
}

/** Sync map index / group-boss progress without wiping nodes the player already cleared. */
export function syncRunMapState(run: RunState): RunState {
  const groupResults = run.groupResults ?? ['pending', 'pending', 'pending']
  const simulatedMatchdays = run.tournament?.simulatedMatchdays ?? 0
  const dedupedMap = fixDuplicateNodeIds(run.map)
  let fixed = appendAllMissingLayers({
    ...run,
    map: repairPlayedGroupBosses(dedupedMap, groupResults, simulatedMatchdays),
  })
  // Second pass: marking bosses may have completed another layer
  fixed = appendAllMissingLayers({
    ...fixed,
    map: repairPlayedGroupBosses(fixed.map, groupResults, simulatedMatchdays),
  })
  const mapIndex = firstIncompleteMapIndex(fixed.map)
  const map = rewireLayerPaths(fixed.map, mapIndex)
  return {
    ...fixed,
    map,
    selectedNodeId: fixed.selectedNodeId ?? null,
    currentMapIndex: mapIndex,
    layer: mapIndex,
    layerSeeds: fixed.layerSeeds ?? [],
  }
}

export function repairRunState(run: RunState): RunState {
  const synced = syncRunMapState(run)
  const mapIndex = synced.currentMapIndex
  const layerNodes = nodesInMap(synced.map, mapIndex)
  const isFinal = stageForLayer(mapIndex).id === 'final'
  const needsRegen =
    layerNodes.length === 0 ||
    (!isFinal &&
      layerNodes.length > 0 &&
      !layerNodes.some((n) => n.taken) &&
      (!layerNodes.some((n) => n.isBoss) ||
        layerNodes.filter((n) => !n.isBoss).every((n) => n.nextIds.length === 0) ||
        !layerNodes.some((n) => n.kind === 'start')))

  let map = synced.map
  if (needsRegen) {
    const past = synced.map.filter((n) => n.layer < mapIndex)
    const fresh = generateLayerNodes(
      synced.tournament,
      synced.nationId,
      mapIndex,
      layerSeed(synced, mapIndex),
      synced.map,
    )
    map = [...past, ...fresh]
  }
  return {
    ...synced,
    map,
    currentNodeId: synced.currentNodeId ?? null,
  }
}

export function isValidRunShape(run: RunState): boolean {
  return (
    Boolean(run.tournament?.groups?.length) &&
    Boolean(run.map?.length) &&
    Boolean(run.map[0]?.stageId) &&
    run.map.some((n) => n.isBoss === true)
  )
}

export function completedLayer(map: MapNode[]): number {
  return map.filter((n) => n.taken).reduce((max, n) => Math.max(max, n.layer), -1)
}

export function isFightNode(kind: NodeKind): boolean {
  return kind === 'friendly' || kind === 'warmup' || kind === 'group' || kind === 'knockout' || kind === 'final'
}

/** Layout helpers for MapPathView */
export function groupNodesByRow(nodes: MapNode[]): MapNode[][] {
  const boss = nodes.find((n) => n.isBoss)
  const side = nodes.filter((n) => !n.isBoss).sort((a, b) => a.row - b.row || a.col - b.col)
  const rowNums = [...new Set(side.map((n) => n.row))].sort((a, b) => a - b)
  const rows: MapNode[][] = rowNums.map((r) =>
    side.filter((n) => n.row === r).sort((a, b) => a.col - b.col),
  )
  if (boss) rows.push([boss])
  return rows
}

export function nodeCenterPercent(
  node: MapNode,
  rowNodes: MapNode[],
  rowIndex: number,
  totalRows: number,
): { x: number; y: number } {
  const cols = rowNodes.length
  const colIdx = rowNodes.findIndex((n) => n.id === node.id)
  const x = ((colIdx + 0.5) / Math.max(cols, 1)) * 100
  const y = ((rowIndex + 0.5) / Math.max(totalRows, 1)) * 100
  return { x, y }
}

export function pathEdges(nodes: MapNode[]): { from: string; to: string }[] {
  const edges: { from: string; to: string }[] = []
  const ids = new Set(nodes.map((n) => n.id))
  for (const n of nodes) {
    for (const to of n.nextIds) {
      if (ids.has(to)) edges.push({ from: n.id, to })
    }
  }
  return edges
}
