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
  /** Days after today left in the month. */
  daysLeft: number
  /** What can be spent each remaining day and still finish within the target; 0 once it's used up. */
  dailyAllowanceCents: number
  /** Month-end total if spending continues at this month's average daily rate, to the nearest rand. An estimate, never a promise. */
  forecastCents: number
}

export function progress(targetCents: number, spentCents: number, nowIso: string): Progress {
  const day = dayOfMonth(nowIso)
  const days = daysInMonth(monthOf(nowIso))
  const paceCents = Math.round((targetCents * day) / days)
  const remainingCents = targetCents - spentCents
  const daysLeft = days - day
  return {
    targetCents,
    spentCents,
    remainingCents,
    overTarget: spentCents > targetCents,
    paceCents,
    paceDeltaCents: spentCents - paceCents,
    day,
    days,
    daysLeft,
    dailyAllowanceCents: remainingCents > 0 && daysLeft > 0 ? Math.floor(remainingCents / daysLeft) : 0,
    forecastCents: Math.round((spentCents * days) / day / 100) * 100,
  }
}

type Spending = { postedAt: string; kind: string; amountCents: number }

/** Running total by day of the month (South African time), refunds coming off; one point per day with payments. */
export function cumulative(payments: Spending[]): { day: number; cents: number }[] {
  const byDay = new Map<number, number>()
  for (const p of payments) {
    const d = dayOfMonth(p.postedAt)
    byDay.set(d, (byDay.get(d) ?? 0) + (p.kind === 'refund' ? -p.amountCents : p.amountCents))
  }
  let total = 0
  return [...byDay.entries()].sort(([a], [b]) => a - b).map(([day, cents]) => ({ day, cents: (total += cents) }))
}
