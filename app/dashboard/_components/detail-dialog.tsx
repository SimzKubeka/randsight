'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { Icon } from '@/components/icons.tsx'
import styles from '../dashboard.module.css'

/**
 * Category detail as a modal. The URL owns it: it opens when ?category= is present and closes by navigating to
 * closeHref, so deep links, refresh and Back keep working. Server-rendered open, so it shows without JavaScript;
 * on hydration it is re-opened as a true modal (focus trapped, page inert, Escape closes).
 */
export function DetailDialog({ closeHref, children }: { closeHref: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const router = useRouter()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog || dialog.matches(':modal')) return
    dialog.close()
    dialog.showModal()
    // showModal() focuses the first control (Close); start on the heading so the content is read first.
    dialog.querySelector<HTMLElement>('#detail')?.focus()
  }, [])

  const close = () => router.push(closeHref, { scroll: false })

  return (
    <dialog
      ref={ref}
      open
      className={styles.dialog}
      aria-labelledby="detail"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(e) => e.target === ref.current && close()}
    >
      <div className={styles.dialogBody}>
        <button type="button" className={styles.dialogClose} onClick={close}>
          <Icon name="close" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </dialog>
  )
}
