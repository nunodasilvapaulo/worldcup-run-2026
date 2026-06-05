/** Wikimedia Commons — stable redirect URL (works better than hand-built /thumb/ paths). */
export function wikiPhoto(filename: string, width = 220): string {
  let file = filename
  if (filename.includes('/')) {
    const last = filename.split('/').pop() ?? ''
    file = last.replace(/^220px-/, '')
  }
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=${width}`
}

export const PLACEHOLDER_PHOTO = wikiPhoto('Soccerball.svg', 220)

export function isPlaceholderPhoto(url: string): boolean {
  if (!url.trim()) return true
  const lower = url.toLowerCase()
  return lower.includes('soccerball.svg') || lower.includes('soccerball')
}

/** Rewrite legacy upload.wikimedia.org thumb URLs to Special:FilePath. */
export function normalizePhotoUrl(url: string): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (isPlaceholderPhoto(trimmed)) return ''
  if (trimmed.includes('Special:FilePath') || trimmed.includes('thesportsdb.com')) {
    return trimmed
  }
  if (trimmed.includes('upload.wikimedia.org')) {
    const lastSeg = trimmed.split('/').pop() ?? ''
    const filename = lastSeg.replace(/^220px-/, '')
    if (filename && !isPlaceholderPhoto(filename)) return wikiPhoto(filename)
  }
  return trimmed
}

/** Usable headshot URL, or empty when only a placeholder / missing. */
export function resolvePhotoUrl(url: string): string {
  return normalizePhotoUrl(url)
}

const sportsDbCache = new Map<string, string>()

function pickSportsDbThumb(
  players: { strThumb?: string; strCutout?: string; strPlayer?: string }[] | undefined,
  playerName: string,
): string {
  if (!players?.length) return ''
  const norm = playerName.toLowerCase()
  const exact = players.find((p) => p.strPlayer?.toLowerCase() === norm)
  const hit = exact ?? players[0]
  return hit?.strCutout || hit?.strThumb || ''
}

/** Fallback when Wikimedia misses — TheSportsDB free API. */
export async function fetchSportsDbPhoto(playerName: string): Promise<string> {
  const cached = sportsDbCache.get(playerName)
  if (cached) return cached

  const queries = [
    playerName,
    playerName.split(' ').pop() ?? playerName,
  ].filter((q, i, arr) => q.length > 1 && arr.indexOf(q) === i)

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(q)}`,
      )
      if (!res.ok) continue
      const data = (await res.json()) as {
        player?: { strThumb?: string; strCutout?: string; strPlayer?: string }[]
      }
      const thumb = pickSportsDbThumb(data.player, playerName)
      if (thumb) {
        sportsDbCache.set(playerName, thumb)
        return thumb
      }
    } catch {
      /* network blocked — initials fallback */
    }
  }
  return ''
}
