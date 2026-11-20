'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './dashboard.module.css'

const LINKS = [
  ['/dashboard', 'Review'],
  ['/dashboard/live-track', 'Live Track'],
] as const

export function NavLinks() {
  const path = usePathname()
  return (
    <ul className={styles.navList}>
      {LINKS.map(([href, label]) => (
        <li key={href}>
          <Link href={href} className={styles.navLink} aria-current={path === href ? 'page' : undefined}>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
