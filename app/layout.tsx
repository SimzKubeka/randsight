import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'RandSight · Your money, in hindsight', template: '%s · RandSight' },
  description: 'See what changed from one month to the next, down to the payments that made the difference.',
}

export const viewport: Viewport = { themeColor: '#0b3d91' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>{children}</body>
    </html>
  )
}
