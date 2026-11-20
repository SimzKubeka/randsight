import Image from 'next/image'
import Link from 'next/link'
import { Icon, type IconName } from '@/components/icons.tsx'
import { publicMetadata } from '@/lib/site.ts'
import desktopShot from '@/public/screens/dashboard-desktop.jpg'
import phoneShot from '@/public/screens/dashboard-mobile.jpg'
import medicalShot from '@/public/screens/medical-mobile.jpg'
import { FeatureMarquee } from './feature-marquee.tsx'
import styles from './landing.module.css'

const description = 'See what changed from one month to the next, down to the payments that made the difference.'

export const metadata = publicMetadata('/', 'RandSight · Your money, in hindsight', description, true)

const STEPS = [
  ['See your month in one number', 'What you had left after spending, and how it compares with the month before.'],
  ['Understand what changed', 'Salary, medical, groceries: the changes that mattered, in plain words, biggest first.'],
  ['Follow it to the payments', 'Open any change to see the payments behind it, with dates, amounts and your notes.'],
] as const

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'words', title: 'Answers before charts', text: 'The first thing you read is a sentence that explains your month. Charts are there when you want them.' },
  { icon: 'phone', title: 'Made for your phone', text: 'Designed for a small screen first, so the answer and the payments behind it fit where you check your money.' },
  { icon: 'live', title: 'Live Track', text: 'Keep an eye on this month against a spending target, and see whether you’re ahead of an even pace.' },
  { icon: 'lock', title: 'Private by default', text: 'Your numbers are never cached by shared servers, never indexed by search engines and never shown to anyone else.' },
]

const DETAILS = [
  'Refunds come off the category they belong to',
  'Transfers between your own accounts don’t count as spending',
  'Months follow South African time, so a late-night payment lands in the right month',
] as const

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.title}>
            <span className={styles.line}>
              <span>Your money,</span>
            </span>{' '}
            <span className={styles.line}>
              <span>in hindsight.</span>
            </span>
          </h1>
          <p className={`${styles.lead} ${styles.enter}`}>{description}</p>
          <div className={`${styles.actions} ${styles.enter}`}>
            <Link href="/dashboard" className={styles.primary}>
              Get started free
              <Icon name="arrowRight" className={styles.arrow} />
            </Link>
            <a href="#how" className={styles.secondary}>
              See how it works
            </a>
          </div>
          <p className={`${styles.small} ${styles.enter}`}>Free to try · Demo account included · No card needed</p>
        </div>

        <figure className={styles.showcase}>
          <div className={styles.tilt}>
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
          </div>
          <div className={styles.heroPhone}>
            <div className={styles.drop}>
              <div className={styles.phone}>
                <Image src={phoneShot} alt="" sizes="(min-width: 64rem) 220px, 30vw" loading="eager" />
              </div>
            </div>
          </div>
          <figcaption className={styles.caption}>Sample insight · a fictional customer&apos;s October</figcaption>
        </figure>
      </section>

      <section id="how" className={styles.section} aria-labelledby="how-title">
        <h2 id="how-title" className={styles.heading}>
          From “where did it go?” to the exact payment
        </h2>
        <ol className={styles.steps}>
          {STEPS.map(([title, text], i) => (
            <li key={title}>
              <span className={styles.stepNumber} aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${styles.section} ${styles.tinted}`} aria-labelledby="features-title">
        <h2 id="features-title" className={styles.heading}>
          Built for the way you check your money
        </h2>
        <FeatureMarquee features={FEATURES} />
      </section>

      <section className={`${styles.section} ${styles.split}`} aria-labelledby="detail-title">
        <div>
          <h2 id="detail-title" className={styles.heading}>
            Every rand accounted for
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
        <div className={styles.splitPhone}>
          <div className={styles.phone}>
            <Image
              src={medicalShot}
              alt="Medical spending rose by R1,200: September R400, October R1,600, and the three October payments behind it"
              sizes="(min-width: 64rem) 320px, 80vw"
            />
          </div>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="cta-title">
        <svg className={styles.mark} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M7 2h4L5.5 18h-4zM15 2h4l-5.5 16h-4z" />
        </svg>
        <h2 id="cta-title" className={styles.heading}>
          See your month clearly
        </h2>
        <p>Try RandSight with a demo account. It takes a few seconds.</p>
        <Link href="/dashboard" className={styles.primary}>
          Take me to my dashboard
          <Icon name="arrowRight" className={styles.arrow} />
        </Link>
        <p className={styles.small}>The demo uses a fictional customer and fictional merchants.</p>
      </section>
    </main>
  )
}
