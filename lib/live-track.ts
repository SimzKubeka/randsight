import { monthOf, TIME_ZONE } from './period.ts'

// Live Track: this month's spending in one category against a target, on the fixed demo clock (period.ts DEMO_NOW).

/** The month and category Live Track follows. The demo customer has a R6,000 grocery target for it. */
export const TRACKED = { month: '2026-11', category: 'groceries' } as const

/** The simulated bank feed's one payment. Applying it is recorded per session, so reviewers never see each other's. */
export const SAMPLE_PAYMENT = {
  id: 'nov-groceries-450',
  postedAt: '2026-11-20T07:45:00.000Z', // 09:45 SAST, just before the demo clock
  merchant: 'Marula Market',
  amountCents: 45000,
} as const

const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, day: 'numeric' })

/** Day of the month in South African time. */
export const dayOfMonth = (isoUtc: string) => Number(dayKey.format(new Date(isoUtc)))

/** '2026-11' → 30 */
export function daysInMonth(month: string): number {
  const [year, m] = month.split('-').map(Number)
  return new Date(Date.UTC(year!, m!, 0)).getUTCDate()
}

export type Progress = {
  targetCents: number
  spentCents: number
  /** Negative once spending passes the target. */
  remainingCents: number
  overTarget: boolean
  /** Straight-line share of the target by today: target × day ÷ days in month. */
  paceCents: number
  /** Spent minus pace: negative is below an even pace, positive above. */
  paceDeltaCents: number
  day: number
  days: number
}

export function progress(targetCents: number, spentCents: number, nowIso: string): Progress {
  const day = dayOfMonth(nowIso)
  const days = daysInMonth(monthOf(nowIso))
  const paceCents = Math.round((targetCents * day) / days)
  return {
    targetCents,
    spentCents,
    remainingCents: targetCents - spentCents,
    overTarget: spentCents > targetCents,
    paceCents,
    paceDeltaCents: spentCents - paceCents,
    day,
    days,
  }
}
