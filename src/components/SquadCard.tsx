import { ROLE_LABELS } from '@/game/constants'

import { AnchoredHoverTooltip } from '@/components/AnchoredHoverTooltip'

import { PlayerAvatar } from '@/components/PlayerAvatar'

import { PlayerStatTooltipContent } from '@/components/PlayerStatTooltip'

import { getPlayerItem } from '@/game/playerItems'

import { effectivePlayerStats } from '@/game/squad'

import type { NextMatchTraining } from '@/game/trainingBuff'

import type { SquadPlayer } from '@/game/types'



export function SquadCard({

  player,

  nationId,

  onClick,

  onItemClick,

  compact,

  selected,

  highlight,

  tooltipSide = 'right',

  nextMatchTraining = null,

}: {

  player: SquadPlayer

  nationId?: string

  onClick?: () => void

  onItemClick?: () => void

  compact?: boolean

  selected?: boolean

  highlight?: boolean

  /** Where the stat tooltip opens (compact mode). Map sidebar uses `right`. */

  tooltipSide?: 'left' | 'right' | 'center'

  nextMatchTraining?: NextMatchTraining | null

}) {

  const hpPct = Math.round((player.hp / player.maxHp) * 100)

  const avatarSize = compact ? 36 : 52

  const item = player.equippedItemId ? getPlayerItem(player.equippedItemId) : null

  const stats = effectivePlayerStats(player, nextMatchTraining)



  const card = (

    <div

      role={onClick ? 'button' : undefined}

      tabIndex={onClick ? 0 : undefined}

      onClick={onClick}

      onKeyDown={

        onClick

          ? (e) => {

              if (e.key === 'Enter' || e.key === ' ') onClick()

            }

          : undefined

      }

      className={[

        'relative text-left rounded-xl border w-full transition-all flex gap-3 items-start',

        compact ? 'p-2' : 'p-3',

        selected || highlight

          ? 'border-[var(--color-wc-gold)] bg-black/50 ring-1 ring-[var(--color-wc-gold)]/40'

          : 'border-white/20 bg-black/45 backdrop-blur-sm',

        onClick ? 'hover:border-[var(--color-wc-gold)]/60 cursor-pointer' : '',

      ].join(' ')}

    >

      <PlayerAvatar

        name={player.name}

        photoUrl={player.photoUrl}

        nationId={nationId}

        size={avatarSize}

      />

      <div className="flex-1 min-w-0">

        <p className={`font-semibold text-white truncate ${compact ? 'text-sm' : ''}`}>

          {player.isLegend ? '⭐ ' : ''}

          {player.callUpRank != null && (
            <span className="text-[var(--color-wc-gold)]/85 font-bold mr-1">#{player.callUpRank}</span>
          )}

          {player.name}

        </p>

        <p className="text-xs text-white/50 flex flex-wrap items-center gap-1">

          <span>

            {ROLE_LABELS[player.role]} · Lv.{player.level}

          </span>

          {item && (

            <button

              type="button"

              onClick={(e) => {

                e.stopPropagation()

                onItemClick?.()

              }}

              className="text-[var(--color-wc-gold)]/90 hover:text-[var(--color-wc-gold-light)] underline-offset-2 hover:underline"

            >

              · {item.name}

            </button>

          )}

        </p>

        {!compact && (

          <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] text-white/55">

            <span>PAC {stats.pace}</span>

            <span>SHO {stats.shoot}</span>

            <span>PAS {stats.pass}</span>

            <span>DEF {stats.defend}</span>

          </div>

        )}

        <div className="mt-2 h-1.5 rounded-full bg-black/50 overflow-hidden">

          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${hpPct}%` }} />

        </div>

      </div>

    </div>

  )



  if (compact) {

    return (

      <AnchoredHoverTooltip

        content={<PlayerStatTooltipContent player={player} />}

        width={210}

        preferSide={tooltipSide}

      >

        {card}

      </AnchoredHoverTooltip>

    )

  }



  return card

}


