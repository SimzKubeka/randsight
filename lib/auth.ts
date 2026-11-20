import { createHash, randomBytes } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDb } from './db.ts'

export const SESSION_COOKIE = 'rs_session'
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

/** Only same-site dashboard paths; anything else could be an open redirect. */
export function safeNext(value: unknown): string {
  return typeof value === 'string' && /^\/dashboard(?:[/?]|$)/.test(value) ? value : '/dashboard'
}

/** The signed-in customer, or a redirect to sign-in that returns to `path` afterwards. */
export async function requireSession(path: string) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = token ? getSession(getDb(), token) : null
  if (session?.status === 'valid') return session
  redirect(`/sign-in?next=${encodeURIComponent(path)}${session?.status === 'expired' ? '&expired=1' : ''}`)
}

// shortcut: per-process memory, move to a shared store when running more than one instance.
const failures = new Map<string, { count: number; since: number }>()
const WINDOW_MS = 15 * 60_000

/** True while the key has fewer than five failed sign-ins in the last fifteen minutes. */
export function checkThrottle(key: string, now = Date.now()): boolean {
  const entry = failures.get(key)
  if (entry && now - entry.since >= WINDOW_MS) failures.delete(key)
  return (failures.get(key)?.count ?? 0) < 5
}

export function recordFailure(key: string, now = Date.now()) {
  const entry = failures.get(key)
  failures.set(key, entry ? { ...entry, count: entry.count + 1 } : { count: 1, since: now })
}

export const clearFailures = (key: string) => failures.delete(key)
