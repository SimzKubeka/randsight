import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDb } from './db.ts'
import { getSession } from './sessions.ts'

export const SESSION_COOKIE = 'rs_session'

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
