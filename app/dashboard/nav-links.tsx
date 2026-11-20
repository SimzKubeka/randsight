'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/icons.tsx'
import styles from './shell.module.css'

const GROUPS: { title: string; links: [href: string, label: string, icon: IconName][] }[] = [
  {
    title: 'Insights',
    links: [
      ['/dashboard', 'Review', 'review'],
      ['/dashboard/live-track', 'Live Track', 'live'],
    ],
  },
  { title: 'Resources', links: [['/docs', 'Docs', 'docs']] },
]

export function NavLinks() {
  const path = usePathname()
  return GROUPS.map((group) => (
    <div key={group.title}>
      <p className={styles.groupTitle}>{group.title}</p>
      <ul className={styles.navList}>
        {group.links.map(([href, label, icon]) => (
          <li key={href}>
            <Link href={href} className={styles.navLink} aria-current={path === href ? 'page' : undefined}>
              <Icon name={icon} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ))
}
