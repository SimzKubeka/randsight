import type { DatabaseSync } from 'node:sqlite'
import type { TotalRow } from './insights.ts'

// Every query is scoped by customer_id, which must come from the signed-in session.

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
