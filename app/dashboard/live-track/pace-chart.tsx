import { niceTicks } from '@/lib/chart.ts'
import type { Progress } from '@/lib/live-track.ts'
import { formatRand } from '@/lib/money.ts'
import live from './live-track.module.css'

/**
 * November so far as a running total, against an even pace and the target, with a dashed line to month end
 * "if spending continues at this rate". Lines are SVG; dots and labels are HTML so text stays sharp.
 */
export function PaceChart({ p, points, month, summary }: { p: Progress; points: { day: number; cents: number }[]; month: string; summary: string }) {
  const ticks = niceTicks(0, Math.max(p.targetCents, p.forecastCents, p.spentCents))
  const high = ticks.at(-1)!
  const x = (day: number) => (day / p.days) * 100
  const y = (cents: number) => ((high - cents) / high) * 100
  const over = p.forecastCents > p.targetCents

  // Steps: flat until a payment day, then up by that day's spending.
  let path = `M0,${y(0)}`
  for (const point of points) path += ` H${x(point.day)} V${y(point.cents)}`
  path += ` H${x(p.day)}`

  return (
    <div className={live.plotArea} role="img" aria-label={summary}>
      <div className={live.yAxis}>
        {ticks.map((t) => (
          <span key={t} className="amount" style={{ top: `${y(t)}%` }}>
            {formatRand(t)}
          </span>
        ))}
      </div>
      <div className={live.plot}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={live.svg}>
          {ticks.map((t) => (
            <line key={t} x1="0" x2="100" y1={y(t)} y2={y(t)} className={live.grid} vectorEffect="non-scaling-stroke" />
          ))}
          <line x1="0" y1={y(0)} x2="100" y2={y(p.targetCents)} className={live.paceLine} vectorEffect="non-scaling-stroke" />
          <line x1="0" x2="100" y1={y(p.targetCents)} y2={y(p.targetCents)} className={live.targetLine} vectorEffect="non-scaling-stroke" />
          <line x1={x(p.day)} x2={x(p.day)} y1="0" y2="100" className={live.today} vectorEffect="non-scaling-stroke" />
          {/* Keyed by the forecast, so the line draws itself again whenever a payment changes it. */}
          <line
            key={p.forecastCents}
            x1={x(p.day)}
            y1={y(p.spentCents)}
            x2="100"
            y2={y(p.forecastCents)}
            className={live.forecastLine}
            data-over={over || undefined}
            vectorEffect="non-scaling-stroke"
          />
          <path d={path} className={live.spentLine} vectorEffect="non-scaling-stroke" />
        </svg>
        <span className={live.targetLabel} style={{ top: `${y(p.targetCents)}%` }}>
          Target <span className="amount">{formatRand(p.targetCents)}</span>
        </span>
        <span className={live.dot} style={{ left: `${x(p.day)}%`, top: `${y(p.spentCents)}%` }} />
        <span key={p.forecastCents} className={live.endDot} data-over={over || undefined} style={{ top: `${y(p.forecastCents)}%` }} />
      </div>
      <div className={live.xAxis}>
        <span style={{ left: '0%' }}>1 {month.slice(0, 3)}</span>
        <span style={{ left: `${x(p.day)}%` }}>Today</span>
        <span style={{ left: '100%' }}>
          {p.days} {month.slice(0, 3)}
        </span>
      </div>
    </div>
  )
}
