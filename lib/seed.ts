import type { DatabaseSync } from 'node:sqlite'
import type { Kind } from './insights.ts'
import { hashPassword } from './password.ts'
import { monthOf } from './period.ts'

// Fictional customers. The demo credentials are public on purpose.
export const DEMO = { email: 'thandi@randsight.example', name: 'Thandi', password: 'hindsight-demo' }
export const OTHER = { email: 'sam@randsight.example', name: 'Sam', password: 'isolation-demo' }
const LOAD = { email: 'load@randsight.example', name: 'Load test', password: 'load-test-demo' }

/** [SAST 'YYYY-MM-DD HH:mm', merchant, category, kind, rands, note] */
type Payment = [string, string, string, Kind, number, string?]

function thandi(): Payment[] {
  const p: Payment[] = []
  const salary: Record<string, number> = { '05': 30000, '06': 30000, '07': 30000, '08': 30000, '09': 30000, '10': 29400 }
  // Varying lines per month. Sep and Oct are the brief's acceptance fixture.
  const groceries: Record<string, number[]> = {
    '05': [980, 1020, 950, 1050], '06': [1000, 990, 1060, 1010], '07': [1040, 1000, 1080, 1020],
    '08': [1100, 1050, 1150, 1000], '09': [1050, 1050, 1050, 1050], '10': [1050, 1050, 1050, 1050],
  }
  const eatingOut: Record<string, number[]> = {
    '05': [700, 850, 600], '06': [900, 700], '07': [650, 800, 500], '08': [400], '09': [600, 600, 600], '10': [600, 600, 600],
  }

  for (const m of ['05', '06', '07', '08', '09', '10', '11']) {
    const day = (d: number, time = '09:00') => `2026-${m}-${String(d).padStart(2, '0')} ${time}`
    const upToDemoDay = (d: number) => m !== '11' || d <= 19 // November runs to the demo clock, 20 Nov

    p.push([day(1, '07:00'), 'Harbourview Lettings', 'housing', 'spend', 6500])
    p.push([day(3), 'Metro Utilities', 'utilities', 'spend', 1200])
    p.push([day(5), 'Linkwave Fibre', 'utilities', 'spend', 500])
    for (const d of [4, 11, 18, 24]) if (upToDemoDay(d)) p.push([day(d, '17:30'), 'Highway Fuels', 'transport', 'spend', 500])
    if (m === '11') continue

    p.push([day(25, '08:00'), 'Karoo Logistics salary', 'income', 'income', salary[m]!])
    p.push([day(26, '10:00'), 'Transfer to savings', 'transfer', 'transfer', 3000])
    groceries[m]!.forEach((r, i) => p.push([day(6 + i * 7, '11:00'), 'Marula Market', 'groceries', 'spend', r]))
    const meals = eatingOut[m]!
    meals.forEach((r, i) => {
      // The last October meal is 23:30 SAST on 31 Oct: still October, though 21:30 UTC.
      const at = m === '10' && i === meals.length - 1 ? '2026-10-31 23:30' : day(9 + i * 10, '19:30')
      p.push([at, i === meals.length - 1 ? 'Midnight Slice' : 'Tin Roof Kitchen', 'eating-out', 'spend', r])
    })
  }

  p.push(
    ['2026-05-14 10:15', 'Kloof Pharmacy', 'medical', 'spend', 180],
    ['2026-07-16 08:30', 'Fernwood Clinic', 'medical', 'spend', 650, 'Antenatal visit'],
    ['2026-08-22 12:00', 'Fernwood Clinic', 'medical', 'spend', 2300, 'Hospital co-payment for the birth'],
    ['2026-08-15 14:00', 'Marula Market', 'groceries', 'refund', 200],
    ['2026-09-12 16:00', 'Kloof Pharmacy', 'medical', 'spend', 400],
    ['2026-10-07 09:30', 'Fernwood Paediatrics', 'medical', 'spend', 950, 'Six-week check-up'],
    ['2026-10-07 10:20', 'Kloof Pharmacy', 'medical', 'spend', 400],
    ['2026-10-21 15:10', 'Kloof Pharmacy', 'medical', 'spend', 250],
    ['2026-10-09 18:00', 'Marula Market', 'groceries', 'spend', 450, 'Formula'],
    ['2026-10-23 18:00', 'Marula Market', 'groceries', 'spend', 450, 'Formula'],
    // November to date: R3,800 on groceries against a R6,000 target.
    ['2026-11-01 00:30', 'Midnight Slice', 'eating-out', 'spend', 300],
    ['2026-11-06 11:00', 'Marula Market', 'groceries', 'spend', 1050],
    ['2026-11-13 11:00', 'Marula Market', 'groceries', 'spend', 1150],
    ['2026-11-17 11:00', 'Marula Market', 'groceries', 'spend', 1150],
    ['2026-11-19 18:00', 'Marula Market', 'groceries', 'spend', 450, 'Formula'],
  )
  return p
}

function sam(): Payment[] {
  return ['08', '09', '10'].flatMap((m): Payment[] => [
    [`2026-${m}-01 08:00`, 'Cedar Court Rentals', 'housing', 'spend', 11000],
    [`2026-${m}-12 12:00`, 'Marula Market', 'groceries', 'spend', 3000],
    [`2026-${m}-18 09:00`, 'Kloof Pharmacy', 'medical', 'spend', 120],
    [`2026-${m}-25 08:00`, 'Bluegum Studios salary', 'income', 'income', 42000],
  ])
}

function insertCustomer(db: DatabaseSync, c: { email: string; name: string; password: string }): number {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO customers (email, name, password_hash) VALUES (?, ?, ?)')
    .run(c.email, c.name, hashPassword(c.password))
  return Number(lastInsertRowid)
}

function insertPayments(db: DatabaseSync, customerId: number, payments: Payment[]) {
  const insert = db.prepare(
    `INSERT INTO transactions (customer_id, posted_at, month, merchant, category, kind, amount_cents, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  for (const [when, merchant, category, kind, rands, note] of payments) {
    const postedAt = new Date(`${when.replace(' ', 'T')}:00+02:00`).toISOString()
    insert.run(customerId, postedAt, monthOf(postedAt), merchant, category, kind, Math.round(rands * 100), note ?? null)
  }
}

function inTransaction(db: DatabaseSync, work: () => void) {
  db.exec('BEGIN')
  try {
    work()
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

const exists = (db: DatabaseSync, email: string) => !!db.prepare('SELECT 1 FROM customers WHERE email = ?').get(email)

/** Demo and isolation customers. Does nothing if already seeded. */
export function seed(db: DatabaseSync) {
  if (exists(db, DEMO.email)) return
  inTransaction(db, () => {
    const demo = insertCustomer(db, DEMO)
    insertPayments(db, demo, thandi())
    db.prepare("INSERT INTO targets (customer_id, month, category, amount_cents) VALUES (?, '2026-11', 'groceries', ?)").run(demo, 600000)
    insertPayments(db, insertCustomer(db, OTHER), sam())
  })
}

/** 50,000 deterministic payments over Jan 2025 – Oct 2026 for scale tests. Does nothing if already seeded. */
export function seedLarge(db: DatabaseSync) {
  if (exists(db, LOAD.email)) return
  let state = 1
  const next = (n: number) => (state = (state * 48271) % 2147483647) % n // Park–Miller PRNG
  const merchants: [string, string][] = [
    ['Marula Market', 'groceries'], ['Highway Fuels', 'transport'], ['Tin Roof Kitchen', 'eating-out'],
    ['Kloof Pharmacy', 'medical'], ['Metro Utilities', 'utilities'], ['Harbourview Lettings', 'housing'],
  ]
  const start = Date.parse('2025-01-01T00:00:00+02:00')
  const span = Date.parse('2026-11-01T00:00:00+02:00') - start
  const payments: Payment[] = Array.from({ length: 50000 }, () => {
    const at = new Date(start + next(span / 60000) * 60000 + 2 * 3600000).toISOString().slice(0, 16).replace('T', ' ')
    const roll = next(100)
    if (roll < 2) return [at, 'Monthly salary', 'income', 'income', 20000 + next(20000)]
    if (roll < 4) return [at, 'Transfer to savings', 'transfer', 'transfer', 500 + next(3000)]
    const [merchant, category] = merchants[next(merchants.length)]!
    return [at, merchant, category, roll < 6 ? 'refund' : 'spend', 10 + next(2000) + next(100) / 100]
  })
  inTransaction(db, () => insertPayments(db, insertCustomer(db, LOAD), payments))
}
