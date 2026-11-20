import type { Metadata } from 'next'
import Link from 'next/link'
import { Wordmark } from '@/components/wordmark.tsx'
import { signOut } from './actions.ts'
import styles from './dashboard.module.css'
import { NavLinks } from './nav-links.tsx'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

// No customer data here: each page checks the session itself so it can return to its own URL.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.bar}`}>
          <Link href="/dashboard" className={styles.home}>
            <Wordmark />
          </Link>
          <nav aria-label="Main" className={styles.nav}>
            <NavLinks />
          </nav>
          <details className={styles.menu}>
            <summary>Menu</summary>
            <div className={styles.menuPanel}>
              <a href="/docs">Docs</a>
              <form action={signOut}>
                <button type="submit">Sign out</button>
              </form>
            </div>
          </details>
        </div>
      </header>
      {children}
    </>
  )
}
