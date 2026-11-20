import Link from 'next/link'
import { DOCS } from '@/lib/docs.ts'
import styles from './docs.module.css'

export function DocsNav({ current }: { current?: string }) {
  return (
    <nav aria-label="Documentation" className={styles.nav}>
      <p className={styles.navTitle}>Engineering docs</p>
      <ul>
        {DOCS.map((d) => (
          <li key={d.slug}>
            <Link href={`/docs/${d.slug}`} aria-current={d.slug === current ? 'page' : undefined}>
              {d.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
