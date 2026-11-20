import { ImageResponse } from 'next/og'

// Brand-only social preview. Never include customer amounts or names.
export const alt = 'RandSight · Your money, in hindsight.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 96,
          background: '#f5f7fa',
          color: '#111418',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 52, fontWeight: 700 }}>
          <svg width="52" height="52" viewBox="0 0 20 20">
            <path d="M7 2h4L5.5 18h-4zM15 2h4l-5.5 16h-4z" fill="#cb432b" />
          </svg>
          RandSight
        </div>
        <div style={{ marginTop: 64, fontSize: 80, letterSpacing: -2 }}>Your money, in hindsight.</div>
        <div style={{ marginTop: 32, maxWidth: 900, fontSize: 36, lineHeight: 1.4, color: '#4a5260' }}>
          See what changed from one month to the next, down to the payments that made the difference.
        </div>
      </div>
    ),
    size,
  )
}
