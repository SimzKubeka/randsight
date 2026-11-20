import styles from './wordmark.module.css'

export function Wordmark() {
  return (
    <span className={styles.wordmark}>
      <svg className={styles.mark} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path d="M7 2h4L5.5 18h-4zM15 2h4l-5.5 16h-4z" />
      </svg>
      RandSight
    </span>
  )
}
