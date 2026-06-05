import squadsJson from '../../data/wc-squads-2026.json'
import type { PlayerTemplate } from './players2026'
import { PLACEHOLDER_PHOTO, wikiPhoto } from './photoUrls'

type RawPlayer = PlayerTemplate & { photoUrl: string }

function hydratePhoto(photoUrl: string): string {
  if (!photoUrl?.trim()) return PLACEHOLDER_PHOTO
  if (photoUrl.startsWith('http')) return photoUrl
  return wikiPhoto(photoUrl)
}

/**
 * Full 26-man FIFA World Cup 2026 squads (Wikipedia official lists).
 * Regenerate: npm run parse:wc-squads
 */
export const WC_NATION_ROSTERS: Record<string, PlayerTemplate[]> = Object.fromEntries(
  Object.entries(squadsJson as Record<string, RawPlayer[]>).map(([nationId, players]) => [
    nationId,
    players.map((p) => ({
      name: p.name,
      role: p.role,
      photoUrl: hydratePhoto(p.photoUrl),
      base: p.base,
      squadRank: p.squadRank,
    })),
  ]),
)
