import { useState } from 'react'
import { getNation } from '@/game/nations2026'
import { nationFlagUrl } from '@/game/flags'

export function NationFlag({
  nationId,
  size = 40,
  className = '',
}: {
  nationId: string
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const nation = getNation(nationId)
  const url = nationFlagUrl(nationId, size >= 56 ? 160 : size >= 40 ? 80 : 40)

  if (failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-black/40 border border-white/20 shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.55 }}
        title={nation.name}
      >
        {nation.flag}
      </span>
    )
  }

  return (
    <img
      src={url}
      alt={`${nation.name} flag`}
      width={size}
      height={size}
      className={`rounded-full object-cover border-2 border-white/30 shrink-0 bg-black/30 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  )
}
