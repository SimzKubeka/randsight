import type { DatabaseSync } from 'node:sqlite'
import type { Kind, TotalRow } from './insights.ts'

// Every query is scoped by customer_id, which must come from the signed-in session.

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
