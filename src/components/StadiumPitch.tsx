import type { ReactNode } from 'react'
import type { StadiumVenue } from '@/game/stadiums2026'

export function StadiumPitch({
  stadium,
  children,
}: {
  stadium: StadiumVenue
  children: ReactNode
}) {
  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Stadium photo (WC 2026 host venues) */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-[1.08]"
        style={{ backgroundImage: `url(${stadium.imageUrl})` }}
        aria-hidden
      />

      {/* Bowl / stands vignette — reads as seated stadium around the pitch */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 95% 72% at 50% 58%, transparent 0%, rgba(10,22,40,0.35) 55%, rgba(5,12,24,0.92) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 18%, transparent 72%, rgba(0,0,0,0.75) 100%),
            linear-gradient(90deg, rgba(0,0,0,0.65) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.65) 100%)
          `,
        }}
        aria-hidden
      />

      {/* Floodlights */}
      <div className="absolute top-0 left-[8%] w-24 h-24 bg-white/8 blur-3xl rounded-full pointer-events-none" aria-hidden />
      <div className="absolute top-0 right-[8%] w-24 h-24 bg-white/8 blur-3xl rounded-full pointer-events-none" aria-hidden />

      {/* Night-sky tint + turf glow at bottom */}
      <div className="absolute inset-0 bg-[#0a1628]/50 mix-blend-multiply" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#1a5c34]/55 via-[#145a32]/25 to-transparent pointer-events-none" aria-hidden />

      {/* Pitch markings (centered, stadium behind) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
        <div
          className="w-[min(88%,680px)] aspect-[68/105] border-[3px] border-white/30 rounded-sm relative shadow-[0_0_120px_rgba(26,107,60,0.45)]"
          style={{
            background:
              'linear-gradient(180deg, rgba(26,107,60,0.92) 0%, rgba(20,90,50,0.95) 50%, rgba(26,107,60,0.92) 100%)',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.35), 0 8px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-[2px] bg-white/35 -translate-y-1/2" />
          <div className="absolute left-1/2 top-1/2 w-[22%] aspect-square border-2 border-white/35 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white/50 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 w-[44%] h-[18%] border-2 border-t-0 border-white/30 -translate-x-1/2" />
          <div className="absolute left-1/2 bottom-0 w-[44%] h-[18%] border-2 border-b-0 border-white/30 -translate-x-1/2" />
          <div className="absolute left-1/2 top-0 w-[18%] h-[7%] border-2 border-t-0 border-white/25 -translate-x-1/2" />
          <div className="absolute left-1/2 bottom-0 w-[18%] h-[7%] border-2 border-b-0 border-white/25 -translate-x-1/2" />
          {/* Corner arcs */}
          <div className="absolute top-0 left-0 w-[4%] aspect-square border-r-2 border-b-2 border-white/25 rounded-br-full" />
          <div className="absolute top-0 right-0 w-[4%] aspect-square border-l-2 border-b-2 border-white/25 rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-[4%] aspect-square border-r-2 border-t-2 border-white/25 rounded-tr-full" />
          <div className="absolute bottom-0 right-0 w-[4%] aspect-square border-l-2 border-t-2 border-white/25 rounded-tl-full" />
        </div>
      </div>

      <p className="absolute top-2 left-3 text-[9px] text-white/40 z-10 max-w-[200px]">
        {stadium.flag ?? '🏟️'} {stadium.name}
        <span className="block text-white/30">{stadium.city} · {stadium.country}</span>
      </p>
      <p className="absolute bottom-1 right-2 text-[8px] text-white/25 z-10">{stadium.credit}</p>

      <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}
