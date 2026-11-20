import Image from 'next/image'
import Link from 'next/link'
import { Icon, type IconName } from '@/components/icons.tsx'
import { publicMetadata } from '@/lib/site.ts'
import desktopShot from '@/public/screens/dashboard-desktop.jpg'
import phoneShot from '@/public/screens/dashboard-mobile.jpg'
import medicalShot from '@/public/screens/medical-mobile.jpg'
import styles from './landing.module.css'

const description = 'See what changed from one month to the next, down to the payments that made the difference.'

export const metadata = publicMetadata('/', 'RandSight · Your money, in hindsight', description, true)

const STEPS = [
  ['See your month in one number', 'RandSight shows what you had left after spending, and how that compares with the month before.'],
  ['Understand what changed', 'Salary, medical, groceries: the changes that mattered, explained in plain words, biggest first.'],
  ['Follow it to the payments', 'Open any change to see the payments behind it, with dates, amounts and your own notes.'],
] as const

const FEATURES: [IconName, string, string][] = [
  ['words', 'Answers before charts', 'The first thing you read is a sentence that explains your month. Charts are there when you want them.'],
  ['phone', 'Made for your phone', 'Designed for a small screen first, so the answer and the payments behind it fit where you check your money.'],
  ['live', 'Live Track', 'Keep an eye on this month against a spending target, and see whether you’re ahead of an even pace.'],
  ['lock', 'Private by default', 'Your numbers are never cached by shared servers, never indexed by search engines and never shown to anyone else.'],
]

const DETAILS = [
  'Refunds come off the category they belong to',
  'Transfers between your own accounts don’t count as spending',
  'Months follow South African time, so a late-night payment lands in the right month',
] as const

export default function Home() {
  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Monthly spending insights</p>
          <h1 className={styles.title}>Your money, in hindsight.</h1>
          <p className={styles.lead}>{description}</p>
          <div className={styles.actions}>
            <Link href="/dashboard" className={styles.primary}>
              Get started free
            </Link>
            <a href="#how" className={styles.secondary}>
              See how it works
            </a>
          </div>
          <p className={styles.small}>Free to try · Demo account included · No card needed</p>
        </div>

        <figure className={styles.showcase}>
          <div className={styles.browser}>
            <div className={styles.browserBar} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <Image
              src={desktopShot}
              alt="The RandSight dashboard for October 2026: R10,700 left after spending, R2,700 less than September, what changed and six months of spending"
              sizes="(min-width: 72rem) 1100px, 100vw"
              priority
            />
          </div>
          <div className={`${styles.phone} ${styles.heroPhone}`}>
            <Image src={phoneShot} alt="" sizes="(min-width: 64rem) 220px, 30vw" loading="eager" />
          </div>
          <figcaption className={styles.caption}>Sample insight · a fictional customer&apos;s October</figcaption>
        </figure>
      </section>

      <section id="how" className={styles.section} aria-labelledby="how-title">
        <p className={styles.eyebrow}>How it works</p>
        <h2 id="how-title" className={styles.heading}>
          From “where did it go?” to the exact payment
        </h2>
        <ol className={styles.steps}>
          {STEPS.map(([title, text], i) => (
            <li key={title}>
              <span className={styles.stepNumber} aria-hidden="true">
                {i + 1}
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${styles.section} ${styles.tinted}`} aria-labelledby="features-title">
        <p className={styles.eyebrow}>Why RandSight</p>
        <h2 id="features-title" className={styles.heading}>
          Built for the way you check your money
        </h2>
        <ul className={styles.features}>
          {FEATURES.map(([icon, title, text]) => (
            <li key={title}>
              <span className={styles.featureIcon}>
                <Icon name={icon} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${styles.section} ${styles.split}`} aria-labelledby="detail-title">
        <div>
          <p className={styles.eyebrow}>Every rand accounted for</p>
          <h2 id="detail-title" className={styles.heading}>
            Follow any change to the payments behind it
          </h2>
          <p className={styles.body}>
            When medical spending jumps, you shouldn&apos;t have to dig through a statement. One tap shows the payments that
            made the difference, and the total always adds up.
          </p>
          <ul className={styles.checks}>
            {DETAILS.map((d) => (
              <li key={d}>
                <Icon name="check" />
                {d}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.phone}>
          <Image
            src={medicalShot}
            alt="Medical spending rose by R1,200: September R400, October R1,600, and the three October payments behind it"
            sizes="(min-width: 64rem) 320px, 80vw"
          />
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="cta-title">
        <h2 id="cta-title" className={styles.heading}>
          See your month clearly
        </h2>
        <p>Try RandSight with a demo account. It takes a few seconds.</p>
        <Link href="/dashboard" className={styles.primary}>
          Take me to my dashboard
        </Link>
        <p className={styles.small}>The demo uses a fictional customer and fictional merchants.</p>
      </section>
    </main>
  )
}
