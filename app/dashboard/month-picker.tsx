import Link from 'next/link'
import { Icon } from '@/components/icons.tsx'
import { monthLabel } from '@/lib/period.ts'
import styles from './dashboard.module.css'

export function MonthPicker({ months, month, category }: { months: string[]; month: string; category: string | null }) {
  const href = (m: string) => `/dashboard?month=${m}${category ? `&category=${category}` : ''}`
  return (
    // Keyed by month so the list closes after choosing.
    <details className={styles.picker} key={month}>
      <summary>
        <Icon name="calendar" />
        <span className="sr-only">Month: </span>
        <span>{monthLabel(month)}</span>
        <span aria-hidden="true" className={styles.caret}>
          ▾
        </span>
      </summary>
      <ul className={styles.pickerList}>
        {months.map((m) => (
          <li key={m}>
            <Link href={href(m)} aria-current={m === month ? 'true' : undefined}>
              {monthLabel(m)}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  )
}
