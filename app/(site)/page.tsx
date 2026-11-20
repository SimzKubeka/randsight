import Link from 'next/link'
import { publicMetadata } from '@/lib/site.ts'
import styles from './landing.module.css'

const description = 'See what changed from one month to the next, down to the payments that made the difference.'

export const metadata = publicMetadata('/', 'RandSight · Your money, in hindsight', description, true)

// A static, labelled sample. It mirrors the demo account's October, but no customer data is read here.
const SAMPLE_ROWS = [
  ['Salary received', '↓', 'R600', 'decrease'],
  ['Medical spending', '↑', 'R1,200', 'increase'],
  ['Grocery spending', '↑', 'R900', 'increase'],
] as const

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Monthly spending insights</p>
          <h1 className={styles.title}>Your money, in hindsight.</h1>
          <p className={styles.lead}>{description}</p>
          <p className={styles.detail}>
            RandSight explains why you had more or less left over, in plain words, and lets you open any change to see the
            payments behind it.
          </p>
          <div className={styles.actions}>
            <Link href="/dashboard" className={styles.primary}>
              Take me to my dashboard
            </Link>
            <Link href="/docs" className={styles.secondary}>
              How it&apos;s built
            </Link>
          </div>
        </div>

        <figure className={styles.sample} aria-labelledby="sample-label">
          <figcaption id="sample-label" className={styles.badge}>
            Sample insight
          </figcaption>
          <p className={styles.sampleMonth}>October 2026</p>
          <p className={`${styles.figure} amount`}>R10,700</p>
          <p className={styles.figureLabel}>Left after spending</p>
          <p className={styles.change}>
            <span className={`${styles.changeValue} amount`}>
              <span aria-hidden="true">↓ </span>R2,700 less
            </span>{' '}
            than September
          </p>
          <ul className={styles.rows}>
            {SAMPLE_ROWS.map(([label, arrow, amount, word]) => (
              <li key={label}>
                <span>{label}</span>
                <span className={`${styles.rowChange} amount`}>
                  <span aria-hidden="true">{arrow}</span> {amount}
                  <span className="sr-only"> {word}</span>
                </span>
              </li>
            ))}
          </ul>
        </figure>
      </section>
    </main>
  )
}
