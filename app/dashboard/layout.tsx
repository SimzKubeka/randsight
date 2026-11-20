import type { Metadata } from 'next'
import { signOut } from './actions.ts'
import styles from './dashboard.module.css'

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
          <span className={styles.brand}>RandSight</span>
          <form action={signOut}>
            <button type="submit" className={styles.signOut}>
              Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
    </>
  )
}
