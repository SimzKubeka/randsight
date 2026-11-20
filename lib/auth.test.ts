import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { checkThrottle, recordFailure, safeNext } from './auth.ts'
import { activeCustomerId, createSession, deleteSession, getSession, SESSION_MS } from './sessions.ts'
import { openDb } from './db.ts'
import { DEMO, seed } from './seed.ts'

const db = openDb(':memory:')
seed(db)
const demo = (db.prepare('SELECT id FROM customers WHERE email = ?').get(DEMO.email) as { id: number }).id
const now = Date.parse('2026-11-20T08:00:00Z')

describe('sessions', () => {
  it('stores only a hash of the token', () => {
    const { token } = createSession(db, demo, now)
    const sha = createHash('sha256').update(token).digest('hex')
    expect(db.prepare('SELECT customer_id FROM sessions WHERE id = ?').get(sha)).toEqual({ customer_id: demo })
    expect(db.prepare('SELECT count(*) AS n FROM sessions WHERE id = ?').get(token)).toEqual({ n: 0 })
  })

  it('returns the customer for a valid token', () => {
    const { token } = createSession(db, demo, now)
    expect(getSession(db, token, now + SESSION_MS - 1)).toMatchObject({ status: 'valid', customerId: demo })
  })

  it('reports and removes an expired session', () => {
    const { token } = createSession(db, demo, now)
    expect(getSession(db, token, now + SESSION_MS)).toEqual({ status: 'expired' })
    expect(getSession(db, token, now)).toBeNull()
  })

  it('ignores unknown tokens and signs out', () => {
    expect(getSession(db, 'made-up', now)).toBeNull()
    const { token } = createSession(db, demo, now)
    deleteSession(db, token)
    expect(getSession(db, token, now)).toBeNull()
  })

  it('reads the customer for display without deleting an expired session', () => {
    const { token } = createSession(db, demo, now)
    expect(activeCustomerId(db, token, now)).toBe(demo)
    expect(activeCustomerId(db, token, now + SESSION_MS)).toBeNull()
    expect(getSession(db, token, now + SESSION_MS)).toEqual({ status: 'expired' })
  })

  it('issues a different token every time', () => {
    expect(createSession(db, demo, now).token).not.toBe(createSession(db, demo, now).token)
  })
})

describe('safeNext', () => {
  it.each([
    ['/dashboard?month=2026-10&category=medical', '/dashboard?month=2026-10&category=medical'],
    ['/dashboard/live-track', '/dashboard/live-track'],
    ['//evil.example', '/dashboard'],
    ['/\\evil.example', '/dashboard'],
    ['https://evil.example', '/dashboard'],
    ['/docs', '/dashboard'],
    ['', '/dashboard'],
    [null, '/dashboard'],
  ])('%s → %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected)
  })
})

describe('sign-in throttle', () => {
  it('blocks after five failures for fifteen minutes', () => {
    const key = 'someone@example.com|1.2.3.4'
    for (let i = 0; i < 5; i++) {
      expect(checkThrottle(key, now)).toBe(true)
      recordFailure(key, now)
    }
    expect(checkThrottle(key, now)).toBe(false)
    expect(checkThrottle('other@example.com|1.2.3.4', now)).toBe(true)
    expect(checkThrottle(key, now + 15 * 60_000)).toBe(true)
  })
})
