import { LiveFigure, SimulationControls } from '@/app/dashboard/_components/live-controls.tsx'
import { requireSession } from '@/lib/auth.ts'
import { getLiveTrack } from '@/lib/data.ts'
import { getDb } from '@/lib/db.ts'
import { progress, SAMPLE_PAYMENT, TRACKED } from '@/lib/live-track.ts'
import { formatRand } from '@/lib/money.ts'
import { DEMO_NOW, monthName, TIME_ZONE } from '@/lib/period.ts'
import styles from '../dashboard.module.css'
import { applySample, resetSample } from './actions.ts'
import live from './live-track.module.css'

export const metadata = { title: 'Live Track' }

const day = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'short' })
const today = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'long' }).format(new Date(DEMO_NOW))
const month = monthName(TRACKED.month)

export default async function LiveTrackPage() {
  const { customerId, sessionId } = await requireSession('/dashboard/live-track')
  const track = getLiveTrack(getDb(), customerId, sessionId)

  return (
    <main id="main" className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Live Track</h1>
          <p className={styles.subtitle}>How {month}’s grocery spending is going against your target.</p>
          <p className={styles.status}>
            <span className={styles.statusDot} aria-hidden="true" />
            Simulated bank feed · {today} 2026
          </p>
        </div>
      </header>

      {track ? <Tracker track={track} /> : <p className={styles.lead}>You haven’t set a spending target for {month} yet.</p>}
    </main>
  )
}

function Tracker({ track }: { track: NonNullable<ReturnType<typeof getLiveTrack>> }) {
  const p = progress(track.targetCents, track.spentCents, DEMO_NOW)
  const filled = Math.min(1, p.spentCents / p.targetCents)
  const pace =
    p.paceDeltaCents === 0
      ? `Exactly on an even pace for ${today}`
      : `${formatRand(Math.abs(p.paceDeltaCents))} ${p.paceDeltaCents < 0 ? 'below' : 'above'} an even pace for ${today}`
  const payments = [
    ...(track.applied
      ? [{ id: 0, merchant: SAMPLE_PAYMENT.merchant, postedAt: SAMPLE_PAYMENT.postedAt, amountCents: SAMPLE_PAYMENT.amountCents, note: null, isNew: true }]
      : []),
    ...track.payments.map((r) => ({ ...r, isNew: false })),
  ]

  return (
    <>
      <section aria-label="This month so far" className={live.summary}>
        <LiveFigure value={p.remainingCents}>
          <p className={`${styles.figure} amount`}>{formatRand(Math.abs(p.remainingCents))}</p>
          <p className={styles.statLabel}>{p.overTarget ? `Over your grocery target for ${month}` : `Left to spend on groceries in ${month}`}</p>
        </LiveFigure>

        {/* The line is a picture of the sentence under it, so it is hidden from screen readers. */}
        <div className={live.track} data-over={p.overTarget || undefined} aria-hidden="true">
          <span style={{ transform: `scaleX(${filled})` }} />
        </div>
        <p className={live.spent}>
          <span className="amount">{formatRand(p.spentCents)}</span> of <span className="amount">{formatRand(p.targetCents)}</span> spent
        </p>

        <p className={live.pace}>{pace}</p>
        <details className={live.basis}>
          <summary>How is this worked out?</summary>
          <p>
            An even pace through day {p.day} of {p.days} is <span className="amount">{formatRand(p.paceCents)}</span>: your{' '}
            {formatRand(p.targetCents)} target × {p.day} ÷ {p.days}. It shows how this month is going, not a forecast.
          </p>
        </details>

        <SimulationControls
          applied={track.applied}
          label={`Apply sample payment · ${formatRand(SAMPLE_PAYMENT.amountCents)} at ${SAMPLE_PAYMENT.merchant}`}
          apply={applySample}
          reset={resetSample}
        />
      </section>

      <section aria-labelledby="payments-title" className={live.payments}>
        <div className={styles.sectionHead}>
          <h2 id="payments-title">{month} groceries</h2>
          <span className={styles.meta}>{payments.length} payments</span>
        </div>
        <ul aria-labelledby="payments-title" className={styles.payments}>
          {payments.map((r) => (
            <li key={r.id} className={styles.payment}>
              <span className={styles.paymentMain}>
                <span className={styles.merchant}>
                  {r.merchant}
                  {r.isNew && <span className={live.badge}>New</span>}
                </span>
                <span className={styles.muted}>{day.format(new Date(r.postedAt))}</span>
                {r.note && <span className={styles.note}>Your note: {r.note}</span>}
              </span>
              <span className={`${styles.paymentAmount} amount`}>{formatRand(r.amountCents)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
