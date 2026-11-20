import { requireSession } from '@/lib/auth.ts'
import styles from '../dashboard.module.css'

export const metadata = { title: 'Live Track' }

export default async function LiveTrackPage() {
  await requireSession('/dashboard/live-track')
  return (
    <main className={`container ${styles.page}`}>
      <div className="surface">
        <h1 className={styles.title}>Live Track</h1>
        <p className={styles.muted}>See how this month is going against your grocery target. Coming soon.</p>
      </div>
    </main>
  )
}
