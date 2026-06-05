import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

export function BattleModal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={[
          'relative max-h-[90dvh] overflow-y-auto rounded-2xl border border-[var(--color-wc-gold)]/40',
          'bg-gradient-to-b from-[#1a2f4a] to-[#0a1628] shadow-[0_16px_48px_rgba(0,0,0,0.6)]',
          wide ? 'w-full max-w-lg' : 'w-full max-w-md',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-[#152238]/95 backdrop-blur-md">
          <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-wc-gold-light)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg border border-white/15 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
