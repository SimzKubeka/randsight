'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '@/components/icons.tsx'
import styles from '../dashboard.module.css'

type View = 'chart' | 'table'
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/**
 * Chart | Table segmented control. Switching glides the panel to its new height while the incoming view
 * rises and sharpens into place. Instant with reduced motion.
 */
export function ViewSwitch({ label, chart, table }: { label: string; chart: React.ReactNode; table: React.ReactNode }) {
  const [view, setView] = useState<View>('chart')
  const frame = useRef<HTMLDivElement>(null)
  const fromHeight = useRef<number | null>(null)

  function choose(next: View) {
    if (next === view) return
    fromHeight.current = frame.current?.offsetHeight ?? null
    setView(next)
  }

  // Runs after the new view is in the DOM but before paint, so the animation starts from the old height.
  useLayoutEffect(() => {
    const el = frame.current
    const from = fromHeight.current
    fromHeight.current = null
    if (!el || from === null || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.style.overflow = 'hidden'
    el.animate([{ height: `${from}px` }, { height: `${el.offsetHeight}px` }], { duration: 450, easing: EASE }).onfinish = () => {
      el.style.overflow = ''
    }
    el.firstElementChild?.animate(
      [
        { opacity: 0, transform: 'translateY(12px) scale(0.985)', filter: 'blur(6px)' },
        { opacity: 1, transform: 'none', filter: 'none' },
      ],
      { duration: 450, easing: EASE },
    )
  }, [view])

  return (
    <>
      <div className={styles.switch} role="group" aria-label={label} data-view={view}>
        <button type="button" aria-pressed={view === 'chart'} onClick={() => choose('chart')}>
          <Icon name="chart" />
          Chart
        </button>
        <button type="button" aria-pressed={view === 'table'} onClick={() => choose('table')}>
          <Icon name="table" />
          Table
        </button>
      </div>
      <div ref={frame} className={styles.viewFrame}>
        {view === 'chart' ? chart : table}
      </div>
    </>
  )
}
