import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function resolveDbPath(): string {
  return process.env.DATABASE_PATH ?? path.join(__dirname, '..', 'data', 'worldcup.db')
}

export function getDb(): Database.Database {
  const dbPath = resolveDbPath()
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  initSchema(db)
  return db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS nations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      flag TEXT NOT NULL DEFAULT '',
      confederation TEXT NOT NULL DEFAULT '',
      tier TEXT NOT NULL DEFAULT 'B',
      archetype TEXT NOT NULL DEFAULT 'balanced',
      colors_json TEXT NOT NULL DEFAULT '[]',
      is_host INTEGER NOT NULL DEFAULT 0,
      debut_2026 INTEGER NOT NULL DEFAULT 0,
      is_wc INTEGER NOT NULL DEFAULT 1,
      is_playable INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nation_id TEXT NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      photo_url TEXT NOT NULL DEFAULT '',
      pace INTEGER NOT NULL,
      shoot INTEGER NOT NULL,
      pass INTEGER NOT NULL,
      defend INTEGER NOT NULL,
      squad_rank INTEGER,
      is_legend INTEGER NOT NULL DEFAULT 0,
      UNIQUE(nation_id, name, is_legend)
    );

    CREATE INDEX IF NOT EXISTS idx_players_nation ON players(nation_id);
    CREATE INDEX IF NOT EXISTS idx_players_rank ON players(nation_id, squad_rank);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_saves (
      session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
      hall_of_legends INTEGER NOT NULL DEFAULT 0,
      screen TEXT,
      run_json TEXT,
      last_battle_json TEXT,
      pending_fight_json TEXT,
      updated_at INTEGER NOT NULL
    );
  `)
}

export const DB_PATH = resolveDbPath()
