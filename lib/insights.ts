import { formatRand } from './money.ts'
import { monthName } from './period.ts'

export type Kind = 'income' | 'spend' | 'refund' | 'transfer'

/** One aggregated line per month, category and kind, as the database returns it. */
export type TotalRow = { month: string; category: string; kind: Kind; cents: number }

export type MonthTotals = {
  month: string
  inCents: number
  outCents: number
  leftOverCents: number
  /** Net spending per category: spend minus refunds. */
  byCategory: Record<string, number>
  empty: boolean
}

export type Driver = {
  key: string // 'income' or a category
  previousCents: number
  currentCents: number
  changeCents: number
  /** What this line did to money left over: income counts as-is, spending counts against. */
  effectCents: number
  isNew: boolean
}

export type Explanation = {
  inChangeCents: number
  outChangeCents: number
  leftOverChangeCents: number
  /** Every line that changed, largest effect first. Effects sum to leftOverChangeCents. */
  drivers: Driver[]
}

export function monthTotals(month: string, rows: TotalRow[]): MonthTotals {
  const own = rows.filter((r) => r.month === month)
  let inCents = 0
  const byCategory: Record<string, number> = {}
  for (const r of own) {
    if (r.kind === 'income') inCents += r.cents
    else if (r.kind !== 'transfer') byCategory[r.category] = (byCategory[r.category] ?? 0) + (r.kind === 'refund' ? -r.cents : r.cents)
  }
  const outCents = Object.values(byCategory).reduce((sum, c) => sum + c, 0)
  return { month, inCents, outCents, leftOverCents: inCents - outCents, byCategory, empty: own.length === 0 }
}

/** Compare a month with the one before it. Null when either side has nothing to compare. */
export function explainChange(prev: MonthTotals | null, curr: MonthTotals): Explanation | null {
  if (!prev || prev.empty || curr.empty) return null

  const line = (key: string, previousCents: number, currentCents: number, sign: 1 | -1): Driver => ({
    key,
    previousCents,
    currentCents,
    changeCents: currentCents - previousCents,
    effectCents: sign * (currentCents - previousCents),
    isNew: previousCents === 0 && currentCents !== 0,
  })

  const categories = new Set([...Object.keys(prev.byCategory), ...Object.keys(curr.byCategory)])
  const drivers = [
    line('income', prev.inCents, curr.inCents, 1),
    ...[...categories].map((c) => line(c, prev.byCategory[c] ?? 0, curr.byCategory[c] ?? 0, -1)),
  ]
    .filter((d) => d.changeCents !== 0)
    .sort((a, b) => Math.abs(b.effectCents) - Math.abs(a.effectCents) || a.key.localeCompare(b.key))

  return {
    inChangeCents: curr.inCents - prev.inCents,
    outChangeCents: curr.outCents - prev.outCents,
    leftOverChangeCents: curr.leftOverCents - prev.leftOverCents,
    drivers,
  }
}

/** The two sentences that lead the dashboard. */
export function describeChange(prev: MonthTotals, curr: MonthTotals, e: Explanation) {
  const thisMonth = monthName(curr.month)
  const lastMonth = monthName(prev.month)
  const amount = (cents: number) => formatRand(Math.abs(cents))

  const headline =
    e.leftOverChangeCents === 0
      ? `You had the same left over in ${thisMonth} as in ${lastMonth}.`
      : `You had ${amount(e.leftOverChangeCents)} ${e.leftOverChangeCents < 0 ? 'less' : 'more'} left over in ${thisMonth}.`

  const moneyIn =
    e.inChangeCents === 0
      ? 'Money in was unchanged'
      : `${amount(e.inChangeCents)} ${e.inChangeCents < 0 ? 'less' : 'more'} came in`

  const moneyOut =
    e.outChangeCents === 0
      ? `you spent the same as in ${lastMonth}`
      : `you spent ${amount(e.outChangeCents)} ${e.outChangeCents > 0 ? 'more' : 'less'} than in ${lastMonth}`

  return { headline, causes: `${moneyIn} and ${moneyOut}.` }
}
