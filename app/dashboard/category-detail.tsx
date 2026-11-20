import Link from 'next/link'
import { rowLabel } from '@/lib/categories.ts'
import { PAGE_SIZE, type Transaction } from '@/lib/data.ts'
import { formatRand } from '@/lib/money.ts'
import { monthName, TIME_ZONE } from '@/lib/period.ts'
import styles from './dashboard.module.css'

// en-GB gives '7 Oct'; en-ZA pads the day to '07 Oct'.
const day = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'short' })

type Props = {
  category: string
  month: string
  prevMonth: string
  prevCents: number
  currCents: number
  returnId: string
  rows: Transaction[]
  count: number
  page: number
}

export function CategoryDetail({ category, month, prevMonth, prevCents, currCents, returnId, rows, count, page }: Props) {
  const label = rowLabel(category)
  const diff = currCents - prevCents
  const heading =
    diff === 0
      ? `${label} was the same as in ${monthName(prevMonth)}.`
      : `${label} ${diff > 0 ? 'rose' : 'fell'} by ${formatRand(Math.abs(diff))}.`
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const pageHref = (p: number) => `/dashboard?month=${month}&category=${category}&page=${p}#detail`

  return (
    <section className={styles.detail} aria-labelledby="detail">
      <Link href={`/dashboard?month=${month}#${returnId}`} className={styles.back}>
        <span aria-hidden="true">←</span> All of {monthName(month)}
      </Link>
      <h1 id="detail" tabIndex={-1} className={styles.detailTitle}>
        {heading}
      </h1>

      <dl className={styles.pair}>
        <div>
          <dt>{monthName(prevMonth)}</dt>
          <dd className="amount">{formatRand(prevCents)}</dd>
        </div>
        <div>
          <dt>{monthName(month)}</dt>
          <dd className="amount">{formatRand(currCents)}</dd>
        </div>
      </dl>

      <h2 id="payments-title">{monthName(month)} payments</h2>
      {rows.length > 0 ? (
        <ul aria-labelledby="payments-title" className={styles.payments}>
          {rows.map((r) => (
            <li key={r.id} className={styles.payment}>
              <span className={styles.paymentMain}>
                <span className={styles.merchant}>{r.merchant}</span>
                <span className={styles.muted}>
                  {day.format(new Date(r.postedAt))}
                  {r.kind === 'refund' && ' · Refund'}
                </span>
                {r.note && <span className={styles.note}>Your note: {r.note}</span>}
              </span>
              <span className={`${styles.paymentAmount} amount`}>
                {formatRand(r.kind === 'refund' ? -r.amountCents : r.amountCents)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.muted}>No payments in {monthName(month)}.</p>
      )}
      <p className={styles.total}>
        <span>Total</span> <span className="amount">{formatRand(currCents)}</span>
      </p>

      {pages > 1 && (
        <nav aria-label="Payment pages" className={styles.pager}>
          {page > 1 ? <Link href={pageHref(page - 1)}>Previous</Link> : <span />}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={pageHref(page + 1)}>Next</Link> : <span />}
        </nav>
      )}
    </section>
  )
}
