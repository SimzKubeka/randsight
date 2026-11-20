import { requireSession } from '@/lib/auth.ts'
import styles from '../dashboard.module.css'

export const metadata = { title: 'Live Track' }

export default async function LiveTrackPage() {
  await requireSession('/dashboard/live-track')
  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Live Track</h1>
          <p className={styles.subtitle}>See how this month is going against your grocery target. Coming soon.</p>
          <p className={styles.status}>
            <span className={styles.statusDot} aria-hidden="true" />
            November 2026 · This month
          </p>
        </div>
      </header>
    </main>
  )
}
