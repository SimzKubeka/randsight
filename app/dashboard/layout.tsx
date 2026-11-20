import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Icon } from '@/components/icons.tsx'
import { Wordmark } from '@/components/wordmark.tsx'
import { activeCustomerId, SESSION_COOKIE } from '@/lib/auth.ts'
import { getCustomerName } from '@/lib/data.ts'
import { getDb } from '@/lib/db.ts'
import { DEMO_NOW, TIME_ZONE } from '@/lib/period.ts'
import { signOut } from './actions.ts'
import { MobileMenu } from './mobile-menu.tsx'
import { NavLinks } from './nav-links.tsx'
import styles from './shell.module.css'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

const today = new Intl.DateTimeFormat('en-ZA', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(DEMO_NOW))

// Each page still checks the session itself (so it can return to its own URL); this only reads the name to display.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const customerId = token ? activeCustomerId(getDb(), token) : null
  const name = customerId ? getCustomerName(getDb(), customerId) : null

  // Rendered twice: in the desktop sidebar and in the phone menu. CSS shows one at a time.
  const navigation = (
    <>
      <nav aria-label="Main">
        <NavLinks />
      </nav>
      <form action={signOut} className={styles.foot}>
        <button type="submit" className={styles.navLink}>
          <Icon name="signOut" />
          Sign out
        </button>
      </form>
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

      <div className={styles.column}>
        <header className={styles.topbar}>
          <Link href="/dashboard" className={`${styles.home} ${styles.mobileOnly}`}>
            <Wordmark />
          </Link>
          <p className={styles.today}>Demo date · {today}</p>
          <div className={styles.actions}>
            <a href="/docs" className={styles.iconButton} title="Docs">
              <Icon name="docs" />
              <span className="sr-only">Docs</span>
            </a>
            {name && (
              <span className={styles.account}>
                <span className={styles.avatar} aria-hidden="true">
                  {name[0]}
                </span>
                {name}
              </span>
            )}
            <div className={styles.mobileOnly}>
              <MobileMenu>{navigation}</MobileMenu>
            </div>
          </div>
        </header>

        {children}

        <footer className={styles.footer}>
          <p>© 2026 RandSight · A demonstration with fictional customers and merchants.</p>
          <a href="/docs">How it&apos;s built</a>
        </footer>
      </div>
    </div>
  )
}
