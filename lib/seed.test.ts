import { describe, expect, it } from 'vitest'
import { openDb } from './db.ts'
import { describeChange, explainChange, monthTotals } from './insights.ts'
import { DEMO, OTHER, seed, seedLarge } from './seed.ts'
import { getTotals } from './data.ts'

const R = (rands: number) => rands * 100

const db = openDb(':memory:')
seed(db)
const idOf = (email: string) => (db.prepare('SELECT id FROM customers WHERE email = ?').get(email) as { id: number }).id
const demo = idOf(DEMO.email)
const other = idOf(OTHER.email)
const rows = getTotals(db, demo, '2026-05', '2026-11')
const sep = monthTotals('2026-09', rows)
const oct = monthTotals('2026-10', rows)

describe('seeded demo customer', () => {
  it('matches the acceptance fixture for September and October', () => {
    const other = (t: typeof sep) => t.outCents - (t.byCategory.medical ?? 0) - (t.byCategory.groceries ?? 0)
    expect([sep.inCents, sep.byCategory.medical, sep.byCategory.groceries, other(sep), sep.outCents, sep.leftOverCents])
      .toEqual([R(30000), R(400), R(4200), R(12000), R(16600), R(13400)])
    expect([oct.inCents, oct.byCategory.medical, oct.byCategory.groceries, other(oct), oct.outCents, oct.leftOverCents])
      .toEqual([R(29400), R(1600), R(5100), R(12000), R(18700), R(10700)])
  })

  it('explains October from the database exactly as the brief words it', () => {
    const e = explainChange(sep, oct)!
    expect(e.drivers.map((d) => d.key)).toEqual(['medical', 'groceries', 'income'])
    expect(describeChange(sep, oct, e)).toEqual({
      headline: 'You had R2,700 less left over in October.',
      causes: 'R600 less came in and you spent R2,100 more than in September.',
    })
  })

  it('has six completed months of payments before November', () => {
    for (const m of ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']) {
      expect(monthTotals(m, rows).empty, m).toBe(false)
    }
  })

  it('stores months in South African time at the boundary', () => {
    const month = (at: string) => (db.prepare('SELECT month FROM transactions WHERE posted_at = ?').get(at) as { month: string }).month
    expect(month('2026-10-31T21:30:00.000Z')).toBe('2026-10') // 23:30 SAST
    expect(month('2026-10-31T22:30:00.000Z')).toBe('2026-11') // 00:30 SAST
  })

  it('includes a refund and monthly transfers that reporting handles', () => {
    expect(rows.some((r) => r.kind === 'refund')).toBe(true)
    expect(rows.filter((r) => r.kind === 'transfer')).toHaveLength(6)
  })

  it('has November to the 20th with the Live Track grocery target', () => {
    expect(monthTotals('2026-11', rows).byCategory.groceries).toBe(R(3800))
    const target = db.prepare("SELECT amount_cents FROM targets WHERE customer_id = ? AND month = '2026-11' AND category = 'groceries'").get(demo)
    expect(target).toEqual({ amount_cents: R(6000) })
    const latest = db.prepare('SELECT max(posted_at) AS at FROM transactions WHERE customer_id = ?').get(demo) as { at: string }
    expect(latest.at < '2026-11-20T08:00:00.000Z').toBe(true)
  })
})

describe('seed', () => {
  it('is idempotent', () => {
    const count = () => db.prepare('SELECT (SELECT count(*) FROM customers) AS c, (SELECT count(*) FROM transactions) AS t').get()
    const before = count()
    seed(db)
    expect(count()).toEqual(before)
  })

  it('gives the second customer separate data', () => {
    const theirs = monthTotals('2026-10', getTotals(db, other, '2026-10', '2026-10'))
    expect(theirs.empty).toBe(false)
    expect(theirs.byCategory.medical).not.toBe(R(1600))
    expect(theirs.inCents).not.toBe(oct.inCents)
  })
})

describe('seedLarge', () => {
  it('creates 50,000 deterministic transactions once', () => {
    const fingerprint = () => {
      const d = openDb(':memory:')
      seed(d)
      seedLarge(d)
      seedLarge(d)
      return d.prepare("SELECT count(*) AS n, sum(amount_cents) AS total, max(posted_at) AS last FROM transactions t JOIN customers c ON c.id = t.customer_id WHERE c.email = 'load@randsight.example'").get()
    }
    const a = fingerprint()
    expect(a).toMatchObject({ n: 50000 })
    expect(fingerprint()).toEqual(a)
  })
})
