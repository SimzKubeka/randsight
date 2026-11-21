import type { DatabaseSync } from 'node:sqlite'
import { monthTotals, type Kind, type TotalRow } from './insights.ts'
import { SAMPLE_PAYMENT, TRACKED } from './live-track.ts'

// Every query is scoped by customer_id, which must come from the signed-in session.
// Live Track's simulation is scoped by session_id as well, so two reviewers never see each other's payment.

export function getCustomerName(db: DatabaseSync, customerId: number): string {
  return (db.prepare('SELECT name FROM customers WHERE id = ?').get(customerId) as { name: string }).name
}

/** Per month, category and kind sums for months from..to inclusive ('YYYY-MM'). */
export function getTotals(db: DatabaseSync, customerId: number, from: string, to: string): TotalRow[] {
  return db
    .prepare(
      `SELECT month, category, kind, SUM(amount_cents) AS cents
         FROM transactions
        WHERE customer_id = ? AND month BETWEEN ? AND ?
        GROUP BY month, category, kind`,
    )
    .all(customerId, from, to) as TotalRow[]
}

/** Months with any payments before `current` ('YYYY-MM'), newest first. */
export function getMonths(db: DatabaseSync, customerId: number, current: string): string[] {
  return (
    db
      .prepare('SELECT DISTINCT month FROM transactions WHERE customer_id = ? AND month < ? ORDER BY month DESC')
      .all(customerId, current) as { month: string }[]
  ).map((r) => r.month)
}

export const PAGE_SIZE = 20

export type Transaction = {
  id: number
  postedAt: string
  merchant: string
  kind: Kind
  amountCents: number
  note: string | null
}

/** One page (clamped to the last) of a month's payments in a category, newest first, plus the full count. */
export function getTransactions(db: DatabaseSync, customerId: number, month: string, category: string, page: number) {
  const { count } = db
    .prepare('SELECT count(*) AS count FROM transactions WHERE customer_id = ? AND month = ? AND category = ?')
    .get(customerId, month, category) as { count: number }
  const current = Math.min(Math.max(1, page), Math.max(1, Math.ceil(count / PAGE_SIZE)))
  // shortcut: OFFSET paging is fine at 50k rows per customer; switch to keyset (posted_at, id) beyond that.
  const rows = db
    .prepare(
      `SELECT id, posted_at AS postedAt, merchant, kind, amount_cents AS amountCents, note
         FROM transactions
        WHERE customer_id = ? AND month = ? AND category = ?
        ORDER BY posted_at DESC, id DESC
        LIMIT ? OFFSET ?`,
    )
    .all(customerId, month, category, PAGE_SIZE, (current - 1) * PAGE_SIZE) as Transaction[]
  return { rows, count, page: current }
}

/** Everything Live Track shows for this customer and session, or null when the customer has no target to track. */
export function getLiveTrack(db: DatabaseSync, customerId: number, sessionId: string) {
  const { month, category } = TRACKED
  const target = db
    .prepare('SELECT amount_cents AS cents FROM targets WHERE customer_id = ? AND month = ? AND category = ?')
    .get(customerId, month, category) as { cents: number } | undefined
  if (!target) return null
  // Same netting as the monthly review: refunds come off, transfers never count.
  const baseCents = monthTotals(month, getTotals(db, customerId, month, month)).byCategory[category] ?? 0
  const applied = !!db.prepare('SELECT 1 FROM sim_events WHERE session_id = ? AND event_id = ?').get(sessionId, SAMPLE_PAYMENT.id)
  return {
    targetCents: target.cents,
    spentCents: baseCents + (applied ? SAMPLE_PAYMENT.amountCents : 0),
    applied,
    payments: getTransactions(db, customerId, month, category, 1).rows,
  }
}

/** Records the sample payment for this session. The primary key makes a second apply a no-op. */
export function applySamplePayment(db: DatabaseSync, sessionId: string, now = Date.now()) {
  db.prepare('INSERT OR IGNORE INTO sim_events (session_id, event_id, applied_at) VALUES (?, ?, ?)').run(sessionId, SAMPLE_PAYMENT.id, now)
}

/** Undoes this session's simulation; other sessions are untouched. */
export function resetSimulation(db: DatabaseSync, sessionId: string) {
  db.prepare('DELETE FROM sim_events WHERE session_id = ?').run(sessionId)
}
