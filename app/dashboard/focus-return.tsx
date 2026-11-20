'use client'

import { useEffect } from 'react'

const KEY = 'rs-return-focus'

/**
 * Keeps the customer's place when moving between the review and a category:
 * focuses the element named in the URL hash, or, after browser Back, the row they opened.
 * The page keys this component by its content, so it remounts only once the new content is on screen.
 */
export function FocusReturn() {
  useEffect(() => {
    const here = location.pathname + location.search
    let id = decodeURIComponent(location.hash.slice(1))
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as { url: string; id: string } | null
      if (saved?.url === here) {
        id ||= saved.id
        sessionStorage.removeItem(KEY)
      }
    } catch {
      // Storage can be unavailable (private mode); the hash still works.
    }
    if (id) document.getElementById(id)?.focus()
  }, [])

  useEffect(() => {
    const remember = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.('a[data-return-focus]')
      if (!link?.id) return
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ url: location.pathname + location.search, id: link.id }))
      } catch {}
    }
    document.addEventListener('click', remember, true)
    return () => document.removeEventListener('click', remember, true)
  }, [])

  return null
}
