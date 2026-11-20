'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from '@/components/icons.tsx'
import styles from './landing.module.css'

type Feature = { icon: IconName; title: string; text: string }

function Cards({ features }: { features: Feature[] }) {
  return features.map((f) => (
    <li key={f.title} className={styles.card}>
      <span className={styles.cardIcon}>
        <Icon name={f.icon} />
      </span>
      <h3>{f.title}</h3>
      <p>{f.text}</p>
    </li>
  ))
}

/**
 * An endless strip: the list is rendered twice and the pair slides by one list-width, so the loop has no seam.
 * The copy is hidden from assistive tech. It pauses on hover, on the button, and whenever it is off screen.
 */
export function FeatureMarquee({ features }: { features: Feature[] }) {
  const root = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [onScreen, setOnScreen] = useState(true)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry!.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={root} className={styles.marquee} data-paused={paused || !onScreen || undefined}>
      <button type="button" className={styles.pause} onClick={() => setPaused((p) => !p)}>
        <Icon name={paused ? 'play' : 'pause'} />
        {paused ? 'Play' : 'Pause'}
        <span className="sr-only"> moving features</span>
      </button>
      <div className={styles.track}>
        <ul className={styles.belt} aria-label="Features">
          <Cards features={features} />
        </ul>
        <ul className={styles.belt} aria-hidden="true">
          <Cards features={features} />
        </ul>
      </div>
    </div>
  )
}
