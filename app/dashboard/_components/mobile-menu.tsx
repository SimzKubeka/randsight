'use client'

import { useRef } from 'react'
import { Icon } from '@/components/icons.tsx'
import styles from '../shell.module.css'

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
        <Icon name="menu" className={styles.iconOpen} />
        <Icon name="close" className={styles.iconClose} />
        Menu
      </summary>
      <div className={styles.menuPanel}>{children}</div>
    </details>
  )
}
