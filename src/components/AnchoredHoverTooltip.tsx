import { createPortal } from 'react-dom'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

const PAD = 12

export function AnchoredHoverTooltip({
  children,
  content,
  width = 220,
  preferSide = 'center',
}: {
  children: ReactNode
  content: ReactNode
  width?: number
  /** Bias tooltip toward center of screen (battle sidebars). */
  preferSide?: 'left' | 'right' | 'center'
}) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{
    top: number
    left: number
    above: boolean
    centerY?: boolean
  } | null>(null)

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPos(null)
      return
    }

    const update = () => {
      const anchor = anchorRef.current
      if (!anchor) return

      const rect = anchor.getBoundingClientRect()
      const panelH = panelRef.current?.offsetHeight ?? 280
      const spaceAbove = rect.top - PAD
      const spaceBelow = window.innerHeight - rect.bottom - PAD

      let top: number
      let left: number
      let above = true
      let centerY = false

      if (preferSide === 'right') {
        left = rect.right + PAD
        top = rect.top + rect.height / 2
        centerY = true
      } else if (preferSide === 'left') {
        left = rect.left - width - PAD
        top = rect.top + rect.height / 2
        centerY = true
      } else {
        above = spaceAbove >= panelH || spaceAbove >= spaceBelow
        top = above ? rect.top - PAD : rect.bottom + PAD
        left = rect.left + rect.width / 2 - width / 2
      }
      left = Math.max(PAD, Math.min(left, window.innerWidth - width - PAD))

      setPos({ top, left, above: centerY ? false : above, centerY })
    }

    update()
    const raf = requestAnimationFrame(update)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, width, preferSide])

  return (
    <>
      <div
        ref={anchorRef}
        className="w-full"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </div>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="tooltip"
            className="pointer-events-none fixed z-[9999]"
            style={{
              width,
              left: pos?.left ?? -9999,
              top: pos?.top ?? 0,
              transform: pos?.centerY
                ? 'translateY(-50%)'
                : pos?.above
                  ? 'translateY(-100%)'
                  : undefined,
              visibility: pos ? 'visible' : 'hidden',
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}
