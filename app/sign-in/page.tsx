import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Wordmark } from '@/components/wordmark.tsx'
import { getSession, safeNext, SESSION_COOKIE } from '@/lib/auth.ts'
import { getDb } from '@/lib/db.ts'
import { DEMO } from '@/lib/seed.ts'
import { SignInForm } from './sign-in-form.tsx'
import styles from './sign-in.module.css'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams
  const next = safeNext(params.next)

  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (token && getSession(getDb(), token)?.status === 'valid') redirect(next)

  return (
    <main className={`container ${styles.page}`}>
      <Link href="/" className={styles.home}>
        <Wordmark />
      </Link>
      <div className="surface">
        <h1>Sign in</h1>

        {params.expired === '1' && <p className={styles.notice}>Your session expired. Sign in again.</p>}
        {params['signed-out'] === '1' && <p className={styles.notice}>You have signed out.</p>}

        <SignInForm next={next} />

        <section className={styles.demo} aria-labelledby="demo-heading">
          <h2 id="demo-heading">Demo login</h2>
          <p>A fictional customer, for trying RandSight.</p>
          <dl>
            <dt>Email</dt>
            <dd>{DEMO.email}</dd>
            <dt>Password</dt>
            <dd>{DEMO.password}</dd>
          </dl>
        </section>
      </div>
    </main>
  )
}
