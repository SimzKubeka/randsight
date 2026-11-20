'use client'

import { useRef } from 'react'
import styles from './shell.module.css'

/** Hamburger for phones and tablets. A native <details>, so it opens without JavaScript; closes on Escape or when a link is chosen. */
export function MobileMenu({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null)

  const close = (returnFocus: boolean) => {
    const menu = ref.current
    if (!menu?.open) return
    menu.open = false
    if (returnFocus) menu.querySelector('summary')?.focus()
  }

  return (
    <details
      ref={ref}
      className={styles.menu}
      onClick={(e) => (e.target as Element).closest('a') && close(false)}
      onKeyDown={(e) => e.key === 'Escape' && close(true)}
    >
      <summary className={styles.menuButton}>
        <svg className={`${styles.icon} ${styles.iconOpen}`} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <svg className={`${styles.icon} ${styles.iconClose}`} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
        Menu
      </summary>
      <div className={styles.menuPanel}>{children}</div>
    </details>
  )
}
