'use client'

import { useEffect, useRef } from 'react'
import styles from '../live-track/live-track.module.css'

/**
 * The remaining allowance. A polite live region, so a screen reader hears the new figure after a payment;
 * with motion allowed, the figure also flashes once when it changes (not on first load).
 */
export function LiveFigure({ value, children }: { value: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const previous = useRef(value)

  useEffect(() => {
    const el = ref.current
    if (!el || previous.current === value) return
    previous.current = value
    el.removeAttribute('data-flash')
    void el.offsetWidth // restart the animation if it's still running
    el.setAttribute('data-flash', '')
  }, [value])

  return (
    <div ref={ref} className={styles.lead} aria-live="polite" aria-atomic="true" onAnimationEnd={(e) => e.currentTarget.removeAttribute('data-flash')}>
      {children}
    </div>
  )
}

/**
 * Apply and reset are plain server-action forms, so they work without JavaScript.
 * With it, focus follows the change: to Reset after applying (the Apply button becomes disabled), and back after resetting.
 */
export function SimulationControls({
  applied,
  label,
  apply,
  reset,
}: {
  applied: boolean
  label: string
  apply: () => Promise<void>
  reset: () => Promise<void>
}) {
  const applyRef = useRef<HTMLButtonElement>(null)
  const resetRef = useRef<HTMLButtonElement>(null)
  const previous = useRef(applied)

  useEffect(() => {
    if (previous.current === applied) return
    previous.current = applied
    ;(applied ? resetRef : applyRef).current?.focus()
  }, [applied])

  return (
    <div className={styles.controls}>
      <form action={apply}>
        <button ref={applyRef} type="submit" className={styles.apply} disabled={applied}>
          {applied ? 'Sample payment applied' : label}
        </button>
      </form>
      {applied && (
        <form action={reset}>
          <button ref={resetRef} type="submit" className={styles.reset}>
            Reset simulation
          </button>
        </form>
      )}
    </div>
  )
}
