import { useMemo, useRef, useState, useLayoutEffect } from 'react'
import { AnchoredHoverTooltip } from '@/components/AnchoredHoverTooltip'
import { NODE_META } from '@/game/constants'
import {
  groupNodesByRow,
  isFightNode,
  nodeCenterPercent,
  pathEdges,
} from '@/game/mapGen'
import { mapNodeTooltip } from '@/game/nodeTooltips'
import { getNation } from '@/game/nations2026'
import { NationFlag } from '@/components/NationFlag'
import type { MapNode } from '@/game/types'

function MapNodeCard({
  node,
  pickable,
  onSelect,
  size = 52,
  ironman = false,
  isHost = false,
}: {
  node: MapNode
  pickable: boolean
  onSelect: () => void
  size?: number
  ironman?: boolean
  isHost?: boolean
}) {
  const meta = NODE_META[node.kind] ?? { emoji: '•', title: node.label }
  const opp = node.opponentId ? getNation(node.opponentId) : null
  const isFight = opp && isFightNode(node.kind)
  const nodeSize = node.isBoss ? Math.max(size, 64) : size
  const tip = mapNodeTooltip(node, { ironman, isHost })

  return (
    <AnchoredHoverTooltip
      width={240}
      preferSide="center"
      content={
        <div className="rounded-lg border border-[var(--color-wc-gold)]/40 bg-[#0a1628]/95 px-3 py-2 shadow-xl backdrop-blur-sm">
          <p className="text-xs font-bold text-[var(--color-wc-gold-light)]">{tip.title}</p>
          <p className="text-[10px] text-white/70 mt-1 leading-snug">{tip.description}</p>
        </div>
      }
    >
    <button
      type="button"
      disabled={!pickable || node.taken}
      onClick={onSelect}
      className={[
        'flex flex-col items-center gap-1 rounded-xl transition-all z-10',
        pickable && !node.taken && 'hover:scale-105 cursor-pointer',
        node.taken && 'opacity-70 cursor-not-allowed',
        !pickable && !node.taken && 'opacity-25 cursor-not-allowed',
        pickable && !node.taken && 'drop-shadow-[0_0_12px_rgba(255,215,0,0.35)]',
        pickable && node.isBoss && 'ring-2 ring-[var(--color-wc-gold)]',
      ].join(' ')}
      style={{ width: nodeSize + 24 }}
    >
      <div className="relative">
        {isFight && opp ? (
          <NationFlag nationId={node.opponentId!} size={nodeSize} />
        ) : (
          <div
            className="rounded-full bg-[#1a2a1a] border-2 border-white/30 flex items-center justify-center shadow-inner"
            style={{ width: nodeSize, height: nodeSize }}
          >
            <span className="text-xl">{meta.emoji}</span>
          </div>
        )}
        {node.taken && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-xl text-emerald-400">
            ✓
          </span>
        )}
      </div>
      <span
        className={[
          'text-[9px] font-semibold text-center leading-tight max-w-[88px]',
          node.isBoss ? 'text-[var(--color-wc-gold-light)]' : 'text-white/80',
        ].join(' ')}
      >
        {node.isBoss && opp ? opp.name : node.label}
      </span>
    </button>
    </AnchoredHoverTooltip>
  )
}

export function MapPathView({
  nodes,
  availableIds,
  stageLabel,
  onSelect,
  ironman = false,
  isHost = false,
}: {
  nodes: MapNode[]
  availableIds: Set<string>
  stageLabel: string
  onSelect: (nodeId: string) => void
  ironman?: boolean
  isHost?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 400, h: 520 })

  const rows = useMemo(() => groupNodesByRow(nodes), [nodes])
  const edges = useMemo(() => pathEdges(nodes), [nodes])
  const totalRows = rows.length

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    rows.forEach((rowNodes, rowIndex) => {
      for (const node of rowNodes) {
        map.set(node.id, nodeCenterPercent(node, rowNodes, rowIndex, totalRows))
      }
    })
    return map
  }, [rows, totalRows])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  return (
    <div className="w-full h-full min-h-0 flex flex-1 flex-col rounded-2xl border border-[var(--color-wc-gold)]/25 bg-gradient-to-b from-[#2d4a32]/40 via-[#142218]/90 to-[#0a1628]/95 overflow-hidden">
      <p className="shrink-0 py-2 text-center text-xs font-bold uppercase tracking-widest text-[var(--color-wc-gold)] border-b border-white/10">
        {stageLabel}
      </p>

      <div ref={containerRef} className="relative flex-1 min-h-0 mx-2 my-2">
        {/* Row bands — nodes on the same horizontal “level” */}
        {rows.map((rowNodes, rowIndex) => {
          const y = ((rowIndex + 0.5) / totalRows) * 100
          return (
            <div
              key={`band-${rowIndex}`}
              className="absolute left-2 right-2 rounded-lg bg-white/[0.03] border border-white/[0.06] pointer-events-none"
              style={{
                top: `${y}%`,
                transform: 'translateY(-50%)',
                height: rowNodes[0]?.isBoss ? 88 : 76,
              }}
            />
          )
        })}

        {/* Path lines (dashed connections between rows) */}
        <svg
          className="absolute inset-0 pointer-events-none z-0"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
        >
          {edges.map(({ from, to }) => {
            const a = positions.get(from)
            const b = positions.get(to)
            if (!a || !b) return null
            const x1 = (a.x / 100) * size.w
            const y1 = (a.y / 100) * size.h
            const x2 = (b.x / 100) * size.w
            const y2 = (b.y / 100) * size.h
            const done = nodes.find((n) => n.id === from)?.taken
            return (
              <line
                key={`${from}-${to}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={done ? 'rgba(52,211,153,0.45)' : 'rgba(255,255,255,0.18)'}
                strokeWidth={done ? 2 : 1.5}
                strokeDasharray="5 6"
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        {/* Nodes positioned on path grid */}
        {rows.map((rowNodes) =>
          rowNodes.map((node) => {
            const pos = positions.get(node.id)!
            return (
              <div
                key={node.id}
                className="absolute z-10"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <MapNodeCard
                  node={node}
                  pickable={availableIds.has(node.id)}
                  onSelect={() => onSelect(node.id)}
                  size={node.isBoss ? 64 : 48}
                  ironman={ironman}
                  isHost={isHost}
                />
              </div>
            )
          }),
        )}
      </div>

      <p className="shrink-0 pb-2 text-center text-[9px] text-white/40 px-4">
        Pick one node per row — you stay on that path until the boss
      </p>
    </div>
  )
}
