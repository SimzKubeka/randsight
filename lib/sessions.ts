import { createHash, randomBytes } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'

// Plain Node (no Next imports), so scripts such as the benchmark can create sessions too.

export const SESSION_MS = 8 * 60 * 60 * 1000

// Only a hash of the token is stored, so a leaked database holds no usable cookies.
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export function createSession(db: DatabaseSync, customerId: number, now = Date.now()) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = now + SESSION_MS
  db.prepare('INSERT INTO sessions (id, customer_id, expires_at) VALUES (?, ?, ?)').run(hashToken(token), customerId, expiresAt)
  return { token, expiresAt }
}

export type Session = { status: 'valid'; customerId: number; sessionId: string } | { status: 'expired' }

export function getSession(db: DatabaseSync, token: string, now = Date.now()): Session | null {
  const sessionId = hashToken(token)
  const row = db.prepare('SELECT customer_id, expires_at FROM sessions WHERE id = ?').get(sessionId) as
    | { customer_id: number; expires_at: number }
    | undefined
  if (!row) return null
  if (row.expires_at <= now) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId)
    return { status: 'expired' }
  }
  return { status: 'valid', customerId: row.customer_id, sessionId }
}

export function deleteSession(db: DatabaseSync, token: string) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(hashToken(token))
}

/** Read-only: the signed-in customer for display (e.g. a name in the layout). No redirect and no clean-up, so it can't race the page's own check. */
export function activeCustomerId(db: DatabaseSync, token: string, now = Date.now()): number | null {
  const row = db.prepare('SELECT customer_id FROM sessions WHERE id = ? AND expires_at > ?').get(hashToken(token), now) as
    | { customer_id: number }
    | undefined
  return row?.customer_id ?? null
}
