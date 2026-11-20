'use client'

import { useActionState, useEffect, useRef } from 'react'
import { signIn, type SignInState } from './actions.ts'
import styles from './sign-in.module.css'

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, {} as SignInState)
  const summary = useRef<HTMLDivElement>(null)
  const problems = [
    state.formError && { text: state.formError, field: 'email' },
    state.errors?.email && { text: state.errors.email, field: 'email' },
    state.errors?.password && { text: state.errors.password, field: 'password' },
  ].filter((p): p is { text: string; field: string } => !!p)

  // Move focus to the problems so screen reader and keyboard users hear them first.
  useEffect(() => {
    if (problems.length) summary.current?.focus()
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} noValidate className={styles.form}>
      {problems.length > 0 && (
        <div ref={summary} tabIndex={-1} role="alert" className={styles.summary}>
          <h2 className={styles.summaryTitle}>There is a problem</h2>
          <ul>
            {problems.map((p) => (
              <li key={p.text}>
                <a href={`#${p.field}`}>{p.text}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <input type="hidden" name="next" value={next} />

      <div className={styles.field}>
        <label htmlFor="email">Email address</label>
        {state.errors?.email && (
          <p id="email-error" className={styles.error}>
            {state.errors.email}
          </p>
        )}
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          defaultValue={state.email}
          key={state.email}
          aria-invalid={!!state.errors?.email || undefined}
          aria-describedby={state.errors?.email ? 'email-error' : undefined}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Password</label>
        {state.errors?.password && (
          <p id="password-error" className={styles.error}>
            {state.errors.password}
          </p>
        )}
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!state.errors?.password || undefined}
          aria-describedby={state.errors?.password ? 'password-error' : undefined}
        />
      </div>

      <button type="submit" className={styles.button} disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
