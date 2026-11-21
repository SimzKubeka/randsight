import { describe, expect, it } from 'vitest'
import { applySamplePayment, getLiveTrack, getMonths, getTotals, getTransactions, PAGE_SIZE, resetSimulation } from './data.ts'
import { openDb } from './db.ts'
import { monthTotals } from './insights.ts'
import { DEMO, OTHER, seed, seedLarge } from './seed.ts'
import { createSession, deleteSession, getSession } from './sessions.ts'

const db = openDb(':memory:')
seed(db)
seedLarge(db)
const idOf = (email: string) => (db.prepare('SELECT id FROM customers WHERE email = ?').get(email) as { id: number }).id
const demo = idOf(DEMO.email)
const load = idOf('load@randsight.example')

describe('getMonths', () => {
  it('lists completed months with payments, newest first', () => {
    expect(getMonths(db, demo, '2026-11')).toEqual(['2026-10', '2026-09', '2026-08', '2026-07', '2026-06', '2026-05'])
  })

  it('is scoped to the customer', () => {
    expect(getMonths(db, idOf(OTHER.email), '2026-11')).toEqual(['2026-10', '2026-09', '2026-08'])
  })
})

describe('getTransactions', () => {
  it('returns October medical payments, newest first, with notes', () => {
    const { rows, count } = getTransactions(db, demo, '2026-10', 'medical', 1)
    expect(count).toBe(3)
    expect(rows.map((r) => [r.merchant, r.amountCents, r.note])).toEqual([
      ['Kloof Pharmacy', 25000, null],
      ['Kloof Pharmacy', 40000, null],
      ['Fernwood Paediatrics', 95000, 'Six-week check-up'],
    ])
  })

  it('pages a large selection with stable order and a subtotal that matches every row', () => {
    const month = '2026-03'
    const { count } = getTransactions(db, load, month, 'groceries', 1)
    expect(count).toBeGreaterThan(PAGE_SIZE * 3)

    const seen: { id: number; postedAt: string; net: number }[] = []
    for (let page = 1; page <= Math.ceil(count / PAGE_SIZE); page++) {
      for (const r of getTransactions(db, load, month, 'groceries', page).rows) {
        seen.push({ id: r.id, postedAt: r.postedAt, net: r.kind === 'refund' ? -r.amountCents : r.amountCents })
      }
    }
    expect(new Set(seen.map((r) => r.id)).size).toBe(count)
    const sorted = [...seen].sort((a, b) => b.postedAt.localeCompare(a.postedAt) || b.id - a.id)
    expect(seen).toEqual(sorted)

    const subtotal = monthTotals(month, getTotals(db, load, month, month)).byCategory.groceries
    expect(seen.reduce((sum, r) => sum + r.net, 0)).toBe(subtotal)
  })

  it('never returns another customer’s payments', () => {
    const { rows } = getTransactions(db, idOf(OTHER.email), '2026-10', 'medical', 1)
    expect(rows.map((r) => r.merchant)).toEqual(['Kloof Pharmacy'])
    expect(rows[0]!.amountCents).toBe(12000)
  })
})

describe('getTransactions page clamping', () => {
  it('serves the last page for a page past the end, and page 1 for nonsense', () => {
    expect(getTransactions(db, demo, '2026-10', 'medical', 99)).toMatchObject({ page: 1, count: 3 })
    expect(getTransactions(db, demo, '2026-10', 'medical', -4).rows).toHaveLength(3)
  })
})

describe('Live Track', () => {
  // Real sessions: sim_events rows hang off the sessions table.
  const sessionFor = (customerId: number) => {
    const session = getSession(db, createSession(db, customerId).token)
    if (session?.status !== 'valid') throw new Error('session not created')
    return session.sessionId
  }

  it('starts from November’s R3,800 of groceries against the R6,000 target', () => {
    const live = getLiveTrack(db, demo, sessionFor(demo))!
    expect(live).toMatchObject({ targetCents: 600000, spentCents: 380000, applied: false })
    expect(live.payments.map((p) => p.merchant)).toEqual(['Marula Market', 'Marula Market', 'Marula Market', 'Marula Market'])
  })

  it('applying the sample payment twice counts it once', () => {
    const session = sessionFor(demo)
    applySamplePayment(db, session)
    applySamplePayment(db, session)
    expect(getLiveTrack(db, demo, session)).toMatchObject({ spentCents: 425000, applied: true })
    expect(db.prepare('SELECT count(*) AS n FROM sim_events WHERE session_id = ?').get(session)).toEqual({ n: 1 })
  })

  it('keeps two sessions apart, and reset restores R3,800', () => {
    const first = sessionFor(demo)
    const second = sessionFor(demo)
    applySamplePayment(db, first)
    expect(getLiveTrack(db, demo, second)?.spentCents).toBe(380000)

    resetSimulation(db, first)
    expect(getLiveTrack(db, demo, first)).toMatchObject({ spentCents: 380000, applied: false })
  })

  it('signing out removes that session’s simulation', () => {
    const { token } = createSession(db, demo)
    const session = (getSession(db, token) as { sessionId: string }).sessionId
    applySamplePayment(db, session)
    deleteSession(db, token)
    expect(db.prepare('SELECT count(*) AS n FROM sim_events WHERE session_id = ?').get(session)).toEqual({ n: 0 })
  })

  it('has nothing to show a customer without a target', () => {
    expect(getLiveTrack(db, idOf(OTHER.email), sessionFor(idOf(OTHER.email)))).toBeNull()
  })
})
