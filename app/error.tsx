'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startTransition } from 'react'
import { Wordmark } from '@/components/wordmark.tsx'
import styles from './status.module.css'

// Shown when a page can't be loaded. The error itself is never displayed: it may hold internal details.
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter()
  // refresh() asks the server to render again; reset() alone would only retry the failed render.
  const retry = () =>
    startTransition(() => {
      router.refresh()
      reset()
    })

  return (
    <main className={`container ${styles.page}`}>
      <Link href="/" className={styles.home}>
        <Wordmark />
      </Link>
      <h1>We couldn’t load this page</h1>
      <p className={styles.lead}>Something went wrong on our side. Nothing in your account has changed.</p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={retry}>
          Try again
        </button>
        <Link href="/">RandSight home</Link>
      </div>
    </main>
  )
}
