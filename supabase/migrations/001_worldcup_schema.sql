-- World Cup Run 2026 — Supabase schema
-- After running: enable Anonymous sign-ins in Auth → Providers → Anonymous

create table if not exists public.nations (
  id              text primary key,
  name            text not null,
  flag            text not null default '',
  confederation   text not null default '',
  tier            text not null default 'B',
  archetype       text not null default 'balanced',
  colors_json     jsonb not null default '[]'::jsonb,
  is_host         boolean not null default false,
  debut_2026      boolean not null default false,
  is_wc           boolean not null default true,
  is_playable     boolean not null default false
);

create table if not exists public.players (
  id          bigserial primary key,
  nation_id   text not null references public.nations(id) on delete cascade,
  name        text not null,
  role        text not null,
  photo_url   text not null default '',
  pace        int not null,
  shoot       int not null,
  pass        int not null,
  defend      int not null,
  squad_rank  int,
  is_legend   boolean not null default false,
  unique (nation_id, name, is_legend)
);

create index if not exists idx_players_nation on public.players(nation_id);
create index if not exists idx_players_rank on public.players(nation_id, squad_rank);

create table if not exists public.game_saves (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  hall_of_legends     int not null default 0,
  screen              text,
  run_json            jsonb,
  last_battle_json    jsonb,
  pending_fight_json  jsonb,
  updated_at          timestamptz not null default now()
);

alter table public.nations enable row level security;
alter table public.players enable row level security;
alter table public.game_saves enable row level security;

drop policy if exists "nations_public_read" on public.nations;
create policy "nations_public_read" on public.nations
  for select using (true);

drop policy if exists "players_public_read" on public.players;
create policy "players_public_read" on public.players
  for select using (true);

drop policy if exists "saves_select_own" on public.game_saves;
create policy "saves_select_own" on public.game_saves
  for select using (auth.uid() = user_id);

drop policy if exists "saves_insert_own" on public.game_saves;
create policy "saves_insert_own" on public.game_saves
  for insert with check (auth.uid() = user_id);

drop policy if exists "saves_update_own" on public.game_saves;
create policy "saves_update_own" on public.game_saves
  for update using (auth.uid() = user_id);

drop policy if exists "saves_delete_own" on public.game_saves;
create policy "saves_delete_own" on public.game_saves
  for delete using (auth.uid() = user_id);
