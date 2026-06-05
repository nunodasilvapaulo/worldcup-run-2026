import { isSupabaseConfigured, supabase } from '@/lib/supabase'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export function isApiEnabled(): boolean {
  if (isSupabaseConfigured()) return true
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
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) return
    const { error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    return
  }
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

type NationRow = {
  id: string
  name: string
  flag: string
  confederation: string
  tier: string
  archetype: string
  colors_json: string[] | string
  is_host: boolean
  debut_2026: boolean
  is_wc: boolean
  is_playable: boolean
}

type PlayerRow = {
  nation_id: string
  name: string
  role: string
  photo_url: string
  pace: number
  shoot: number
  pass: number
  defend: number
  squad_rank: number | null
  is_legend: boolean
}

function buildBootstrapFromRows(nationRows: NationRow[], playerRows: PlayerRow[]): BootstrapPayload {
  const nations = nationRows.map((r) => ({
    id: r.id,
    name: r.name,
    flag: r.flag,
    confederation: r.confederation,
    tier: r.tier,
    archetype: r.archetype,
    colors: Array.isArray(r.colors_json) ? r.colors_json : JSON.parse(String(r.colors_json)),
    isHost: r.is_host,
    debut2026: r.debut_2026,
    isWc: r.is_wc,
    isPlayable: r.is_playable,
  }))

  const rosters: Record<string, import('./players2026').PlayerTemplate[]> = {}
  const legends: Record<string, import('./players2026').PlayerTemplate[]> = {}

  for (const p of playerRows) {
    const template = {
      name: p.name,
      role: p.role as import('./types').PlayerRole,
      photoUrl: p.photo_url,
      base: { pace: p.pace, shoot: p.shoot, pass: p.pass, defend: p.defend },
      ...(p.squad_rank != null ? { squadRank: p.squad_rank } : {}),
    }
    const bucket = p.is_legend ? legends : rosters
    if (!bucket[p.nation_id]) bucket[p.nation_id] = []
    bucket[p.nation_id]!.push(template)
  }

  return {
    nations,
    rosters,
    legends,
    starterNationIds: nations.filter((n) => n.isPlayable).map((n) => n.id),
  }
}

async function fetchBootstrapSupabase(): Promise<BootstrapPayload> {
  const [nationsRes, playersRes] = await Promise.all([
    supabase
      .from('nations')
      .select('id, name, flag, confederation, tier, archetype, colors_json, is_host, debut_2026, is_wc, is_playable')
      .order('is_playable', { ascending: false })
      .order('name', { ascending: true }),
    supabase
      .from('players')
      .select('nation_id, name, role, photo_url, pace, shoot, pass, defend, squad_rank, is_legend')
      .order('nation_id')
      .order('squad_rank', { ascending: true, nullsFirst: false })
      .order('id'),
  ])

  if (nationsRes.error) throw nationsRes.error
  if (playersRes.error) throw playersRes.error
  if (!nationsRes.data?.length) {
    throw new Error('No nations in database — run npm run db:seed:supabase')
  }

  return buildBootstrapFromRows(nationsRes.data as NationRow[], playersRes.data as PlayerRow[])
}

export async function fetchBootstrap(): Promise<BootstrapPayload> {
  if (isSupabaseConfigured()) return fetchBootstrapSupabase()
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

async function fetchSaveSupabase(): Promise<RemoteSavePayload> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { hallOfLegends: 0, run: null, screen: null, lastBattle: null, pendingFight: null }
  }

  const { data, error } = await supabase
    .from('game_saves')
    .select('hall_of_legends, screen, run_json, last_battle_json, pending_fight_json')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    return { hallOfLegends: 0, run: null, screen: null, lastBattle: null, pendingFight: null }
  }

  return {
    hallOfLegends: data.hall_of_legends ?? 0,
    screen: data.screen,
    run: data.run_json,
    lastBattle: data.last_battle_json,
    pendingFight: data.pending_fight_json,
  }
}

export async function fetchSave(): Promise<RemoteSavePayload> {
  if (isSupabaseConfigured()) return fetchSaveSupabase()
  const res = await apiFetch('/api/save')
  return res.json() as Promise<RemoteSavePayload>
}

async function putSaveSupabase(payload: RemoteSavePayload): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No Supabase session')

  const { error } = await supabase.from('game_saves').upsert({
    user_id: user.id,
    hall_of_legends: payload.hallOfLegends ?? 0,
    screen: payload.screen,
    run_json: payload.run ?? null,
    last_battle_json: payload.lastBattle ?? null,
    pending_fight_json: payload.pendingFight ?? null,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
}

export async function putSave(payload: RemoteSavePayload): Promise<void> {
  if (isSupabaseConfigured()) return putSaveSupabase(payload)
  await apiFetch('/api/save', { method: 'PUT', body: JSON.stringify(payload) })
}

async function clearRemoteRunSupabase(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data: existing } = await supabase
    .from('game_saves')
    .select('hall_of_legends')
    .eq('user_id', user.id)
    .maybeSingle()

  const hall = existing?.hall_of_legends ?? 0

  const { error } = await supabase.from('game_saves').upsert({
    user_id: user.id,
    hall_of_legends: hall,
    screen: null,
    run_json: null,
    last_battle_json: null,
    pending_fight_json: null,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
  return hall
}

export async function clearRemoteRun(): Promise<number> {
  if (isSupabaseConfigured()) return clearRemoteRunSupabase()
  const res = await apiFetch('/api/save/run', { method: 'DELETE' })
  const data = (await res.json()) as { hallOfLegends: number }
  return data.hallOfLegends
}

export async function checkApiHealth(): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('nations').select('id').limit(1)
      return !error
    } catch {
      return false
    }
  }
  try {
    const res = await fetch(`${API_BASE}/api/health`, { credentials: 'include' })
    return res.ok
  } catch {
    return false
  }
}
