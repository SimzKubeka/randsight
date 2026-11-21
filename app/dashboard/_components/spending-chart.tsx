import { niceTicks } from '@/lib/chart.ts'
import { formatRand } from '@/lib/money.ts'
import { monthLabel, monthName } from '@/lib/period.ts'
import styles from '../dashboard.module.css'
import { ViewSwitch } from './view-switch.tsx'

type Point = { month: string; cents: number }

const shortMonth = new Intl.DateTimeFormat('en-ZA', { timeZone: 'UTC', month: 'short' })

function summarise(points: Point[], selected: number): string {
  const curr = points[selected]!
  const prev = points[selected - 1]
  if (!prev) return `You spent ${formatRand(curr.cents)} in ${monthName(curr.month)}.`
  if (prev.cents === curr.cents) return `Spending stayed at ${formatRand(curr.cents)} in ${monthName(prev.month)} and ${monthName(curr.month)}.`
  const verb = curr.cents > prev.cents ? 'rose' : 'fell'
  return `Spending ${verb} from ${formatRand(prev.cents)} in ${monthName(prev.month)} to ${formatRand(curr.cents)} in ${monthName(curr.month)}.`
}

/** Line chart of money out per month, switchable to a table of the same numbers. Lines are SVG; points and labels are HTML so text stays readable at any width. */
export function SpendingChart({ points, selected }: { points: Point[]; selected: string }) {
  const values = points.map((p) => p.cents)
  const ticks = niceTicks(Math.min(...values), Math.max(...values))
  const low = ticks[0]!
  const high = ticks.at(-1)!
  const x = (i: number) => (points.length === 1 ? 50 : 4 + (i * 92) / (points.length - 1))
  const y = (cents: number) => ((high - cents) / (high - low)) * 100
  const index = points.findIndex((p) => p.month === selected)
  const current = points[index]!

  const chart = (
    <div className={styles.plotArea} role="img" aria-labelledby="spending-title" aria-describedby="spending-summary">
      <div className={styles.yAxis}>
        {ticks.map((t) => (
          <span key={t} className="amount" style={{ top: `${y(t)}%` }}>
            {formatRand(t)}
          </span>
        ))}
      </div>
      <div className={styles.plot}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.svg}>
          {ticks.map((t) => (
            <line key={t} x1="0" x2="100" y1={y(t)} y2={y(t)} className={styles.grid} vectorEffect="non-scaling-stroke" />
          ))}
          <polyline points={points.map((p, i) => `${x(i)},${y(p.cents)}`).join(' ')} className={styles.line} vectorEffect="non-scaling-stroke" />
        </svg>
        {points.map((p, i) => (
          <span
            key={p.month}
            className={styles.point}
            data-selected={p.month === selected || undefined}
            style={{ left: `${x(i)}%`, top: `${y(p.cents)}%` }}
          />
        ))}
        <span className={`${styles.callout} amount`} data-end={x(index) > 70 || undefined} style={{ left: `${x(index)}%`, top: `${y(current.cents)}%` }}>
          {monthName(current.month)} {formatRand(current.cents)}
        </span>
      </div>
      <div className={styles.xAxis}>
        {points.map((p, i) => (
          <span key={p.month} style={{ left: `${x(i)}%` }}>
            {shortMonth.format(new Date(`${p.month}-01T00:00:00Z`))}
          </span>
        ))}
      </div>
    </div>
  )

  const table = (
    <table className={styles.table}>
      <caption className="sr-only">Monthly spending</caption>
      <thead>
        <tr>
          <th scope="col">Month</th>
          <th scope="col">Spending</th>
        </tr>
      </thead>
      <tbody>
        {points.map((p) => (
          <tr key={p.month} data-selected={p.month === selected || undefined}>
            <th scope="row">{monthLabel(p.month)}</th>
            <td className="amount">{formatRand(p.cents)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <section className={styles.chart} aria-labelledby="spending-title">
      <div className={styles.sectionHead}>
        <h2 id="spending-title">Monthly spending</h2>
        <span className={styles.meta}>
          {shortMonth.format(new Date(`${points[0]!.month}-01T00:00:00Z`))} – {shortMonth.format(new Date(`${current.month}-01T00:00:00Z`))}
        </span>
      </div>
      <p id="spending-summary" className={styles.muted}>
        {summarise(points, index)}
      </p>
      <ViewSwitch label="Show spending as" chart={chart} table={table} />
    </section>
  )
}
