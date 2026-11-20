import Link from 'next/link'
import { Icon } from '@/components/icons.tsx'
import { requireSession } from '@/lib/auth.ts'
import { isCategory, rowLabel } from '@/lib/categories.ts'
import { getMonths, getTotals, getTransactions } from '@/lib/data.ts'
import { getDb } from '@/lib/db.ts'
import { describeChange, explainChange, monthTotals, type Driver } from '@/lib/insights.ts'
import { formatRand } from '@/lib/money.ts'
import { DEMO_NOW, monthLabel, monthName, monthOf, shiftMonth } from '@/lib/period.ts'
import { CategoryDetail } from './_components/category-detail.tsx'
import styles from './dashboard.module.css'
import { DetailDialog } from './_components/detail-dialog.tsx'
import { FocusReturn } from './_components/focus-return.tsx'
import { MonthPicker } from './_components/month-picker.tsx'
import { SpendingChart } from './_components/spending-chart.tsx'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const arrow = (cents: number) => (cents > 0 ? '↑' : '↓')

function ChangeLine({ cents, prev }: { cents: number; prev: string }) {
  if (cents === 0) return <p className={styles.statChange}>Same as {prev}</p>
  return (
    <p className={styles.statChange}>
      <span className={`${styles.changeValue} amount`}>
        <span aria-hidden="true">{arrow(cents)} </span>
        {formatRand(Math.abs(cents))} {cents < 0 ? 'less' : 'more'}
      </span>{' '}
      than {prev}
    </p>
  )
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (typeof value === 'string') query.set(key, value)
  const { customerId } = await requireSession(`/dashboard${query.size ? `?${query}` : ''}`)

  const db = getDb()
  const months = getMonths(db, customerId, monthOf(DEMO_NOW))
  if (!months[0]) {
    return (
      <main className={styles.page}>
        <div>
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
    <main className={styles.page}>
      <FocusReturn key={`${month}|${category}|${detail ? detail.page : 0}`} />
      <div className={styles.review}>
        <header className={styles.pageHead}>
          <div>
            <h1 className={styles.title}>Monthly review</h1>
            <p className={styles.subtitle}>What changed from one month to the next, down to the payments that made the difference.</p>
            <p className={styles.status}>
              <span className={styles.statusDot} aria-hidden="true" />
              {monthLabel(month)} · Completed month · {months.length} months of records
            </p>
          </div>
          <MonthPicker months={months} month={month} category={category} />
        </header>

        <div>
          <p className={styles.lead}>{copy ? `${copy.headline} ${copy.causes}` : 'There is no earlier month to compare with.'}</p>

          <div className={styles.stats}>
            <div className={styles.statMain}>
              <p className={`${styles.figure} amount`}>{formatRand(curr.leftOverCents)}</p>
              <p className={styles.statLabel}>Left after spending</p>
              {change && <ChangeLine cents={change.leftOverChangeCents} prev={monthName(prev.month)} />}
            </div>
            <div>
              <p className={`${styles.statFigure} amount`}>{formatRand(curr.inCents)}</p>
              <p className={styles.statLabel}>Money in</p>
              {change && <ChangeLine cents={change.inChangeCents} prev={monthName(prev.month)} />}
            </div>
            <div>
              <p className={`${styles.statFigure} amount`}>{formatRand(curr.outCents)}</p>
              <p className={styles.statLabel}>Money out</p>
              {change && <ChangeLine cents={change.outChangeCents} prev={monthName(prev.month)} />}
            </div>
          </div>

          <div className={styles.middle}>
            <section aria-labelledby="what-changed">
              <div className={styles.sectionHead}>
                <h2 id="what-changed">What changed</h2>
                {change && <span className={styles.meta}>vs {monthName(prev.month)}</span>}
              </div>
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
                        <Icon name="chevronRight" className={styles.chevron} />
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
            <div className={styles.sectionHead}>
              <h2 id="all-categories">All categories</h2>
              <span className={styles.meta}>{categories.length} categories</span>
            </div>
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
                      <Icon name="chevronRight" className={styles.chevron} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>

      {category && detail && (
        <DetailDialog
          // Closing returns to the row that opened it: a "What changed" row if there is one, otherwise the category list.
          closeHref={`/dashboard?month=${month}#${drivers.some((d) => d.key === category) ? 'change' : 'category'}-${category}`}
        >
          <CategoryDetail
            category={category}
            month={month}
            prevMonth={prev.month}
            prevCents={amountIn(prev, category)}
            currCents={amountIn(curr, category)}
            rows={detail.rows}
            count={detail.count}
            page={detail.page}
          />
        </DetailDialog>
      )}
    </main>
  )
}
