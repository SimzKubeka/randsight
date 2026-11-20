import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { seed } from './seed.ts'

const schema = `
CREATE TABLE IF NOT EXISTS customers (
  id            INTEGER PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  expires_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id           INTEGER PRIMARY KEY,
  customer_id  INTEGER NOT NULL REFERENCES customers(id),
  posted_at    TEXT NOT NULL,
  month        TEXT NOT NULL,
  merchant     TEXT NOT NULL,
  category     TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('income', 'spend', 'refund', 'transfer')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  note         TEXT
);
CREATE INDEX IF NOT EXISTS tx_month ON transactions (customer_id, month, posted_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS tx_category ON transactions (customer_id, month, category, posted_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS targets (
  customer_id  INTEGER NOT NULL REFERENCES customers(id),
  month        TEXT NOT NULL,
  category     TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  PRIMARY KEY (customer_id, month, category)
);

CREATE TABLE IF NOT EXISTS sim_events (
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  event_id   TEXT NOT NULL,
  applied_at INTEGER NOT NULL,
  PRIMARY KEY (session_id, event_id)
);
`

export function openDb(path: string): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;')
  db.exec(schema)
  return db
}

export const databasePath = process.env.DATABASE_PATH ?? 'data/randsight.db'

let shared: DatabaseSync | undefined

/** The app's connection. Creates and seeds the database on first use. */
export function getDb(): DatabaseSync {
  if (!shared) {
    shared = openDb(databasePath)
    seed(shared)
  }
  return shared
}
