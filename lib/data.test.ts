import { describe, expect, it } from 'vitest'
import { getMonths, getTotals, getTransactions, PAGE_SIZE } from './data.ts'
import { openDb } from './db.ts'
import { monthTotals } from './insights.ts'
import { DEMO, OTHER, seed, seedLarge } from './seed.ts'

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
