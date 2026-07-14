import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DATABASE_PATH ?? './data/uplore.db'

// Ensure the data directory exists
const dir = path.dirname(DB_PATH)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

// Singleton — reuse the same connection across hot-reloads in dev
const globalForDb = globalThis as typeof globalThis & { _uploreDb?: Database.Database }

function openDb(): Database.Database {
  if (globalForDb._uploreDb) return globalForDb._uploreDb

  const db = new Database(DB_PATH)

  // Performance settings
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Schema initialisation — all tables from spec §4
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      provider     TEXT NOT NULL,
      provider_id  TEXT NOT NULL,
      username     TEXT,
      display_name TEXT,
      avatar_url   TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (provider, provider_id)
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id  INTEGER NOT NULL REFERENCES users(id),
      body       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS idea_archive_log (
      idea_id     INTEGER PRIMARY KEY REFERENCES ideas(id) ON DELETE CASCADE,
      archived_by INTEGER NOT NULL REFERENCES users(id),
      archived_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS idea_images (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      idea_id  INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      url      TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS votes (
      idea_id    INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      value      INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (idea_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS reactions (
      idea_id    INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      emoji      TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (idea_id, user_id, emoji)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      idea_id    INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      author_id  INTEGER NOT NULL REFERENCES users(id),
      body       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  globalForDb._uploreDb = db
  return db
}

export const db = openDb()
