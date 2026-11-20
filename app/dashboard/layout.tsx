import type { Metadata } from 'next'
import Link from 'next/link'
import { Wordmark } from '@/components/wordmark.tsx'
import { signOut } from './actions.ts'
import { MobileMenu } from './mobile-menu.tsx'
import { NavLinks } from './nav-links.tsx'
import styles from './shell.module.css'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

// No customer data here: each page checks the session itself so it can return to its own URL.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Rendered twice: in the desktop sidebar and in the phone menu. CSS shows one at a time.
  const navigation = (
    <>
      <nav aria-label="Main">
        <NavLinks />
      </nav>
      <div className={styles.foot}>
        <a href="/docs">Docs</a>
        <form action={signOut}>
          <button type="submit">Sign out</button>
        </form>
      </div>
    </>
  )

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/dashboard" className={styles.home}>
          <Wordmark />
        </Link>
        {navigation}
      </aside>

      <header className={styles.topbar}>
        <Link href="/dashboard" className={styles.home}>
          <Wordmark />
        </Link>
        <MobileMenu>{navigation}</MobileMenu>
      </header>

      <div>{children}</div>
    </div>
  )
}
