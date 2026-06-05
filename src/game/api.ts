const API_BASE = import.meta.env.VITE_API_URL ?? ''

export function isApiEnabled(): boolean {
  return import.meta.env.VITE_USE_API !== 'false'
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`)
  }
  return res
}

export async function ensureSession(): Promise<void> {
  await apiFetch('/api/session', { method: 'POST' })
}

export interface BootstrapPayload {
  nations: Array<{
    id: string
    name: string
    flag: string
    confederation: string
    tier: string
    archetype: string
    colors: string[]
    isHost?: boolean
    debut2026?: boolean
    isWc?: boolean
    isPlayable?: boolean
  }>
  rosters: Record<string, import('./players2026').PlayerTemplate[]>
  legends: Record<string, import('./players2026').PlayerTemplate[]>
  starterNationIds: string[]
}

export async function fetchBootstrap(): Promise<BootstrapPayload> {
  const res = await apiFetch('/api/bootstrap')
  return res.json() as Promise<BootstrapPayload>
}

export interface RemoteSavePayload {
  hallOfLegends: number
  screen: string | null
  run: unknown
  lastBattle: unknown
  pendingFight: unknown
}

export async function fetchSave(): Promise<RemoteSavePayload> {
  const res = await apiFetch('/api/save')
  return res.json() as Promise<RemoteSavePayload>
}

export async function putSave(payload: RemoteSavePayload): Promise<void> {
  await apiFetch('/api/save', { method: 'PUT', body: JSON.stringify(payload) })
}

export async function clearRemoteRun(): Promise<number> {
  const res = await apiFetch('/api/save/run', { method: 'DELETE' })
  const data = (await res.json()) as { hallOfLegends: number }
  return data.hallOfLegends
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { credentials: 'include' })
    return res.ok
  } catch {
    return false
  }
}
