'use client'

import { useId, useSyncExternalStore } from 'react'
import { THEME_KEY } from '@/lib/theme.ts'
import styles from './theme-toggle.module.css'

// The <html> attribute is the single source of truth, so every toggle on the page stays in step.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
const isDark = () => document.documentElement.dataset.theme === 'dark'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false)
  const maskId = useId()

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    const next = isDark() ? 'light' : 'dark'
    const apply = () => {
      document.documentElement.dataset.theme = next
      // A choice made here outranks later system changes, even when storage is blocked.
      document.documentElement.dataset.themePinned = ''
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        // Private mode: the choice lasts for this page only.
      }
    }
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return apply()

    // The new theme grows out of the button as a circle.
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    document.startViewTransition(apply).ready.then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 550, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
      ),
    )
  }

  return (
    <button type="button" className={`${styles.toggle} ${className}`} aria-pressed={dark} onClick={toggle}>
      {/* Sun and moon are one drawing: the disc grows, a shadow slides over it, the rays fold away. */}
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <mask id={maskId}>
          <rect width="24" height="24" fill="white" />
          <circle className={styles.shadow} cx="24" cy="6" r="7" fill="black" />
        </mask>
        <circle className={styles.disc} cx="12" cy="12" r="5" mask={`url(#${maskId})`} />
        <g className={styles.rays}>
          <path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
        </g>
      </svg>
      <span className="sr-only">Dark theme</span>
    </button>
  )
}
