import Link from 'next/link'
import { requireSession } from '@/lib/auth.ts'
import { isCategory, rowLabel } from '@/lib/categories.ts'
import { getMonths, getTotals, getTransactions } from '@/lib/data.ts'
import { getDb } from '@/lib/db.ts'
import { describeChange, explainChange, monthTotals, type Driver } from '@/lib/insights.ts'
import { formatRand } from '@/lib/money.ts'
import { DEMO_NOW, monthName, monthOf, shiftMonth } from '@/lib/period.ts'
import { CategoryDetail } from './category-detail.tsx'
import styles from './dashboard.module.css'
import { FocusReturn } from './focus-return.tsx'
import { MonthPicker } from './month-picker.tsx'
import { SpendingChart } from './spending-chart.tsx'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const arrow = (cents: number) => (cents > 0 ? '↑' : '↓')

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (typeof value === 'string') query.set(key, value)
  const { customerId } = await requireSession(`/dashboard${query.size ? `?${query}` : ''}`)

  const db = getDb()
  const months = getMonths(db, customerId, monthOf(DEMO_NOW))
  if (!months[0]) {
    return (
      <main className={`container ${styles.page}`}>
        <div className="surface">
          <h1 className={styles.title}>Monthly review</h1>
          <p>No payments recorded yet.</p>
        </div>
      </main>
    )
  }

  // Unknown or out-of-range values fall back to the latest completed month and no category.
  const month = typeof params.month === 'string' && months.includes(params.month) ? params.month : months[0]
  const category = isCategory(params.category) ? params.category : null

  const window = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5))
  const totalRows = getTotals(db, customerId, window[0]!, month)
  const totals = window.map((m) => monthTotals(m, totalRows))
  const curr = totals[5]!
  const prev = totals[4]!
  const change = explainChange(prev, curr)
  const copy = change && describeChange(prev, curr, change)

  // Salary first, then the three biggest spending changes.
  const drivers: Driver[] = change
    ? [...change.drivers.filter((d) => d.key === 'income'), ...change.drivers.filter((d) => d.key !== 'income').slice(0, 3)]
    : []
  const categories = [...new Set([...Object.keys(prev.byCategory), ...Object.keys(curr.byCategory)])]
    .filter(isCategory)
    .sort((a, b) => (curr.byCategory[b] ?? 0) - (curr.byCategory[a] ?? 0))
  const amountIn = (t: typeof curr, key: string) => (key === 'income' ? t.inCents : (t.byCategory[key] ?? 0))
  const detailHref = (key: string) => `/dashboard?month=${month}&category=${key}#detail`
  const detail = category && getTransactions(db, customerId, month, category, Number(params.page) || 1)

  return (
    <main className={`container ${styles.page}`}>
      <FocusReturn key={`${month}|${category}|${detail ? detail.page : 0}`} />
      <div className={`surface ${styles.review}`} data-detail={category ? '' : undefined}>
        <div className={styles.titleRow}>
          {category ? <p className={styles.title}>Monthly review</p> : <h1 className={styles.title}>Monthly review</h1>}
          <MonthPicker months={months} month={month} category={category} />
        </div>

        <div className={styles.overview}>
          <div className={styles.result}>
            <p className={styles.figureBlock}>
              <span className={`${styles.figure} amount`}>{formatRand(curr.leftOverCents)}</span>
              <span className={styles.figureLabel}>Left after spending</span>
            </p>
            {change && (
              <p className={styles.change}>
                {change.leftOverChangeCents === 0 ? (
                  <span className={styles.changeAmount}>The same</span>
                ) : (
                  <span className={`${styles.changeAmount} amount`}>
                    <span aria-hidden="true">{arrow(change.leftOverChangeCents)} </span>
                    {formatRand(Math.abs(change.leftOverChangeCents))} {change.leftOverChangeCents < 0 ? 'less' : 'more'}
                  </span>
                )}
                <span className={styles.changeText}>
                  {change.leftOverChangeCents === 0 ? 'as' : 'than'} {monthName(prev.month)}
                </span>
              </p>
            )}
          </div>

          <div className={styles.middle}>
            <section aria-labelledby="what-changed">
              <h2 id="what-changed">What changed</h2>
              {copy ? (
                <p className={styles.muted}>
                  {copy.headline} {copy.causes}
                </p>
              ) : (
                <p className={styles.muted}>There is no earlier month to compare with.</p>
              )}
              {drivers.length > 0 && (
                <ul aria-labelledby="what-changed" className={styles.rows}>
                  {drivers.map((d) => (
                    <li key={d.key}>
                      <Link
                        href={detailHref(d.key)}
                        id={`change-${d.key}`}
                        data-return-focus
                        className={styles.row}
                      >
                        <span className={styles.rowLabel}>{rowLabel(d.key)}</span>{' '}
                        <span className={`${styles.rowChange} amount`}>
                          <span aria-hidden="true">{arrow(d.changeCents)}</span> {formatRand(Math.abs(d.changeCents))}
                          {/* Spoken after the visible text, so voice control can still say what's on screen. */}
                          <span className="sr-only"> {d.changeCents > 0 ? 'increase' : 'decrease'}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <SpendingChart
              points={totals.filter((t) => !t.empty).map((t) => ({ month: t.month, cents: t.outCents }))}
              selected={month}
            />
          </div>
        </div>

        <div className={styles.bottom}>
          <section aria-labelledby="all-categories" className={styles.categories}>
            <h2 id="all-categories">All categories</h2>
            <ul aria-labelledby="all-categories" className={styles.rows}>
              {categories.map((key) => {
                const diff = (curr.byCategory[key] ?? 0) - (prev.byCategory[key] ?? 0)
                const words = prev.empty
                  ? ''
                  : diff === 0
                    ? `Same as ${monthName(prev.month)}`
                    : `${formatRand(Math.abs(diff))} ${diff > 0 ? 'more' : 'less'} than ${monthName(prev.month)}`
                return (
                  <li key={key}>
                    <Link
                      href={detailHref(key)}
                      id={`category-${key}`}
                      data-return-focus
                      className={styles.row}
                      aria-current={key === category ? 'true' : undefined}
                    >
                      <span className={styles.rowLabel}>{rowLabel(key)}</span>
                      <span className={styles.rowValues}>
                        <span className="amount">{formatRand(curr.byCategory[key] ?? 0)}</span>
                        {words && <span className={`${styles.muted} amount`}>{words}</span>}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>

          {category && detail ? (
            <CategoryDetail
              category={category}
              month={month}
              prevMonth={prev.month}
              prevCents={amountIn(prev, category)}
              currCents={amountIn(curr, category)}
              returnId={drivers.some((d) => d.key === category) ? `change-${category}` : `category-${category}`}
              rows={detail.rows}
              count={detail.count}
              page={detail.page}
            />
          ) : (
            <p className={styles.detailHint}>Choose a category to see its payments.</p>
          )}
        </div>
      </div>
    </main>
  )
}
