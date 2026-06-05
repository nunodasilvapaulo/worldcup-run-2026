import { getNation } from './nations2026'
import type { MapNode } from './types'

export interface MapNodeTooltip {
  title: string
  description: string
}

export function mapNodeTooltip(
  node: MapNode,
  opts?: { ironman?: boolean; isHost?: boolean },
): MapNodeTooltip {
  const opp = node.opponentId ? getNation(node.opponentId) : null

  if (node.isBoss) {
    if (node.kind === 'final') {
      return {
        title: 'World Cup Final',
        description: opp
          ? `vs ${opp.name} — +2 to +3 levels on win. Lift the trophy!`
          : '+2 to +3 levels on win. Lift the trophy!',
      }
    }
    if (node.kind === 'knockout') {
      return {
        title: 'Knockout match',
        description: opp
          ? `vs ${opp.name} — +2 to +3 levels on win. Lose and you're eliminated.`
          : "+2 to +3 levels on win. Lose and you're eliminated.",
      }
    }
    if (node.stageId === 'md1') {
      return {
        title: 'Group stage — Matchday 1',
        description: opp
          ? `vs ${opp.name} — +2 to +3 levels on win. You can lose and stay in the World Cup.`
          : '+2 to +3 levels on win. You can lose and stay in the World Cup.',
      }
    }
    if (node.stageId === 'md2') {
      return {
        title: 'Group stage — Matchday 2',
        description: opp
          ? `vs ${opp.name} — play to continue the camp. +2 to +3 levels on win; a loss still keeps you in the World Cup.`
          : 'Play to continue the camp. +2 to +3 levels on win; a loss still keeps you in the World Cup.',
      }
    }
    if (node.stageId === 'md3') {
      return {
        title: 'Group stage — Matchday 3',
        description: opp
          ? `vs ${opp.name} — +2 to +3 levels on win. Lose and you may still qualify as a best third place.`
          : '+2 to +3 levels on win. Lose and you may still qualify as a best third place.',
      }
    }
    return {
      title: 'Tournament match',
      description: opp
        ? `vs ${opp.name} — +2 to +3 levels on win. Beat the boss to advance.`
        : '+2 to +3 levels on win. Beat the boss to advance.',
    }
  }

  switch (node.kind) {
    case 'start':
      return {
        title: 'Starting point',
        description: 'Your path begins here — choose one node per row toward the boss.',
      }
    case 'friendly':
      return {
        title: 'Friendly match',
        description: opp
          ? `vs ${opp.name} — +1 level on win. Lose: no EXP, stamina still drains.`
          : '+1 level on win. Lose: no EXP, stamina still drains.',
      }
    case 'recovery': {
      const base = opts?.ironman ? 18 : 32
      const bonus = opts?.isHost ? 8 : 0
      const total = base + bonus
      return {
        title: 'Recovery camp',
        description: `Rest the squad — +${total} HP each player.`,
      }
    }
    case 'recruit':
      return {
        title: 'Call-up',
        description: 'Scout a new player and add them to your 5-man squad.',
      }
    case 'legend':
      return {
        title: 'Legend call-up',
        description: 'Recruit a star player (once per run).',
      }
    case 'social':
      return {
        title: 'Social event',
        description: 'Press, fans, or team bonding — pick a player for a small boost.',
      }
    case 'item':
      return {
        title: 'Equipment',
        description: 'Choose boots, gloves, or kit for one player.',
      }
    case 'mystery':
      return {
        title: '???',
        description: 'Mystery event — injury, heal, friendly, boost, or legend visit.',
      }
    case 'training':
      return {
        title: 'Training',
        description: 'Drill one player for a permanent stat bump.',
      }
    case 'training_session':
      return {
        title: 'Training Session',
        description:
          'Pick GK, Defenders, Midfielders, Forwards, or Team. Sector drill: +2 main stat. Team drill: +1 main stat for all — next official match only.',
      }
    case 'shop':
      return {
        title: 'Shop',
        description: 'Buy run items — buffs, healing, or tactics for the next match.',
      }
    default:
      return {
        title: node.label,
        description: 'Camp event on your World Cup run.',
      }
  }
}
