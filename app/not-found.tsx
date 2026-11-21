import Link from 'next/link'
import { Wordmark } from '@/components/wordmark.tsx'
import styles from './status.module.css'

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <main id="main" className={`container ${styles.page}`}>
      <Link href="/" className={styles.home}>
        <Wordmark />
      </Link>
      <h1>We couldn’t find that page</h1>
      <p className={styles.lead}>The link may be out of date, or the address may have a typo.</p>
      <div className={styles.actions}>
        <Link href="/dashboard" className={styles.primary}>
          Go to my dashboard
        </Link>
        <Link href="/">RandSight home</Link>
      </div>
    </main>
  )
}
