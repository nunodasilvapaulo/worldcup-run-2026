import { appendNextLayer, generateLayerNodes } from '../src/game/mapGen.ts'
import { createTournament } from '../src/game/tournament.ts'

function validate(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const start = nodes.find((n) => n.kind === 'start')
  const boss = nodes.find((n) => n.isBoss)
  const issues = []

  const incoming = new Map(nodes.map((n) => [n.id, 0]))
  for (const n of nodes) {
    for (const to of n.nextIds) incoming.set(to, (incoming.get(to) ?? 0) + 1)
  }

  for (const n of nodes) {
    if (n.isBoss) continue
    if (n.kind !== 'start' && (incoming.get(n.id) ?? 0) === 0) {
      issues.push(`zero-in:${n.row},${n.col}`)
    }
    if (!n.isBoss && n.nextIds.length === 0) {
      issues.push(`zero-out:${n.row},${n.col}`)
    }
    if (n.nextIds.length > 2) issues.push(`too-many-out:${n.id}`)
    for (const to of n.nextIds) {
      if ((incoming.get(to) ?? 0) > 2) issues.push(`too-many-in:${to}`)
    }
  }

  const seen = new Set(start ? [start.id] : [])
  const q = start ? [start.id] : []
  for (let i = 0; i < q.length; i++) {
    for (const next of byId.get(q[i]).nextIds) {
      if (!seen.has(next)) {
        seen.add(next)
        q.push(next)
      }
    }
  }
  if (!boss || !seen.has(boss.id)) issues.push('no-path-to-boss')

  for (const n of nodes) {
    const fromRow = n.row
    for (const toId of n.nextIds) {
      const to = byId.get(toId)
      if (!to) {
        issues.push(`dangling:${n.id}->${toId}`)
        continue
      }
      const expected = to.isBoss ? fromRow + 1 : to.row
      if (!to.isBoss && to.row !== fromRow + 1) {
        issues.push(`skip-row:${fromRow}->${to.row}`)
      }
      if (to.isBoss && to.row <= fromRow) {
        issues.push(`bad-boss-link:${fromRow}->${to.row}`)
      }
      const fromCols = nodes.filter((x) => x.row === fromRow && !x.isBoss).length
      const toCols = to.isBoss ? 1 : nodes.filter((x) => x.row === to.row).length
      const fromIdx = nodes
        .filter((x) => x.row === fromRow && !x.isBoss)
        .sort((a, b) => a.col - b.col)
        .findIndex((x) => x.id === n.id)
      const toIdx = to.isBoss
        ? 0
        : nodes
            .filter((x) => x.row === to.row)
            .sort((a, b) => a.col - b.col)
            .findIndex((x) => x.id === to.id)
      const dist = Math.abs(norm(fromIdx, fromCols) - norm(toIdx, toCols))
      if (!to.isBoss && dist > 0.55) issues.push(`long-edge:${fromRow}.${fromIdx}->${to.row}.${toIdx}`)
    }
  }

  return issues
}

function norm(i, len) {
  return (i + 0.5) / len
}

const t = createTournament('BRA')
let bad = 0
for (let seed = 1; seed <= 100; seed++) {
  const nodes = generateLayerNodes(t, 'BRA', 0, seed * 777)
  const issues = validate(nodes)
  if (issues.length) {
    bad++
    if (bad <= 3) console.log('seed', seed, issues.slice(0, 5))
  }
}
console.log('bad maps:', bad, '/ 100')

let dupes = 0
for (let seed = 1; seed <= 100; seed++) {
  const md1 = generateLayerNodes(t, 'BRA', 0, seed * 777)
  const md2 = appendNextLayer(
    { map: md1, tournament: t, nationId: 'BRA', layerSeeds: [seed * 777] },
    0,
  )
  const ids = new Set(md2.map((n) => n.id))
  if (ids.size !== md2.length) {
    dupes++
    if (dupes <= 3) console.log('duplicate ids seed', seed)
  }
}
console.log('duplicate cross-layer ids:', dupes, '/ 100')
