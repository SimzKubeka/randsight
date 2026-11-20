import Link from 'next/link'
import { DOCS } from '@/lib/docs.ts'
import { publicMetadata } from '@/lib/site.ts'
import { DocsNav } from './docs-nav.tsx'
import styles from './docs.module.css'

export const metadata = publicMetadata(
  '/docs',
  'Engineering docs',
  'How RandSight is built: architecture, tech stack and verification, from the same Markdown that lives in the repository.',
)

export default function DocsIndex() {
  return (
    <main className={styles.layout}>
      <DocsNav />
      <div className={styles.article}>
        <h1>Engineering docs</h1>
        <p>How RandSight is built and checked. The same Markdown files live in the repository&apos;s <code>docs</code> folder.</p>
        <ul className={styles.cards}>
          {DOCS.map((d) => (
            <li key={d.slug}>
              <Link href={`/docs/${d.slug}`}>{d.title}</Link>
              <p>{d.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
