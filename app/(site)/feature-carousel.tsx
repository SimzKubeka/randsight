'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from '@/components/icons.tsx'
import styles from './landing.module.css'

type Feature = { icon: IconName; title: string; text: string }

/**
 * A native scroll-snap rail: swipe, trackpad and arrow keys work without JavaScript.
 * The script only adds previous/next buttons and the progress bar.
 */
export function FeatureCarousel({ features }: { features: Feature[] }) {
  const rail = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const el = rail.current
    if (!el) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const max = el.scrollWidth - el.clientWidth
        setProgress(max > 0 ? el.scrollLeft / max : 1)
        setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 })
      })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const move = (direction: 1 | -1) => {
    const el = rail.current
    const slide = el?.firstElementChild as HTMLElement | null
    if (!el || !slide) return
    const step = slide.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0')
    const instant = matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: direction * step, behavior: instant ? 'auto' : 'smooth' })
  }

  // The enclosing section is already the labelled landmark; the rail itself is the carousel group.
  return (
    <div className={styles.carousel}>
      <div className={styles.carouselControls}>
        <div className={styles.progress} aria-hidden="true">
          <span style={{ transform: `scaleX(${Math.max(progress, 0.08)})` }} />
        </div>
        <button type="button" className={styles.navButton} onClick={() => move(-1)} disabled={edges.start} aria-label="Previous feature">
          <Icon name="chevronLeft" />
        </button>
        <button type="button" className={styles.navButton} onClick={() => move(1)} disabled={edges.end} aria-label="Next feature">
          <Icon name="chevronRight" />
        </button>
      </div>
      <div ref={rail} className={styles.rail} tabIndex={0} role="group" aria-roledescription="carousel" aria-label="Features, scroll sideways for more">
        {features.map((f, i) => (
          <div key={f.title} className={styles.slide} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${features.length}`}>
            {/* The card animates; the outer slide stays put so scroll snapping has a fixed target. */}
            <div className={styles.card}>
              <span className={styles.slideIcon}>
                <Icon name={f.icon} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
