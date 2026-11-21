import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle.tsx'
import { Wordmark } from '@/components/wordmark.tsx'
import styles from './site.module.css'

// Public pages: static, no cookies or customer data.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.frame}>
      <header className={styles.header}>
        <Link href="/" className={styles.home}>
          <Wordmark />
        </Link>
        <nav aria-label="Site" className={styles.nav}>
          <ThemeToggle />
          <Link href="/docs">Docs</Link>
          <Link href="/sign-in" className={styles.signIn}>
            Sign in
          </Link>
        </nav>
      </header>
      {children}
      <footer className={styles.footer}>
        <p>© 2026 RandSight · A demonstration with fictional customers and merchants.</p>
        <Link href="/docs">How it&apos;s built</Link>
      </footer>
    </div>
  )
}
